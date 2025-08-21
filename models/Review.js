// Review model
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    aiSentiment: { type: String },  // will store AI result later
    aiScore: { type: Number },      // optional 1-5 rating from AI
    isSpam: { type: Boolean, default: false } // optional spam flag later
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);

