import User from '../models/User.js';
import { verifyAccessToken } from '../utils/tokens.js';

function readBearer(req) {
  const h = req.headers.authorization;
  return h && h.startsWith('Bearer ') ? h.slice(7) : null;
}

// Requires a valid access token.
export const protect = async (req, res, next) => {
  const token = readBearer(req);
  if (!token) {
    return res.status(401).json({ success: false, code: 'NO_TOKEN', message: 'Please sign in to continue' });
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    // TOKEN_EXPIRED tells the frontend to refresh and retry instead of logging out
    const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN';
    return res.status(401).json({ success: false, code, message: 'Session expired' });
  }

  try {
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ success: false, code: 'NO_USER', message: 'User not found' });
    if (!user.active) return res.status(403).json({ success: false, code: 'DEACTIVATED', message: 'Account has been deactivated' });
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Access denied. Admin privileges required.' });
};

// Attaches req.user when a valid token is sent, but never blocks the request.
export const optionalAuth = async (req, res, next) => {
  const token = readBearer(req);
  if (!token) return next();
  try {
    const decoded = verifyAccessToken(token);
    req.user = await User.findById(decoded.id).select('-password');
  } catch {
    req.user = null;
  }
  next();
};
