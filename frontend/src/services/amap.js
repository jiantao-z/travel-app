/**
 * 高德地图 JS API 加载器 & 共享实例管理
 * 使用 AMap JS API v2.0 (安全密钥方式)
 */

import AMapLoader from '@amap/amap-jsapi-loader'

// 高德 JS API Key 与安全密钥（Web端 JS API 需要，均在前端 .env 中配置）
const AMAP_KEY = import.meta.env.VITE_AMAP_JS_KEY || ''
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE || ''
const AMAP_VERSION = '2.0'

let AMapInstance = null
let loadPromise = null

/**
 * 加载高德 JS API 并缓存（仅首次加载）
 */
export async function loadAmap() {
  if (AMapInstance) return AMapInstance
  if (loadPromise) return loadPromise

  loadPromise = AMapLoader.load({
    key: AMAP_KEY,
    securityJsCode: AMAP_SECURITY_CODE,
    version: AMAP_VERSION,
    plugins: [
      'AMap.Geolocation',
      'AMap.AutoComplete',
      'AMap.PlaceSearch',
      'AMap.RangingTool',
      'AMap.Marker',
      'AMap.Polyline',
      'AMap.Geocoder',
      'AMap.Scale',
      'AMap.ToolBar',
      'AMap.GeoJSON',
      'AMap.Driving',
      'AMap.Walking',
      'AMap.Riding',
      'AMap.Transit',
      'AMap.HeatMap'
    ]
  })
    .then((AMap) => {
      AMapInstance = AMap
      console.log('高德地图 JS API 加载成功')
      return AMap
    })
    .catch((err) => {
      loadPromise = null
      console.error('高德地图 JS API 加载失败:', err)
      throw err
    })

  return loadPromise
}

/**
 * 获取已加载的 AMap 实例（必须先调用 loadAmap）
 */
export function getAmap() {
  if (!AMapInstance) throw new Error('AMap 尚未加载，请先调用 loadAmap()')
  return AMapInstance
}


