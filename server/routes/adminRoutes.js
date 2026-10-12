const express = require('express');
const admin = require('../controllers/adminController');
const { listBookings } = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(protect, authorizeRoles('admin')); // everything under /api/admin is admin-only

router.get('/dashboard', admin.getDashboard);

router.get('/users', admin.listUsers);
router.put('/users/:id', admin.updateUser);
router.delete('/users/:id', admin.deleteUser);

router.get('/providers', admin.listProvidersAdmin);
router.post('/providers', admin.createProviderAdmin);
router.put('/providers/:id', admin.updateProviderAdmin);
router.delete('/providers/:id', admin.deleteProviderAdmin);

router.get('/services', admin.listServicesAdmin);

router.get('/bookings', listBookings); // admin scope = all bookings
router.put('/bookings/:id/assign', admin.assignProvider);
router.put('/bookings/:id/status', admin.updateBookingStatus);

router.get('/reviews', admin.listReviewsAdmin);
router.delete('/reviews/:id', admin.deleteReview);

router.get('/reports', admin.getReports);
router.get('/reports/bookings.csv', admin.downloadBookingsCsv);
router.post('/reports/save', admin.saveBookingsReport);

module.exports = router;
