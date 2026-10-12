// API GATEWAY
// One central entry point for the whole API. Every request to /api passes through this router,
// which (1) logs it, (2) answers shared endpoints (health, booking config), and
// (3) forwards the request to the right feature router (auth, services, bookings ...).
// Benefit: app.js stays tiny and new modules are added in a single place.
const express = require('express');
const path = require('path');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const { serviceRouter, categoryRouter } = require('./serviceRoutes');
const providerRoutes = require('./providerRoutes');
const bookingRoutes = require('./bookingRoutes');
const reviewRoutes = require('./reviewRoutes');
const adminRoutes = require('./adminRoutes');
const chatbotRoutes = require('./chatbotRoutes');

const { readJsonFile } = require('../utils/readJsonFile');
const { Booking } = require('../models');
const { writeLog } = require('../utils/logger');

const gateway = express.Router();

// 1) Gateway-level middleware: reads REQUEST HEADERS and logs each call.
gateway.use((req, res, next) => {
  const hasToken = Boolean(req.headers.authorization);
  const origin = req.headers.origin || 'direct';
  writeLog('requests.log', `${req.method} ${req.originalUrl} | auth header: ${hasToken ? 'yes' : 'no'} | origin: ${origin}`);
  next();
});

// 2) Shared endpoints
gateway.get('/health', (req, res) => res.json({ status: 'ok', app: 'FixMate API', time: new Date().toISOString() }));

// Uses the CALLBACK style readJsonFile directly (see utils/readJsonFile.js).
gateway.get('/config/booking', (req, res, next) => {
  readJsonFile(path.join(__dirname, '..', 'data', 'bookingConfig.json'), (err, config) => {
    if (err) return next(err);
    res.json({ slots: config.slots, maxDaysAhead: config.maxDaysAhead, statuses: Booking.STATUSES });
  });
});

// 3) Forward to feature routers
gateway.use('/auth', authRoutes);
gateway.use('/users', userRoutes);
gateway.use('/services', serviceRouter);
gateway.use('/categories', categoryRouter);
gateway.use('/providers', providerRoutes);
gateway.use('/bookings', bookingRoutes);
gateway.use('/reviews', reviewRoutes);
gateway.use('/admin', adminRoutes);
gateway.use('/chatbot', chatbotRoutes);

module.exports = gateway;
