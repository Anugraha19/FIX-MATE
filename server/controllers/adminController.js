// ADMIN CONTROLLER: dashboard numbers, user/provider management, assigning bookings, reviews and reports.
const bcrypt = require('bcryptjs');
const { Op, QueryTypes } = require('sequelize');
const { sequelize, User, Provider, Service, Booking, Review, Category, ProviderService } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { emitBooking } = require('../events/bookingEvents');
const { assertTransition } = require('../utils/bookingWorkflow');
const { normalizeTime } = require('../utils/dateHelpers');
const { streamBookingsCsv, saveBookingsCsv } = require('../utils/reportExport');
const { findServices } = require('./serviceController');
const { loadProvider, updateProvider } = require('./providerController');
const { refreshProviderRating } = require('./reviewController');
const { bookingIncludes, loadFullBooking, assertProviderFree } = require('./bookingController');
const { providerStatsMap } = require('../utils/stats');

// MySQL and SQLite format dates differently; the app targets MySQL.
const monthExpression = () =>
  sequelize.getDialect() === 'sqlite' ? "strftime('%Y-%m', booking_date)" : "DATE_FORMAT(booking_date, '%Y-%m')";

const paging = (query, defaultLimit = 10) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

// ---------------- Dashboard ----------------

// GET /api/admin/dashboard - every number is calculated from MySQL
const getDashboard = asyncHandler(async (req, res) => {
  const [customers, providers, services, bookings, pending, completed, cancelled] = await Promise.all([
    User.count({ where: { role: 'customer' } }),
    Provider.count(),
    Service.count(),
    Booking.count(),
    Booking.count({ where: { status: 'Pending' } }),
    Booking.count({ where: { status: 'Completed' } }),
    Booking.count({ where: { status: 'Cancelled' } }),
  ]);

  const [revenueRow] = await sequelize.query(
    "SELECT COALESCE(SUM(estimated_price), 0) AS revenue FROM bookings WHERE status = 'Completed'",
    { type: QueryTypes.SELECT }
  );

  const recentBookings = await Booking.findAll({ include: bookingIncludes, order: [['createdAt', 'DESC'], ['id', 'DESC']], limit: 5 });

  const monthly = await sequelize.query(
    `SELECT ${monthExpression()} AS month, COUNT(*) AS bookings
       FROM bookings GROUP BY ${monthExpression()} ORDER BY month DESC LIMIT 6`,
    { type: QueryTypes.SELECT }
  );

  res.json({
    stats: { customers, providers, services, bookings, pending, completed, cancelled, revenue: Number(revenueRow.revenue) },
    recentBookings,
    monthly: monthly.reverse().map((m) => ({ month: m.month, bookings: Number(m.bookings) })),
  });
});

// ---------------- Users (customers) ----------------

// GET /api/admin/users?role=customer&q=&page=&limit=
const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req.query);
  const where = { role: req.query.role || 'customer' };
  if (req.query.q) {
    const text = `%${req.query.q.trim()}%`;
    where[Op.or] = [{ name: { [Op.like]: text } }, { email: { [Op.like]: text } }, { phone: { [Op.like]: text } }];
  }
  const { count, rows } = await User.findAndCountAll({ where, order: [['createdAt', 'DESC']], limit, offset });
  res.json({ users: rows, total: count, page, pages: Math.max(Math.ceil(count / limit), 1) });
});

// PUT /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  const { name, phone, address, city, is_active } = req.body;
  if (is_active === false && user.id === req.user.id) throw new AppError('You cannot disable your own account', 400);
  const changes = {};
  if (name !== undefined) changes.name = name;
  if (phone !== undefined) changes.phone = phone;
  if (address !== undefined) changes.address = address;
  if (city !== undefined) changes.city = city;
  if (is_active !== undefined) changes.is_active = is_active;
  await user.update(changes);
  res.json({ user });
});

// DELETE /api/admin/users/:id  - disables the account; add ?hard=true to remove the row completely
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  if (user.id === req.user.id) throw new AppError('You cannot delete your own account', 400);
  if (user.role === 'admin') throw new AppError('Admin accounts cannot be deleted here', 400);

  if (req.query.hard === 'true') {
    await user.destroy(); // fails with a clear message if the user still has bookings
    return res.json({ message: 'User deleted' });
  }
  await user.update({ is_active: false });
  res.json({ message: 'User disabled' });
});

// ---------------- Providers ----------------

// GET /api/admin/providers?q=&page=
const listProvidersAdmin = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req.query);
  const userWhere = {};
  if (req.query.q) {
    const text = `%${req.query.q.trim()}%`;
    userWhere[Op.or] = [{ name: { [Op.like]: text } }, { email: { [Op.like]: text } }];
  }
  const { count, rows } = await Provider.findAndCountAll({
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'phone', 'city', 'address', 'is_active'], where: userWhere }],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  const withServices = await Provider.findAll({
    where: { id: { [Op.in]: rows.map((p) => p.id) } },
    attributes: ['id'],
    include: [{ model: Service, as: 'services', attributes: ['id', 'name'], through: { attributes: [] } }],
  });
  const serviceMap = {};
  withServices.forEach((p) => {
    serviceMap[p.id] = p.services;
  });
  const stats = await providerStatsMap();
  res.json({
    providers: rows.map((p) => ({ ...p.toJSON(), services: serviceMap[p.id] || [], completed_jobs: stats[p.id]?.completed_jobs || 0 })),
    total: count,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
  });
});

// POST /api/admin/providers - creates a user (role provider) AND the provider profile in one transaction
const createProviderAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password, address, city, experience, skills, location, service_ids } = req.body;
  if (!name || !email || !phone || !password) throw new AppError('Name, email, phone and password are required', 400);
  if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);

  const providerId = await sequelize.transaction(async (t) => {
    const user = await User.create(
      { name, email: String(email).toLowerCase().trim(), phone, password: await bcrypt.hash(password, 10), role: 'provider', address, city },
      { transaction: t }
    );
    const provider = await Provider.create(
      { user_id: user.id, experience: experience || 0, skills, location: location || city },
      { transaction: t }
    );
    if (Array.isArray(service_ids) && service_ids.length) {
      const services = await Service.findAll({ where: { id: { [Op.in]: service_ids } }, transaction: t });
      await provider.setServices(services, { transaction: t });
    }
    return provider.id;
  });

  res.status(201).json({ provider: await loadProvider({ id: providerId }, true) });
});

// PUT /api/admin/providers/:id
const updateProviderAdmin = asyncHandler(async (req, res, next) => {
  const provider = await Provider.findByPk(req.params.id);
  if (!provider) throw new AppError('Provider not found', 404);
  if (req.body.is_active !== undefined) await User.update({ is_active: req.body.is_active }, { where: { id: provider.user_id } });
  return updateProvider(req, res, next); // reuse the provider update logic
});

// DELETE /api/admin/providers/:id  - deactivates; ?hard=true deletes the account
const deleteProviderAdmin = asyncHandler(async (req, res) => {
  const provider = await Provider.findByPk(req.params.id);
  if (!provider) throw new AppError('Provider not found', 404);
  if (req.query.hard === 'true') {
    await User.destroy({ where: { id: provider.user_id } }); // provider row is removed by ON DELETE CASCADE
    return res.json({ message: 'Provider deleted' });
  }
  await User.update({ is_active: false }, { where: { id: provider.user_id } });
  await provider.update({ availability_status: 'unavailable' });
  res.json({ message: 'Provider deactivated' });
});

// ---------------- Services ----------------

// GET /api/admin/services - includes inactive services
const listServicesAdmin = asyncHandler(async (req, res) => {
  res.json(await findServices({ limit: 50, ...req.query }, true));
});

// ---------------- Bookings ----------------

// PUT /api/admin/bookings/:id/assign   body: { provider_id }
const assignProvider = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) throw new AppError('Booking not found', 404);
  const { provider_id } = req.body;
  if (!provider_id) throw new AppError('Choose a provider', 400);

  if (!['Pending', 'Confirmed', 'Assigned', 'Rejected'].includes(booking.status)) {
    throw new AppError(`A booking that is "${booking.status}" cannot be given to another provider`, 400);
  }

  const provider = await Provider.findByPk(provider_id, { include: [{ model: User, as: 'user', attributes: ['is_active'] }] });
  if (!provider || !provider.user.is_active) throw new AppError('Provider not found', 404);
  const offers = await ProviderService.findOne({ where: { provider_id: provider.id, service_id: booking.service_id } });
  if (!offers) throw new AppError('This provider does not offer the booked service', 400);
  await assertProviderFree(provider, booking.booking_date, normalizeTime(booking.booking_time), booking.id);

  if (booking.status !== 'Assigned') assertTransition(booking.status, 'Assigned');
  await booking.update({ provider_id: provider.id, status: 'Assigned' });
  emitBooking('bookingAssigned', booking, req.user);
  res.json({ booking: await loadFullBooking(booking.id) });
});

const STATUS_EVENTS = {
  Accepted: 'bookingAccepted',
  Rejected: 'bookingRejected',
  'In Progress': 'bookingStarted',
  Completed: 'bookingCompleted',
  Cancelled: 'bookingCancelled',
  Assigned: 'bookingAssigned',
};

// PUT /api/admin/bookings/:id/status   body: { status }
const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) throw new AppError('Booking not found', 404);
  const { status } = req.body;
  if (!Booking.STATUSES.includes(status)) throw new AppError('Unknown status', 400);
  assertTransition(booking.status, status);
  if (['Assigned', 'Accepted', 'In Progress', 'Completed'].includes(status) && !booking.provider_id) {
    throw new AppError('Assign a provider before moving the booking to this status', 400);
  }
  await booking.update({ status });
  if (STATUS_EVENTS[status]) emitBooking(STATUS_EVENTS[status], booking, req.user);
  res.json({ booking: await loadFullBooking(booking.id) });
});

// ---------------- Reviews ----------------

// GET /api/admin/reviews
const listReviewsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, offset } = paging(req.query, 20);
  const { count, rows } = await Review.findAndCountAll({
    include: [
      { model: User, as: 'customer', attributes: ['id', 'name'] },
      { model: Provider, as: 'provider', attributes: ['id'], include: [{ model: User, as: 'user', attributes: ['id', 'name'] }] },
      { model: Booking, as: 'booking', attributes: ['id'], include: [{ model: Service, as: 'service', attributes: ['id', 'name'] }] },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });
  res.json({ reviews: rows, total: count, page, pages: Math.max(Math.ceil(count / limit), 1) });
});

// DELETE /api/admin/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByPk(req.params.id);
  if (!review) throw new AppError('Review not found', 404);
  const providerId = review.provider_id;
  await review.destroy();
  await refreshProviderRating(providerId);
  res.json({ message: 'Review deleted' });
});

// ---------------- Reports (raw SQL) ----------------

// GET /api/admin/reports
const getReports = asyncHandler(async (req, res) => {
  const monthly = await sequelize.query(
    `SELECT ${monthExpression()} AS month,
            COUNT(*) AS total_bookings,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed,
            SUM(CASE WHEN status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
            COALESCE(SUM(CASE WHEN status = 'Completed' THEN estimated_price ELSE 0 END), 0) AS revenue
       FROM bookings
      GROUP BY ${monthExpression()}
      ORDER BY month DESC
      LIMIT 12`,
    { type: QueryTypes.SELECT }
  );

  const popularity = await sequelize.query(
    `SELECT s.id, s.name, c.name AS category, COUNT(b.id) AS bookings
       FROM services s
       JOIN categories c ON c.id = s.category_id
       LEFT JOIN bookings b ON b.service_id = s.id
      GROUP BY s.id, s.name, c.name
      ORDER BY bookings DESC, s.name ASC
      LIMIT 10`,
    { type: QueryTypes.SELECT }
  );

  const providerJobs = await sequelize.query(
    `SELECT p.id, u.name,
            COUNT(b.id) AS completed_jobs,
            COALESCE(SUM(b.estimated_price), 0) AS earnings
       FROM providers p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN bookings b ON b.provider_id = p.id AND b.status = 'Completed'
      GROUP BY p.id, u.name
      ORDER BY completed_jobs DESC, u.name ASC`,
    { type: QueryTypes.SELECT }
  );

  const [revenue] = await sequelize.query(
    `SELECT COALESCE(SUM(CASE WHEN status = 'Completed' THEN estimated_price END), 0) AS completed_revenue,
            COALESCE(SUM(CASE WHEN status IN ('Pending','Confirmed','Assigned','Accepted','In Progress') THEN estimated_price END), 0) AS pipeline_value,
            COALESCE(AVG(estimated_price), 0) AS average_booking_value
       FROM bookings`,
    { type: QueryTypes.SELECT }
  );

  res.json({
    monthly: monthly.map((m) => ({
      month: m.month,
      total_bookings: Number(m.total_bookings),
      completed: Number(m.completed),
      cancelled: Number(m.cancelled),
      revenue: Number(m.revenue),
    })),
    popularity: popularity.map((p) => ({ ...p, bookings: Number(p.bookings) })),
    providerJobs: providerJobs.map((p) => ({ ...p, completed_jobs: Number(p.completed_jobs), earnings: Number(p.earnings) })),
    revenue: {
      completed_revenue: Number(revenue.completed_revenue),
      pipeline_value: Number(revenue.pipeline_value),
      average_booking_value: Math.round(Number(revenue.average_booking_value) * 100) / 100,
    },
  });
});

// GET /api/admin/reports/bookings.csv - streamed straight to the browser
const downloadBookingsCsv = asyncHandler(async (req, res) => {
  await streamBookingsCsv(res);
});

// POST /api/admin/reports/save - streams the CSV into the server's /reports folder
const saveBookingsReport = asyncHandler(async (req, res) => {
  const file = await saveBookingsCsv();
  res.json({ message: 'Report saved on the server', file: require('path').basename(file) });
});

module.exports = {
  getDashboard,
  listUsers,
  updateUser,
  deleteUser,
  listProvidersAdmin,
  createProviderAdmin,
  updateProviderAdmin,
  deleteProviderAdmin,
  listServicesAdmin,
  assignProvider,
  updateBookingStatus,
  listReviewsAdmin,
  deleteReview,
  getReports,
  downloadBookingsCsv,
  saveBookingsReport,
};
