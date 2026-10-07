const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
  createDonation,
  acceptDonation,
  rejectDonation,
  assignVolunteer,
  getMyDonations,
  getAllDonations,
  getMyAcceptedDonations,
  getNGOStats,
  getMyTasks,
  updateDonation,
  deleteDonation,
  verifyPickup,
  markDelivered,
  downloadDonorCertificate,
  downloadVolunteerCertificate,
  downloadQrCode,
} = require('../controllers/donationController');

router.get('/:id/qr-code', protect, downloadQrCode);
router.get('/:id/certificate/donor', protect, downloadDonorCertificate);
router.get('/:id/certificate/volunteer', protect, downloadVolunteerCertificate);
router.post('/', protect, createDonation);
router.get('/my-donations', protect, getMyDonations);
router.get('/my-tasks', protect, getMyTasks);
router.get('/ngo-accepted', protect, getMyAcceptedDonations);
router.get('/ngo-stats', protect, getNGOStats);
router.get('/', protect, getAllDonations);
router.put('/:id', protect, updateDonation);
router.delete('/:id', protect, deleteDonation);
router.put('/:id/accept', protect, acceptDonation);
router.put('/:id/reject', protect, rejectDonation);
router.put('/:id/assign-volunteer', protect, assignVolunteer);
router.put('/:id/verify-pickup', protect, verifyPickup);
router.put('/:id/mark-delivered', protect, markDelivered);

module.exports = router;