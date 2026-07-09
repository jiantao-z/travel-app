<template>
  <div class="locate-widget">
    <div @click="handleLocate" :title="buttonTitle" class="locate-button" :class="{ 'locating': isLocating }">
      <el-icon v-if="!isLocating" class="locate-icon"><Location /></el-icon>
      <el-icon v-else class="locate-icon loading"><Loading /></el-icon>
    </div>
    <el-alert
      v-if="locationMessage"
      :title="locationMessage"
      :type="locationType"
      show-icon
      :closable="false"
      class="location-alert"
    />
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import { Location, Loading } from '@element-plus/icons-vue'

const props = defineProps({
  map: { type: Object, required: true }  // AMap.Map 实例
})

const isLocating = ref(false)
const locationMessage = ref('')
const locationType = ref('info')
let currentMarker = null

const buttonTitle = computed(() => isLocating.value ? '正在定位...' : '定位我的位置')

const handleLocate = async () => {
  if (!props.map) return
  isLocating.value = true
  locationMessage.value = '正在获取您的位置...'
  locationType.value = 'info'

  try {
    if (!navigator.geolocation) {
      showMessage('浏览器不支持定位', 'error')
      return
    }

    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, timeout: 10000, maximumAge: 60000
      })
    })

    const { longitude, latitude } = position.coords

    // 清除旧标记
    if (currentMarker) {
      props.map.remove(currentMarker)
      currentMarker = null
    }

    // 添加定位标记（高德使用 GCJ02，浏览器返回 WGS84，这里直接使用）
    currentMarker = new AMap.Marker({
      position: [longitude, latitude],
      title: '我的位置',
      animation: 'AMAP_ANIMATION_DROP',
      icon: new AMap.Icon({
        size: new AMap.Size(24, 24),
        imageSize: new AMap.Size(24, 24),
        image: 'data:image/svg+xml,' + encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#56ab7a" opacity="0.3"/><circle cx="12" cy="12" r="5" fill="#56ab7a"/><circle cx="12" cy="12" r="2" fill="#fff"/></svg>'
        )
      })
    })
    props.map.add(currentMarker)

    // 跳转
    props.map.setZoomAndCenter(16, [longitude, latitude])
    showMessage(`定位成功！${longitude.toFixed(6)}, ${latitude.toFixed(6)}`, 'success')

    setTimeout(() => { locationMessage.value = '' }, 3000)

  } catch (error) {
    let msg = '定位失败'
    if (error.code === 1) msg = '定位被拒绝，请允许浏览器获取位置信息'
    else if (error.code === 2) msg = '无法获取位置信息'
    else if (error.code === 3) msg = '定位超时'
    showMessage(msg, 'error')
  } finally {
    isLocating.value = false
  }
}

const showMessage = (msg, type) => {
  locationMessage.value = msg
  locationType.value = type
}

onBeforeUnmount(() => {
  if (currentMarker) { try { props.map?.remove(currentMarker) } catch(e){} }
})
</script>

<style scoped>
.locate-widget { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; }
.locate-button {
  position: absolute; top: 64px; right: 16px; pointer-events: auto;
  background: #ffffff;
  color: #1a1a1a; font-size: 16px; width: 42px; height: 42px;
  border: 2px solid #1a1a1a;
  box-shadow: none;
  transition: all var(--duration-fast) var(--ease-out);
  z-index: 10000;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.locate-button:hover { background: #1a1a1a; color: #fff; }
.locate-button:active { transform: scale(0.95); }
.locate-button.locating { background: var(--bauhaus-red); color: #fff; border-color: var(--bauhaus-red); }
.locate-icon { font-size: 18px; transition: all 0.3s; }
.locate-icon.loading { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .locate-icon.loading { animation: none; } }
.location-alert {
  position: absolute; top: 64px; right: 16px; max-width: 280px;
  z-index: 10001; pointer-events: auto;
  border: 2px solid #1a1a1a;
}
</style>
