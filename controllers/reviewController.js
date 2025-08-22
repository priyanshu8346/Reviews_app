// Review controller
const Review = require('../models/Review');
const axios = require('axios');

exports.getInsights = async (req, res) => {
  try {
    // 1. Fetch all reviews from DB
    const reviews = await Review.find({});
    if (!reviews.length) {
      return res.json({ success: true, insights: { problems: [], goodPoints: [], summary: "No reviews yet" } });
    }

    // 2. Aggregate raw problems and good points
    const allProblems = [];
    const allGoodPoints = [];

    reviews.forEach(r => {
      if (Array.isArray(r.problems)) allProblems.push(...r.problems);
      if (Array.isArray(r.goodPoints)) allGoodPoints.push(...r.goodPoints);
    });

    // Optionally count occurrences
    const countItems = arr => arr.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {});
    const problemCounts = countItems(allProblems);
    const goodPointCounts = countItems(allGoodPoints);

    // 3. Call Python AI microservice to generate summary
    const aiResponse = await axios.post('http://localhost:8000/insights', {
      problems: allProblems,
      goodPoints: allGoodPoints
    });

    const { summary } = aiResponse.data;

    // 4. Return combined insights
    res.json({
      success: true,
      insights: {
        problemCounts,
        goodPointCounts,
        summary
      }
    });

  } catch (err) {
    console.error('getInsights error:', err);
    res.status(500).json({ success: false, error: 'Failed to fetch insights' });
  }
};


/** POST /reviews  { text, rating } */
exports.createReview = async (req, res) => {
  try {
    const { text, rating } = req.body || {};
    if (!text || !rating) {
      return res.status(400).json({ error: 'Text and rating are required' });
    }

    // Call Python AI microservice
    const aiResponse = await axios.post('http://localhost:8000/analyze', { text });
    const { sentiment, score, spam,  } = aiResponse.data;

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
    console.error('createReview error:', err);
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
    console.error('getReviews error:', err);
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
    console.error('getMyLatestReview error:', err);
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

    const review = await Review.findOne({ _id: reviewId, user: req.user.userId });
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

    if (text) review.text = text;
    if (rating) review.rating = rating;

    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    console.error('updateReview error:', err);
    return res.status(500).json({ error: 'Failed to update review' });
  }
};

// Delete my review
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const deleted = await Review.findOneAndDelete({ _id: reviewId, user: req.user.userId });
    if (!deleted) return res.status(404).json({ success: false, message: 'Review not found' });

    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error('deleteReview error:', err);
    res.status(500).json({ success: false, error: 'Failed to delete review' });
  }
};

