const { scenicpot, canteen, lodging } = require('../models');
const { Sequelize } = require('sequelize');

const searchLocations = async (req, res) => {
  try {
    const keyword = req.query.q || '';
    
    // 从三个表中搜索
    const [scenicResults, canteenResults, lodgingResults] = await Promise.all([
      scenicpot.findAll({
        where: {
          name: {
            [Sequelize.Op.iLike]: `%${keyword}%`
          }
        },
        attributes: ['scenic_id', 'name', 'type', 'address'],
        raw: true
      }),
      canteen.findAll({
        where: {
          name: {
            [Sequelize.Op.iLike]: `%${keyword}%`
          }
        },
        attributes: ['canteen_id', 'name', 'type', 'address'],
        raw: true
      }),
      lodging.findAll({
        where: {
          name: {
            [Sequelize.Op.iLike]: `%${keyword}%`
          }
        },
        attributes: ['lodging_id', 'name', 'star_rating', 'address'],
        raw: true
      })
    ]);
    
    // 格式化结果
    const formattedScenic = scenicResults.map(item => ({
      id: item.scenic_id,
      name: item.name,
      type: 'scenic',
      address: item.address,
      category: '景区'
    }));
    
    const formattedCanteen = canteenResults.map(item => ({
      id: item.canteen_id,
      name: item.name,
      type: 'canteen',
      address: item.address,
      category: '餐厅'
    }));
    
    const formattedLodging = lodgingResults.map(item => ({
      id: item.lodging_id,
      name: item.name,
      type: 'lodging',
      address: item.address,
      category: '住宿'
    }));
    
    // 合并结果
    const results = [...formattedScenic, ...formattedCanteen, ...formattedLodging];
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: '搜索地点失败', error: err.message });
  }
};

module.exports = { searchLocations }; 