// CENTRALIZED ERROR HANDLING: every error in the app ends up in errorHandler,
// which turns it into a clean JSON response with the right HTTP status code.
const AppError = require('../utils/AppError');

// 404 for routes that do not exist
const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong on the server';
  let details;

  switch (err.name) {
    case 'SequelizeValidationError': // a model validation failed
      statusCode = 400;
      details = err.errors.map((e) => e.message);
      message = details[0];
      break;
    case 'SequelizeUniqueConstraintError': // e.g. duplicate email
      statusCode = 400;
      message = err.errors?.[0]?.path === 'email' ? 'This email is already registered' : 'This value already exists';
      break;
    case 'SequelizeForeignKeyConstraintError':
      statusCode = 400;
      message = 'This record is linked to other data, so the change is not allowed';
      break;
    case 'SequelizeDatabaseError':
      statusCode = 400;
      message = 'The database rejected this request. Please check the values you sent';
      break;
    case 'SequelizeConnectionError':
    case 'SequelizeConnectionRefusedError':
      statusCode = 500;
      message = 'Cannot reach the database';
      break;
    default:
      break;
  }

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    message,
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 ? { stack: err.stack } : {}),
  });
};

module.exports = { notFound, errorHandler };
