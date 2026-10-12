// CHATBOT CONTROLLER - the "FixMate Assistant".
// Flow: browser -> POST /api/chatbot -> this controller -> Groq API -> reply -> browser.
// The Groq key stays on the SERVER (in .env). It is never sent to the browser.
const { Category, Service } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const GROQ_URL = () => `${process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1'}/chat/completions`;
const MAX_MESSAGES = 12; // only the latest messages are sent to Groq (keeps cost and size low)
const MAX_CHARS = 1000;

// Builds the "system prompt": instructions + live facts from OUR database, so answers are about FixMate.
async function buildSystemPrompt(user) {
  const categories = await Category.findAll({
    include: [{ model: Service, as: 'services', where: { is_active: true }, required: false }],
    order: [['name', 'ASC']],
  });
  const catalogue = categories
    .map((c) => {
      const items = (c.services || []).map((s) => `${s.name} (Rs ${Number(s.price)}, ~${s.duration} min)`).join('; ');
      return `- ${c.name}: ${items || 'no services yet'}`;
    })
    .join('\n');

  return [
    'You are the FixMate Assistant, a friendly helper on the FixMate home-repair website.',
    'Help visitors with: which service they need, prices and duration, how to book, how to register/login, cancelling, reviews, and how providers work.',
    'Rules: answer ONLY about FixMate and home repairs. Keep answers short (2-5 sentences) and simple. Use only the prices listed below - never invent prices, providers or discounts. If you do not know, say so and suggest the Contact page.',
    'For anything dangerous (gas leak, electrical sparks, flooding) first tell the person to stay safe and call local emergency services, then suggest booking.',
    'Never ask for or accept passwords or payment details.',
    '',
    'HOW BOOKING WORKS: 1) Register or login as a customer. 2) Open Services and pick one. 3) Click Book, choose a date, time slot and provider, add your address. 4) The provider accepts, starts and completes the job. 5) After completion you can leave a review. Customers can cancel from My Bookings before the provider starts the job (status Pending, Confirmed or Assigned). Prices are fixed by the service, not by the provider.',
    '',
    'SERVICES AND PRICES:',
    catalogue || '(no services listed yet)',
    '',
    user ? `The visitor is logged in as ${user.name} (role: ${user.role}).` : 'The visitor is not logged in.',
  ].join('\n');
}

const chat = asyncHandler(async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new AppError('The chatbot is not set up yet (GROQ_API_KEY is missing on the server).', 503);

  // 1) Validate input - never trust the browser
  const incoming = req.body && req.body.messages;
  if (!Array.isArray(incoming) || incoming.length === 0) throw new AppError('Please send a message', 400);
  const messages = incoming
    .filter((m) => m && ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_CHARS) }))
    .slice(-MAX_MESSAGES);
  if (!messages.length || messages[messages.length - 1].role !== 'user') throw new AppError('The last message must be from the user', 400);

  // 2) Call Groq (OpenAI-compatible endpoint)
  const system = await buildSystemPrompt(req.user);
  let response;
  try {
    response = await fetch(GROQ_URL(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [{ role: 'system', content: system }, ...messages],
        temperature: 0.4,
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch (err) {
    // Print the REAL reason in the server console (the browser only gets a friendly message).
    const cause = err.cause ? ` | cause: ${err.cause.code || ''} ${err.cause.message || ''}` : '';
    console.error(`Chatbot could not reach Groq: ${err.name}: ${err.message}${cause}`);
    if (err instanceof ReferenceError) {
      throw new AppError('The chatbot needs Node.js 18 or newer. Please update Node.js.', 502);
    }
    throw new AppError('The assistant could not be reached right now. Please try again.', 502);
  }

  // 3) Map Groq errors to safe messages (never leak the raw Groq error or the key)
  if (!response.ok) {
    console.error('Groq error status:', response.status);
    if (response.status === 429) throw new AppError('The assistant is busy. Please try again in a moment.', 429);
    if (response.status === 401) throw new AppError('The chatbot key on the server is invalid.', 502);
    throw new AppError('The assistant had a problem. Please try again.', 502);
  }

  const data = await response.json();
  const reply = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  if (!reply) throw new AppError('The assistant gave an empty answer. Please try again.', 502);
  res.json({ reply: reply.trim() });
});

module.exports = { chat };
