const express = require('express');
const {
  listProviders,
  getMyProvider,
  getProvider,
  updateProvider,
  listMyAvailability,
  addAvailability,
  deleteAvailability,
} = require('../controllers/providerController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', listProviders); // public

// "/me" routes must come BEFORE "/:id", otherwise Express would treat "me" as an id.
router.get('/me', protect, authorizeRoles('provider'), getMyProvider);
router.get('/me/availability', protect, authorizeRoles('provider'), listMyAvailability);
router.post('/me/availability', protect, authorizeRoles('provider'), addAvailability);
router.delete('/me/availability/:slotId', protect, authorizeRoles('provider'), deleteAvailability);

router.get('/:id', getProvider); // public
router.put('/:id', protect, authorizeRoles('provider', 'admin'), updateProvider);

module.exports = router;
