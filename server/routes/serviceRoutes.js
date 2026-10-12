const express = require('express');
const { listServices, getService, createService, updateService, deleteService } = require('../controllers/serviceController');
const { listCategories, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Services router (mounted at /api/services)
const serviceRouter = express.Router();
serviceRouter.get('/', listServices); // public
serviceRouter.get('/:id', getService); // public
serviceRouter.post('/', protect, authorizeRoles('admin'), createService);
serviceRouter.put('/:id', protect, authorizeRoles('admin'), updateService);
serviceRouter.delete('/:id', protect, authorizeRoles('admin'), deleteService);

// Categories router (mounted at /api/categories)
const categoryRouter = express.Router();
categoryRouter.get('/', listCategories); // public
categoryRouter.post('/', protect, authorizeRoles('admin'), createCategory);
categoryRouter.put('/:id', protect, authorizeRoles('admin'), updateCategory);
categoryRouter.delete('/:id', protect, authorizeRoles('admin'), deleteCategory);

module.exports = { serviceRouter, categoryRouter };
