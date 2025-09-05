const jwt = require('jsonwebtoken');


// Middleware to authenticate JWT and attach user info to request
module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    console.warn('[AuthMiddleware] No token provided');
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, email, role }
    console.log('[AuthMiddleware] Authenticated user:', req.user);
    next();
  } catch (err) {
    console.warn('[AuthMiddleware] Invalid or expired token');
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
