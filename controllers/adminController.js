const Review = require('../models/Review');

// 1. List reviews (with filters & pagination)
exports.listReviews = async (req, res) => {
  try {
    const { sentiment, spam, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (sentiment) filter.sentiment = sentiment;
    if (spam !== undefined) filter.spam = spam === 'true';

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * Number(limit))
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);

    res.json({ 
      success: true, 
      total, 
      page: Number(page), 
      limit: Number(limit), 
      reviews 
    });
  } catch (err) {
    console.error("Error in listReviews:", err);
    res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
  }
};

// 2. Mark/unmark review as spam
exports.markSpam = async (req, res) => {
  try {
    const { id } = req.params;
    const { spam } = req.body;

    if (typeof spam !== 'boolean') {
      return res.status(400).json({ success: false, error: 'Spam must be true or false' });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { spam },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, error: 'Review not found' });
    }

    res.json({ success: true, review });
  } catch (err) {
    console.error("Error in markSpam:", err);
    res.status(500).json({ success: false, error: 'Failed to update review' });
  }
};

// 3. Get overall stats with AI insights
exports.getStats = async (req, res) => {
  try {
    // total reviews & spam count
    const totalReviews = await Review.countDocuments();
    const spamCount = await Review.countDocuments({ spam: true });

    // sentiment breakdown
    const sentimentAgg = await Review.aggregate([
      { $group: { _id: "$sentiment", count: { $sum: 1 } } }
    ]);
    const sentiments = sentimentAgg.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, { positive: 0, neutral: 0, negative: 0 });

    // average AI score for non-spam reviews
    const avgScoreAgg = await Review.aggregate([
      { $match: { spam: false } },
      { $group: { _id: null, avgScore: { $avg: "$aiScore" } } }
    ]);
    const avgAiScore = avgScoreAgg.length > 0 ? avgScoreAgg[0].avgScore : 0;

    // top 3 problems
    const topProblems = await Review.aggregate([
      { $unwind: "$problems" },
      { $group: { _id: "$problems", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    // top 3 good points
    const topGoodPoints = await Review.aggregate([
      { $unwind: "$goodPoints" },
      { $group: { _id: "$goodPoints", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    res.json({
      success: true,
      stats: {
        totalReviews,
        spamCount,
        sentiments,
        avgAiScore: Number(avgAiScore.toFixed(2)),
        topProblems: topProblems.map(p => ({ text: p._id, count: p.count })),
        topGoodPoints: topGoodPoints.map(g => ({ text: g._id, count: g.count }))
      }
    });
  } catch (err) {
    console.error("Error in getStats:", err);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
};
