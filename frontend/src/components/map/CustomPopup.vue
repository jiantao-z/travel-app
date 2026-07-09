<template>
  <div v-if="visible" class="custom-popup" :class="{ 'popup-exit': exiting }">
    <!-- 几何装饰元素 - 大圆环 -->
    <div class="geo-deco-circle"></div>
    <div class="geo-deco-square"></div>
    <div class="geo-deco-triangle"></div>

    <div class="popup-container">
      <!-- ═══ 头部：色条 + 名称 ═══ -->
      <div class="popup-header">
        <div class="header-accent"></div>
        <div class="header-content">
          <span class="header-eyebrow">{{ categoryLabel }}</span>
          <h2 class="header-title">{{ title }}</h2>
        </div>
        <button class="popup-close" @click="closePopup" :aria-label="'关闭'">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="3" y1="3" x2="15" y2="15"/><line x1="15" y1="3" x2="3" y2="15"/>
          </svg>
        </button>
      </div>

      <!-- ═══ KPI 色块带 ═══ -->
      <div class="kpi-strip">
        <div class="kpi-block kpi-block--terracotta" :class="{ 'kpi-animate': animateIn }">
          <span class="kpi-number kpi-num-counter">{{ animated.collections }}</span>
          <span class="kpi-label">被收藏</span>
          <div class="kpi-icon-ring">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
        </div>
        <div class="kpi-block kpi-block--mustard" :class="{ 'kpi-animate': animateIn }">
          <span class="kpi-number kpi-num-counter">{{ animated.checkins }}</span>
          <span class="kpi-label">近期打卡</span>
          <div class="kpi-icon-ring">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 12a11 11 0 1 1-22 0 11 11 0 0 1 22 0z"/><path d="M12 7v5l3 3"/>
            </svg>
          </div>
        </div>
        <div class="kpi-block kpi-block--teal" :class="{ 'kpi-animate': animateIn }">
          <span class="kpi-number kpi-num-counter">{{ animated.rating }}</span>
          <span class="kpi-label">综合评分</span>
          <div class="kpi-icon-ring">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- ═══ 可视化区域 ═══ -->
      <div class="viz-section">
        <!-- 近7日打卡趋势 - 迷你火花图 -->
        <div class="viz-card sparkline-card" :class="{ 'viz-reveal': animateIn }">
          <div class="viz-card-header">
            <span class="viz-card-title">近7日打卡趋势</span>
            <span class="viz-card-badge">{{ weeklyTrend }}% ↑</span>
          </div>
          <div class="sparkline-wrap">
            <svg class="sparkline-svg" viewBox="0 0 200 56" preserveAspectRatio="none">
              <defs>
                <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" :stop-color="accentColor" stop-opacity="0.35"/>
                  <stop offset="100%" :stop-color="accentColor" stop-opacity="0.02"/>
                </linearGradient>
              </defs>
              <path :d="sparkAreaPath" :fill="`url(#${gradientId})`"/>
              <path :d="sparkLinePath" fill="none" :stroke="accentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle v-for="(pt, i) in sparkDots" :key="i"
                :cx="pt.x" :cy="pt.y" r="3.5"
                :fill="i === sparkDots.length-1 ? accentColor : '#fff'"
                :stroke="accentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="spark-labels">
            <span v-for="d in dayLabels" :key="d" class="spark-day">{{ d }}</span>
          </div>
        </div>

        <!-- 指标进度条 -->
        <div class="viz-card metrics-card" :class="{ 'viz-reveal': animateIn }">
          <div class="metric-row" v-for="m in metricsData" :key="m.label">
            <div class="metric-header">
              <span class="metric-label">{{ m.label }}</span>
              <span class="metric-value" :style="{color: m.color}">{{ m.percent }}%</span>
            </div>
            <div class="metric-track">
              <div class="metric-fill"
                :class="`metric-fill--${m.key}`"
                :style="{ width: m.percent + '%', background: m.color }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ 地点信息网格 ═══ -->
      <div class="info-grid-section" :class="{ 'viz-reveal': animateIn }">
        <div class="info-grid-bauhaus">
          <div class="info-cell" v-for="item in displayInfoGrid" :key="item.label">
            <div class="info-cell-dot" :style="{background: item.dotColor}"></div>
            <div class="info-cell-content">
              <span class="info-cell-label">{{ item.label }}</span>
              <span class="info-cell-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ 操作按钮 ═══ -->
      <div class="popup-actions" :class="{ 'viz-reveal': animateIn }">
        <button class="action-btn action-btn-primary" @click="addToCollection">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
          <span>加入收藏</span>
        </button>
        <button class="action-btn action-btn-secondary" @click="addToItinerary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span>加入行程</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import emitter from '@/eventBus'

const props = defineProps({
  visible: { type: Boolean, default: false },
  feature: { type: Object, default: null }
})

const emit = defineEmits(['close'])

// 退出动画
const exiting = ref(false)
const animateIn = ref(false)
let animateTimer = null

// 渐变 ID（每个实例唯一，避免 SVG defs 冲突）
const gradientId = 'spark-grad-' + Math.random().toString(36).slice(2, 8)

// ── 虚拟数据生成（基于名称的确定性哈希） ──
function hashFromName(str) {
  if (!str) str = 'default'
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

const virtualData = computed(() => {
  const name = title.value || '未知地点'
  const h = hashFromName(name)

  // 收藏数 50-5050
  const collections = (h % 5000) + 50
  // 近期打卡 100-8100
  const checkins = ((h * 7) % 8000) + 100
  // 评分 3.5-5.0
  const rating = (((h * 13) % 16) + 35) / 10

  // 7日趋势数据
  const weekly = []
  let seed = h
  for (let i = 0; i < 7; i++) {
    seed = ((seed * 1103515245) + 12345) & 0x7fffffff
    weekly.push((seed % 60) + 20) // 20-79
  }
  // 最近一天高一点
  weekly[6] = Math.max(weekly[6], weekly[5] + 5)
  const trend = weekly[6] - weekly[0]

  return { collections, checkins, rating, weekly, trend }
})

// 带动画数字
const animated = ref({ collections: 0, checkins: 0, rating: '0.0' })

function animateNumbers() {
  const vd = virtualData.value
  const duration = 800
  const start = performance.now()

  function tick(now) {
    const elapsed = now - start
    const progress = Math.min(elapsed / duration, 1)
    // ease-out
    const eased = 1 - Math.pow(1 - progress, 3)

    animated.value = {
      collections: Math.round(vd.collections * eased),
      checkins: formatCheckinNum(Math.round(vd.checkins * eased)),
      rating: (vd.rating * eased).toFixed(1)
    }

    if (progress < 1) {
      requestAnimationFrame(tick)
    }
  }
  requestAnimationFrame(tick)
}

function formatCheckinNum(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return String(n)
}

// ── 标题 ──
const title = computed(() => {
  if (!props.feature) return '未知地点'
  const attrs = props.feature.attributes || {}
  return attrs._name_local || attrs._name_global || attrs.name || attrs.Name
    || attrs['景区名称'] || attrs['酒店名'] || attrs['餐厅名']
    || attrs['名称'] || attrs.Match_addr || '未知地点'
})

// 分类标签
const categoryLabel = computed(() => {
  if (!props.feature) return 'LOCATION'
  const attrs = props.feature.attributes || {}
  if (attrs['景区名称'] || attrs['景区名'] || attrs['等级']) return 'SCENIC SPOT'
  if (attrs['酒店名'] || attrs['酒店类型']) return 'HOTEL'
  if (attrs['餐厅名'] || attrs['餐厅类型']) return 'RESTAURANT'
  if (attrs.station || attrs.Name && String(attrs.Name).includes('站')) return 'STATION'
  if (attrs.kind) return 'AIRPORT'
  if (props.feature.isBasemapFeature) return 'LOCATION'
  return 'POI'
})

// 强调色（根据分类）
const accentColor = computed(() => {
  const cat = categoryLabel.value
  if (cat === 'SCENIC SPOT') return '#c45b3d'
  if (cat === 'HOTEL') return '#d4a44a'
  if (cat === 'RESTAURANT') return '#c45b3d'
  if (cat === 'STATION') return '#2d5f8b'
  if (cat === 'AIRPORT') return '#3d8b7e'
  return '#5b8c6f'
})

// ── 火花图数据 ──
const dayLabels = ['一', '二', '三', '四', '五', '六', '日']

const sparkDots = computed(() => {
  const data = virtualData.value.weekly
  const max = Math.max(...data)
  const w = 200; const h = 56; const pad = 10
  return data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((v / max) * (h - pad * 2))
  }))
})

const sparkLinePath = computed(() => {
  const pts = sparkDots.value
  if (!pts.length) return ''
  return 'M' + pts.map(p => `${p.x},${p.y}`).join(' L')
})

const sparkAreaPath = computed(() => {
  const pts = sparkDots.value
  if (!pts.length) return ''
  const line = pts.map(p => `${p.x},${p.y}`).join(' L')
  const last = pts[pts.length - 1]
  const first = pts[0]
  return `M${first.x},56 L${line} L${last.x},56 Z`
})

const weeklyTrend = computed(() => {
  const t = virtualData.value.trend
  return t >= 0 ? '+' + t : String(t)
})

// ── 指标数据 ──
const metricsData = computed(() => {
  const h = hashFromName(title.value)
  return [
    { key: 'popularity', label: '热度排名',   percent: (h % 70) + 30,  color: '#c45b3d' },
    { key: 'crowd',      label: '拥挤指数',   percent: (h * 3) % 60 + 15, color: '#d4a44a' },
    { key: 'photo',      label: '拍照指数',   percent: (h * 7) % 50 + 50, color: '#5b8c6f' },
    { key: 'satisfy',    label: '好评比例',   percent: (h * 11) % 30 + 68, color: '#3d8b7e' },
  ]
})

// ── 信息网格 ──
const displayInfoGrid = computed(() => {
  const info = getDisplayInfo()
  const dotColors = ['#c45b3d', '#d4a44a', '#5b8c6f', '#3d8b7e', '#2d5f8b', '#d4726a']
  const grid = []
  let ci = 0

  const labelMap = {
    district: '所属区县', type: '类型', stars: '星级', grade: '等级',
    stationType: '站点类型', airportType: '机场类型', address: '详细地址',
    longitude: '经度', latitude: '纬度', name: '名称'
  }

  for (const [key, value] of Object.entries(info)) {
    if (value !== undefined && value !== null && value !== '' && key !== 'name') {
      grid.push({
        label: labelMap[key] || key,
        value: String(value),
        dotColor: dotColors[ci % dotColors.length]
      })
      ci++
    }
  }

  // 如果信息太少，补充坐标
  if (grid.length < 2 && props.feature?.clickPoint) {
    grid.push({
      label: '经度', value: props.feature.clickPoint.longitude.toFixed(6),
      dotColor: dotColors[ci++ % dotColors.length]
    })
    grid.push({
      label: '纬度', value: props.feature.clickPoint.latitude.toFixed(6),
      dotColor: dotColors[ci++ % dotColors.length]
    })
  }

  return grid
})

function getDisplayInfo() {
  if (!props.feature?.attributes) return {}
  const attrs = props.feature.attributes
  const info = {}

  if (attrs.name) info.name = attrs.name
  if (attrs['景区名称']) info.name = attrs['景区名称']
  if (attrs['酒店名']) info.name = attrs['酒店名']
  if (attrs['餐厅名']) info.name = attrs['餐厅名']
  if (attrs.Name) info.name = attrs.Name

  if (attrs['所属区']) info.district = attrs['所属区']
  else if (attrs['所属区县']) info.district = attrs['所属区县']
  else if (attrs['区县']) info.district = attrs['区县']
  else if (attrs.district) info.district = attrs.district

  if (attrs['等级']) info.grade = attrs['等级']
  if (attrs.station) info.stationType = attrs.station === 'subway' ? '地铁站' : '火车站/高铁站'
  if (attrs.kind) info.airportType = attrs.kind === '国际' ? '国际机场' : '国内机场'

  if (attrs['酒店名'] && attrs['类型'] !== undefined) info.stars = attrs['类型'] + '星'
  else if (attrs['类型'] !== undefined) info.type = attrs['类型']

  if (attrs['详细地']) info.address = attrs['详细地']
  else if (attrs['详细地址']) info.address = attrs['详细地址']
  else if (attrs['地址']) info.address = attrs['地址']
  else if (attrs.address) info.address = attrs.address

  if (props.feature.clickPoint) {
    info.longitude = props.feature.clickPoint.longitude.toFixed(6) + '°E'
    info.latitude = props.feature.clickPoint.latitude.toFixed(6) + '°N'
  }

  return info
}

// ── 关闭 ──
const closePopup = () => {
  exiting.value = true
  setTimeout(() => {
    emit('close')
    exiting.value = false
    animateIn.value = false
  }, 280)
}

// ── 收藏 / 行程 ──
const buildLocationData = () => {
  if (!props.feature?.attributes) return null
  const attrs = props.feature.attributes
  return {
    name: title.value,
    address: attrs['详细地'] || attrs['详细地址'] || attrs['地址'] || attrs.address || '',
    longitude: parseFloat(attrs['经度'] || attrs['入口lon'] || attrs['lng_WGS84'] || attrs.longitude || props.feature.clickPoint?.longitude) || null,
    latitude: parseFloat(attrs['纬度'] || attrs['入口lat'] || attrs['lat_WGS84'] || attrs.latitude || props.feature.clickPoint?.latitude) || null,
    type: attrs['类型'] || attrs['餐厅类型'] || attrs['酒店类型'] || '',
    district: attrs['所属区'] || attrs['所属区县'] || attrs['区县'] || attrs.district || '',
    originalFeature: props.feature
  }
}

const addToCollection = () => {
  const data = buildLocationData()
  if (!data) return
  emitter.emit('open-modal', 'my-collection')
  setTimeout(() => emitter.emit('add-to-collection', data), 200)
}

const addToItinerary = () => {
  const data = buildLocationData()
  if (!data) return
  emitter.emit('open-modal', 'travel-plan-management')
  setTimeout(() => emitter.emit('add-to-itinerary', data), 200)
}

// ── 动画生命周期 ──
watch(() => props.visible, async (v) => {
  if (v) {
    exiting.value = false
    await nextTick()
    // 延迟一帧触发入场
    requestAnimationFrame(() => {
      animateIn.value = true
      animateNumbers()
    })
  }
})

onBeforeUnmount(() => {
  if (animateTimer) clearTimeout(animateTimer)
})
</script>

<style scoped>
/* ═══════════════════════════════════════════
   BAUSHAUS DATA POPUP v2
   几何 · 数据可视化 · 色彩块
   ═══════════════════════════════════════════ */

.custom-popup {
  position: fixed;
  top: 80px;
  right: 0;
  width: 480px;
  max-width: 100vw;
  height: calc(100vh - 80px);
  z-index: 99999;
  pointer-events: auto;
  animation: popupSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.custom-popup.popup-exit {
  animation: popupSlideOut 0.28s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes popupSlideIn {
  from { opacity: 0; transform: translateX(60px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes popupSlideOut {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(80px); }
}

/* ── 几何装饰元素 ── */
.geo-deco-circle {
  position: absolute;
  top: 120px;
  right: -30px;
  width: 90px;
  height: 90px;
  border: 3px solid var(--border-light);
  border-radius: 50%;
  opacity: 0.35;
  pointer-events: none;
  z-index: 0;
  animation: decoFloat 6s ease-in-out infinite;
}

.geo-deco-square {
  position: absolute;
  bottom: 180px;
  right: 380px;
  width: 22px;
  height: 22px;
  background: #c45b3d;
  opacity: 0.25;
  pointer-events: none;
  z-index: 0;
  transform: rotate(15deg);
  animation: decoFloat 5s ease-in-out 1s infinite;
}

.geo-deco-triangle {
  position: absolute;
  top: 280px;
  right: 420px;
  width: 0;
  height: 0;
  border-left: 12px solid transparent;
  border-right: 12px solid transparent;
  border-bottom: 20px solid #d4a44a;
  opacity: 0.2;
  pointer-events: none;
  z-index: 0;
  animation: decoFloat 7s ease-in-out 2s infinite;
}

@keyframes decoFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-8px) rotate(3deg); }
}

/* ── 容器 ── */
.popup-container {
  position: relative;
  z-index: 1;
  background: var(--surface-solid);
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 48px rgba(0,0,0,0.12);
  scrollbar-width: thin;
  scrollbar-color: rgba(0,0,0,0.1) transparent;
}

.popup-container::-webkit-scrollbar { width: 5px; }
.popup-container::-webkit-scrollbar-track { background: transparent; }
.popup-container::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
}

/* ── 头部 ── */
.popup-header {
  display: flex;
  align-items: stretch;
  padding: 0;
  background: #1a1a1a;
  color: #fff;
  flex-shrink: 0;
  position: relative;
  min-height: 72px;
}

.header-accent {
  width: 6px;
  flex-shrink: 0;
  background: #c45b3d;
}

.header-content {
  flex: 1;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.header-eyebrow {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 3px;
  text-transform: uppercase;
  color: rgba(255,255,255,0.5);
  margin-bottom: 4px;
}

.header-title {
  font-size: 20px;
  font-weight: 900;
  margin: 0;
  letter-spacing: -0.3px;
  line-height: 1.2;
  color: #fff;
  word-break: break-word;
}

.popup-close {
  flex-shrink: 0;
  width: 48px;
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.popup-close:hover { color: #fff; background: rgba(255,255,255,0.08); }

/* ── KPI 色块带 ── */
.kpi-strip {
  display: flex;
  gap: 0;
  flex-shrink: 0;
}

.kpi-block {
  flex: 1;
  padding: 20px 14px 18px;
  position: relative;
  overflow: hidden;
  cursor: default;
  transition: filter 0.3s;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}
.kpi-block:hover { filter: brightness(1.08); }

.kpi-block--terracotta { background: #c45b3d; }
.kpi-block--mustard    { background: #d4a44a; }
.kpi-block--teal       { background: #3d8b7e; }

.kpi-number {
  font-size: 30px;
  font-weight: 900;
  color: #fff;
  font-family: var(--font-mono);
  letter-spacing: -1px;
  line-height: 1;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.kpi-block.kpi-animate .kpi-number {
  opacity: 1;
  transform: translateY(0);
}
.kpi-block--terracotta.kpi-animate .kpi-number { transition-delay: 0.05s; }
.kpi-block--mustard.kpi-animate .kpi-number    { transition-delay: 0.12s; }
.kpi-block--teal.kpi-animate .kpi-number       { transition-delay: 0.19s; }

.kpi-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: 2px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.kpi-block.kpi-animate .kpi-label {
  opacity: 1;
  transform: translateY(0);
}
.kpi-block--terracotta.kpi-animate .kpi-label { transition-delay: 0.1s; }
.kpi-block--mustard.kpi-animate .kpi-label    { transition-delay: 0.17s; }
.kpi-block--teal.kpi-animate .kpi-label       { transition-delay: 0.24s; }

.kpi-icon-ring {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0.25;
  color: #fff;
}

/* ── 可视化区域 ── */
.viz-section {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  flex-shrink: 0;
}

.viz-card {
  background: var(--surface-subtle);
  padding: 18px;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.viz-card.viz-reveal { opacity: 1; transform: translateY(0); }
.sparkline-card.viz-reveal { transition-delay: 0.28s; }
.metrics-card.viz-reveal { transition-delay: 0.36s; }

.viz-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.viz-card-title {
  font-size: 10px;
  font-weight: 800;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.viz-card-badge {
  font-size: 10px;
  font-weight: 700;
  color: #c45b3d;
  font-family: var(--font-mono);
}

/* ── 火花图 ── */
.sparkline-wrap {
  width: 100%;
  height: 56px;
  margin-bottom: 8px;
}

.sparkline-svg {
  width: 100%;
  height: 100%;
}

.spark-labels {
  display: flex;
  justify-content: space-between;
  padding: 0 4px;
}

.spark-day {
  font-size: 9px;
  font-weight: 600;
  color: var(--text-muted);
  width: 20px;
  text-align: center;
}

/* ── 指标进度条 ── */
.metric-row {
  margin-bottom: 14px;
}
.metric-row:last-child { margin-bottom: 0; }

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.metric-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.metric-value {
  font-size: 12px;
  font-weight: 800;
  font-family: var(--font-mono);
}

.metric-track {
  height: 6px;
  background: var(--border-light);
  position: relative;
}

.metric-fill {
  height: 100%;
  transition: width 1.2s cubic-bezier(0.16, 1, 0.3, 1);
}

/* ── 信息网格 ── */
.info-grid-section {
  padding: 0 20px;
  margin-bottom: 12px;
  flex-shrink: 0;
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.info-grid-section.viz-reveal { opacity: 1; transform: translateY(0); transition-delay: 0.44s; }

.info-grid-bauhaus {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
}

.info-cell {
  background: var(--surface-subtle);
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  transition: background 0.2s;
}
.info-cell:hover { background: var(--accent-soft); }

.info-cell-dot {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
  margin-top: 4px;
}

.info-cell-content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.info-cell-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

.info-cell-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  word-break: break-word;
  line-height: 1.4;
}

/* ── 操作按钮 ── */
.popup-actions {
  display: flex;
  gap: 10px;
  padding: 0 20px 24px;
  flex-shrink: 0;
  margin-top: auto;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.popup-actions.viz-reveal { opacity: 1; transform: translateY(0); transition-delay: 0.52s; }

.action-btn {
  flex: 1;
  padding: 14px 16px;
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  letter-spacing: 0.5px;
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.action-btn-primary {
  background: #1a1a1a;
  color: #fff;
}
.action-btn-primary:hover {
  background: #c45b3d;
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(196, 91, 61, 0.3);
}

.action-btn-secondary {
  background: var(--surface-subtle);
  color: var(--text-primary);
  border: 2px solid var(--border-light);
}
.action-btn-secondary:hover {
  border-color: #1a1a1a;
  background: var(--surface-solid);
  transform: translateY(-2px);
}

.action-btn:active { transform: translateY(0) scale(0.97); }

/* ── 响应式 ── */
@media (max-width: 768px) {
  .custom-popup {
    top: auto; bottom: 0; right: 0; left: 0;
    width: 100%; height: 62vh;
    border-radius: 0;
  }
  .popup-container { border-radius: 0; }
  .kpi-block { padding: 14px 10px; }
  .kpi-number { font-size: 24px; }
  .info-grid-bauhaus { grid-template-columns: 1fr; }
}

/* ── 减少动画 ── */
@media (prefers-reduced-motion: reduce) {
  .custom-popup { animation: none !important; }
  .custom-popup.popup-exit { animation: none !important; opacity: 0; }
  .viz-card, .info-grid-section, .popup-actions {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
  .kpi-number, .kpi-label { opacity: 1 !important; transform: none !important; transition: none !important; }
  .geo-deco-circle, .geo-deco-square, .geo-deco-triangle { animation: none !important; }
}

/* ── 深色模式 ── */
body.dark .popup-header { background: #0d0d0d; }
body.dark .header-accent { background: #d4726a; }
body.dark .geo-deco-square { background: #d4726a; opacity: 0.3; }
body.dark .geo-deco-triangle { border-bottom-color: #e8b84b; opacity: 0.3; }
body.dark .geo-deco-circle { border-color: rgba(255,255,255,0.08); }
body.dark .action-btn-primary { background: #2a2a2a; }
body.dark .action-btn-primary:hover { background: #d4726a; }
body.dark .action-btn-secondary { border-color: rgba(255,255,255,0.1); }
body.dark .action-btn-secondary:hover { border-color: rgba(255,255,255,0.3); }
body.dark .viz-card-badge { color: #d4726a; }
</style>
