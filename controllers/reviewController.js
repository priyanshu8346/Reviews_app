// Review controller
const Review = require('../models/Review');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';



/** POST /reviews  { text, rating } */
exports.createReview = async (req, res) => {
  try {
    const { text, rating } = req.body || {};
    if (!text || !rating) {
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

    res.json({ success: true, review });
  } catch (err) {
    // console.error('createReview error:', err);
    res.status(500).json({ success: false, error: 'Failed to create review' });
  }
};

/** GET /reviews  -> get all reviews (basic for now) */
exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    return res.json({ success: true, reviews });
  } catch (err) {
    // console.error('getReviews error:', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

/** GET /reviews/my-latest */
exports.getMyLatestReview = async (req, res) => {
  try {
    const review = await Review.findOne({ user: req.user.userId })
      .sort({ createdAt: -1 });

    if (!review) {
      return res.status(404).json({ success: false, message: 'No reviews found' });
    }

    return res.json({ success: true, review });
  } catch (err) {
    // console.error('getMyLatestReview error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch review' });
  }
};

/** PUT /updateReview  { text, rating } */
exports.updateReview = async (req, res) => {
  try {
    const {reviewId} = req.params;
    const { text, rating } = req.body || {};
    if (!text || !rating) {
      return res.status(400).json({ error: 'New Text and rating are required' });
    }
    // console.log("updateReview called with:", { reviewId, text, rating });

    const review = await Review.findOne({ _id: reviewId, user: req.user.userId });
    // console.log("updateReview found review:", review);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    if (text) review.text = text;
    if (rating) review.rating = rating;

    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    // console.error('updateReview error:', err);
    return res.status(500).json({ error: 'Failed to update review' });
  }
};

// Delete my review
exports.deleteReview = async (req, res) => {
  try {
    // console.log("deleteReview called with id:", req.params.reviewId);
    const { reviewId } = req.params;
    const deleted = await Review.findOneAndDelete({ _id: reviewId});
    if (!deleted) return res.status(404).json({ success: false, message: 'Review not found' });

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    // console.error('deleteReview error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete review' });
  }
};

