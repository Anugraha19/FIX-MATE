const express = require('express');
const { createReview, listProviderReviews, listMyReviews, listFeaturedReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/featured', listFeaturedReviews); // public (home page)
router.get('/mine', protect, authorizeRoles('customer'), listMyReviews);
router.get('/provider/:providerId', listProviderReviews); // public
router.post('/', protect, authorizeRoles('customer'), createReview);

module.exports = router;
