const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const {  listReviews, markSpam, getStats } = require('../controllers/adminController');

router.get('/reviews', auth, admin, listReviews);
router.patch('/reviews/:id/spam', auth, admin, markSpam);
router.get('/stats', auth, admin, getStats);

module.exports = router;