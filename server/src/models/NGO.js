const mongoose = require('mongoose');

const ngoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    organizationName: {
      type: String,
      required: true,
      trim: true,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    location: {
      address: {
        type: String,
        required: true,
      },

      latitude: {
        type: Number,
        required: true,
      },

      longitude: {
        type: Number,
        required: true,
      },
    },

    // Legacy field kept for backward compatibility with existing donations.
    isApproved: {
      type: Boolean,
      default: false,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // New document-based verification fields.
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'suspended'],
      default: 'pending',
    },

    registrationNumber: {
      type: String,
      trim: true,
      default: '',
    },

    ngoDarpanId: {
      type: String,
      trim: true,
      default: '',
    },

    documentUrl: {
      type: String,
      trim: true,
      default: '',
    },

    documentData: {
      type: String,
      default: '',
    },

    documentMimeType: {
      type: String,
      default: '',
    },

    documentName: {
      type: String,
      trim: true,
      default: '',
    },

    rejectionReason: {
      type: String,
      trim: true,
      default: '',
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('NGO', ngoSchema);
