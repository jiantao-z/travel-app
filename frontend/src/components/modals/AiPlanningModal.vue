<template>
  <div v-if="visible" class="modal" @click.self="close">
    <div class="modal-content">
      <!-- 头部 -->
      <div class="modal-header">
        <h2 class="modal-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          智能旅游规划
        </h2>
        <span class="close" @click="close">&times;</span>
      </div>

      <div class="modal-body">
        <!-- ═══ 表单 ═══ -->
        <form v-if="!showResult" @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>目的地</label>
            <input type="text" class="form-control" v-model="destination" placeholder="输入您想去的城市" required>
          </div>

          <div class="form-row">
            <div class="form-group form-half">
              <label>旅行天数</label>
              <input type="number" class="form-control" v-model.number="days" min="1" max="14" required>
            </div>
            <div class="form-group form-half">
              <label>预算 (元)</label>
              <input type="number" class="form-control" v-model.number="budget" min="500" step="500" required>
            </div>
            <div class="form-group form-half">
              <label>出发日期</label>
              <input type="date" class="form-control" v-model="startDate" required>
            </div>
          </div>

          <div class="form-group">
            <label>兴趣爱好 (多选)</label>
            <div class="interest-tags">
              <label v-for="(name, key) in interests" :key="key" class="interest-tag" :class="{ active: selectedInterests.includes(key) }">
                <input type="checkbox" :value="key" v-model="selectedInterests" class="hidden-checkbox">
                {{ name }}
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>特殊要求 (选填)</label>
            <textarea class="form-control" v-model="additionalRequirements" rows="2" placeholder="例如：素食偏好、避开人群、亲子友好..."></textarea>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn--outline" @click="close">取消</button>
            <button type="submit" class="btn btn--primary" :disabled="isSubmitting || !isFormValid">
              <span v-if="isSubmitting" class="spinner"></span>
              {{ isSubmitting ? 'AI 正在规划...' : '生成路线' }}
            </button>
          </div>
        </form>

        <!-- ═══ 结果面板 ═══ -->
        <div v-if="showResult && parsedPlan" class="result-panel">
          <!-- 攻略内容 -->
          <div class="guide-content" v-html="renderedGuide"></div>

          <!-- 保存成功提示 -->
          <div v-if="tripSaved" class="save-success-msg">
            {{ tripSavedMessage }}
          </div>

          <!-- 底部操作 -->
          <div class="result-actions">
            <button class="btn btn--outline" @click="resetForm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
              重新生成
            </button>
            <button class="btn btn--map" @click="showOnMainMap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
              在主地图查看
            </button>
            <button class="btn btn--primary" @click="addToMyTrips" :disabled="savingTrip || tripSaved">
              <span v-if="savingTrip" class="spinner"></span>
              {{ savingTrip ? '定位并保存中...' : tripSaved ? '✅ 已保存' : '💾 加入我的行程' }}
            </button>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-if="showResult && !parsedPlan" class="error-panel">
          <p>AI 返回数据解析失败，请重试。</p>
          <button class="btn btn--outline" @click="resetForm">重新生成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import emitter from '@/eventBus'
import api from '@/services/api'
import { Marked } from 'marked'
const marked = new Marked()

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

// ═══ sessionStorage 持久化键名 ═══
const STORAGE_KEY = 'ai_planning_data'

function saveToStorage(plan, dest, d, b, sd) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      plan, destination: dest, days: d, budget: b, startDate: sd
    }))
  } catch (e) { /* ignore */ }
}

function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch (e) { return null }
}

function clearStorage() {
  try { sessionStorage.removeItem(STORAGE_KEY) } catch (e) { /* ignore */ }
}

// ── 表单 ──
const destination = ref('')
const days = ref(3)
const budget = ref(3000)
const startDate = ref(new Date().toISOString().slice(0, 10))
const selectedInterests = ref([])
const additionalRequirements = ref('')
const isSubmitting = ref(false)

const interests = {
  food: '美食', culture: '文化', nature: '自然风光',
  shopping: '购物', adventure: '探险', relaxation: '休闲度假'
}

const isFormValid = computed(() =>
  destination.value && days.value >= 1 && selectedInterests.value.length > 0 && startDate.value
)

// ── 结果 ──
const showResult = ref(false)
const parsedPlan = ref(null)
const renderedGuide = ref('')
const savingTrip = ref(false)
const tripSaved = ref(false)
const tripSavedMessage = ref('')
const geocoding = ref(false)
const geocodeProgress = ref('')

// 交通方式映射
const transportMap = { walking: '步行', driving: '自驾', transit: '公交', riding: '骑行', subway: '地铁', bus: '公交', taxi: '打车' }

// ═══ 高德 Web 服务 REST API 地理编码 ═══
// 请在前端 .env 文件中配置 VITE_AMAP_WEB_KEY
const AMAP_WEB_KEY = import.meta.env.VITE_AMAP_WEB_KEY || ''

async function geocodePlaceName(name, city) {
  try {
    const url = `https://restapi.amap.com/v3/place/text?key=${AMAP_WEB_KEY}&keywords=${encodeURIComponent(name)}&city=${encodeURIComponent(city || '全国')}&offset=1`
    const resp = await fetch(url)
    const data = await resp.json()
    if (data.status === '1' && data.pois && data.pois.length > 0) {
      const poi = data.pois[0]
      const loc = poi.location.split(',')
      return { lng: parseFloat(loc[0]), lat: parseFloat(loc[1]) }
    }
    return null
  } catch (e) {
    console.warn(`地理编码失败: ${name}`, e.message)
    return null
  }
}

async function batchGeocode(spots, city, onProgress) {
  const queue = spots.filter(s => !s._lng || !s._lat)
  if (queue.length === 0) return
  let idx = 0
  for (const spot of queue) {
    idx++
    if (onProgress) onProgress(idx, queue.length)
    const result = await geocodePlaceName(spot.name, city)
    if (result) {
      spot._lng = result.lng
      spot._lat = result.lat
    }
    if (idx < queue.length) {
      await new Promise(r => setTimeout(r, 150))
    }
  }
}

// ── 监听 visible → 恢复/重置数据 ──
watch(() => props.visible, (val) => {
  if (val) {
    const stored = loadFromStorage()
    if (stored && stored.plan) {
      // 恢复持久化的 AI 结果
      parsedPlan.value = stored.plan
      renderedGuide.value = marked.parse(stored.plan.guide)
      destination.value = stored.destination
      days.value = stored.days
      budget.value = stored.budget
      startDate.value = stored.startDate
      showResult.value = true
      tripSaved.value = false
      tripSavedMessage.value = ''
      geocoding.value = false
      geocodeProgress.value = ''
    } else {
      // 无持久化数据 → 空白表单
      destination.value = ''
      days.value = 3
      budget.value = 3000
      startDate.value = new Date().toISOString().slice(0, 10)
      selectedInterests.value = []
      additionalRequirements.value = ''
      showResult.value = false
      parsedPlan.value = null
      renderedGuide.value = ''
      geocodeProgress.value = ''
      isSubmitting.value = false
      tripSaved.value = false
      tripSavedMessage.value = ''
    }
  }
  // 关闭时不清理数据，sessionStorage 会保留
})

// ── 提交 ──
const handleSubmit = async () => {
  if (!isFormValid.value) return
  isSubmitting.value = true
  showResult.value = false

  try {
    const interestNames = selectedInterests.value.map(k => interests[k]).join('、')
    let req = `我想去${destination.value}旅游${days.value}天，预算${budget.value}元。兴趣：${interestNames}。`
    if (additionalRequirements.value.trim()) req += `特殊要求：${additionalRequirements.value.trim()}`

    const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/ai/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'system',
          content: `你是专业旅游规划AI。必须严格返回以下JSON格式（不要markdown代码块，不要任何额外文字）：
{
  "guide": "攻略Markdown文本（支持标题##、列表-、加粗**、换行）",
  "route": {
    "days": [{
      "day": 1,
      "title": "第一天标题",
      "spots": [{
        "name": "精确景点名",
        "time": "08:30-12:00",
        "duration": 180,
        "transport": "walking",
        "tips": "实用贴士"
      }]
    }]
  }
}
规则：
1. guide用Markdown写完整攻略，包含每天行程、美食推荐、预算分配、注意事项
2. route.days按天排列，每天2-5个景点
3. spots中name必须是真实地名，transport为walking/driving/transit/riding之一
4. JSON必须合法完整，可直接JSON.parse解析`
        }, {
          role: 'user', content: req
        }],
        stream: false,
        temperature: 0.3
      })
    })

    if (!resp.ok) throw new Error('API请求失败')
    const data = await resp.json()
    const raw = data.choices[0].message.content

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('未找到JSON')
    const plan = JSON.parse(jsonMatch[0])

    if (!plan.guide || !plan.route?.days) throw new Error('JSON结构不完整')
    parsedPlan.value = plan
    renderedGuide.value = marked.parse(plan.guide)
    showResult.value = true

    // 持久化到 sessionStorage（组件卸载/页面刷新后仍可恢复）
    saveToStorage(plan, destination.value, days.value, budget.value, startDate.value)
  } catch (e) {
    console.error('AI规划失败:', e)
    alert('生成失败: ' + e.message + '\n请重试。')
    showResult.value = false
  } finally {
    isSubmitting.value = false
  }
}

// ── 加入行程 ──
const addToMyTrips = async () => {
  if (!parsedPlan.value) return
  savingTrip.value = true
  tripSaved.value = false

  try {
    const plan = parsedPlan.value
    const start = new Date(startDate.value)

    // 地理编码：为所有缺少坐标的景点获取经纬度
    const flatSpots = []
    for (const day of plan.route.days) {
      for (const spot of day.spots) {
        flatSpots.push(spot)
      }
    }

    const needGeocode = flatSpots.filter(s => !s._lng || !s._lat)
    if (needGeocode.length > 0) {
      geocoding.value = true
      await batchGeocode(needGeocode, destination.value, (idx, total) => {
        geocodeProgress.value = `定位景点 ${idx}/${total}...`
      })
      geocoding.value = false
    }

    // 创建行程组
    const planResp = await api.createPlan({
      title: `${destination.value}${days.value}日游`,
      start_time: start.toISOString().slice(0, 10),
      end_time: new Date(start.getTime() + (days.value - 1) * 86400000).toISOString().slice(0, 10),
      notes: `AI生成 · 预算${budget.value}元`
    })

    const created = planResp.data?.plan || planResp.data?.data || planResp.data
    const routeId = created?.route_id || created?.id
    if (!routeId) {
      console.error('创建行程响应:', planResp.data)
      throw new Error('创建行程失败：未获取到行程ID')
    }

    // 批量创建行程项（带真实坐标）
    let sortOrder = 1
    for (const day of plan.route.days) {
      const dayDate = new Date(start.getTime() + (day.day - 1) * 86400000)
      for (const spot of day.spots) {
        const timePart = spot.time?.split('-')?.[0] || '09:00'
        const rawTransport = (spot.transport || 'walking').toLowerCase()
        const transportCN = transportMap[rawTransport] || rawTransport
        await api.createRoutePlan(routeId, {
          name: spot.name,
          longitude: spot._lng || null,
          latitude: spot._lat || null,
          sort_order: sortOrder++,
          estimated_arrival: `${dayDate.toISOString().slice(0, 10)}T${timePart}:00`,
          duration_minutes: spot.duration || 120,
          transportation_mode: transportCN
        })
      }
    }

    tripSaved.value = true
    tripSavedMessage.value = `✅ "${destination.value}${days.value}日游" 已加入你的行程！坐标已保存，可在行程管理中查看地图。`
  } catch (e) {
    console.error('保存行程失败:', e)
    alert('保存失败: ' + (e.response?.data?.error || e.message))
  } finally {
    savingTrip.value = false
    geocoding.value = false
  }
}

// ── 在主地图查看 ──
const showOnMainMap = () => {
  if (!parsedPlan.value) return

  const route = JSON.parse(JSON.stringify(parsedPlan.value.route))
  for (const day of route.days) {
    for (let i = 0; i < day.spots.length; i++) {
      const orig = parsedPlan.value.route.days[day.day - 1]?.spots?.[i]
      if (orig?._lng) day.spots[i]._lng = orig._lng
      if (orig?._lat) day.spots[i]._lat = orig._lat
    }
  }
  emitter.emit('show-ai-route', {
    destination: destination.value,
    route: route
  })

  // 关闭模态框让用户看到主地图（sessionStorage 已保存，重新打开可恢复）
  close()
}

const resetForm = () => {
  showResult.value = false
  parsedPlan.value = null
  renderedGuide.value = ''
  geocodeProgress.value = ''
  tripSaved.value = false
  tripSavedMessage.value = ''
  clearStorage()
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.modal {
  display: flex; align-items: flex-start; justify-content: center;
  position: fixed; z-index: 9999; left: 0; top: 0;
  width: 100%; height: 100%; overflow: auto;
  background: rgba(0,0,0,0.5); padding-top: 3vh;
}
.modal-content {
  background: #fff; border: 3px solid #1a1a1a;
  box-shadow: 6px 6px 0 rgba(0,0,0,0.08);
  width: 90%; max-width: 720px; max-height: 94vh;
  overflow-y: auto; display: flex; flex-direction: column;
}
.modal-header {
  padding: 16px 24px; background: #1a1a1a;
  display: flex; justify-content: space-between; align-items: center;
  flex-shrink: 0;
}
.modal-title {
  font-size: 1.1rem; font-weight: 900; color: #fff; margin: 0;
  display: flex; align-items: center; gap: 10px;
}
.close { color: rgba(255,255,255,0.5); font-size: 1.5rem; cursor: pointer; transition: color 0.15s; }
.close:hover { color: #fff; }

.modal-body { padding: 24px; flex: 1; overflow-y: auto; }

/* ── 表单 ── */
.form-group { margin-bottom: 18px; }
.form-group label { display: block; margin-bottom: 6px; color: #1a1a1a; font-weight: 800; font-size: 0.8rem; letter-spacing: 1.5px; text-transform: uppercase; }
.form-control { width: 100%; padding: 10px 14px; border: 2px solid #1a1a1a; font-size: 0.95rem; outline: none; background: #fff; color: #1a1a1a; font-family: inherit; box-sizing: border-box; transition: border-color 0.15s; }
.form-control:focus { border-color: #c45b3d; }
textarea.form-control { resize: vertical; min-height: 60px; }

.form-row { display: flex; gap: 14px; }
.form-half { flex: 1; }

.interest-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.interest-tag {
  padding: 7px 16px; border: 2px solid #ccc; font-size: 0.85rem; font-weight: 700;
  cursor: pointer; transition: all 0.15s; color: #5c5c5c; user-select: none;
}
.interest-tag:hover { border-color: #1a1a1a; color: #1a1a1a; }
.interest-tag.active { border-color: #c45b3d; background: #fdf3f0; color: #c45b3d; }
.hidden-checkbox { display: none; }

.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; padding-top: 16px; border-top: 2px solid #eee; }

/* ── 按钮 ── */
.btn { padding: 10px 22px; font-weight: 700; font-size: 0.9rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; border: 2px solid transparent; font-family: inherit; letter-spacing: 0.5px; transition: all 0.15s; }
.btn--primary { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
.btn--primary:hover:not(:disabled) { background: #c45b3d; border-color: #c45b3d; }
.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--outline { background: #fff; color: #1a1a1a; border-color: #1a1a1a; }
.btn--outline:hover { background: #f8f6f3; }
.btn--map { background: #2d5f8b; color: #fff; border-color: #2d5f8b; }
.btn--map:hover { background: #1e4a6e; border-color: #1e4a6e; }

/* ── 旋转器 ── */
.spinner { width: 16px; height: 16px; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── 攻略 ── */
.guide-content { max-height: 400px; overflow-y: auto; line-height: 1.8; padding: 4px 0; margin-bottom: 16px; }
.guide-content :deep(h2) { font-size: 1.2rem; font-weight: 900; margin: 16px 0 8px; color: #1a1a1a; }
.guide-content :deep(h3) { font-size: 1rem; font-weight: 800; margin: 12px 0 6px; color: #333; }
.guide-content :deep(ul), .guide-content :deep(ol) { padding-left: 20px; margin: 6px 0; }
.guide-content :deep(li) { margin: 3px 0; }
.guide-content :deep(strong) { color: #c45b3d; }

/* ── 保存成功 ── */
.save-success-msg { padding: 12px 16px; background: #e8f5e9; border: 2px solid #56ab7a; margin-bottom: 12px; font-size: 0.85rem; font-weight: 700; color: #2e7d32; line-height: 1.5; }

/* ── 结果操作 ── */
.result-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 2px solid #eee; }

/* ── 错误 ── */
.error-panel { text-align: center; padding: 40px; }
.error-panel p { margin-bottom: 16px; color: #c45b3d; font-weight: 700; }
</style>
