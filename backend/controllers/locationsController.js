const axios = require('axios');

// 统一的地点搜索（高德地图）
// 入参：q 关键词，city 可选城市，page 可选页码
// 出参：[{ id, name, address, longitude, latitude }]
const searchLocations = async (req, res) => {
  const AMAP_KEY = process.env.AMAP_KEY;
  if (!AMAP_KEY) {
    return res.status(500).json({ message: '缺少 AMAP_KEY 环境变量' });
  }

  try {
    const keyword = (req.query.q || '').trim();
    const city = (req.query.city || '').trim();
    const page = Number(req.query.page || 1) || 1;

    if (!keyword) {
      return res.json([]);
    }

    // 使用高德 v3 地点搜索（稳定）
    const url = 'https://restapi.amap.com/v3/place/text';
    const params = {
      key: AMAP_KEY,
      keywords: keyword,
      city: city,
      page: page,
      offset: 20,
      extensions: 'base'
    };

    const { data } = await axios.get(url, { params });
    if (data.status !== '1') {
      return res.status(500).json({ message: data.info || '高德搜索失败' });
    }

    const pois = Array.isArray(data.pois) ? data.pois : [];
    const results = pois.map((p) => {
      let lng = null, lat = null;
      if (p.location && typeof p.location === 'string' && p.location.includes(',')) {
        const [lngStr, latStr] = p.location.split(',');
        lng = Number(lngStr);
        lat = Number(latStr);
      }
      return {
        id: p.id,
        name: p.name,
        address: p.address || '',
        longitude: Number.isFinite(lng) ? lng : null,
        latitude: Number.isFinite(lat) ? lat : null,
      };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: '地点搜索失败', error: err.message });
  }
};

module.exports = { searchLocations };


