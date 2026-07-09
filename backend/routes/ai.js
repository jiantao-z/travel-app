const express = require('express');
const router = express.Router();
const { planTravel } = require('../controllers/aiController');

// POST /api/ai/plan — DeepSeek 代理
router.post('/plan', planTravel);

module.exports = router;
