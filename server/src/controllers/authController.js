const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'rajadityaraj005@gmail.com').toLowerCase();
const allowedProofTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      firebaseUID,
      address,
      idProofData,
      idProofMimeType,
      idProofName,
    } = req.body;

    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail || !firebaseUID) {
      return res.status(400).json({ message: 'Email and Firebase account are required' });
    }

    // Admin is created only through the one-time setup script, never public signup.
    if (role === 'admin') {
      return res.status(403).json({ message: 'Admin account must be created by the administrator' });
    }

    if (role === 'volunteer') {
      if (!idProofData || !idProofMimeType || !allowedProofTypes.includes(idProofMimeType)) {
        return res.status(400).json({ message: 'Volunteer ID proof PDF/image is required' });
      }
      if (idProofData.length > 7000000) {
        return res.status(413).json({ message: 'ID proof must be smaller than 4 MB' });
      }
    }

    const existingUser = await User.findOne({ $or: [{ email: normalizedEmail }, { firebaseUID }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      role,
      firebaseUID,
      address,
      isVerified: role === 'donor',
      verificationStatus: role === 'volunteer' ? 'pending' : 'verified',
      idProofData: role === 'volunteer' ? idProofData : '',
      idProofMimeType: role === 'volunteer' ? idProofMimeType : '',
      idProofName: role === 'volunteer' ? idProofName || '' : '',
    });
    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { firebaseUID } = req.body;
    const user = await User.findOne({ firebaseUID });

    if (!user) {
      return res.status(404).json({ message: 'No FoodBridge account was found for this email' });
    }

    const token = generateToken(user._id, user.role);
    res.status(200).json({
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// NGO assignment only receives trusted/verified volunteers.
const getVolunteers = async (req, res) => {
  try {
    if (!['ngo', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Only NGO or admin users can view volunteers' });
    }

    const volunteers = await User.find({
      role: 'volunteer',
      $or: [
        { verificationStatus: 'verified', isVerified: true },
        { verificationStatus: { $exists: false }, isVerified: true },
      ],
    })
      .select('name email phone address verificationStatus isVerified')
      .sort({ name: 1 });

    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch volunteers', error: error.message });
  }
};

const getAllVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer' })
      .select('name email phone address verificationStatus isVerified idProofData idProofMimeType idProofName rejectionReason createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all volunteers', error: error.message });
  }
};

const approveVolunteer = async (req, res) => {
  try {
    const volunteer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'volunteer' },
      { isVerified: true, verificationStatus: 'verified', verifiedBy: req.user.id, verifiedAt: new Date(), rejectionReason: '' },
      { new: true, runValidators: true }
    ).select('-idProofData');
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    res.status(200).json({ message: 'Volunteer verified successfully', volunteer });
  } catch (error) {
    res.status(500).json({ message: 'Volunteer approval failed', error: error.message });
  }
};

const rejectVolunteer = async (req, res) => {
  try {
    const volunteer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'volunteer' },
      { isVerified: false, verificationStatus: 'rejected', verifiedBy: req.user.id, verifiedAt: null, rejectionReason: req.body.rejectionReason || 'ID proof could not be verified' },
      { new: true, runValidators: true }
    ).select('-idProofData');
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    res.status(200).json({ message: 'Volunteer rejected', volunteer });
  } catch (error) {
    res.status(500).json({ message: 'Volunteer rejection failed', error: error.message });
  }
};

const suspendVolunteer = async (req, res) => {
  try {
    const volunteer = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'volunteer' },
      { isVerified: false, verificationStatus: 'suspended', verifiedBy: req.user.id, verifiedAt: null },
      { new: true, runValidators: true }
    ).select('-idProofData');
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    res.status(200).json({ message: 'Volunteer suspended', volunteer });
  } catch (error) {
    res.status(500).json({ message: 'Volunteer suspension failed', error: error.message });
  }
};

module.exports = {
  signup,
  login,
  getVolunteers,
  getAllVolunteers,
  approveVolunteer,
  rejectVolunteer,
  suspendVolunteer,
  ADMIN_EMAIL,
};
