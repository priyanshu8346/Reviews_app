// Review routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { createReview, getReviews, getMyLatestReview, updateReview, deleteReview, getInsights } = require('../controllers/reviewController');

router.post('/', auth, createReview);
router.get('/', getReviews);
router.get('/my-latest', auth, getMyLatestReview);
router.put('/:reviewId', auth, updateReview);    // Edit review
router.delete('/:reviewId', auth, deleteReview); // Delete review
router.get('/insights', auth, admin, getInsights); // Get AI insights for all reviews

module.exports = router;
