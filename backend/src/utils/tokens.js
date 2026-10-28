import jwt from 'jsonwebtoken';

export const REFRESH_COOKIE = 'crf_refresh';

const accessSecret = () => process.env.JWT_SECRET;
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}-refresh`;

// Short-lived access token, sent in the Authorization header.
export function signAccessToken(user) {
  const expiresIn = user.role === 'admin'
    ? process.env.ADMIN_JWT_EXPIRE || '10m'
    : process.env.JWT_EXPIRE || '15m';
  return jwt.sign({ id: user._id.toString(), role: user.role }, accessSecret(), { expiresIn });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, accessSecret());
}

// Long-lived refresh token, kept in an httpOnly cookie the browser JS can't read.
// `v` is the user's tokenVersion: bumping it (password change/reset) signs out
// every other device.
export function signRefreshToken(user, remember = true) {
  return jwt.sign(
    { id: user._id.toString(), v: user.tokenVersion || 0, r: remember ? 1 : 0 },
    refreshSecret(),
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
  );
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, refreshSecret());
}

function cookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  // If the frontend and API are on different domains in production, the cookie
  // must be SameSite=None; Secure. Override with COOKIE_SAMESITE if needed.
  const sameSite = process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax');
  return {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    path: '/api/auth',
  };
}

function parseDurationMs(value) {
  const m = /^(\d+)([smhd])$/.exec(value || '');
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  return n * { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
}

export function setRefreshCookie(res, token, remember = true) {
  const opts = cookieOptions();
  // "Remember me" off → session cookie, cleared when the browser closes.
  if (remember) opts.maxAge = parseDurationMs(process.env.JWT_REFRESH_EXPIRE || '7d');
  res.cookie(REFRESH_COOKIE, token, opts);
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, cookieOptions());
}
