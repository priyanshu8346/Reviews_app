const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {  listReviews, markSpam, getSuggestions, summary } = require('../controllers/adminController');
const { requestAdminOTP, verifyAdminOTP } = require('../controllers/adminAuthController');

router.get('/reviews', auth, admin, listReviews);
router.patch('/reviews/:id/spam', auth, admin, markSpam);
router.post('/send-otp',  requestAdminOTP);
router.post('/verify-otp',verifyAdminOTP);
router.post('/summary', auth, admin, summary)
router.post('/suggestions', auth, getSuggestions)


module.exports = router;