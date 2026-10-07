const crypto = require('crypto');
const QRCode = require('qrcode');
const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
const { isVerifiedNGO } = require('./ngoController');
const User = require('../models/User');
const { findBestMatches } = require('../utils/matchingEngine');
const sendEmail = require('../utils/emailService');
const { generateDonorCertificate, generateVolunteerCertificate } = require('../utils/certificateGenerator');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
const generateQrToken = () => crypto.randomBytes(24).toString('hex');

const createDonation = async (req, res) => {
  try {
    const {
      foodItems, cookedTime, expiryTime, alternatePhone,
      pickupLocation, donorType, donorTypeOther, organizationName,
      idProofImage, termsAccepted,
    } = req.body;

    const donation = await Donation.create({
      donor: req.user.id,
      foodItems,
      cookedTime,
      expiryTime,
      alternatePhone,
      pickupLocation,
      donorType,
      donorTypeOther,
      organizationName,
      idProofImage,
      termsAccepted,
    });

    const allNGOs = await NGO.find({ isApproved: true });
    const topMatches = findBestMatches(donation, allNGOs);
    console.log('Top matched NGOs:', topMatches.map((m) => m.ngo.organizationName));

    const donor = await User.findById(req.user.id);
    const itemSummary = foodItems.map((i) => `${i.name} (${i.quantity})`).join(', ');
    sendEmail(
      donor.email,
      'FoodBridge - Donation Listed',
      `Hi ${donor.name}, your donation (${itemSummary}) has been listed and is being matched with nearby NGOs.`
    );


    res.status(201).json({
      message: 'Donation listed successfully',
      donation,
      matchedNGOs: topMatches.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create donation', error: error.message });
  }
};

const acceptDonation = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user.id });
    if (!ngo) return res.status(403).json({ message: 'You are not registered as an NGO' });
    if (!isVerifiedNGO(ngo)) {
      return res.status(403).json({ message: 'Your NGO must be verified by an admin before managing donations' });
    }

    const donation = await Donation.findById(req.params.id).populate('donor', 'name email phone');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    const otp = generateOTP();

    donation.status = 'accepted';
    donation.otp = otp;
    donation.qrCode = generateQrToken();
    donation.assignedNGO = ngo._id;
    donation.acceptedAt = new Date();
    await donation.save();

    sendEmail(
      donation.donor.email,
      'FoodBridge - Donation Accepted',
      `Hi ${donation.donor.name}, your donation has been accepted by ${ngo.organizationName}. Your pickup OTP is: ${otp}. Please share this OTP with the volunteer at the time of pickup.`
    );


    res.status(200).json({ message: 'Donation accepted, OTP generated', donation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to accept donation', error: error.message });
  }
};

const rejectDonation = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user.id });
    if (!ngo) return res.status(403).json({ message: 'You are not registered as an NGO' });
    if (!isVerifiedNGO(ngo)) {
      return res.status(403).json({ message: 'Your NGO must be verified by an admin before managing donations' });
    }

    const donation = await Donation.findById(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    // Use an atomic update instead of donation.save().
    // This also works with older donation records that may not contain
    // every field required by the current Donation schema.
    const updatedDonation = await Donation.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { rejectedBy: ngo._id } },
      { new: true, runValidators: false }
    );

    res.status(200).json({ message: 'Donation rejected', donation: updatedDonation });
  } catch (error) {
    console.error('Reject donation error:', error.stack || error);
    res.status(500).json({ message: 'Failed to reject donation', error: error.message });
  }
};

const assignVolunteer = async (req, res) => {
  try {
    if (req.user.role !== 'ngo') {
      return res.status(403).json({ message: 'Only an NGO can assign volunteers' });
    }

    const ngo = await NGO.findOne({ user: req.user.id });
    if (!ngo) {
      return res.status(403).json({ message: 'You are not registered as an NGO' });
    }

    const { volunteerId } = req.body;
    if (!volunteerId) {
      return res.status(400).json({ message: 'Volunteer is required' });
    }

    const donation = await Donation.findById(req.params.id).populate('donor', 'name email phone');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    if (!donation.assignedNGO || String(donation.assignedNGO) !== String(ngo._id)) {
      return res.status(403).json({ message: 'This donation is not assigned to your NGO' });
    }

    if (!['accepted', 'assigned'].includes(donation.status)) {
      return res.status(400).json({ message: 'This donation cannot be assigned now' });
    }

    const volunteer = await User.findOne({ _id: volunteerId, role: 'volunteer' });
    if (!volunteer) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    const trustedVolunteer = volunteer.isVerified === true &&
      (!volunteer.verificationStatus || volunteer.verificationStatus === 'verified');
    if (!trustedVolunteer) {
      return res.status(403).json({ message: 'This volunteer has not been verified by the admin yet' });
    }

    donation.assignedVolunteer = volunteer._id;
    donation.qrCode = donation.qrCode || generateQrToken();
    donation.status = 'assigned';
    await donation.save();

    sendEmail(
      volunteer.email,
      'FoodBridge - New Pickup Task',
      `Hi ${volunteer.name}, you have been assigned a pickup from ${donation.pickupLocation?.address || 'the pickup location'}. Please collect it soon.`
    );


    res.status(200).json({ message: 'Volunteer assigned', donation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign volunteer', error: error.message });
  }
};

const getMyDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user.id }).sort({ createdAt: -1 });
    const activeDonations = donations.filter(
      (donation) => ['accepted', 'assigned'].includes(donation.status) && !donation.qrCode
    );

    if (activeDonations.length) {
      await Promise.all(
        activeDonations.map(async (donation) => {
          donation.qrCode = generateQrToken();
          await donation.save();
        })
      );
    }

    const responseDonations = await Promise.all(
      donations.map(async (donation) => {
        const item = donation.toObject();

        if (['accepted', 'assigned'].includes(donation.status) && donation.qrCode) {
          item.qrImage = await QRCode.toDataURL(
            JSON.stringify({
              donationId: String(donation._id),
              qrToken: donation.qrCode,
            }),
            { width: 320, margin: 2 }
          );
        }

        return item;
      })
    );

    res.status(200).json(responseDonations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch donations', error: error.message });
  }
};

const getAllDonations = async (req, res) => {
  try {
    if (!['ngo', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only NGO or admin users can view donation requests' });
    }

    const ngo = await NGO.findOne({ user: req.user.id });
    if (req.user.role === 'ngo' && !ngo) {
      return res.status(403).json({ message: 'You are not registered as an NGO' });
    }
    if (ngo && !isVerifiedNGO(ngo)) {
      return res.status(200).json([]);
    }

    const filter = { status: 'pending' };
    if (ngo) filter.rejectedBy = { $ne: ngo._id };

    const donations = await Donation.find(filter)
      .populate('donor', 'name email phone')
      .sort({ createdAt: -1 });
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch donations', error: error.message });
  }
};

const getMyAcceptedDonations = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user.id });
    if (!ngo) return res.status(403).json({ message: 'You are not registered as an NGO' });
    if (!isVerifiedNGO(ngo)) {
      return res.status(200).json([]);
    }

    const donations = await Donation.find({
      assignedNGO: ngo._id,
      status: { $in: ['accepted', 'assigned', 'picked_up'] },
    })
      .select('-otp')
      .populate('donor', 'name phone')
      .populate('assignedVolunteer', 'name phone')
      .sort({ createdAt: -1 });

    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch accepted donations', error: error.message });
  }
};

const getNGOStats = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user.id });
    if (!ngo) return res.status(403).json({ message: 'You are not registered as an NGO' });
    if (!isVerifiedNGO(ngo)) {
      return res.status(200).json({
        organizationName: ngo.organizationName,
        verificationStatus: ngo.verificationStatus || 'pending',
        totalAccepted: 0,
        delivered: 0,
        inProgress: 0,
        pendingRequests: 0,
      });
    }

    const totalAccepted = await Donation.countDocuments({ assignedNGO: ngo._id });
    const delivered = await Donation.countDocuments({ assignedNGO: ngo._id, status: 'delivered' });
    const inProgress = await Donation.countDocuments({
      assignedNGO: ngo._id,
      status: { $in: ['accepted', 'assigned', 'picked_up'] },
    });
    const pendingRequests = await Donation.countDocuments({
      status: 'pending',
      rejectedBy: { $ne: ngo._id },
    });

    res.status(200).json({ organizationName: ngo.organizationName, totalAccepted, delivered, inProgress, pendingRequests });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const tasks = await Donation.find({ assignedVolunteer: req.user.id })
      .select('-otp')
      .populate('donor', 'name phone')
      .sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};

const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, donor: req.user.id },
      req.body,
      { new: true }
    );
    if (!donation) return res.status(404).json({ message: 'Donation not found or unauthorized' });
    res.status(200).json({ message: 'Donation updated', donation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update donation', error: error.message });
  }
};

const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, donor: req.user.id });
    if (!donation) return res.status(404).json({ message: 'Donation not found or unauthorized' });

    if (donation.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot cancel a donation that has already been accepted' });
    }

    await Donation.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Donation cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete donation', error: error.message });
  }
};

const verifyPickup = async (req, res) => {
  try {
    const submittedOtp = String(req.body.otp || '').trim();
    const submittedQrToken = String(req.body.qrToken || '').trim();

    if (req.user.role !== 'volunteer') {
      return res.status(403).json({ message: 'Only the assigned volunteer can verify pickup' });
    }

    const donation = await Donation.findById(req.params.id).populate('donor', 'name email phone');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    if (!donation.assignedVolunteer || String(donation.assignedVolunteer) !== String(req.user.id)) {
      return res.status(403).json({ message: 'This donation is not assigned to you' });
    }

    if (donation.status !== 'assigned') {
      return res.status(400).json({ message: 'This donation is not waiting for pickup' });
    }

    const otpIsValid = Boolean(submittedOtp && donation.otp === submittedOtp);
    const qrIsValid = Boolean(submittedQrToken && donation.qrCode === submittedQrToken);

    if (!otpIsValid && !qrIsValid) {
      return res.status(400).json({ message: 'Invalid OTP or QR code. Please try again.' });
    }

    donation.status = 'picked_up';
    donation.pickedUpAt = new Date();
    donation.otp = undefined;
    donation.qrCode = undefined;
    await donation.save();

    sendEmail(
      donation.donor.email,
      'FoodBridge - Food Picked Up',
      `Hi ${donation.donor.name}, your donation has been picked up and is on its way.`
    );


    res.status(200).json({
      message: qrIsValid ? 'QR pickup verified successfully' : 'OTP pickup verified successfully',
      donation,
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

const downloadQrCode = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);
    if (!donation || !donation.qrCode) {
      return res.status(404).json({ message: 'QR code is not available' });
    }

    const isDonor = String(donation.donor) === String(req.user.id);
    const isVolunteer = String(donation.assignedVolunteer) === String(req.user.id);
    let isAssignedNgo = false;

    if (req.user.role === 'ngo') {
      const ngo = await NGO.findOne({ user: req.user.id });
      isAssignedNgo = Boolean(ngo && String(donation.assignedNGO) === String(ngo._id));
    }

    if (!isDonor && !isVolunteer && !isAssignedNgo) {
      return res.status(403).json({ message: 'You cannot view this QR code' });
    }

    const payload = JSON.stringify({
      donationId: String(donation._id),
      qrToken: donation.qrCode,
    });
    const png = await QRCode.toBuffer(payload, { width: 320, margin: 2 });

    res.set('Content-Type', 'image/png');
    res.send(png);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate QR code', error: error.message });
  }
};

const markDelivered = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donor', 'name email phone');
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    let allowed = false;

    if (req.user.role === 'volunteer') {
      allowed = String(donation.assignedVolunteer) === String(req.user.id) && donation.status === 'picked_up';
    } else if (req.user.role === 'ngo') {
      const ngo = await NGO.findOne({ user: req.user.id });
      allowed = Boolean(ngo && String(donation.assignedNGO) === String(ngo._id));
    }

    if (!allowed) {
      return res.status(403).json({ message: 'You are not allowed to complete this donation' });
    }

    if (!['assigned', 'picked_up'].includes(donation.status)) {
      return res.status(400).json({ message: 'This donation cannot be marked delivered now' });
    }

    donation.status = 'delivered';
    donation.deliveredAt = new Date();
    await donation.save();

    sendEmail(
      donation.donor.email,
      'FoodBridge - Delivery Complete',
      `Hi ${donation.donor.name}, your donation has been delivered successfully. Thank you for making a difference! Your certificate is ready in your dashboard.`
    );


    res.status(200).json({ message: 'Delivery marked complete', donation });
  } catch (error) {
    res.status(500).json({ message: 'Failed to mark delivered', error: error.message });
  }
};

const downloadDonorCertificate = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('donor', 'name');
    if (!donation || donation.status !== 'delivered') {
      return res.status(400).json({ message: 'Certificate not available yet' });
    }
    const pdfBuffer = await generateDonorCertificate(donation, donation.donor.name);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="FoodBridge_Certificate_${donation._id}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate certificate', error: error.message });
  }
};

const downloadVolunteerCertificate = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id).populate('assignedVolunteer', 'name');
    if (!donation || donation.status !== 'delivered' || !donation.assignedVolunteer) {
      return res.status(400).json({ message: 'Certificate not available yet' });
    }
    const pdfBuffer = await generateVolunteerCertificate(donation, donation.assignedVolunteer.name);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="FoodBridge_Volunteer_Certificate_${donation._id}.pdf"`,
    });
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate certificate', error: error.message });
  }
};

module.exports = {
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
};