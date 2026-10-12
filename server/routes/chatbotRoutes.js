const express = require('express');
const { chat } = require('../controllers/chatbotController');
const { optionalAuth } = require('../middleware/authMiddleware');
const rateLimit = require('../utils/rateLimit');

const router = express.Router();
// 15 messages per minute per IP; logged-in users are recognised (optional) so the bot can greet them.
router.post('/', rateLimit({ windowMs: 60000, max: 15 }), optionalAuth, chat);

module.exports = router;
