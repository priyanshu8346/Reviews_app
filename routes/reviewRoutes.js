
// Review routes for user review operations
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { createReview, getReviews, getMyLatestReview, updateReview, deleteReview} = require('../controllers/reviewController');

router.post('/', auth, createReview);
router.get('/getReviews', admin, getReviews);
router.get('/my-latest', auth, getMyLatestReview);
router.put('/:reviewId', auth, updateReview);    // Edit review
router.delete('/:reviewId', auth, deleteReview); // Delete review

module.exports = router;
