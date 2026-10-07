const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminOnly');
const { getAnalytics } = require('../controllers/analyticsController');

router.get('/', protect, adminOnly, getAnalytics);

module.exports = router;