// PROVIDER CONTROLLER: public provider listing/profile, provider self-service, and availability slots.
const { Op } = require('sequelize');
const { Provider, User, Service, Category, ProviderService, Booking, Review, Availability } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { providerStatsMap } = require('../utils/stats');
const { todayString } = require('../utils/dateHelpers');

// Only safe, public user fields (no email/phone) are exposed on public provider pages.
const PUBLIC_USER = ['id', 'name', 'profile_image', 'city'];

const intersect = (current, next) => (current === null ? next : current.filter((id) => next.includes(id)));

// Loads a provider with everything the UI needs. `isPrivate` adds the contact details (own profile / admin).
async function loadProvider(where, isPrivate = false) {
  const provider = await Provider.findOne({
    where,
    include: [
      { model: User, as: 'user', attributes: isPrivate ? [...PUBLIC_USER, 'email', 'phone', 'address', 'is_active'] : PUBLIC_USER },
      {
        model: Service,
        as: 'services',
        attributes: ['id', 'name', 'price', 'category_id', 'image'],
        through: { attributes: [] },
        include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      },
    ],
  });
  if (!provider) return null;
  const stats = (await providerStatsMap())[provider.id] || { completed_jobs: 0, review_count: 0 };
  return { ...provider.toJSON(), ...stats };
}

// Finds the Provider row that belongs to the logged-in user.
async function providerOfUser(userId) {
  const provider = await Provider.findOne({ where: { user_id: userId } });
  if (!provider) throw new AppError('Provider profile not found for this account', 404);
  return provider;
}

// GET /api/providers?q=&category=&service=&location=&rating=&available=true&page=&limit=
const listProviders = asyncHandler(async (req, res) => {
  const { q, category, service, location, rating, available } = req.query;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);
  const where = {};

  if (location) where.location = { [Op.like]: `%${location.trim()}%` };
  if (rating) where.rating = { [Op.gte]: Number(rating) };
  if (available === 'true') where.availability_status = 'available';

  if (q) {
    const text = `%${q.trim()}%`;
    const users = await User.findAll({ where: { role: 'provider', name: { [Op.like]: text } }, attributes: ['id'] });
    where[Op.or] = [{ skills: { [Op.like]: text } }, { user_id: { [Op.in]: users.map((u) => u.id) } }];
  }

  // category / service filters go through the provider_services join table
  let allowedIds = null;
  if (category || service) {
    const serviceWhere = {};
    if (service) serviceWhere.id = Number(service);
    if (category) serviceWhere.category_id = Number(category);
    const services = await Service.findAll({ where: serviceWhere, attributes: ['id'] });
    const links = await ProviderService.findAll({ where: { service_id: { [Op.in]: services.map((s) => s.id) } } });
    allowedIds = intersect(allowedIds, [...new Set(links.map((l) => l.provider_id))]);
  }
  if (allowedIds !== null) where.id = { [Op.in]: allowedIds };

  const { count, rows } = await Provider.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: PUBLIC_USER, where: { is_active: true } }],
    order: [['rating', 'DESC'], ['experience', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  // second query: the services of just these providers
  const withServices = await Provider.findAll({
    where: { id: { [Op.in]: rows.map((p) => p.id) } },
    attributes: ['id'],
    include: [
      {
        model: Service,
        as: 'services',
        attributes: ['id', 'name', 'category_id'],
        through: { attributes: [] },
        include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
      },
    ],
  });
  const serviceMap = {};
  withServices.forEach((p) => {
    serviceMap[p.id] = p.services;
  });

  const stats = await providerStatsMap();
  const providers = rows.map((p) => ({
    ...p.toJSON(),
    services: serviceMap[p.id] || [],
    completed_jobs: stats[p.id]?.completed_jobs || 0,
    review_count: stats[p.id]?.review_count || 0,
  }));

  res.json({ providers, total: count, page, pages: Math.max(Math.ceil(count / limit), 1) });
});

// GET /api/providers/me  (provider)
const getMyProvider = asyncHandler(async (req, res) => {
  const mine = await providerOfUser(req.user.id);
  res.json({ provider: await loadProvider({ id: mine.id }, true) });
});

// GET /api/providers/:id  - public profile with reviews, availability and completed jobs
const getProvider = asyncHandler(async (req, res) => {
  const provider = await loadProvider({ id: req.params.id });
  if (!provider || (provider.user && provider.user.is_active === false)) throw new AppError('Provider not found', 404);

  const reviews = await Review.findAll({
    where: { provider_id: provider.id },
    include: [
      { model: User, as: 'customer', attributes: ['id', 'name'] },
      { model: Booking, as: 'booking', attributes: ['id', 'service_id'], include: [{ model: Service, as: 'service', attributes: ['name'] }] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 20,
  });

  const completedJobs = await Booking.findAll({
    where: { provider_id: provider.id, status: 'Completed' },
    attributes: ['id', 'booking_date'],
    include: [{ model: Service, as: 'service', attributes: ['id', 'name'] }],
    order: [['booking_date', 'DESC']],
    limit: 10,
  });

  const availability = await Availability.findAll({
    where: { provider_id: provider.id, available_date: { [Op.gte]: todayString() } },
    order: [['available_date', 'ASC'], ['start_time', 'ASC']],
    limit: 20,
  });

  res.json({ provider, reviews, completedJobs, availability });
});

// PUT /api/providers/:id  (the provider themself, or an admin). `:id` can be "me".
const updateProvider = asyncHandler(async (req, res) => {
  let provider;
  if (req.params.id === 'me') {
    provider = await providerOfUser(req.user.id);
  } else {
    provider = await Provider.findByPk(req.params.id);
    if (!provider) throw new AppError('Provider not found', 404);
    if (req.user.role !== 'admin' && provider.user_id !== req.user.id) {
      throw new AppError('You can only edit your own provider profile', 403);
    }
  }

  const { experience, skills, location, availability_status, service_ids, name, phone, address, city, profile_image } = req.body;

  const providerChanges = {};
  if (experience !== undefined) providerChanges.experience = experience;
  if (skills !== undefined) providerChanges.skills = skills;
  if (location !== undefined) providerChanges.location = location;
  if (availability_status !== undefined) providerChanges.availability_status = availability_status;
  await provider.update(providerChanges);

  const userChanges = {};
  if (name !== undefined) userChanges.name = name;
  if (phone !== undefined) userChanges.phone = phone;
  if (address !== undefined) userChanges.address = address;
  if (city !== undefined) userChanges.city = city;
  if (profile_image !== undefined) userChanges.profile_image = profile_image;
  if (Object.keys(userChanges).length) await User.update(userChanges, { where: { id: provider.user_id }, individualHooks: true });

  // The services a provider offers: setServices() rewrites the rows in provider_services.
  if (Array.isArray(service_ids)) {
    const services = await Service.findAll({ where: { id: { [Op.in]: service_ids } } });
    await provider.setServices(services);
  }

  res.json({ provider: await loadProvider({ id: provider.id }, true) });
});

// ---------- Availability (time slots a provider is free / blocked) ----------

// GET /api/providers/me/availability
const listMyAvailability = asyncHandler(async (req, res) => {
  const provider = await providerOfUser(req.user.id);
  const availability = await Availability.findAll({
    where: { provider_id: provider.id, available_date: { [Op.gte]: todayString() } },
    order: [['available_date', 'ASC'], ['start_time', 'ASC']],
  });
  res.json({ availability });
});

// POST /api/providers/me/availability  body: { available_date, start_time, end_time, is_available }
const addAvailability = asyncHandler(async (req, res) => {
  const provider = await providerOfUser(req.user.id);
  const { available_date, start_time, end_time, is_available } = req.body;
  if (!available_date || !start_time || !end_time) throw new AppError('Date, start time and end time are required', 400);
  if (available_date < todayString()) throw new AppError('Choose today or a future date', 400);

  const slot = await Availability.create({
    provider_id: provider.id,
    available_date,
    start_time,
    end_time,
    is_available: is_available !== false,
  });
  res.status(201).json({ slot });
});

// DELETE /api/providers/me/availability/:slotId
const deleteAvailability = asyncHandler(async (req, res) => {
  const provider = await providerOfUser(req.user.id);
  const slot = await Availability.findOne({ where: { id: req.params.slotId, provider_id: provider.id } });
  if (!slot) throw new AppError('Availability slot not found', 404);
  await slot.destroy();
  res.json({ message: 'Slot removed' });
});

module.exports = {
  loadProvider,
  providerOfUser,
  listProviders,
  getMyProvider,
  getProvider,
  updateProvider,
  listMyAvailability,
  addAvailability,
  deleteAvailability,
};
