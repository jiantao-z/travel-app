const express = require('express');
const router = express.Router();
const { searchLocations } = require('../controllers/locationsController');
const auth = require('../middleware/auth');

// 高德地点搜索（需登录，避免滥用 Key）
router.get('/search', auth, searchLocations);

module.exports = router;


