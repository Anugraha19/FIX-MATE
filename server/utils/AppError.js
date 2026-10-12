// An error that carries an HTTP status code, so controllers can simply `throw new AppError('msg', 404)`.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = AppError;
