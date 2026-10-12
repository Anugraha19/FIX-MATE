// REVIEW CONTROLLER: customers rate completed jobs; the provider's average rating is recalculated.
const { fn, col } = require('sequelize');
const { Review, Booking, Provider, User, Service } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Recalculates Provider.rating from all of that provider's reviews (AVG done by the database).
async function refreshProviderRating(providerId) {
  const row = await Review.findOne({
    attributes: [[fn('AVG', col('rating')), 'average']],
    where: { provider_id: providerId },
    raw: true,
  });
  const average = row && row.average ? Math.round(Number(row.average) * 10) / 10 : 0;
  await Provider.update({ rating: average }, { where: { id: providerId } });
  return average;
}

// POST /api/reviews   body: { booking_id, rating, comment }   (customer)
const createReview = asyncHandler(async (req, res) => {
  const { booking_id, rating, comment } = req.body;
  if (!booking_id) throw new AppError('booking_id is required', 400);

  const booking = await Booking.findByPk(booking_id);
  if (!booking) throw new AppError('Booking not found', 404);
  if (booking.customer_id !== req.user.id) throw new AppError('You can only review your own bookings', 403);
  if (booking.status !== 'Completed') throw new AppError('You can review a service after it is completed', 400);
  if (!booking.provider_id) throw new AppError('This booking has no provider to review', 400);

  const already = await Review.findOne({ where: { booking_id: booking.id } });
  if (already) throw new AppError('You have already reviewed this booking', 400);

  const review = await Review.create({
    booking_id: booking.id,
    customer_id: req.user.id,
    provider_id: booking.provider_id,
    rating: Number(rating),
    comment,
  });
  await refreshProviderRating(booking.provider_id);
  res.status(201).json({ review });
});

// GET /api/reviews/provider/:providerId   (public)
const listProviderReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.findAll({
    where: { provider_id: req.params.providerId },
    include: [
      { model: User, as: 'customer', attributes: ['id', 'name'] },
      { model: Booking, as: 'booking', attributes: ['id'], include: [{ model: Service, as: 'service', attributes: ['id', 'name'] }] },
    ],
    order: [['createdAt', 'DESC']],
  });
  const count = reviews.length;
  const average = count ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10 : 0;
  res.json({ reviews, count, average });
});

// GET /api/reviews/mine   (customer: reviews I wrote)
const listMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.findAll({
    where: { customer_id: req.user.id },
    include: [
      {
        model: Provider,
        as: 'provider',
        attributes: ['id'],
        include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
      },
      { model: Booking, as: 'booking', attributes: ['id'], include: [{ model: Service, as: 'service', attributes: ['id', 'name'] }] },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json({ reviews });
});

// Latest high-rated reviews for the home page (public).
const listFeaturedReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.findAll({
    where: { rating: { [require('sequelize').Op.gte]: 4 } },
    include: [
      { model: User, as: 'customer', attributes: ['id', 'name', 'city'] },
      { model: Booking, as: 'booking', attributes: ['id'], include: [{ model: Service, as: 'service', attributes: ['name'] }] },
    ],
    order: [['createdAt', 'DESC']],
    limit: 6,
  });
  res.json({ reviews });
});

module.exports = { refreshProviderRating, createReview, listProviderReviews, listMyReviews, listFeaturedReviews };
