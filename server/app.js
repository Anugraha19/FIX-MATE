// Builds the Express application (middleware + routes). server.js starts it.
const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const gateway = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// CORS: only our React app may call this API from a browser.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
  })
);

app.use(express.json()); // lets us read JSON request bodies as req.body

app.use('/api', gateway); // everything goes through the API gateway

app.use(notFound); // unknown URL -> 404
app.use(errorHandler); // any error -> clean JSON response

module.exports = app;
