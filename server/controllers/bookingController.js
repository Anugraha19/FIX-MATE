// BOOKING CONTROLLER: creating bookings, listing them per role, and the provider status actions.
const path = require('path');
const { Op, fn, col } = require('sequelize');
const { Booking, Service, Category, Provider, User, Review, ProviderService, Availability } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { emitBooking } = require('../events/bookingEvents');
const { assertTransition, CUSTOMER_CANCELLABLE, SLOT_BLOCKING } = require('../utils/bookingWorkflow');
const { todayString, normalizeTime, isDateString, isTimeString } = require('../utils/dateHelpers');
const { readJsonFileAsync } = require('../utils/readJsonFile');
const { providerOfUser } = require('./providerController');

const CONFIG_FILE = path.join(__dirname, '..', 'data', 'bookingConfig.json');

// Related data returned together with every booking.
const bookingIncludes = [
  {
    model: Service,
    as: 'service',
    attributes: ['id', 'name', 'price', 'duration', 'image', 'category_id'],
    include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
  },
  {
    model: Provider,
    as: 'provider',
    attributes: ['id', 'user_id', 'rating', 'location', 'experience'],
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'phone', 'profile_image'] }],
  },
  { model: User, as: 'customer', attributes: ['id', 'name', 'email', 'phone', 'address', 'city'] },
  { model: Review, as: 'review' },
];

const loadFullBooking = (id) => Booking.findByPk(id, { include: bookingIncludes });

// Which bookings may this user see? customer: own, provider: assigned to them, admin: all.
async function scopeFor(user) {
  if (user.role === 'customer') return { customer_id: user.id };
  if (user.role === 'provider') {
    const provider = await providerOfUser(user.id);
    return { provider_id: provider.id };
  }
  return {};
}

// Throws if the provider cannot take a booking at this date/time.
async function assertProviderFree(provider, date, time, ignoreBookingId = null) {
  if (provider.availability_status === 'unavailable') {
    throw new AppError('This provider is not taking bookings right now', 400);
  }

  // 1) Same provider, same date and time already booked?
  const conflictWhere = {
    provider_id: provider.id,
    booking_date: date,
    booking_time: time,
    status: { [Op.in]: SLOT_BLOCKING },
  };
  if (ignoreBookingId) conflictWhere.id = { [Op.ne]: ignoreBookingId };
  const conflict = await Booking.findOne({ where: conflictWhere });
  if (conflict) throw new AppError('This provider already has a booking at that date and time. Choose another time', 400);

  // 2) If the provider added availability windows for that date, the time must fall inside a free one.
  const windows = await Availability.findAll({ where: { provider_id: provider.id, available_date: date } });
  if (windows.length > 0) {
    const inside = (w) => normalizeTime(w.start_time) <= time && time < normalizeTime(w.end_time);
    const blocked = windows.some((w) => !w.is_available && inside(w));
    const free = windows.some((w) => w.is_available && inside(w));
    if (blocked || !free) throw new AppError('The provider is not available at that time. Try another time or provider', 400);
  }
}

// Validates date + time values from the request and returns clean versions.
async function cleanDateTime(date, time) {
  if (!isDateString(date)) throw new AppError('Choose a valid booking date', 400);
  if (!isTimeString(time)) throw new AppError('Choose a valid booking time', 400);

  const config = await readJsonFileAsync(CONFIG_FILE); // fs read with a callback wrapped in a Promise
  const cleanTime = normalizeTime(time);
  if (!config.slots.map(normalizeTime).includes(cleanTime)) throw new AppError('Choose one of the available time slots', 400);

  if (date < todayString()) throw new AppError('The booking date cannot be in the past', 400);
  if (date > todayString(config.maxDaysAhead)) throw new AppError(`Bookings can only be made ${config.maxDaysAhead} days ahead`, 400);
  return { date, time: cleanTime };
}

// POST /api/bookings   (customer)
const createBooking = asyncHandler(async (req, res) => {
  const { service_id, provider_id, booking_date, booking_time, address, problem_description, notes } = req.body;
  if (!service_id) throw new AppError('Choose a service', 400);
  if (!address || !address.trim()) throw new AppError('Enter the address for the visit', 400);

  const service = await Service.findByPk(service_id);
  if (!service || !service.is_active) throw new AppError('This service is not available', 400);

  const { date, time } = await cleanDateTime(booking_date, booking_time);

  // Optional provider: it must offer this service and be free at that time.
  if (provider_id) {
    const provider = await Provider.findByPk(provider_id, { include: [{ model: User, as: 'user', attributes: ['is_active'] }] });
    if (!provider || !provider.user.is_active) throw new AppError('Selected provider was not found', 400);
    const offers = await ProviderService.findOne({ where: { provider_id: provider.id, service_id: service.id } });
    if (!offers) throw new AppError('This provider does not offer the selected service', 400);
    await assertProviderFree(provider, date, time);
  }

  const booking = await Booking.create({
    customer_id: req.user.id,
    provider_id: provider_id || null,
    service_id: service.id,
    booking_date: date,
    booking_time: time,
    address: address.trim(),
    problem_description,
    notes,
    estimated_price: service.price, // the backend decides the price, never the browser
    status: 'Pending',
  });

  emitBooking('bookingCreated', booking, req.user);
  res.status(201).json({ booking: await loadFullBooking(booking.id) });
});

// GET /api/bookings?status=&when=upcoming|history&after=&before=&page=&limit=
const listBookings = asyncHandler(async (req, res) => {
  const where = await scopeFor(req.user);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

  // statistics for dashboard cards (before extra filters) - counted by the database
  const grouped = await Booking.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'total'], [fn('SUM', col('estimated_price')), 'amount']],
    where,
    group: ['status'],
    raw: true,
  });
  const byStatus = {};
  let total = 0;
  let earnings = 0;
  grouped.forEach((row) => {
    byStatus[row.status] = Number(row.total);
    total += Number(row.total);
    if (row.status === 'Completed') earnings = Number(row.amount) || 0;
  });

  // filters
  const { status, when, after, before } = req.query;
  if (status) where.status = { [Op.in]: status.split(',') };
  if (when === 'upcoming') {
    where.booking_date = { [Op.gte]: todayString() };
    where.status = { [Op.in]: ['Pending', 'Confirmed', 'Assigned', 'Accepted', 'In Progress'] };
  }
  if (when === 'history') {
    where.status = { [Op.in]: ['Completed', 'Cancelled', 'Rejected'] };
  }
  if (after) where.booking_date = { ...(where.booking_date || {}), [Op.gt]: after }; // Op.gt  =  >
  if (before) where.booking_date = { ...(where.booking_date || {}), [Op.lt]: before }; // Op.lt  =  <

  const { count, rows } = await Booking.findAndCountAll({
    where,
    include: bookingIncludes,
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  res.json({
    bookings: rows,
    total: count,
    page,
    pages: Math.max(Math.ceil(count / limit), 1),
    stats: { total, byStatus, earnings },
  });
});

// Loads a booking and checks that this user is allowed to see it.
async function getAllowedBooking(id, user) {
  const booking = await loadFullBooking(id);
  if (!booking) throw new AppError('Booking not found', 404);
  if (user.role === 'customer' && booking.customer_id !== user.id) throw new AppError('This is not your booking', 403);
  if (user.role === 'provider') {
    const provider = await providerOfUser(user.id);
    if (booking.provider_id !== provider.id) throw new AppError('This booking is not assigned to you', 403);
  }
  return booking;
}

// GET /api/bookings/:id
const getBooking = asyncHandler(async (req, res) => {
  res.json({ booking: await getAllowedBooking(req.params.id, req.user) });
});

function cancelBooking(booking, user) {
  if (user.role === 'customer' && !CUSTOMER_CANCELLABLE.includes(booking.status)) {
    throw new AppError(`A booking that is "${booking.status}" can no longer be cancelled`, 400);
  }
  assertTransition(booking.status, 'Cancelled');
  return booking.update({ status: 'Cancelled' });
}

// PUT /api/bookings/:id   (customer edits a pending booking or cancels it; admin may also change status)
const updateBooking = asyncHandler(async (req, res) => {
  const booking = await getAllowedBooking(req.params.id, req.user);
  const { status, booking_date, booking_time, address, problem_description, notes } = req.body;

  if (status === 'Cancelled') {
    await cancelBooking(booking, req.user);
    emitBooking('bookingCancelled', booking, req.user);
    return res.json({ booking: await loadFullBooking(booking.id) });
  }

  if (req.user.role === 'customer' && booking.status !== 'Pending') {
    throw new AppError('Only pending bookings can be edited', 400);
  }

  const changes = {};
  if (address !== undefined) changes.address = address;
  if (problem_description !== undefined) changes.problem_description = problem_description;
  if (notes !== undefined) changes.notes = notes;

  if (booking_date !== undefined || booking_time !== undefined) {
    const { date, time } = await cleanDateTime(booking_date ?? booking.booking_date, booking_time ?? booking.booking_time);
    if (booking.provider_id) {
      const provider = await Provider.findByPk(booking.provider_id);
      await assertProviderFree(provider, date, time, booking.id);
    }
    changes.booking_date = date;
    changes.booking_time = time;
  }

  if (status !== undefined) {
    if (req.user.role !== 'admin') throw new AppError('Only an admin can set this status', 403);
    assertTransition(booking.status, status);
    changes.status = status;
  }

  await booking.update(changes);
  res.json({ booking: await loadFullBooking(booking.id) });
});

// DELETE /api/bookings/:id  - customer: cancels it; admin: removes the record
const removeBooking = asyncHandler(async (req, res) => {
  const booking = await getAllowedBooking(req.params.id, req.user);
  if (req.user.role === 'admin') {
    await booking.destroy();
    return res.json({ message: 'Booking deleted' });
  }
  await cancelBooking(booking, req.user);
  emitBooking('bookingCancelled', booking, req.user);
  res.json({ message: 'Booking cancelled', booking: await loadFullBooking(booking.id) });
});

// ---------- Provider actions: accept / reject / start / complete ----------
const ACTIONS = {
  accept: { target: 'Accepted', event: 'bookingAccepted' },
  reject: { target: 'Rejected', event: 'bookingRejected' },
  start: { target: 'In Progress', event: 'bookingStarted' },
  complete: { target: 'Completed', event: 'bookingCompleted' },
};

const providerAction = (action) =>
  asyncHandler(async (req, res) => {
    const { target, event } = ACTIONS[action];
    const booking = await getAllowedBooking(req.params.id, req.user); // also checks the provider owns it

    if (!booking.provider_id) throw new AppError('Assign a provider to this booking first', 400);
    assertTransition(booking.status, target); // blocks invalid jumps such as Pending -> Completed

    if (action === 'accept') {
      // do not accept two jobs at the same date/time
      const provider = await Provider.findByPk(booking.provider_id);
      await assertProviderFree(provider, booking.booking_date, normalizeTime(booking.booking_time), booking.id);
    }

    await booking.update({ status: target });
    emitBooking(event, booking, req.user);
    res.json({ booking: await loadFullBooking(booking.id) });
  });

module.exports = {
  bookingIncludes,
  loadFullBooking,
  assertProviderFree,
  createBooking,
  listBookings,
  getBooking,
  updateBooking,
  removeBooking,
  acceptBooking: providerAction('accept'),
  rejectBooking: providerAction('reject'),
  startBooking: providerAction('start'),
  completeBooking: providerAction('complete'),
};
