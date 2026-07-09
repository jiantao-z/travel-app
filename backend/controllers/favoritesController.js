const { Favorite, FavoriteItem, Scenicpot, Canteen, Lodging } = require('../models');

// 获取当前用户所有收藏夹
const getFavorites = async (req, res) => {
  try {
    const list = await Favorite.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']]
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: '获取收藏夹失败', error: err.message });
  }
};

// 新建收藏夹
const createFavorite = async (req, res) => {
  const { title } = req.body;
  try {
    const fav = await Favorite.create({ user_id: req.user.id, title });
    res.status(201).json(fav);
  } catch (err) {
    res.status(500).json({ message: '新建收藏夹失败', error: err.message });
  }
};

// 删除收藏夹
const deleteFavorite = async (req, res) => {
  try {
    const count = await Favorite.destroy({ where: { fav_id: req.params.id, user_id: req.user.id } });
    if (count === 0) return res.status(404).json({ message: '未找到该收藏夹' });
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ message: '删除失败', error: err.message });
  }
};

// 重命名收藏夹
const renameFavorite = async (req, res) => {
  const { title } = req.body;
  try {
    if (!title || !title.trim()) {
      return res.status(400).json({ message: '收藏夹名称不能为空' });
    }
    
    const [count] = await Favorite.update(
      { title: title.trim() },
      { where: { fav_id: req.params.id, user_id: req.user.id } }
    );
    
    if (count === 0) {
      return res.status(404).json({ message: '未找到该收藏夹' });
    }
    
    // 返回更新后的收藏夹信息
    const updatedFavorite = await Favorite.findByPk(req.params.id);
    res.json(updatedFavorite);
  } catch (err) {
    res.status(500).json({ message: '重命名失败', error: err.message });
  }
};

// getLocationOptions 已弃用，改为 /locations/search 对接高德
const getLocationOptions = async (req, res) => {
  return res.status(410).json({ message: '该接口已废弃，请改用 /api/locations/search' });
};

// 获取收藏夹内项目（返回包含经纬度）
const getFavoriteItems = async (req, res) => {
  try {
    const items = await FavoriteItem.findAll({
      where: { fav_id: req.params.id },
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']]
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: '获取收藏夹项目失败', error: err.message });
  }
};

// 添加项目到收藏夹（已解耦地点表）
const addFavoriteItem = async (req, res) => {
  const { name, address, longitude, latitude } = req.body;
  try {
    // 防止重复（基于名称+地址，或基于经纬度近似值可选）
    const exist = await FavoriteItem.findOne({ where: { fav_id: req.params.id, name, address } });
    if (exist) return res.status(400).json({ message: '该项目已在收藏夹中' });
    const maxOrder = await FavoriteItem.max('sort_order', { where: { fav_id: req.params.id } }) || 0;
    const item = await FavoriteItem.create({
      fav_id: req.params.id,
      name,
      address,
      longitude,
      latitude,
      sort_order: maxOrder + 1
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: '添加失败', error: err.message });
  }
};

// 从收藏夹移除项目
const removeFavoriteItem = async (req, res) => {
  try {
    const count = await FavoriteItem.destroy({ where: { fav_id: req.params.id, item_id: req.params.item_id } });
    if (count === 0) return res.status(404).json({ message: '未找到该项目' });
    res.json({ message: '移除成功' });
  } catch (err) {
    res.status(500).json({ message: '移除失败', error: err.message });
  }
};

module.exports = {
  getFavorites,
  createFavorite,
  deleteFavorite,
  renameFavorite,
  getLocationOptions,
  getFavoriteItems,
  addFavoriteItem,
  removeFavoriteItem,
}; 