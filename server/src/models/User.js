const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  role: { type: String, enum: ['donor', 'ngo', 'admin', 'volunteer'], required: true },
  firebaseUID: { type: String, required: true, unique: true },
  address: { type: String },
  isVerified: { type: Boolean, default: false },

  // Volunteer trust/identity verification.
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: 'pending',
  },
  idProofData: { type: String, default: '' },
  idProofMimeType: { type: String, default: '' },
  idProofName: { type: String, default: '' },
  rejectionReason: { type: String, default: '' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verifiedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
