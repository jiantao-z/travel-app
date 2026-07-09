// controllers/travelPlansController.js
const { TravelPlan, RoutePlan, scenicpot, canteen, lodging } = require('../models');
const { Sequelize } = require('sequelize');

// 获取当前用户所有行程
const getAllPlans = async (req, res) => {
  try {
    const plans = await TravelPlan.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ message: '获取行程失败', error: err.message });
  }
};

// 新建行程
const createPlan = async (req, res) => {
  const { title, start_time, end_time, notes, departure_point } = req.body;
  try {
    const plan = await TravelPlan.create({
      user_id: req.user.id,
      title,
      start_time,
      end_time,
      notes,
      departure_point
    });
    res.status(201).json({ message: '新建成功', plan });
  } catch (err) {
    res.status(500).json({ message: '新建失败', error: err.message });
  }
};

// 编辑行程
const updatePlan = async (req, res) => {
  const { title, start_time, end_time, notes, departure_point } = req.body;
  try {
    const [count] = await TravelPlan.update(
      { title, start_time, end_time, notes, departure_point },
      { where: { route_id: req.params.id, user_id: req.user.id } }
    );
    if (!count) return res.status(404).json({ message: '未找到该行程' });
    res.json({ message: '更新成功' });
  } catch (err) {
    res.status(500).json({ message: '更新失败', error: err.message });
  }
};

// 删除行程
const deletePlan = async (req, res) => {
  try {
    await RoutePlan.destroy({ where: { route_id: req.params.id } });
    const count = await TravelPlan.destroy({
      where: { route_id: req.params.id, user_id: req.user.id }
    });
    if (!count) return res.status(404).json({ message: '未找到该行程' });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ message: '删除失败', error: err.message });
  }
};

// 获取行程详情（含行程项）
const getPlanDetails = async (req, res) => {
  try {
    const plan = await TravelPlan.findOne({
      where: { route_id: req.params.id, user_id: req.user.id },
      include: [{ model: RoutePlan, as: 'routePlans', order: [['sort_order', 'ASC']] }]
    });
    if (!plan) return res.status(404).json({ message: '未找到该行程' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ message: '获取行程详情失败', error: err.message });
  }
};

// 创建行程项（已解耦地点表，直接存储名称/地址/经纬度）
const createRoutePlan = async (req, res) => {
  const { title, estimated_arrival, duration_minutes, name, address, longitude, latitude, transportation_mode } = req.body;
  try {
    const plan = await TravelPlan.findOne({
      where: { route_id: req.params.route_id, user_id: req.user.id }
    });
    if (!plan) return res.status(404).json({ message: '未找到该行程组' });

    const item = await RoutePlan.create({
      route_id: req.params.route_id,
      title,
      address,
      longitude,
      latitude,
      estimated_arrival,
      duration_minutes,
      sort_order: await RoutePlan.max('sort_order', { where: { route_id: req.params.route_id } }) + 1 || 1,
      name: name || title, // 如果没有提供name，则使用title作为默认值
      transportation_mode: transportation_mode || '步行'
    });
    res.status(201).json({ message: '新建行程项成功', item });
  } catch (err) {
    res.status(500).json({ message: '新建行程项失败', error: err.message });
  }
};

// 更新行程项（已解耦地点表）
const updateItineraryItem = async (req, res) => {
  const { title, estimated_arrival, duration_minutes, name, address, longitude, latitude, transportation_mode } = req.body;
  try {
    // 1. 确认行程项属于当前用户的行程
    const item = await RoutePlan.findOne({
      where: { plan_id: req.params.itemId },
      include: [{
        model: TravelPlan,
        as: 'travelPlan',
        where: { user_id: req.user.id }
      }]
    });
    if (!item) return res.status(404).json({ message: '未找到该行程项' });

    // 2. 更新
    await RoutePlan.update(
      { title, estimated_arrival, duration_minutes, name: name || title, address, longitude, latitude, transportation_mode },
      { where: { plan_id: req.params.itemId } }
    );
    res.json({ message: '更新行程项成功' });
  } catch (err) {
    res.status(500).json({ message: '更新行程项失败', error: err.message });
  }
};

// 删除行程项
const deleteItineraryItem = async (req, res) => {
  try {
    // 1. 确认行程项属于当前用户的行程
    const item = await RoutePlan.findOne({
      where: { plan_id: req.params.itemId },
      include: [{
        model: TravelPlan,
        as: 'travelPlan',
        where: { user_id: req.user.id }
      }]
    });
    if (!item) return res.status(404).json({ message: '未找到该行程项' });

    // 2. 删除
    await RoutePlan.destroy({ where: { plan_id: req.params.itemId } });
    res.json({ message: '删除行程项成功' });
  } catch (err) {
    res.status(500).json({ message: '删除行程项失败', error: err.message });
  }
};

// 获取行程项列表
const getRoutePlans = async (req, res) => {
  try {
    // 1. 确认行程属于当前用户
    const plan = await TravelPlan.findOne({
      where: { route_id: req.params.planId, user_id: req.user.id }
    });
    if (!plan) return res.status(404).json({ message: '未找到该行程组' });

    // 2. 获取行程项列表
    const items = await RoutePlan.findAll({
      where: { route_id: req.params.planId },
      order: [['sort_order', 'ASC'], ['estimated_arrival', 'ASC']],
      attributes: ['plan_id', 'route_id', 'sort_order', 'estimated_arrival', 'duration_minutes', 'name', 'transportation_mode', 'address', 'longitude', 'latitude']
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: '获取行程项列表失败', error: err.message });
  }
};

// 批量更新行程项排序
const updateItineraryOrder = async (req, res) => {
  try {
    const { order } = req.body; // [{ plan_id, sort_order }]
    if (!Array.isArray(order)) {
      return res.status(400).json({ message: 'order 参数无效' });
    }

    // 确保行程属于当前用户
    const plan = await TravelPlan.findOne({ where: { route_id: req.params.planId, user_id: req.user.id } });
    if (!plan) return res.status(404).json({ message: '未找到该行程组' });

    // 批量更新排序
    const updates = order.map(item => RoutePlan.update(
      { sort_order: item.sort_order },
      { where: { plan_id: item.plan_id, route_id: req.params.planId } }
    ));
    await Promise.all(updates);

    res.json({ message: '更新排序成功' });
  } catch (err) {
    res.status(500).json({ message: '更新排序失败', error: err.message });
  }
};

// 获取行程的空间坐标用于地图展示（直接使用存储的经纬度）
const getRouteGeometries = async (req, res) => {
  try {
    const plan = await TravelPlan.findOne({ where: { route_id: req.params.planId, user_id: req.user.id } });
    if (!plan) return res.status(404).json({ message: '未找到该行程组' });

    const items = await RoutePlan.findAll({
      where: { route_id: req.params.planId },
      order: [['sort_order', 'ASC'], ['estimated_arrival', 'ASC']],
      raw: true
    });

    const nodes = items.map((it, idx) => ({
      index: idx + 1,
      plan_id: it.plan_id,
      name: it.name || it.title,
      lng: it.longitude ?? null,
      lat: it.latitude ?? null,
      transportation_mode: it.transportation_mode || '步行'
    }));

    res.json({
      departure_point: plan.departure_point || null,
      nodes
    });
  } catch (err) {
    res.status(500).json({ message: '获取行程地图数据失败', error: err.message });
  }
};

module.exports = {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getPlanDetails,
  createRoutePlan,
  updateItineraryItem,
  deleteItineraryItem,
  getRoutePlans,
  updateItineraryOrder,
  getRouteGeometries
};