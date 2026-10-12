// RAW SQL queries used for statistics. Sequelize can run plain SQL with sequelize.query().
// They are written in portable SQL (GROUP BY / JOIN) so they are easy to read in a viva.
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../models');

// Average rating and number of reviews for every service that has reviews.
async function serviceRatingMap() {
  const rows = await sequelize.query(
    `SELECT b.service_id AS service_id, AVG(r.rating) AS avg_rating, COUNT(r.id) AS review_count
       FROM reviews r
       JOIN bookings b ON b.id = r.booking_id
      GROUP BY b.service_id`,
    { type: QueryTypes.SELECT }
  );
  const map = {};
  rows.forEach((row) => {
    map[row.service_id] = { rating: Math.round(Number(row.avg_rating) * 10) / 10, review_count: Number(row.review_count) };
  });
  return map;
}

// How many providers offer each service.
async function serviceProviderCountMap() {
  const rows = await sequelize.query(
    `SELECT service_id, COUNT(*) AS provider_count FROM provider_services GROUP BY service_id`,
    { type: QueryTypes.SELECT }
  );
  const map = {};
  rows.forEach((row) => {
    map[row.service_id] = Number(row.provider_count);
  });
  return map;
}

// Completed jobs and review counts for every provider.
async function providerStatsMap() {
  const jobs = await sequelize.query(
    `SELECT provider_id, COUNT(*) AS completed_jobs
       FROM bookings
      WHERE status = 'Completed' AND provider_id IS NOT NULL
      GROUP BY provider_id`,
    { type: QueryTypes.SELECT }
  );
  const reviews = await sequelize.query(
    `SELECT provider_id, COUNT(*) AS review_count FROM reviews GROUP BY provider_id`,
    { type: QueryTypes.SELECT }
  );
  const map = {};
  jobs.forEach((row) => {
    map[row.provider_id] = { completed_jobs: Number(row.completed_jobs), review_count: 0 };
  });
  reviews.forEach((row) => {
    map[row.provider_id] = { completed_jobs: map[row.provider_id]?.completed_jobs || 0, review_count: Number(row.review_count) };
  });
  return map;
}

module.exports = { serviceRatingMap, serviceProviderCountMap, providerStatsMap };
