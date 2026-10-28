import crypto from 'crypto';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/error.js';
import {
  REFRESH_COOKIE,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} from '../utils/tokens.js';
import { sendEmail } from '../utils/email.js';
import { deleteUserData } from '../utils/userData.js';

// Issues an access token (returned in JSON) and a refresh token (httpOnly cookie).
function startSession(res, user, remember = true) {
  setRefreshCookie(res, signRefreshToken(user, remember), remember);
  return signAccessToken(user);
}

// @route POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  if (await User.findOne({ email })) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists' });
  }

  const user = await User.create({ email, password, name });
  const token = startSession(res, user, true);
  res.status(201).json({ success: true, data: { user: user.toClient(), token } });
});

// @route POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password, rememberMe = true } = req.body;

  const user = await User.findOne({ email }).select('+password +tokenVersion');
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Incorrect email or password' });
  }
  if (!user.active) {
    return res.status(403).json({ success: false, message: 'This account has been deactivated' });
  }

  const token = startSession(res, user, rememberMe !== false);
  res.json({ success: true, data: { user: user.toClient(), token } });
});

// @route POST /api/auth/refresh
// Swaps a valid refresh cookie for a new access token (and rotates the cookie).
export const refresh = asyncHandler(async (req, res) => {
  const raw = req.cookies?.[REFRESH_COOKIE];
  if (!raw) return res.status(401).json({ success: false, code: 'NO_REFRESH', message: 'Not signed in' });

  let decoded;
  try {
    decoded = verifyRefreshToken(raw);
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, code: 'BAD_REFRESH', message: 'Session expired' });
  }

  const user = await User.findById(decoded.id).select('+tokenVersion');
  if (!user || !user.active || (user.tokenVersion || 0) !== decoded.v) {
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, code: 'BAD_REFRESH', message: 'Session expired' });
  }

  const token = startSession(res, user, decoded.r === 1);
  res.json({ success: true, data: { user: user.toClient(), token } });
});

// @route POST /api/auth/logout
export const logout = (req, res) => {
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Signed out' });
};

// @route GET /api/auth/profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, data: user.toClient() });
});

// @route PUT /api/auth/profile
export const updateProfile = asyncHandler(async (req, res) => {
  const updates = {};
  if (typeof req.body.name === 'string') updates.name = req.body.name.trim();
  if (typeof req.body.bio === 'string') updates.bio = req.body.bio;
  if (typeof req.body.avatar === 'string') updates.avatar = req.body.avatar;

  // Merge preferences field by field so a partial update doesn't wipe the rest
  const prefs = req.body.preferences || {};
  if (['metric', 'imperial'].includes(prefs.units)) updates['preferences.units'] = prefs.units;
  const goal = Number(prefs.weeklyGoalKm);
  if (Number.isFinite(goal) && goal >= 1 && goal <= 500) updates['preferences.weeklyGoalKm'] = Math.round(goal * 10) / 10;
  const notif = prefs.notifications || {};
  ['email', 'push', 'newBlogPost', 'threadReplies', 'threadLikes'].forEach((k) => {
    if (typeof notif[k] === 'boolean') updates[`preferences.notifications.${k}`] = notif[k];
  });

  const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true });
  res.json({ success: true, data: user.toClient() });
});

// @route PUT /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+password +tokenVersion');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(400).json({ success: false, message: 'Current password is incorrect' });
  }

  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion || 0) + 1; // signs out other devices
  await user.save();

  // Keep this device signed in with a fresh session
  const token = startSession(res, user, true);
  res.json({ success: true, message: 'Password updated successfully', data: { token } });
});

// @route POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Same response whether or not the account exists, so emails can't be probed
  const generic = { success: true, message: 'If an account exists for that email, a reset link has been sent.' };
  if (!user || !user.active) return res.json(generic);

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ validateBeforeSave: false });

  const siteUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const link = `${siteUrl}/reset-password/${rawToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Reset your CoolRunningsFitness password',
      text: `Hi ${user.name},\n\nUse this link to set a new password (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
      html: `<p>Hi ${user.name},</p><p>Use the button below to set a new password. The link is valid for 1 hour.</p><p><a href="${link}" style="background:#C9952A;color:#16100a;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">Reset password</a></p><p>If you didn't ask for this, you can ignore this email.</p>`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.error('Password reset email failed:', err.message);
    return res.status(500).json({ success: false, message: 'Could not send the reset email. Please try again later.' });
  }

  res.json(generic);
});

// @route POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashed,
    passwordResetExpires: { $gt: new Date() },
  }).select('+password +tokenVersion +passwordResetToken +passwordResetExpires');

  if (!user) {
    return res.status(400).json({ success: false, message: 'This reset link is invalid or has expired. Please request a new one.' });
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1; // sign out every existing session
  await user.save();

  const token = startSession(res, user, true);
  res.json({ success: true, message: 'Password reset. You are now signed in.', data: { user: user.toClient(), token } });
});

// @route DELETE /api/auth/account
export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('+password');
  if (!(await user.comparePassword(req.body.password))) {
    return res.status(400).json({ success: false, message: 'Password is incorrect' });
  }
  if (user.role === 'admin') {
    const admins = await User.countDocuments({ role: 'admin', active: true });
    if (admins <= 1) {
      return res.status(400).json({ success: false, message: 'You are the only admin. Make someone else an admin first.' });
    }
  }

  await deleteUserData(user._id);
  await user.deleteOne();
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Account deleted successfully' });
});
