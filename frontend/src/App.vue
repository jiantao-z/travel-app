<template>
  <div id="container">
    <DashboardView v-if="showDashboard" />
    <template v-else>
      <TopBar :view="amapViewRef" class="h-20" />
      <div class="h-[calc(100vh-5rem)] w-full relative">
        <div v-if="!showExplore" id="viewDiv" class="w-full h-full relative">
          <PointView :point="pointview" />
          <LocateWidget :map="mapInstance" v-if="mapInstance" />
          <LayerCategoryBar @select="onCategorySelect" @filter="onFilter" />
          <div id="measurementWidget" class="absolute top-4 right-4 z-10"></div>
          <!-- 热力图控制面板 -->
          <div class="heatmap-controls">
            <div
              class="heatmap-toggle"
              :class="{ 'heatmap-toggle--active': heatmapVisible }"
              @click="toggleHeatmap"
              title="城市热度热力图"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 2C8.5 2 5 6 5 10c0 5 7 12 7 12s7-7 7-12c0-4-3.5-8-7-8z"/>
                <path d="M12 6c-1.5 0-3 1.5-3 3.5 0 2 3 5.5 3 5.5s3-3.5 3-5.5c0-2-1.5-3.5-3-3.5z" fill="currentColor" opacity="0.5"/>
              </svg>
              <span>热力</span>
            </div>
            <div v-if="heatmapVisible" class="heatmap-panel">
              <div class="heatmap-legend">
                <span class="legend-label">低</span>
                <div class="legend-bar"></div>
                <span class="legend-label">高</span>
              </div>
              <div class="heatmap-slider">
                <span class="slider-label">强度</span>
                <input
                  type="range"
                  min="20"
                  max="100"
                  :value="heatmapIntensity"
                  @input="onIntensityChange"
                  class="intensity-slider"
                />
              </div>
            </div>
          </div>
          <!-- AI 路线操作按钮 -->
          <div v-if="aiRouteVisible" class="ai-route-controls">
            <div class="ai-route-btn ai-route-reopen" @click="reopenAiPlan">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              查看AI攻略
            </div>
            <div class="ai-route-btn ai-route-clear" @click="clearAiRoute">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              清除路线
            </div>
          </div>
          <CustomPopup
            :visible="popupVisible"
            :feature="selectedFeature"
            @close="closePopup"
          />
        </div>
        <ExploreView v-else class="w-full h-full" style="padding-left: 12rem;" />
        <SideBar class="absolute left-0 top-0 bottom-0 z-30 w-48" />
      </div>
    </template>
    <ModalContainer />
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeUnmount } from 'vue'
import DashboardView from './components/dashboard/DashboardView.vue'
import PointView from './components/map/PointView.vue'
import LocateWidget from './components/map/LocateWidget.vue'
import TopBar from './components/topbar/TopBar.vue'
import SideBar from './components/sidebar/SideBar.vue'
import ModalContainer from './components/ModalContainer.vue'
import LayerCategoryBar from './components/map/LayerCategoryBar.vue'
import ExploreView from './components/explore/ExploreView.vue'
import CustomPopup from './components/map/CustomPopup.vue'
import emitter, { currentMapStyle, currentTheme } from './eventBus'
import { loadAmap } from './services/amap'

// 地图实例 (给子组件用)
const amapViewRef = ref(null)
const mapInstance = ref(null)
let AMap = null

// 图层标记集合
const layerMarkers = { scenic: [], hotel: [], food: [], station: [], airport: [] }
const layerDataStore = {} // 缓存原始 GeoJSON features

const pointview = ref('')

// 地图样式映射（用户可选3种，共4种地图：标准/卫星/导航/暗色）
const mapStyleMapping = {
  '0': 'amap://styles/light',       // 标准
  '1': 'satellite',                  // 卫星图
  '2': 'amap://styles/macaron',     // 导航（彩色标准，马卡龙风格）
}

// 暗色主题专用地图样式（不在地图样式选项中，由主题开关触发）
const DARK_MAP_STYLE = 'amap://styles/darkblue'

// 追踪当前是否处于卫星图层模式
let isSatelliteMode = false

// 统一应用地图样式
// styleValue: '0'|'1'|'2' 为用户选择的样式，'dark' 为深色主题专用
function applyMapStyle(styleValue) {
  if (!mapInstance.value || !AMap) return

  try {
    const center = mapInstance.value.getCenter()
    const zoom = mapInstance.value.getZoom()

    if (styleValue === '1') {
      // 切换到卫星图：用 setLayers 整体替换瓦片
      mapInstance.value.setLayers([
        new AMap.TileLayer.Satellite(),
        new AMap.TileLayer.RoadNet()
      ])
      isSatelliteMode = true
    } else {
      // 非卫星样式：如果当前是卫星模式，先恢复默认瓦片
      if (isSatelliteMode) {
        mapInstance.value.setLayers([new AMap.TileLayer()])
        isSatelliteMode = false
      }
      // 直接 setMapStyle（标准/导航/暗色）
      const targetStyle = styleValue === 'dark'
        ? DARK_MAP_STYLE
        : (mapStyleMapping[styleValue] || mapStyleMapping['0'])
      mapInstance.value.setMapStyle(targetStyle)
    }

    // 恢复视图状态
    if (center && zoom != null) {
      mapInstance.value.setCenter(center)
      mapInstance.value.setZoom(zoom)
    }
  } catch (e) {
    console.error('地图样式切换失败:', e)
  }
}

// 弹窗
const popupVisible = ref(false)
const selectedFeature = ref(null)
let infoWindow = null
let lastMarkerClickTime = 0 // 防止标记点击触发地图点击

const closePopup = () => {
  popupVisible.value = false
  selectedFeature.value = null
}

// 数据大屏 & 探索视图
const showDashboard = ref(false)
const showExplore = ref(false)
emitter.on('toggle-dashboard', () => { showDashboard.value = !showDashboard.value })
emitter.on('toggle-explore', () => {
  showExplore.value = !showExplore.value
})

// 热力图
const heatmapVisible = ref(false)
const heatmapIntensity = ref(65)
let heatmapLayer = null
let heatmapData = []

async function initHeatmap() {
  try {
    const resp = await fetch('/JSON/cityHeatData.json')
    heatmapData = await resp.json()

    if (!AMap.HeatMap) {
      console.warn('AMap.HeatMap 不可用')
      return
    }

    const data = heatmapData.map(d => ({
      lng: d.lng,
      lat: d.lat,
      count: d.heat
    }))

    heatmapLayer = new AMap.HeatMap(mapInstance.value, {
      radius: 45,
      opacity: [0.1, 0.85],
      gradient: {
        0.10: '#1a3a5c',
        0.25: '#2d5f8b',
        0.40: '#3d8b7e',
        0.55: '#d4a44a',
        0.75: '#c45b3d',
        1.00: '#8b1a1a'
      },
      zooms: [4, 18]
    })

    heatmapLayer.setDataSet({ data, max: 100 })
    console.log('Heatmap 图层初始化完成, 数据点:', data.length)
  } catch (e) {
    console.error('Heatmap 初始化失败:', e)
  }
}

function toggleHeatmap() {
  heatmapVisible.value = !heatmapVisible.value
  if (!heatmapLayer) return
  if (heatmapVisible.value) {
    heatmapLayer.show()
    applyHeatmapIntensity(heatmapIntensity.value)
  } else {
    heatmapLayer.hide()
  }
}

function onIntensityChange(e) {
  const val = parseInt(e.target.value)
  heatmapIntensity.value = val
  applyHeatmapIntensity(val)
}

function applyHeatmapIntensity(val) {
  if (!heatmapLayer) return
  // intensity 映射到 opacity 上限和 radius
  const opacityMax = 0.4 + (val / 100) * 0.55  // 0.4 ~ 0.95
  const radius = 25 + (val / 100) * 35           // 25 ~ 60
  heatmapLayer.setOptions({
    opacity: [0.05, opacityMax],
    radius: Math.round(radius)
  })
}

// ── AI 路线主地图显示 ──
const aiRouteVisible = ref(false)
let aiRouteMarkers = []
let aiRoutePolylines = []

const aiDayColors = ['#c45b3d', '#2d5f8b', '#3d8b7e', '#d4a44a', '#5b8c6f', '#d4726a', '#8b5a2b']

emitter.on('show-ai-route', (routeData) => {
  if (!mapInstance.value || !routeData?.route?.days) return
  clearAiRoute()
  renderAiRoute(routeData)
})

function renderAiRoute(routeData) {
  if (!mapInstance.value || !AMap) return

  const allCoords = []

  // 先收集所有需要地理编码的点
  const needGeocode = []
  for (const day of routeData.route.days) {
    for (const spot of day.spots) {
      // 优先用模态框已缓存的坐标
      if (spot._lng && spot._lat) {
        allCoords.push([spot._lng, spot._lat])
      } else {
        needGeocode.push(spot)
      }
    }
  }

  // 异步处理（使用可靠的 REST API 地理编码）
  ;(async () => {
    // 地理编码未缓存的点
    if (needGeocode.length > 0) {
      for (const spot of needGeocode) {
        try {
          const url = `https://restapi.amap.com/v3/place/text?key=${AMAP_WEB_KEY}&keywords=${encodeURIComponent(spot.name)}&city=${encodeURIComponent(routeData.destination || '全国')}&offset=1`
          const resp = await fetch(url)
          const data = await resp.json()
          if (data.status === '1' && data.pois && data.pois.length > 0) {
            const poi = data.pois[0]
            const loc = poi.location.split(',')
            spot._lng = parseFloat(loc[0])
            spot._lat = parseFloat(loc[1])
            allCoords.push([spot._lng, spot._lat])
          }
        } catch (e) {
          console.warn(`主地图地理编码失败: ${spot.name}`, e.message)
        }
        // 限速
        await new Promise(r => setTimeout(r, 120))
      }
    }

    // 渲染所有已编码的景点
    for (const day of routeData.route.days) {
      const daySpots = day.spots.filter(s => s._lng && s._lat)
      if (daySpots.length === 0) continue

      const color = aiDayColors[(day.day - 1) % aiDayColors.length]
      daySpots.forEach((spot, si) => {
        const content = document.createElement('div')
        content.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:2px">
          <div style="width:30px;height:30px;background:${color};border:3px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:14px;box-shadow:0 2px 10px rgba(0,0,0,0.4)">${si + 1}</div>
          <span style="font-size:10px;font-weight:700;color:#1a1a1a;background:rgba(255,255,255,0.92);padding:2px 6px;white-space:nowrap;border:1px solid #ccc">${spot.name}</span></div>`
        const marker = new AMap.Marker({
          position: [spot._lng, spot._lat],
          content: content,
          offset: new AMap.Pixel(-15, -48),
          zIndex: 200
        })
        mapInstance.value.add(marker)
        aiRouteMarkers.push(marker)

        if (si > 0) {
          const prev = daySpots[si - 1]
          const polyline = new AMap.Polyline({
            path: [[prev._lng, prev._lat], [spot._lng, spot._lat]],
            strokeColor: color, strokeWeight: 4, strokeOpacity: 0.8,
            showDir: true, zIndex: 150
          })
          mapInstance.value.add(polyline)
          aiRoutePolylines.push(polyline)
        }
      })
    }

    if (allCoords.length > 0) {
      mapInstance.value.setFitView(allCoords)
      aiRouteVisible.value = true
    }
  })()
}

function reopenAiPlan() {
  emitter.emit('open-modal', 'ai-planning')
}

function clearAiRoute() {
  if (aiRouteMarkers.length > 0) {
    mapInstance.value?.remove(aiRouteMarkers)
    aiRouteMarkers = []
  }
  if (aiRoutePolylines.length > 0) {
    mapInstance.value?.remove(aiRoutePolylines)
    aiRoutePolylines = []
  }
  aiRouteVisible.value = false
}

// 主题变更（深色/浅色切换）
emitter.on('theme-changed', (theme) => {
  currentTheme.value = theme
  document.body.className = theme === 'dark' ? 'dark' : ''
  localStorage.setItem('theme', theme)

  // 同步地图：深色模式 → 暗色地图，浅色模式 → 恢复用户选择的地图样式
  if (mapInstance.value) {
    if (theme === 'dark') {
      // 保存当前地图样式以便恢复
      localStorage.setItem('mapStyleBeforeDark', currentMapStyle.value)
      applyMapStyle('dark')
    } else {
      const restored = localStorage.getItem('mapStyleBeforeDark') || currentMapStyle.value || '0'
      localStorage.removeItem('mapStyleBeforeDark')
      currentMapStyle.value = restored
      localStorage.setItem('mapStyle', restored)
      applyMapStyle(restored)
    }
  }
})

// 地图样式切换（深色模式下只记录选择，不改变地图显示）
emitter.on('map-style-changed', (value) => {
  currentMapStyle.value = value
  localStorage.setItem('mapStyle', value)
  // 深色主题时地图固定为暗色，切回浅色后才应用用户选择
  if (currentTheme.value !== 'dark') {
    applyMapStyle(value)
  }
})

// 分类选择
const onCategorySelect = (category) => { console.log('选中分类:', category) }

// ================================
// GeoJSON 图层管理
// ================================
const geoJsonLayers = [
  { key: 'scenic',  url: '/JSON/全国A级景区数据_FeaturesToJSON.geojson', icon: '/icons/scenic-spot.svg', nameField: '景区名称', categoryField: '等级' },
  { key: 'hotel',   url: '/JSON/西安住宿.geojson',                        icon: '/icons/hotel.svg',       nameField: '酒店名',   categoryField: '类型' },
  { key: 'food',    url: '/JSON/西安餐厅.geojson',                        icon: '/icons/restaurant.svg',  nameField: '餐厅名',   categoryField: '类型' },
  { key: 'station', url: '/JSON/动车站点.geojson',                         icon: '/icons/train.svg',       nameField: 'name',       categoryField: 'station' },
  { key: 'airport', url: '/JSON/中国_机场.geojson',                         icon: '/icons/airport.svg',     nameField: 'Name',       categoryField: 'kind' }
]

const categoryFilterMap = {
  scenic:  '等级',
  hotel:   '类型',
  food:    '类型',
  station: 'station',
  airport: 'kind'
}

// 加载单个 GeoJSON 层
async function loadGeoJsonLayer(layerKey) {
  const config = geoJsonLayers.find(l => l.key === layerKey)
  if (!config) return

  try {
    const resp = await fetch(config.url)
    const geojson = await resp.json()
    layerDataStore[layerKey] = geojson.features || []
    // 初始隐藏
  } catch (e) {
    console.error(`加载 ${layerKey} GeoJSON 失败:`, e)
  }
}

// 渲染 GeoJSON features 为高德标记
function renderLayerMarkers(layerKey, features) {
  if (!mapInstance.value || !AMap) return

  // 清除旧标记
  clearLayerMarkers(layerKey)

  const config = geoJsonLayers.find(l => l.key === layerKey)
  if (!config || !features || features.length === 0) return

  const markers = []

  features.forEach((feature) => {
    const props = feature.properties || feature.attributes || {}
    const geom = feature.geometry
    if (!geom || !props[config.nameField]) return

    let lng, lat
    if (geom.type === 'Point') {
      [lng, lat] = geom.coordinates
    } else {
      return // 只处理点数据
    }

    const markerContent = document.createElement('div')
    const img = document.createElement('img')
    img.src = config.icon
    img.style.width = '26px'
    img.style.height = '26px'
    markerContent.appendChild(img)

    const marker = new AMap.Marker({
      position: [lng, lat],
      content: markerContent,
      offset: new AMap.Pixel(-13, -13),
      zIndex: 100,
      extData: { ...props, _layerKey: layerKey }
    })

    marker.on('click', () => onMarkerClick(layerKey, props, lng, lat))
    markers.push(marker)
  })

  mapInstance.value.add(markers)
  layerMarkers[layerKey] = markers
}

function clearLayerMarkers(layerKey) {
  if (layerMarkers[layerKey] && layerMarkers[layerKey].length > 0) {
    mapInstance.value?.remove(layerMarkers[layerKey])
    layerMarkers[layerKey] = []
  }
}

// 标记点击 → 弹窗
function onMarkerClick(layerKey, attrs, lng, lat) {
  lastMarkerClickTime = Date.now()
  const plainFeature = {
    attributes: { ...attrs },
    clickPoint: { longitude: lng, latitude: lat }
  }
  selectedFeature.value = plainFeature
  popupVisible.value = true
}


// 高德 Web 服务 API Key（用于逆地理编码等数据服务）
// 请在前端 .env 文件中配置 VITE_AMAP_WEB_KEY
const AMAP_WEB_KEY = import.meta.env.VITE_AMAP_WEB_KEY || ''

// 地图点击 → 逆地理编码获取地点信息
async function onMapClick(e) {
  // 如果刚点过标记（300ms内），跳过地图点击处理
  if (Date.now() - lastMarkerClickTime < 300) return

  const lng = e.lnglat.getLng()
  const lat = e.lnglat.getLat()

  let placeName = ''
  let address = ''
  let district = ''
  let city = ''
  let province = ''

  // 调用高德 Web 服务逆地理编码 API（使用 Web 服务 Key）
  try {
    const url = `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_WEB_KEY}&location=${lng},${lat}&extensions=all&radius=1000`
    const resp = await fetch(url)
    const data = await resp.json()

    if (data.status === '1' && data.regeocode) {
      const rg = data.regeocode
      address = rg.formatted_address || ''

      const ac = rg.addressComponent || {}
      district = ac.district || ''
      city = ac.city || ac.province || ''
      province = ac.province || ''

      // 优先使用周边 POI 名称
      const pois = rg.pois || []
      if (pois.length > 0 && pois[0].name) {
        placeName = pois[0].name
      } else if (ac.building?.name) {
        placeName = ac.building.name
      } else if (ac.streetNumber?.street && ac.streetNumber?.number) {
        placeName = ac.streetNumber.street + ac.streetNumber.number + '号'
      } else if (ac.township && ac.township !== '[]') {
        placeName = ac.township
      } else if (ac.streetNumber?.street) {
        placeName = ac.streetNumber.street
      } else if (ac.neighborhood?.name) {
        placeName = ac.neighborhood.name
      } else {
        placeName = address
      }
    }
  } catch (err) {
    console.warn('逆地理编码请求失败:', err.message || err)
  }

  // 兜底：坐标
  if (!placeName) {
    placeName = `${lng.toFixed(4)}°E, ${lat.toFixed(4)}°N`
    address = `经度 ${lng.toFixed(6)}  纬度 ${lat.toFixed(6)}`
  }

  selectedFeature.value = {
    attributes: {
      _name_local: placeName,
      address: address,
      district: district,
      city: city,
      province: province
    },
    clickPoint: { longitude: lng, latitude: lat },
    isBasemapFeature: true
  }
  popupVisible.value = true
}

// ================================
// 分类筛选
// ================================
const onFilter = ({ category, values }) => {
  if (!mapInstance.value) return

  // UI 类别值与数据层键名的映射（火车站按钮发出 'train'，但数据存储在 'station' 下）
  const layerKey = category === 'train' ? 'station' : category

  const features = layerDataStore[layerKey]
  if (!features) return

  const field = categoryFilterMap[layerKey]
  if (!field) return

  // 获取筛选值
  let filterValues = []
  if (category === 'scenic') filterValues = values.scenicTypes || []
  else if (category === 'hotel') filterValues = values.hotelStars || []
  else if (category === 'food') filterValues = values.foodTypes || []
  else if (category === 'train') filterValues = values.trainTypes || []
  else if (category === 'airport') filterValues = values.airportTypes || []

  if (filterValues.length === 0) {
    clearLayerMarkers(layerKey)
    return
  }

  // 筛选匹配的 features
  let matched = []
  if (category === 'hotel') {
    const stars = filterValues.map(s => parseInt(s))
    matched = features.filter(f => {
      const val = f.properties ? f.properties[field] : (f.attributes ? f.attributes[field] : undefined)
      return stars.includes(parseInt(val))
    })
  } else if (category === 'train') {
    const mapped = filterValues.map(t => t === '火车站' ? 'train' : (t === '地铁站' ? 'subway' : null)).filter(Boolean)
    matched = features.filter(f => {
      const val = f.properties ? (f.properties[field] || f.properties.station) : (f.attributes ? (f.attributes[field] || f.attributes.station) : undefined)
      return mapped.includes(val)
    })
  } else if (category === 'airport') {
    const mapped = filterValues.map(t => t === '国际机场' ? '国际' : '国内')
    matched = features.filter(f => {
      const val = f.properties ? f.properties[field] : (f.attributes ? f.attributes[field] : undefined)
      return mapped.includes(val)
    })
  } else {
    matched = features.filter(f => {
      const val = f.properties ? f.properties[field] : (f.attributes ? f.attributes[field] : undefined)
      return filterValues.includes(val)
    })
  }

  renderLayerMarkers(layerKey, matched)
}

// ================================
// 测量工具
// ================================
let rangingTool = null
function initMeasurementWidget() {
  if (!mapInstance.value || !AMap) return
  const container = document.getElementById('measurementWidget')
  if (!container) return

  // 用高德 RangingTool 放到指定容器里
  AMap.plugin('AMap.RangingTool', () => {
    rangingTool = new AMap.RangingTool(mapInstance.value)
    // RangingTool 自带 UI，但它是内联的。我们用自定义按钮触发
  })

  // 创建一个自定义触发按钮
  const btn = document.createElement('button')
  btn.textContent = '测距'
  btn.style.cssText = 'padding:6px 14px;border-radius:0;background:var(--surface-solid);color:var(--text-primary);cursor:pointer;font-size:13px;font-weight:600;'
  btn.onclick = () => {
    if (rangingTool) {
      // 切换测距开关
      rangingTool.turnOn()
    }
  }
  container.appendChild(btn)
}

// ================================
// 初始化地图
// ================================
async function initMap() {
  try {
    AMap = await loadAmap()
  } catch (e) {
    console.error('地图加载失败:', e)
    return
  }

  const container = document.getElementById('viewDiv')
  if (!container) return

  // 创建地图实例（使用保存的地图样式）
  const savedStyle = localStorage.getItem('mapStyle') || '0'
  const initialStyle = mapStyleMapping[savedStyle] === 'satellite'
    ? 'amap://styles/light'
    : mapStyleMapping[savedStyle]

  const map = new AMap.Map(container, {
    zoom: 8,
    center: [108.94, 34.26], // 西安
    mapStyle: initialStyle || 'amap://styles/light',
    resizeEnable: true
  })

  mapInstance.value = map
  amapViewRef.value = map
  window.map = map // 调试用

  // 应用保存的地图样式（如当前是深色主题，优先暗色地图）
  if (currentTheme.value === 'dark') {
    applyMapStyle('dark')
  } else {
    applyMapStyle(savedStyle)
  }

  // 鼠标移动 → 坐标显示
  map.on('mousemove', (e) => {
    pointview.value = `X:${e.lnglat.getLng().toFixed(6)}°\n           Y:${e.lnglat.getLat().toFixed(7)}°`
  })

  // 地图点击 → 关闭弹窗
  map.on('click', onMapClick)

  // 测量工具
  initMeasurementWidget()

  // 加载所有 GeoJSON 图层
  for (const layer of geoJsonLayers) {
    await loadGeoJsonLayer(layer.key)
  }

  // 初始化热力图（后台加载，默认隐藏）
  initHeatmap()
}

onMounted(() => { initMap() })

onBeforeUnmount(() => {
  if (rangingTool) rangingTool.turnOff()
})
</script>

<style scoped>
#container {
  padding: 0px;
  margin: 0px;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  user-select: none;
  position: relative;
  background: #f4f1ec;
}

#viewDiv {
  padding: 0px; margin: 0px; height: 100%; width: 100%;
  box-sizing: border-box; user-select: none; overflow: hidden !important;
  z-index: 1; border-radius: 0 0 8px 0;
}

#measurementWidget {
  position: absolute;
  top: 16px; right: 16px; z-index: 1000;
  pointer-events: auto;
  background: var(--surface-solid);
  border-radius: var(--radius-md); padding: 6px;
  box-shadow: var(--shadow-sm);
}

/* 高德内部元素隐藏版权 */
:deep(.amap-logo) { display: none !important; }
:deep(.amap-copyright) { display: none !important; }

/* ═══ 热力图控制面板 (右下角) ═══ */
.heatmap-controls {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  pointer-events: none;
}

.heatmap-controls > * {
  pointer-events: auto;
}

/* ── 开关按钮 ── */
.heatmap-toggle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 8px;
  background: rgba(26, 26, 26, 0.85);
  backdrop-filter: blur(8px);
  border: 2px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  user-select: none;
  min-width: 48px;
}

.heatmap-toggle:hover {
  background: rgba(26, 26, 26, 0.95);
  border-color: rgba(255, 255, 255, 0.4);
  color: #fff;
  transform: scale(1.05);
}

.heatmap-toggle--active {
  background: rgba(196, 91, 61, 0.9);
  border-color: #c45b3d;
  color: #fff;
  box-shadow: 0 0 20px rgba(196, 91, 61, 0.4);
}

.heatmap-toggle--active:hover {
  background: rgba(196, 91, 61, 1);
  border-color: #e0795b;
}

/* ── 展开面板 (图例 + 强度) ── */
.heatmap-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  background: rgba(26, 26, 26, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  animation: panelSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  min-width: 160px;
}

@keyframes panelSlideIn {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}

/* ── 图例 ── */
.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-label {
  font-size: 8px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.legend-bar {
  flex: 1;
  height: 8px;
  background: linear-gradient(to right,
    #1a3a5c 0%,
    #2d5f8b 22%,
    #3d8b7e 42%,
    #d4a44a 58%,
    #c45b3d 78%,
    #8b1a1a 100%
  );
}

/* ── 强度滑块 ── */
.heatmap-slider {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-label {
  font-size: 8px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 2px;
  text-transform: uppercase;
}

.intensity-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.2);
  outline: none;
  cursor: pointer;
}

.intensity-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  background: #c45b3d;
  border: 2px solid #fff;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(196, 91, 61, 0.5);
  transition: transform 0.15s;
}

.intensity-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.intensity-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  background: #c45b3d;
  border: 2px solid #fff;
  cursor: pointer;
  box-shadow: 0 0 6px rgba(196, 91, 61, 0.5);
}

/* ═══ AI 路线操作按钮组 ═══ */
.ai-route-controls {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  display: flex;
  gap: 8px;
  animation: slideDown 0.3s ease-out;
  user-select: none;
}

.ai-route-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  backdrop-filter: blur(8px);
  color: #fff;
  cursor: pointer;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1px;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.ai-route-reopen {
  background: rgba(26, 26, 26, 0.92);
  border-color: rgba(255, 255, 255, 0.3);
}

.ai-route-reopen:hover {
  background: #1a1a1a;
  border-color: #fff;
}

.ai-route-clear {
  background: rgba(196, 91, 61, 0.92);
  border-color: #c45b3d;
}

.ai-route-clear:hover {
  background: #c45b3d;
  border-color: #8b2a1a;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
