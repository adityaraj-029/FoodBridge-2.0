const Donation = require('../models/Donation');
const NGO = require('../models/NGO');
const User = require('../models/User');

const getAnalytics = async (req, res) => {
  try {
    const [
      totalDonations,
      delivered,
      pending,
      totalNGOs,
      verifiedNGOs,
      pendingNGOs,
      rejectedNGOs,
      totalVolunteers,
      totalDonors,
      approvedByMe,
      statusBreakdown,
      recentDonations,
      recentVolunteers,
    ] = await Promise.all([
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'delivered' }),
      Donation.countDocuments({ status: 'pending' }),
      NGO.countDocuments(),
      NGO.countDocuments({ isApproved: true }),
      NGO.countDocuments({
        isApproved: false,
        $or: [
          { verificationStatus: 'pending' },
          { verificationStatus: { $exists: false } },
        ],
      }),
      NGO.countDocuments({ verificationStatus: { $in: ['rejected', 'suspended'] } }),
      User.countDocuments({ role: 'volunteer' }),
      User.countDocuments({ role: 'donor' }),
      NGO.countDocuments({ approvedBy: req.user.id, isApproved: true }),
      Donation.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Donation.find({})
        .select('foodItems status createdAt expiryTime donor assignedNGO assignedVolunteer')
        .populate('donor', 'name email phone')
        .populate('assignedNGO', 'organizationName verificationStatus')
        .populate('assignedVolunteer', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      User.find({ role: 'volunteer' })
        .select('name email phone isVerified createdAt')
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
    ]);

    res.status(200).json({
      totalDonations,
      delivered,
      pending,
      totalNGOs,
      verifiedNGOs,
      pendingNGOs,
      rejectedNGOs,
      totalVolunteers,
      totalDonors,
      approvedByMe,
      statusBreakdown,
      recentDonations,
      recentVolunteers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
};

module.exports = { getAnalytics };
