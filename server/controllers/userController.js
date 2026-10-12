// USER CONTROLLER: the logged-in user's own profile and password.
const bcrypt = require('bcryptjs');
const { User, Provider } = require('../models');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/users/me
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, { include: [{ model: Provider, as: 'provider' }] });
  res.json({ user });
});

// PUT /api/users/me  - only these fields can be changed (role/email/is_active cannot)
const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'address', 'city', 'profile_image'];
  const changes = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) changes[field] = req.body[field];
  });

  await req.user.update(changes);
  const user = await User.findByPk(req.user.id, { include: [{ model: Provider, as: 'provider' }] });
  res.json({ user });
});

// PUT /api/users/me/password   body: { currentPassword, newPassword }
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) throw new AppError('Enter your current and new password', 400);
  if (newPassword.length < 6) throw new AppError('New password must be at least 6 characters', 400);

  const user = await User.scope('withPassword').findByPk(req.user.id);
  const ok = await bcrypt.compare(currentPassword, user.password);
  if (!ok) throw new AppError('Current password is incorrect', 400);

  await user.update({ password: await bcrypt.hash(newPassword, 10) });
  res.json({ message: 'Password updated' });
});

module.exports = { getProfile, updateProfile, changePassword };
