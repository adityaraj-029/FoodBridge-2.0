const NGO = require('../models/NGO');

const isVerifiedNGO = (ngo) => Boolean(
  ngo &&
  ngo.isApproved === true &&
  (!ngo.verificationStatus || ngo.verificationStatus === 'verified')
);

const registerNGO = async (req, res) => {
  try {
    const {
      organizationName,
      capacity,
      location,
      registrationNumber,
      ngoDarpanId,
      documentUrl,
      documentData,
      documentMimeType,
      documentName,
    } = req.body;

    if (!organizationName || !capacity || !location?.address) {
      return res.status(400).json({
        message: 'Organization name, capacity and address are required',
      });
    }

    if (!ngoDarpanId || !documentData || !documentMimeType) {
      return res.status(400).json({
        message: 'NGO DARPAN ID and registration document are required',
      });
    }

    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedMimeTypes.includes(documentMimeType)) {
      return res.status(400).json({
        message: 'Only PDF, JPG, PNG or WEBP documents are allowed',
      });
    }

    if (documentData.length > 7000000) {
      return res.status(413).json({
        message: 'Document is too large. Please upload a file below 4 MB.',
      });
    }

    const existingNGO = await NGO.findOne({ user: req.user.id });
    if (existingNGO) {
      return res.status(409).json({
        message: 'An NGO profile already exists for this account',
        ngo: existingNGO,
      });
    }

    const ngo = await NGO.create({
      user: req.user.id,
      organizationName,
      capacity,
      location,
      registrationNumber: registrationNumber || '',
      ngoDarpanId: ngoDarpanId || '',
      documentUrl: documentUrl || '',
      documentData,
      documentMimeType,
      documentName: documentName || '',
      verificationStatus: 'pending',
      isApproved: false,
    });

    res.status(201).json({
      message: 'NGO registered. It is pending admin verification.',
      ngo,
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

const getPendingNGOs = async (req, res) => {
  try {
    const ngos = await NGO.find({
      isApproved: false,
      $or: [
        { verificationStatus: 'pending' },
        { verificationStatus: { $exists: false } },
      ],
    })
      .populate('user', 'name email phone address')
      .sort({ createdAt: 1 });

    res.status(200).json(ngos);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending NGOs', error: error.message });
  }
};

const getAllNGOs = async (req, res) => {
  try {
    const ngos = await NGO.find({})
      .select('-documentData -documentUrl')
      .populate('user', 'name email phone address')
      .populate('verifiedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(ngos);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch all NGOs', error: error.message });
  }
};

const getVerifiedNGOs = async (req, res) => {
  try {
    const ngos = await NGO.find({
      $or: [
        { isApproved: true, verificationStatus: 'verified' },
        { isApproved: true, verificationStatus: { $exists: false } },
      ],
    })
      .select('-documentUrl -documentData')
      .populate('user', 'name email phone')
      .sort({ organizationName: 1 });

    res.status(200).json(ngos);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch verified NGOs', error: error.message });
  }
};

const getMyVerification = async (req, res) => {
  try {
    const ngo = await NGO.findOne({ user: req.user.id })
      .select('-documentUrl -documentData')
      .populate('verifiedBy', 'name email');

    if (!ngo) {
      return res.status(404).json({ message: 'NGO profile not found' });
    }

    res.status(200).json(ngo);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch verification status', error: error.message });
  }
};

const approveNGO = async (req, res) => {
  try {
    const ngo = await NGO.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: true,
        verificationStatus: 'verified',
        approvedBy: req.user.id,
        verifiedBy: req.user.id,
        verifiedAt: new Date(),
        rejectionReason: '',
      },
      { new: true, runValidators: true }
    );

    if (!ngo) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    res.status(200).json({ message: 'NGO verified successfully', ngo });
  } catch (error) {
    res.status(500).json({ message: 'Approval failed', error: error.message });
  }
};

const rejectNGO = async (req, res) => {
  try {
    const ngo = await NGO.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: false,
        verificationStatus: 'rejected',
        approvedBy: null,
        verifiedBy: req.user.id,
        verifiedAt: null,
        rejectionReason: req.body.rejectionReason || 'Documents could not be verified',
      },
      { new: true, runValidators: true }
    );

    if (!ngo) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    res.status(200).json({ message: 'NGO rejected', ngo });
  } catch (error) {
    res.status(500).json({ message: 'Rejection failed', error: error.message });
  }
};

const suspendNGO = async (req, res) => {
  try {
    const ngo = await NGO.findByIdAndUpdate(
      req.params.id,
      {
        isApproved: false,
        verificationStatus: 'suspended',
        verifiedBy: req.user.id,
        verifiedAt: null,
      },
      { new: true, runValidators: true }
    );

    if (!ngo) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    res.status(200).json({ message: 'NGO suspended', ngo });
  } catch (error) {
    res.status(500).json({ message: 'Suspension failed', error: error.message });
  }
};

module.exports = {
  registerNGO,
  getPendingNGOs,
  getVerifiedNGOs,
  getAllNGOs,
  getMyVerification,
  approveNGO,
  rejectNGO,
  suspendNGO,
  isVerifiedNGO,
};
