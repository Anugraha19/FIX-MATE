// Tiny in-memory rate limiter (no extra package). Allows `max` requests per `windowMs` for each IP.
// Protects the Groq key from being drained by one visitor. Resets when the server restarts.
const AppError = require('./AppError');

function rateLimit({ windowMs = 60000, max = 10 } = {}) {
  const hits = new Map(); // ip -> [timestamps]
  return (req, res, next) => {
    const now = Date.now();
    const recent = (hits.get(req.ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      return next(new AppError('You are sending messages too fast. Please wait a minute and try again.', 429));
    }
    recent.push(now);
    hits.set(req.ip, recent);
    if (hits.size > 5000) for (const [ip, t] of hits) if (!t.some((x) => now - x < windowMs)) hits.delete(ip);
    next();
  };
}

module.exports = rateLimit;
