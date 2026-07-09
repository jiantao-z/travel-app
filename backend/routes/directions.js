const express = require('express');
const router = express.Router();
const { driving, walking, riding, transit } = require('../controllers/directionsController');
const auth = require('../middleware/auth');

// 驾车路线
router.get('/driving', auth, driving);

// 步行路线
router.get('/walking', auth, walking);

// 骑行路线
router.get('/riding', auth, riding);

// 公交/地铁
router.get('/transit', auth, transit);

module.exports = router;
