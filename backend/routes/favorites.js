const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const auth = require('../middleware/auth');

// 获取所有收藏夹
router.get('/', auth, favoritesController.getFavorites);
// 新建收藏夹
router.post('/', auth, favoritesController.createFavorite);
// 删除收藏夹
router.delete('/:id', auth, favoritesController.deleteFavorite);
// 重命名收藏夹
router.put('/:id', auth, favoritesController.renameFavorite);

// 获取地点列表（用于下拉选择）- 已废弃，改用 /locations/search
// router.get('/locations/options', auth, favoritesController.getLocationOptions);

// 获取收藏夹内项目
router.get('/:id/items', auth, favoritesController.getFavoriteItems);
// 添加项目到收藏夹
router.post('/:id/items', auth, favoritesController.addFavoriteItem);
// 从收藏夹移除项目
router.delete('/:id/items/:item_id', auth, favoritesController.removeFavoriteItem);

module.exports = router; 