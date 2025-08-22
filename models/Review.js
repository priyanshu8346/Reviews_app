// Review model
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 1000 },
    rating: { type: Number, min: 1, max: 5, required: true },
    // --- AI fields ---
    sentiment: { type: String, enum: ['positive','neutral','negative'], default: 'neutral' },
    aiScore: { type: Number, min: 0, max: 1 },            // sentiment strength 0..1
    spam: { type: Boolean, default: false },
    problems: { type: [String], default: [] },
    goodPoints: { type: [String], default: [] },
    aiUpdatedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);

