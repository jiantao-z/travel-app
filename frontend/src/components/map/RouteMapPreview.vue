<template>
  <div v-if="visible" class="modal" @click.self="close">
    <div class="modal-content" style="width:1280px;height:700px;overflow:hidden;">
      <div class="modal-header">
        <h2 class="modal-title">
          <el-icon :size="20" color="#56ab7a"><MapLocation /></el-icon>
          行程路线地图预览
        </h2>
        <span class="close" @click="close">&times;</span>
      </div>
      <div class="modal-body">
        <div v-if="loading" class="loading-overlay">
          <el-icon class="is-loading" :size="32"><Loading /></el-icon>
          <span>{{ loadingText }}</span>
        </div>
        <div id="routeMapContainer" style="width:100%;height:100%;min-height:550px;"></div>
        <!-- 状态提示栏：成功/部分成功/失败 -->
        <div v-if="mapStatus" class="status-bar" :class="statusClass">{{ mapStatus }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { MapLocation, Loading } from '@element-plus/icons-vue'
import api from '../../services/api'
import { loadAmap } from '../../services/amap'

const props = defineProps({
  visible: Boolean,
  planId: Number
})
const emit = defineEmits(['close'])

let mapInstance = null
const mapStatus = ref('')           // 渲染完成后显示的状态文字
const statusClass = ref('')         // 'success' | 'warning' | 'error'
const loading = ref(false)
const loadingText = ref('正在通过高德地图规划真实路线...')

let statusTimer = null   // 自动清除状态文字的定时器
let initLock = false     // 防止重复初始化

// 交通方式 → 后端 API 类型
const TRANSPORT_TO_API = {
  '步行': 'walking',
  '骑行': 'riding',
  '公交': 'transit',
  '地铁': 'transit',
  '打车': 'driving',
  '自驾': 'driving'
}

const close = () => emit('close')

// ── 格式化距离/时间 ──
function formatDistance(meters) {
  if (!meters || meters <= 0) return ''
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`
}
function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return ''
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m}min`
  return `${m}min`
}

// 设置状态文字（自动清除）
function setStatus(text, cls) {
  if (statusTimer) clearTimeout(statusTimer)
  mapStatus.value = text
  statusClass.value = cls || ''
  // error 级别不自动清除，warning/success 8 秒后消失
  if (cls !== 'error') {
    statusTimer = setTimeout(() => {
      mapStatus.value = ''
      statusClass.value = ''
    }, 8000)
  }
}

// ── 单段路线查询（调用后端 → 高德 Web 服务 API） ──
async function fetchRoute(originLng, originLat, destLng, destLat, transportMode) {
  const apiType = TRANSPORT_TO_API[transportMode] || 'driving'
  const origin = `${originLng},${originLat}`
  const destination = `${destLng},${destLat}`

  try {
    // city 参数由后端自动通过逆地理编码获取，前端无需传递
    const res = await api.getDirections(apiType, { origin, destination })
    if (res.data?.isReal && res.data.path?.length > 0) {
      return res.data
    }
    // API 返回了错误详情（高德侧失败）→ 把错误信息带回给调用方
    const errInfo = res.data?._error
    return {
      path: [[originLng, originLat], [destLng, destLat]],
      distance: 0,
      duration: 0,
      isReal: false,
      _amapError: errInfo || null
    }
  } catch (e) {
    // 单个段失败是正常降级，用 warn 而非 error（用户看到 error 会以为崩了）
    console.warn(`路径规划: ${transportMode} 段未获取到导航路线，使用直线估算 (${e.message})`)
    return {
      path: [[originLng, originLat], [destLng, destLat]],
      distance: 0,
      duration: 0,
      isReal: false
    }
  }
}

// ── 渲染路线 ──
async function renderRoute(routeData) {
  if (!mapInstance) return

  mapInstance.clearMap()

  const nodes = (routeData.nodes || []).filter(n => n.lng != null && n.lat != null)
  if (nodes.length === 0) {
    setStatus('该行程暂无有效地点数据', 'error')
    return
  }

  loading.value = true
  mapStatus.value = ''

  try {
    const AMap = await loadAmap()

    // ── 1. 并行查询所有段的真实路线（city 由后端自动识别） ──
    const routePromises = []
    const segmentLabels = []   // 记录每段描述用于后续提示

    for (let i = 0; i < nodes.length - 1; i++) {
      const from = nodes[i]
      const to = nodes[i + 1]
      const transport = to.transportation_mode || '步行'
      segmentLabels.push(`${from.name || '起点'} → ${to.name || '终点'} (${transport})`)
      routePromises.push(
        fetchRoute(from.lng, from.lat, to.lng, to.lat, transport)
      )
    }

    loadingText.value = `正在规划路线 (0/${routePromises.length})...`

    let completed = 0
    const trackedPromises = routePromises.map(p =>
      p.then(result => {
        completed++
        loadingText.value = `正在规划路线 (${completed}/${routePromises.length})...`
        return result
      })
    )

    const routeResults = await Promise.all(trackedPromises)

    // ── 2. 绘制地点标记 ──
    const allCoords = []

    nodes.forEach((node, idx) => {
      const pos = [node.lng, node.lat]
      allCoords.push(pos)

      let bgColor = '#3b82f6', borderColor = '#2563eb'
      if (idx === 0) {
        bgColor = '#10b981'; borderColor = '#059669'
      } else if (idx === nodes.length - 1) {
        bgColor = '#ef4444'; borderColor = '#dc2626'
      }

      const numDiv = document.createElement('div')
      numDiv.style.cssText =
        'width:28px;height:28px;border-radius:50%;color:#fff;' +
        'display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;' +
        `background:${bgColor};border:2px solid ${borderColor};box-shadow:0 2px 8px rgba(0,0,0,0.2);`
      numDiv.textContent = node.index || (idx + 1)
      mapInstance.add(new AMap.Marker({
        position: pos, content: numDiv, offset: new AMap.Pixel(-14, -14), zIndex: 110
      }))

      if (node.name) {
        const labelDiv = document.createElement('div')
        labelDiv.style.cssText =
          'background:rgba(255,255,255,0.94);color:#1e2a3a;padding:3px 10px;border-radius:4px;' +
          'font-size:12px;font-weight:500;white-space:nowrap;border:1px solid rgba(0,0,0,0.1);'
        let label = node.name
        if (idx === 0) label = '🏁 ' + label
        else if (idx === nodes.length - 1) label = '📍 ' + label
        labelDiv.textContent = label
        mapInstance.add(new AMap.Marker({
          position: pos, content: labelDiv,
          offset: new AMap.Pixel(-40, idx % 2 === 0 ? -38 : 8), zIndex: 105
        }))
      }
    })

    // ── 3. 绘制路线 ──
    const colors = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

    for (let i = 0; i < routeResults.length; i++) {
      const result = routeResults[i]
      const transport = (nodes[i + 1]?.transportation_mode) || '步行'
      const isReal = result.isReal
      const color = colors[i % colors.length]
      const linePath = result.path

      if (!linePath || linePath.length < 2) continue

      const polylineOpts = {
        path: linePath,
        strokeColor: color,
        strokeWeight: isReal ? 5 : 3,
        strokeOpacity: isReal ? 0.85 : 0.4,
        lineJoin: 'round',
        lineCap: 'round',
        showDir: isReal,
        dirColor: '#ffffff',
        strokeStyle: isReal ? 'solid' : 'dashed'
      }
      if (!isReal) {
        polylineOpts.dashArray = [10, 8]
      }

      mapInstance.add(new AMap.Polyline(polylineOpts))

      // 交通方式标签
      const midIdx = Math.floor(linePath.length / 2)
      const mid = linePath[midIdx]
      if (mid) {
        const tpDiv = document.createElement('div')
        let labelText = transport
        if (isReal) {
          // transit 兜底为 driving 时标注
          if (result._fallback === 'driving') labelText += '→驾车'
          if (result.distance) labelText += ` ${formatDistance(result.distance)}`
          if (result.duration) labelText += ` ${formatDuration(result.duration)}`
        } else {
          labelText += ' (直线)'
        }

        const bgStyle = isReal
          ? 'background:rgba(34,197,94,0.9);'
          : 'background:rgba(148,163,184,0.85);'
        tpDiv.style.cssText =
          `${bgStyle}color:#fff;padding:2px 10px;border-radius:12px;` +
          'font-size:11px;font-weight:bold;white-space:nowrap;'
        tpDiv.textContent = labelText
        mapInstance.add(new AMap.Marker({
          position: mid, content: tpDiv, offset: new AMap.Pixel(-25, -12), zIndex: 108
        }))
      }
    }

    // ── 4. 自适应视野 ──
    if (allCoords.length > 0) {
      mapInstance.setFitView(null, false, [80, 80, 80, 80])
    }

    // ── 5. 状态提示 ──
    const realCount = routeResults.filter(r => r.isReal).length
    const totalCount = routeResults.length
    const failedSegments = routeResults
      .map((r, i) => r.isReal ? null : segmentLabels[i])
      .filter(Boolean)

    if (realCount === totalCount) {
      setStatus(`✅ 全部 ${totalCount} 段路线规划成功`, 'success')
    } else if (realCount === 0) {
      // 收集所有高德返回的错误码，帮助诊断
      const amapErrors = routeResults
        .filter(r => r._amapError)
        .map(r => r._amapError)
      const uniqueErrors = [...new Map(amapErrors.map(e => [e.code, e])).values()]
      const errorDetail = uniqueErrors.length > 0
        ? uniqueErrors.map(e => `[${e.code}] ${e.info} (${e.hint})`).join('; ')
        : ''

      setStatus(
        '❌ 未能获取导航路线，已显示直线估算。' +
        (errorDetail ? ` 原因：${errorDetail}` : ' 请确认：1) 后端已重启 2) .env 中 AMAP_KEY 已开通路径规划权限'),
        'error'
      )
      console.warn('路线规划全部失败:', { failedSegments, amapErrors: uniqueErrors })
    } else {
      setStatus(
        `⚠️ ${realCount}/${totalCount} 段获取到真实导航路线，${totalCount - realCount} 段使用直线估算`,
        'warning'
      )
      console.warn('部分路线规划失败，受影响段：', failedSegments)
    }

  } catch (e) {
    console.error('路线渲染异常:', e)
    setStatus(e.message || '地图渲染失败，请重试', 'error')
  } finally {
    loading.value = false
  }
}

async function initMap() {
  // 防止重复初始化
  if (initLock) return
  initLock = true

  mapStatus.value = ''
  const container = document.getElementById('routeMapContainer')
  if (!container || !props.planId) {
    initLock = false
    return
  }

  try {
    if (mapInstance) {
      mapInstance.destroy()
      mapInstance = null
    }
    const AMap = await loadAmap()
    mapInstance = new AMap.Map(container, {
      zoom: 12,
      center: [108.94, 34.26],
      resizeEnable: true
    })

    const res = await api.getRouteGeometries(props.planId)
    if (res.data?.nodes?.length) {
      await renderRoute(res.data)
    } else {
      setStatus('该行程暂无地点数据', 'error')
    }
  } catch (e) {
    console.error('地图初始化失败:', e)
    setStatus(e.message || '地图加载失败', 'error')
  } finally {
    initLock = false
  }
}

// 只在 visible 从 false→true 时初始化
watch(() => props.visible, (v) => {
  if (v && props.planId) {
    setTimeout(() => initMap(), 300)
  }
})

// planId 变化且 modal 已打开 → 重新加载
watch(() => props.planId, (newId, oldId) => {
  if (props.visible && newId && newId !== oldId) {
    setTimeout(() => initMap(), 200)
  }
})

onUnmounted(() => {
  if (statusTimer) clearTimeout(statusTimer)
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
})
</script>

<style scoped>
.modal {
  position: fixed; top:0;left:0;right:0;bottom:0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
  animation: fadeIn 0.25s ease-out;
}
@keyframes fadeIn { from{opacity:0} to{opacity:1} }
.modal-content {
  background: var(--surface-solid); border-radius: var(--radius-lg); max-height: 90vh; overflow: hidden;
  padding: 24px; box-shadow: var(--shadow-lg);
}
.modal-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--border-light);
}
.modal-title {
  font-size: 1.25rem; font-weight: 600; color: var(--text-primary);
  display: flex; align-items: center; gap: 8px;
}
.close { font-size:1.5rem; cursor:pointer; color:var(--text-muted); }
.close:hover { color:var(--text-primary); }
.modal-body { flex:1; min-height:0; position:relative; }
.loading-overlay {
  position:absolute; inset:0; z-index:10;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  background: rgba(255,255,255,0.7); gap:12px; font-size:14px; color:var(--text-secondary);
}

/* 状态提示栏 */
.status-bar {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  z-index: 20;
  pointer-events: none;
  animation: fadeIn 0.3s ease-out;
}
.status-bar.success {
  background: rgba(16,185,129,0.9);
  color: #fff;
}
.status-bar.warning {
  background: rgba(245,158,11,0.9);
  color: #fff;
}
.status-bar.error {
  background: rgba(239,68,68,0.9);
  color: #fff;
}
@media (prefers-reduced-motion: reduce) { .modal, .status-bar { animation: none; } }
</style>
