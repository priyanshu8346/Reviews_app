// Review model
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  text: { type: String, required: true },
  sentiment: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', reviewSchema);
