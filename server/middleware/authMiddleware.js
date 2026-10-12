// AUTHENTICATION MIDDLEWARE
// Middleware = a function that runs BEFORE the controller. This one checks the login token.
// It reads the "Authorization: Bearer <token>" REQUEST HEADER, verifies the JWT, and loads the user.
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization; // e.g. "Bearer eyJhbGciOi..."
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Please log in to continue', 401);
  }

  const token = header.split(' ')[1];
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new AppError('Your session has expired. Please log in again', 401);
  }

  // The role comes from the DATABASE, never from the token body sent by the browser.
  const user = await User.findByPk(decoded.id);
  if (!user) throw new AppError('This account no longer exists', 401);
  if (!user.is_active) throw new AppError('This account has been disabled', 403);

  req.user = user;
  next();
});

// optionalAuth: like protect, but a missing/invalid token is NOT an error - the request just continues as a guest.
// Used by the chatbot, which anyone may use, but which can greet a logged-in user by name.
const optionalAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (user && user.is_active) req.user = user;
    } catch (err) {
      // ignore - treat as guest
    }
  }
  next();
});

module.exports = { protect, optionalAuth };
