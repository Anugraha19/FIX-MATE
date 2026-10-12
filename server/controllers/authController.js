// AUTH CONTROLLER: register, login, and "who am I".
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, Provider } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const loadUser = (id) => User.findByPk(id, { include: [{ model: Provider, as: 'provider' }] });

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, confirmPassword, address, city, role } = req.body;

  // Basic checks first, so the user gets clear messages.
  if (!name || !email || !phone || !password) throw new AppError('Name, email, phone and password are required', 400);
  if (password.length < 6) throw new AppError('Password must be at least 6 characters', 400);
  if (confirmPassword !== undefined && password !== confirmPassword) throw new AppError('Passwords do not match', 400);

  // SECURITY: nobody can register as admin. Only "customer" or "provider" is accepted.
  if (role === 'admin') throw new AppError('Admin accounts cannot be created from the registration form', 403);
  const safeRole = role === 'provider' ? 'provider' : 'customer';

  const existing = await User.findOne({ where: { email: String(email).toLowerCase() } });
  if (existing) throw new AppError('This email is already registered', 400);

  const hashedPassword = await bcrypt.hash(password, 10); // never store the plain password
  const user = await User.create({
    name: name.trim(),
    email: String(email).toLowerCase().trim(),
    phone: phone.trim(),
    password: hashedPassword,
    role: safeRole,
    address,
    city,
  });

  // A provider account also gets a provider profile row (users 1 -> 1 providers).
  if (safeRole === 'provider') {
    await Provider.create({ user_id: user.id, experience: 0, skills: '', location: city || '' });
  }

  res.status(201).json({ token: signToken(user.id), user: await loadUser(user.id) });
});

// POST /api/auth/login   body: { email OR phone, password }
const login = asyncHandler(async (req, res) => {
  const { email, phone, password } = req.body;
  if ((!email && !phone) || !password) throw new AppError('Enter your email or phone number and your password', 400);

  const where = email ? { email: String(email).toLowerCase().trim() } : { phone: String(phone).trim() };
  // The "withPassword" scope brings the hash back so we can compare it.
  const user = await User.scope('withPassword').findOne({ where: { [Op.and]: [where] } });

  const passwordOk = user ? await bcrypt.compare(password, user.password) : false;
  if (!user || !passwordOk) throw new AppError('Incorrect email/phone or password', 401);
  if (!user.is_active) throw new AppError('This account has been disabled. Contact FixMate support', 403);

  res.json({ token: signToken(user.id), user: await loadUser(user.id) });
});

// GET /api/auth/me   (needs a valid token)
const me = asyncHandler(async (req, res) => {
  res.json({ user: await loadUser(req.user.id) });
});

module.exports = { register, login, me };
