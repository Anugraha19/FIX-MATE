// SERVICE CONTROLLER: browsing, searching, filtering and admin CRUD for services.
const { Op } = require('sequelize');
const { Service, Category, Provider, User, Booking } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { serviceRatingMap, serviceProviderCountMap } = require('../utils/stats');

const SORTS = {
  name: [['name', 'ASC']],
  price_asc: [['price', 'ASC']],
  price_desc: [['price', 'DESC']],
  newest: [['createdAt', 'DESC']],
};

// Keeps only the ids that appear in BOTH lists (used when several filters are active).
const intersect = (current, next) => (current === null ? next : current.filter((id) => next.includes(id)));

// Shared by the public list (/api/services) and the admin list (/api/admin/services).
async function findServices(query, includeInactive = false) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 12, 1), 50);
  const where = {};
  if (!includeInactive) where.is_active = true;

  // ---- category filter (accepts an id or a name) ----
  if (query.category) {
    if (/^\d+$/.test(query.category)) {
      where.category_id = Number(query.category);
    } else {
      const cat = await Category.findOne({ where: { name: query.category } });
      where.category_id = cat ? cat.id : 0;
    }
  }

  // ---- price range: Op.gte means >=, Op.lte means <= ----
  if (query.minPrice || query.maxPrice) {
    where.price = {};
    if (query.minPrice) where.price[Op.gte] = Number(query.minPrice);
    if (query.maxPrice) where.price[Op.lte] = Number(query.maxPrice);
  }

  // ---- text search: service name, description or category name (Op.like = SQL LIKE) ----
  if (query.q) {
    const text = `%${query.q.trim()}%`;
    const matchingCategories = await Category.findAll({ where: { name: { [Op.like]: text } }, attributes: ['id'] });
    where[Op.or] = [
      { name: { [Op.like]: text } },
      { description: { [Op.like]: text } },
      { category_id: { [Op.in]: matchingCategories.map((c) => c.id) } },
    ];
  }

  // ---- filters that depend on other tables: collect the matching service ids ----
  let allowedIds = null;

  if (query.location || query.available === 'true') {
    const providerWhere = {};
    if (query.location) providerWhere.location = { [Op.like]: `%${query.location.trim()}%` };
    if (query.available === 'true') providerWhere.availability_status = 'available';
    const providers = await Provider.findAll({
      where: providerWhere,
      attributes: ['id'],
      include: [{ model: Service, as: 'services', attributes: ['id'], through: { attributes: [] } }],
    });
    const ids = [...new Set(providers.flatMap((p) => p.services.map((s) => s.id)))];
    allowedIds = intersect(allowedIds, ids);
  }

  const ratings = await serviceRatingMap(); // raw SQL: average rating per service
  if (query.rating) {
    const minRating = Number(query.rating);
    const ids = Object.keys(ratings).filter((id) => ratings[id].rating >= minRating).map(Number);
    allowedIds = intersect(allowedIds, ids);
  }

  if (allowedIds !== null) where.id = { [Op.in]: allowedIds };

  const { count, rows } = await Service.findAndCountAll({
    where,
    include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
    order: SORTS[query.sort] || SORTS.name,
    limit,
    offset: (page - 1) * limit, // pagination
  });

  const providerCounts = await serviceProviderCountMap();
  const services = rows.map((s) => ({
    ...s.toJSON(),
    rating: ratings[s.id]?.rating || 0,
    review_count: ratings[s.id]?.review_count || 0,
    provider_count: providerCounts[s.id] || 0,
  }));

  return { services, total: count, page, pages: Math.max(Math.ceil(count / limit), 1) };
}

// GET /api/services?q=&category=&minPrice=&maxPrice=&rating=&location=&available=true&page=&limit=&sort=
const listServices = asyncHandler(async (req, res) => {
  res.json(await findServices(req.query, false));
});

// GET /api/services/:id  - the service plus the providers who offer it
const getService = asyncHandler(async (req, res) => {
  const service = await Service.findByPk(req.params.id, {
    include: [{ model: Category, as: 'category', attributes: ['id', 'name'] }],
  });
  if (!service || !service.is_active) throw new AppError('Service not found', 404);

  const providers = await Provider.findAll({
    include: [
      { model: User, as: 'user', attributes: ['id', 'name', 'profile_image', 'city'], where: { is_active: true } },
      { model: Service, as: 'services', where: { id: service.id }, attributes: ['id'], through: { attributes: [] } },
    ],
    order: [['rating', 'DESC']],
  });

  const ratings = await serviceRatingMap();
  res.json({
    service: { ...service.toJSON(), rating: ratings[service.id]?.rating || 0, review_count: ratings[service.id]?.review_count || 0 },
    providers: providers.map((p) => {
      const json = p.toJSON();
      delete json.services;
      return json;
    }),
  });
});

const SERVICE_FIELDS = ['category_id', 'name', 'description', 'price', 'duration', 'image', 'is_active'];
const pickServiceFields = (body) => {
  const data = {};
  SERVICE_FIELDS.forEach((f) => {
    if (body[f] !== undefined) data[f] = body[f];
  });
  return data;
};

// POST /api/services  (admin)
const createService = asyncHandler(async (req, res) => {
  const data = pickServiceFields(req.body);
  const category = await Category.findByPk(data.category_id);
  if (!category) throw new AppError('Choose a valid category', 400);
  const service = await Service.create(data);
  res.status(201).json({ service });
});

// PUT /api/services/:id  (admin)
const updateService = asyncHandler(async (req, res) => {
  const service = await Service.findByPk(req.params.id);
  if (!service) throw new AppError('Service not found', 404);
  const data = pickServiceFields(req.body);
  if (data.category_id) {
    const category = await Category.findByPk(data.category_id);
    if (!category) throw new AppError('Choose a valid category', 400);
  }
  await service.update(data);
  res.json({ service });
});

// DELETE /api/services/:id  (admin) - a service that already has bookings must be deactivated instead
const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findByPk(req.params.id);
  if (!service) throw new AppError('Service not found', 404);
  const bookingCount = await Booking.count({ where: { service_id: service.id } });
  if (bookingCount > 0) {
    throw new AppError(`This service has ${bookingCount} booking(s). Set it to inactive instead of deleting it`, 400);
  }
  await service.destroy();
  res.json({ message: 'Service deleted' });
});

module.exports = { findServices, listServices, getService, createService, updateService, deleteService };
