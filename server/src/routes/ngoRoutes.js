const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminOnly');
const {
  registerNGO,
  getPendingNGOs,
  getVerifiedNGOs,
  getAllNGOs,
  getMyVerification,
  approveNGO,
  rejectNGO,
  suspendNGO,
} = require('../controllers/ngoController');

router.post('/', protect, registerNGO);
router.get('/verified', protect, getVerifiedNGOs);
router.get('/all', protect, adminOnly, getAllNGOs);
router.get('/mine', protect, getMyVerification);
router.get('/pending', protect, adminOnly, getPendingNGOs);
router.put('/:id/approve', protect, adminOnly, approveNGO);
router.put('/:id/reject', protect, adminOnly, rejectNGO);
router.put('/:id/suspend', protect, adminOnly, suspendNGO);

module.exports = router;
