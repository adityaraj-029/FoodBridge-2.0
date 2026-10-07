const User = require('../models/User');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'rajadityaraj005@gmail.com').toLowerCase();

const adminOnly = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user.id).select('role email');
    if (!user || user.role !== 'admin' || user.email.toLowerCase() !== ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Only the configured admin account can access this page' });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Could not verify admin access' });
  }
};

module.exports = adminOnly;
