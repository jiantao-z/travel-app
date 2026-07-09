const axios = require('axios');

/**
 * 高德地图路径规划代理
 *
 * 使用高德 Web 服务 API (restapi.amap.com) 进行驾车/步行/骑行/公交路线规划。
 *
 * ⚠️ 注意：Web 服务 API 和 JS API 是两套独立产品，Key 类型不同：
 *   - JS API Key（浏览器端用，需配合 securityJsCode）
 *   - Web 服务 Key（服务端用，本项目通过此后端代理调用）
 *
 *   请确保 .env 中的 AMAP_KEY 是「Web 服务」类型，并在高德控制台
 *   「API 产品」中开通以下产品：
 *     - 驾车路径规划  (/v3/direction/driving)
 *     - 步行路径规划  (/v3/direction/walking)
 *     - 骑行路径规划  (/v4/direction/bicycling)
 *     - 公交路径规划  (/v3/direction/transit/integrated)
 */

const AMAP_WEB_URL = 'https://restapi.amap.com';

// ── 高德 API 常见错误码说明 ──
const AMAP_ERROR_HINTS = {
  '10001': 'Key 不正确或已过期',
  '10002': 'Key 没有配置使用相关 API 产品的权限（请在控制台开通对应 API 产品）',
  '10003': '访问的 Key 与 API 产品类型不匹配（Web 服务 API 需要「Web 服务」类型的 Key）',
  '10004': '请求的 API 产品权限已被关闭',
  '10005': '账号欠费',
  '10006': '当日配额已用完',
  '10007': 'Key 被禁用',
  '10009': '请求太频繁，触发 QPS 限制',
  '10012': '请求的 API 不支持 HTTPS（请改用 HTTP）',
  '10020': 'API 产品未开通（MASTER 账户需要在控制台开通）',
  '10021': 'API 产品的请求来源不在白名单内',
  '20000': '请求参数非法',
  '20001': '缺少必填参数',
  '20800': '没有该公交路线数据（该城市或区域不支持公交规划）',
  '30000': '路线规划失败（已在最大尝试次数内未找到合适路线）',
};

// 反向地理编码：坐标 → 城市名（用于 transit 自动获取 city 参数）
async function reverseGeocodeCity(lng, lat) {
  try {
    const { data } = await axios.get(`${AMAP_WEB_URL}/v3/geocode/regeo`, {
      params: {
        key: process.env.AMAP_KEY,
        location: `${lng},${lat}`,
        output: 'json'
      }
    });
    if (data.status === '1' && data.regeocode?.addressComponent) {
      const comp = data.regeocode.addressComponent;
      // 优先取城市名，其次取区县名
      const city = comp.city || comp.district || comp.province || '';
      // city 可能是数组（如 ["南京市"]）或字符串
      const cityName = Array.isArray(city) ? city[0] : city;
      if (cityName && cityName.length >= 2) {
        console.log(`[directions] regeo → ${lng},${lat} 位于 [${cityName}]`);
        return cityName;
      }
    }
    return '';
  } catch (e) {
    console.warn(`[directions] regeo 失败: ${e.message}`);
    return '';
  }
}

// polyline 解码：高德返回格式为 "lng1,lat1;lng2,lat2;..."
function decodePolyline(polylineStr) {
  if (!polylineStr || typeof polylineStr !== 'string') return [];
  return polylineStr
    .split(';')
    .filter(s => s.trim())
    .map(s => {
      const [lng, lat] = s.split(',').map(Number);
      return [lng, lat];
    });
}

// 统一的路线查询函数
async function queryRoute(type, params, res) {
  const { origin, destination } = params;
  const [originLng, originLat] = (origin || '').split(',').map(Number);

  let url, amapParams;
  switch (type) {
    case 'driving':
      url = `${AMAP_WEB_URL}/v3/direction/driving`;
      amapParams = {
        key: process.env.AMAP_KEY,
        origin,
        destination,
        strategy: params.strategy || 0,
        extensions: 'all',
        output: 'json'
      };
      break;
    case 'walking':
      url = `${AMAP_WEB_URL}/v3/direction/walking`;
      amapParams = {
        key: process.env.AMAP_KEY,
        origin,
        destination,
        output: 'json'
      };
      break;
    case 'riding':
      url = `${AMAP_WEB_URL}/v4/direction/bicycling`;
      amapParams = {
        key: process.env.AMAP_KEY,
        origin,
        destination,
        output: 'json'
      };
      break;
    case 'transit':
      url = `${AMAP_WEB_URL}/v3/direction/transit/integrated`;
      // city 是公交规划必填参数。如果前端没传或太短 → 用反向地理编码自动获取
      let city = (params.city && params.city.length >= 2) ? params.city : '';
      if (!city && !isNaN(originLng) && !isNaN(originLat)) {
        city = await reverseGeocodeCity(originLng, originLat);
      }
      amapParams = {
        key: process.env.AMAP_KEY,
        origin,
        destination,
        city: city || '',
        strategy: 0,
        output: 'json'
      };
      break;
    default:
      return res.status(400).json({ message: `不支持的路线类型: ${type}` });
  }

  // 隐藏 Key 打日志
  const maskedKey = process.env.AMAP_KEY
    ? process.env.AMAP_KEY.slice(0, 6) + '****' + process.env.AMAP_KEY.slice(-4)
    : 'NOT SET';

  const cityInfo = amapParams.city ? ` city=${amapParams.city}` : ' city=(空)';
  console.log(`[directions] ${type} → origin=${origin} dest=${destination}${cityInfo} key=${maskedKey}`);

  const { data } = await axios.get(url, { params: amapParams });

  if (data.status !== '1') {
    const errorCode = data.infocode || 'unknown';
    const hint = AMAP_ERROR_HINTS[errorCode] || '未知错误';
    console.error(`[directions] ${type} 失败 → infocode=${errorCode} info="${data.info}" hint="${hint}"`);
    return res.json({
      path: [],
      distance: 0,
      duration: 0,
      isReal: false,
      _error: { code: errorCode, info: data.info || '', hint }
    });
  }

  const route = data.route?.paths?.[0];
  if (!route) {
    // transit 失败时自动尝试 driving（公交无覆盖时至少给条驾车路线）
    if (type === 'transit') {
      console.log(`[directions] transit → 无公交路径，尝试 driving 兜底...`);
      try {
        const fbRes = await axios.get(`${AMAP_WEB_URL}/v3/direction/driving`, {
          params: {
            key: process.env.AMAP_KEY,
            origin,
            destination,
            strategy: 0,
            extensions: 'all',
            output: 'json'
          }
        });
        if (fbRes.data.status === '1') {
          const fbRoute = fbRes.data.route?.paths?.[0];
          if (fbRoute) {
            const path = [];
            (fbRoute.steps || []).forEach(step => {
              if (step.polyline) {
                decodePolyline(step.polyline).forEach(p => path.push(p));
              }
            });
            const distance = parseInt(fbRoute.distance) || 0;
            const duration = parseInt(fbRoute.duration) || 0;
            console.log(`[directions] transit → driving 兜底成功 path=${path.length}pts distance=${distance}m`);
            return res.json({
              path,
              distance,
              duration,
              isReal: true,
              _fallback: 'driving'  // 前端可据此标注"已切换为驾车路线"
            });
          }
        }
      } catch (e) {
        console.warn(`[directions] transit → driving 兜底也失败: ${e.message}`);
      }
    }

    const reasons = [];
    if (type === 'transit') reasons.push('公交+驾车兜底均失败', '起终点可能无路网数据');
    else if (type === 'riding') reasons.push('骑行路网数据可能未覆盖该区域');
    else reasons.push('起终点之间可能无道路连接', '距离过近或过远');
    const hint = reasons.join('、');
    console.log(`[directions] ${type} → 无导航路径 (${hint})`);
    return res.json({
      path: [],
      distance: 0,
      duration: 0,
      isReal: false,
      _error: { code: 'NO_ROUTE', info: '无可用的导航路径', hint }
    });
  }

  // 合并所有 step 的 polyline
  const path = [];
  (route.steps || []).forEach(step => {
    if (step.polyline) {
      const decoded = decodePolyline(step.polyline);
      decoded.forEach(p => path.push(p));
    }
    // 公交子 step
    if (step.bus?.steps) {
      step.bus.steps.forEach(busStep => {
        if (busStep.polyline) {
          const decoded = decodePolyline(busStep.polyline);
          decoded.forEach(p => path.push(p));
        }
      });
    }
  });

  const distance = parseInt(route.distance) || 0;
  const duration = parseInt(route.duration) || 0;

  console.log(`[directions] ${type} → 成功 path=${path.length}pts distance=${distance}m duration=${duration}s`);

  res.json({
    path,
    distance,
    duration,
    isReal: true
  });
}

// ── 各路由 handler ──

const driving = async (req, res) => {
  try {
    if (!req.query.origin || !req.query.destination) {
      return res.status(400).json({ message: '缺少 origin / destination 参数 (格式: lng,lat)' });
    }
    await queryRoute('driving', req.query, res);
  } catch (err) {
    console.error('[directions] driving 异常:', err.message);
    res.status(500).json({ message: '驾车路线规划异常', error: err.message });
  }
};

const walking = async (req, res) => {
  try {
    if (!req.query.origin || !req.query.destination) {
      return res.status(400).json({ message: '缺少 origin / destination 参数' });
    }
    await queryRoute('walking', req.query, res);
  } catch (err) {
    console.error('[directions] walking 异常:', err.message);
    res.status(500).json({ message: '步行路线规划异常', error: err.message });
  }
};

const riding = async (req, res) => {
  try {
    if (!req.query.origin || !req.query.destination) {
      return res.status(400).json({ message: '缺少 origin / destination 参数' });
    }
    await queryRoute('riding', req.query, res);
  } catch (err) {
    console.error('[directions] riding 异常:', err.message);
    res.status(500).json({ message: '骑行路线规划异常', error: err.message });
  }
};

const transit = async (req, res) => {
  try {
    if (!req.query.origin || !req.query.destination) {
      return res.status(400).json({ message: '缺少 origin / destination 参数' });
    }
    await queryRoute('transit', req.query, res);
  } catch (err) {
    console.error('[directions] transit 异常:', err.message);
    res.status(500).json({ message: '公交路线规划异常', error: err.message });
  }
};

module.exports = { driving, walking, riding, transit };
