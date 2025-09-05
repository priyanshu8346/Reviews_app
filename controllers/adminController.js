const Review = require('../models/Review');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

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

    const ratingCounts = await Review.aggregate([
  { $match: filter },
  { $group: { _id: "$rating", count: { $sum: 1 } } },
  { $project: { _id: 0, rating: "$_id", count: 1 } }
]);

// Normalize to always have 1–5 keys
const counts = { 1:0, 2:0, 3:0, 4:0, 5:0 };
ratingCounts.forEach(r => { counts[r.rating] = r.count; });

// Sentiment distribution
    const sentimentAgg = await Review.aggregate([
      { $match: filter },
      { $group: { _id: "$sentiment", count: { $sum: 1 } } }
    ]);

    const sentimentCounts = ["positive", "neutral", "negative"].map(s => {
      const found = sentimentAgg.find(x => x._id === s);
      return { name: s.charAt(0).toUpperCase() + s.slice(1), value: found ? found.count : 0 };
    });

res.json({ 
  success: true, 
  total, 
  page: Number(page), 
  limit: Number(limit), 
  reviews,
  ratingDistribution: counts,
  satisfaction: sentimentCounts
});

  } catch (err) {
    // console.error("Error in listReviews:", err);
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
    // console.error("Error in markSpam:", err);
    res.status(500).json({ success: false, error: 'Failed to update review' });
  }
};

exports.summary = async (req, res) => {
  try {
    // console.log("1. Fetching reviews from DB...");
    const reviews = await Review.find({});
    // console.log(`Found ${reviews.length} reviews`);
    
    if (!reviews.length) {
      return res.json({ 
        success: true, 
        insights: { 
          summary: "No reviews yet" 
        } 
      });
    }

    // 2. Aggregate data
    const allProblems = [];
    const allGoodPoints = [];

    reviews.forEach(r => {
      if (Array.isArray(r.problems)) allProblems.push(...r.problems);
      if (Array.isArray(r.goodPoints)) allGoodPoints.push(...r.goodPoints);
    });


    // 3. Call Python service with timeout and better error handling
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/summary`, {
        problems: allProblems.slice(0, 50), // Limit to avoid large requests
        goodPoints: allGoodPoints.slice(0, 50)
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // console.log("4. AI Response received:", aiResponse.data);

      if (aiResponse.data && aiResponse.data.summary) {
        return res.json({
          success: true,
          insights: {
            summary: aiResponse.data.summary,
            totalReviews: reviews.length
          }
        });
      } else {
        // console.warn("5. Unexpected AI response structure:", aiResponse.data);
        throw new Error('Invalid response from AI service');
      }

    } catch (aiError) {
      // console.error("6. AI Service Error:", aiError.message);
      
      if (aiError.code === 'ECONNREFUSED') {
        console.error("7. Python service not reachable at localhost:8000");
      }
      
      if (aiError.response) {
        console.error("8. Python service error response:", aiError.response.data);
      }

      // Fallback summary
      return res.json({
        success: true,
        insights: {
          summary: `Based on ${reviews.length} reviews: ${allProblems.slice(0, 3).join(', ')} mentioned as areas to improve, and ${allGoodPoints.slice(0, 3).join(', ')} as strengths.`,
          totalReviews: reviews.length
        }
      });
    }

  } catch (err) {
    // console.error('9. Summary endpoint error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate summary'
    });
  }
};


exports.getSuggestions = async (req, res) => {
  try {
    // 1. Fetch all reviews from DB
    const reviews = await Review.find({});
    if (!reviews.length) {
      return res.json({ 
        success: true, 
        insights: { 
          problems: [], 
          goodPoints: [], 
          suggestions: "No reviews yet" 
        } 
      });
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

    // 3. Call Python AI microservice
    let suggestions = "suggestions are not available at this moment";
    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/suggestions`, {
        problems: allProblems,
        goodPoints: allGoodPoints
      }, { timeout: 10000 });

      if (aiResponse.data && aiResponse.data.suggestions) {
        suggestions = aiResponse.data.suggestions;
      }
    } catch (aiErr) {
      console.error("AI service error in getSuggestions:", aiErr.message);
    }

    // 4. Return combined insights
    res.json({
      success: true,
      insights: {
        problemCounts,
        goodPointCounts,
        suggestions
      }
    });

  } catch (err) {
    console.error("getSuggestions endpoint error:", err.message);
    res.status(500).json({ success: false, error: 'Failed to fetch suggestions' });
  }
};
