// Wraps an async controller so any rejected Promise is passed to the central error handler.
// Without this, every controller would need its own try/catch.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
