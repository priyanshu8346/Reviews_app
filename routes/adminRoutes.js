
// Admin routes for analytics, moderation, and admin auth
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {  listReviews, markSpam, getSuggestions, summary } = require('../controllers/adminController');
const { requestAdminOTP, verifyAdminOTP } = require('../controllers/adminAuthController');

// Log each admin route access
router.use((req, res, next) => {
	console.log(`[AdminRoutes] ${req.method} ${req.originalUrl}`);
	next();
});

// Analytics and moderation endpoints
router.get('/reviews', auth, admin, listReviews);
router.patch('/reviews/:id/spam', auth, admin, markSpam);
router.get('/summary', auth, admin, summary);
router.get('/suggestions', auth, getSuggestions);

// Admin OTP authentication
router.post('/send-otp',  requestAdminOTP);
router.post('/verify-otp',verifyAdminOTP);
module.exports = router;