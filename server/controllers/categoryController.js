// CATEGORY CONTROLLER: CRUD for service categories (create/update/delete are admin only).
const { Category, Service } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

// GET /api/categories  - also returns how many services each category has
const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  const counts = await sequelize.query(
    'SELECT category_id, COUNT(*) AS total FROM services WHERE is_active = 1 GROUP BY category_id',
    { type: QueryTypes.SELECT }
  );
  const countMap = {};
  counts.forEach((row) => {
    countMap[row.category_id] = Number(row.total);
  });
  res.json({ categories: categories.map((c) => ({ ...c.toJSON(), service_count: countMap[c.id] || 0 })) });
});

// POST /api/categories
const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;
  const category = await Category.create({ name, description, image });
  res.status(201).json({ category });
});

// PUT /api/categories/:id
const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  const { name, description, image } = req.body;
  await category.update({ name, description, image });
  res.json({ category });
});

// DELETE /api/categories/:id  - blocked automatically (by the foreign key) while services still use it
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByPk(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  const used = await Service.count({ where: { category_id: category.id } });
  if (used > 0) throw new AppError(`Cannot delete: ${used} service(s) still use this category`, 400);
  await category.destroy();
  res.json({ message: 'Category deleted' });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
