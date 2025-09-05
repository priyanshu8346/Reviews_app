
// Review model for storing user reviews and AI analysis
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

// Log when a review is created or updated (for debugging)
reviewSchema.post('save', function(doc) {
  console.log(`[ReviewModel] Review saved: user=${doc.user}, rating=${doc.rating}, sentiment=${doc.sentiment}`);
});

module.exports = mongoose.model('Review', reviewSchema);

