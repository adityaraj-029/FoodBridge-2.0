const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: String, required: true },
}, { _id: false });

const donationSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  foodItems: { type: [foodItemSchema], required: true },
  cookedTime: { type: Date },
  expiryTime: { type: Date, required: true },
  alternatePhone: { type: String },
  pickupLocation: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'assigned', 'picked_up', 'delivered'],
    default: 'pending',
  },
  assignedNGO: { type: mongoose.Schema.Types.ObjectId, ref: 'NGO' },
  assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'NGO' }],
  qrCode: { type: String },
  otp: { type: String },
  acceptedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date },
  donorType: {
    type: String,
    enum: ['household', 'restaurant', 'event_organizer', 'other'],
    required: true,
  },
  donorTypeOther: { type: String },
  organizationName: { type: String },
  idProofImage: { type: String },
  termsAccepted: { type: Boolean, required: true, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);