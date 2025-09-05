// Review controller
const Review = require('../models/Review');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';



/** POST /reviews  { text, rating } */

// Create a new review, analyze with AI, and save
exports.createReview = async (req, res) => {
  try {
    const { text, rating } = req.body || {};
    if (!text || !rating) {
      console.warn('[ReviewController] Text and rating are required');
      return res.status(400).json({ error: 'Text and rating are required' });
    }
    // Call Python AI microservice
    const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze`, { text });
    const { sentiment, score, spam, problems, goodPoints  } = aiResponse.data;

    // Save review with AI data
    const review = new Review({
      user: req.user.userId,
      text,
      rating,
      sentiment,
      aiScore: score,
      spam,
      problems,
      goodPoints
    });
    await review.save();

    console.log(`[ReviewController] Review created for user ${req.user.userId}, sentiment: ${sentiment}`);
    res.json({ success: true, review });
  } catch (err) {
    console.error('[ReviewController] createReview error:', err);
    res.status(500).json({ success: false, error: 'Failed to create review' });
  }
};

/** GET /reviews  -> get all reviews (basic for now) */

// Get all reviews (public)
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'email')
      .sort({ createdAt: -1 });
    console.log(`[ReviewController] Fetched ${reviews.length} reviews`);
    return res.json({ success: true, reviews });
  } catch (err) {
    console.error('[ReviewController] getReviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

/** GET /reviews/my-latest */

// Get the latest review for the logged-in user
exports.getMyLatestReview = async (req, res) => {
  try {
    const review = await Review.findOne({ user: req.user.userId })
      .sort({ createdAt: -1 });

    if (!review) {
      console.warn(`[ReviewController] No reviews found for user ${req.user.userId}`);
      return res.status(404).json({ success: false, message: 'No reviews found' });
    }

    console.log(`[ReviewController] Fetched latest review for user ${req.user.userId}`);
    return res.json({ success: true, review });
  } catch (err) {
    console.error('[ReviewController] getMyLatestReview error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch review' });
  }
};

/** PUT /updateReview  { text, rating } */

// Update a review by ID for the logged-in user
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { text, rating } = req.body || {};
    if (!text || !rating) {
      console.warn('[ReviewController] New Text and rating are required for update');
      return res.status(400).json({ error: 'New Text and rating are required' });
    }

    const review = await Review.findOne({ _id: reviewId, user: req.user.userId });
    if (!review) {
      console.warn(`[ReviewController] Review not found for update: id=${reviewId}, user=${req.user.userId}`);
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (text) review.text = text;
    if (rating) review.rating = rating;

    await review.save();
    console.log(`[ReviewController] Review updated: id=${reviewId}, user=${req.user.userId}`);
    res.json({ success: true, review });
  } catch (err) {
    console.error('[ReviewController] updateReview error:', err);
    return res.status(500).json({ error: 'Failed to update review' });
  }
};

// Delete my review

// Delete a review by ID for the logged-in user
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const deleted = await Review.findOneAndDelete({ _id: reviewId });
    if (!deleted) {
      console.warn(`[ReviewController] Review not found for delete: id=${reviewId}`);
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    console.log(`[ReviewController] Review deleted: id=${reviewId}`);
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error('[ReviewController] deleteReview error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete review' });
  }
};

