const express = require('express');
const {
  createBooking,
  listBookings,
  getBooking,
  updateBooking,
  removeBooking,
  acceptBooking,
  rejectBooking,
  startBooking,
  completeBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(protect); // every booking route needs login

router.post('/', authorizeRoles('customer'), createBooking);
router.get('/', listBookings); // result depends on the role
router.get('/:id', getBooking);
router.put('/:id', authorizeRoles('customer', 'admin'), updateBooking);
router.delete('/:id', authorizeRoles('customer', 'admin'), removeBooking);

// provider actions (the status workflow blocks invalid steps)
router.put('/:id/accept', authorizeRoles('provider', 'admin'), acceptBooking);
router.put('/:id/reject', authorizeRoles('provider', 'admin'), rejectBooking);
router.put('/:id/start', authorizeRoles('provider', 'admin'), startBooking);
router.put('/:id/complete', authorizeRoles('provider', 'admin'), completeBooking);

module.exports = router;
