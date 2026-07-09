const express = require('express');
const router = express.Router();
const travelPlansController = require('../controllers/travelPlansController');
const auth = require('../middleware/auth');

// 获取当前用户所有行程
router.get('/', auth, travelPlansController.getAllPlans);
// 新建行程
router.post('/', auth, travelPlansController.createPlan);
// 编辑行程
router.put('/:id', auth, travelPlansController.updatePlan);
// 删除行程
router.delete('/:id', auth, travelPlansController.deletePlan);

// 获取行程详情（包含行程项）
router.get('/:id', auth, travelPlansController.getPlanDetails);

// 创建行程项
router.post('/:route_id/itineraries', auth, travelPlansController.createRoutePlan);

// 获取行程项列表
router.get('/:planId/itineraries', auth, travelPlansController.getRoutePlans);

// 更新行程项
router.put('/:planId/itineraries/:itemId', auth, travelPlansController.updateItineraryItem);

// 删除行程项
router.delete('/:planId/itineraries/:itemId', auth, travelPlansController.deleteItineraryItem);

// 更新排序
router.put('/:planId/itineraries-order', auth, travelPlansController.updateItineraryOrder);

// 获取地图展示数据
router.get('/:planId/geometries', auth, travelPlansController.getRouteGeometries);



module.exports = router;