

// Middleware to check if user is admin
module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    console.warn('[AdminMiddleware] Access denied. Admin only.');
    return res.status(403).json({ success: false, error: 'Access denied. Admin only.' });
  }
  next();
};
