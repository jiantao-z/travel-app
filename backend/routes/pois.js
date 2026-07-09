const express = require('express');
const router = express.Router();
const poisController = require('../controllers/poisController');

// 搜索地点（景区/餐厅/住宿）
router.get('/search', poisController.searchLocations);

module.exports = router;