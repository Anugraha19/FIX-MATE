// ROLE MIDDLEWARE: allows only certain roles, e.g. router.get('/', protect, authorizeRoles('admin'), handler)
const AppError = require('../utils/AppError');

const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to do this', 403));
  }
  next();
};

module.exports = { authorizeRoles };
