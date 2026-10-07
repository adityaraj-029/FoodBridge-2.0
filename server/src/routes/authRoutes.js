const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminOnly');
const {
  signup,
  login,
  getVolunteers,
  getAllVolunteers,
  approveVolunteer,
  rejectVolunteer,
  suspendVolunteer,
} = require('../controllers/authController');

router.post('/signup', signup);
router.post('/login', login);
router.get('/volunteers', protect, getVolunteers);
router.get('/volunteers/all', protect, adminOnly, getAllVolunteers);
router.put('/volunteers/:id/approve', protect, adminOnly, approveVolunteer);
router.put('/volunteers/:id/reject', protect, adminOnly, rejectVolunteer);
router.put('/volunteers/:id/suspend', protect, adminOnly, suspendVolunteer);

module.exports = router;
