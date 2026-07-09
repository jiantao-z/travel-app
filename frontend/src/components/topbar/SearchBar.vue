<template>
  <div class="search-wrapper" ref="wrapperRef">
    <div class="search-input-group">
      <div class="search-geo-left"></div>
      <input
        type="text"
        v-model="searchTerm"
        @input="onInput"
        @focus="onFocus"
        @keyup.enter="onSelectFirst"
        @keydown.down.prevent="moveSelection(1)"
        @keydown.up.prevent="moveSelection(-1)"
        :placeholder="t('searchPlaceholder')"
        class="search-box"
      />
      <button @click="onSelectFirst" class="search-btn" aria-label="搜索">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </div>

    <div v-if="showSuggestions && suggestions.length > 0" class="search-suggestions">
      <div
        v-for="(item, index) in suggestions"
        :key="item.id || item.name + index"
        :class="['suggest-item', { 'suggest-item--active': index === selectedIndex }]"
        @click="onSelect(item)"
        @mouseenter="selectedIndex = index"
      >
        <div class="suggest-dot"></div>
        <div class="suggest-item-main">
          <span class="suggest-item-name">{{ item.name }}</span>
          <span v-if="item.address" class="suggest-item-desc">{{ item.address }}</span>
        </div>
      </div>
    </div>

    <div v-if="showSuggestions && searchTerm.trim() && !searching && suggestions.length === 0" class="search-suggestions">
      <div class="suggest-item suggest-item-empty">未找到相关地点，按回车搜索</div>
    </div>

    <div v-if="searching" class="search-suggestions">
      <div class="suggest-item suggest-item-empty">
        搜索中...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { currentLanguage } from '@/eventBus'
import { getAmap } from '@/services/amap'
import api from '@/services/api'

const props = defineProps({ view: Object })

const searchTerm = ref('')
const suggestions = ref([])
const showSuggestions = ref(false)
const selectedIndex = ref(-1)
const searching = ref(false)
const wrapperRef = ref(null)

let debounceTimer = null
let abortController = null
let lastMarker = null

const translations = {
  zh: { searchPlaceholder: '搜索目的地、景点或地址' },
  en: { searchPlaceholder: 'Search destinations...' }
}
const t = (key) => translations[currentLanguage.value]?.[key] || translations.zh[key] || key

const onInput = () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  selectedIndex.value = -1
  const term = searchTerm.value.trim()
  if (!term) { suggestions.value = []; showSuggestions.value = false; return }
  debounceTimer = setTimeout(() => fetchSuggestions(term), 300)
}

const fetchSuggestions = async (term) => {
  if (abortController) abortController.abort()
  abortController = new AbortController()
  searching.value = true
  showSuggestions.value = true
  try {
    const res = await api.searchAmapLocations(term, { signal: abortController.signal })
    const data = Array.isArray(res?.data) ? res.data : []
    suggestions.value = data.filter(item => item.name).slice(0, 8)
  } catch (e) {
    if (e.name !== 'AbortError') console.warn('搜索建议失败:', e.message)
    suggestions.value = []
  }
  searching.value = false
}

const onFocus = () => {
  if (searchTerm.value.trim() && suggestions.value.length > 0) showSuggestions.value = true
}

const moveSelection = (delta) => {
  if (!showSuggestions.value || suggestions.value.length === 0) return
  selectedIndex.value = Math.min(Math.max(selectedIndex.value + delta, 0), suggestions.value.length - 1)
}

const onSelectFirst = async () => {
  if (selectedIndex.value >= 0 && suggestions.value[selectedIndex.value]) {
    await onSelect(suggestions.value[selectedIndex.value]); return
  }
  if (suggestions.value.length > 0) {
    await onSelect(suggestions.value[0]); return
  }
  if (searchTerm.value.trim()) {
    await navigateToLocation(searchTerm.value.trim())
  }
}

const onSelect = async (item) => {
  showSuggestions.value = false
  searchTerm.value = item.name
  await navigateToLocation(item)
}

const navigateToLocation = async (location) => {
  const map = props.view
  const AMap = getAmap()
  if (!map) return

  if (lastMarker) { map.remove(lastMarker); lastMarker = null }

  let lon, lat, name

  if (typeof location === 'object') {
    lon = parseFloat(location.longitude)
    lat = parseFloat(location.latitude)
    name = location.name
  } else {
    name = location
  }

  if (lon && lat && !isNaN(lon) && !isNaN(lat)) {

    const marker = new AMap.Marker({
      position: [lon, lat],
      title: name,
      animation: 'AMAP_ANIMATION_DROP'
    })
    map.add(marker)
    lastMarker = marker
    map.setZoomAndCenter(14, [lon, lat])
    return
  }

  try {

    AMap.plugin('AMap.PlaceSearch', () => {
      const placeSearch = new AMap.PlaceSearch({ city: '全国' })
      placeSearch.search(name, (status, result) => {
        if (status === 'complete' && result.poiList?.pois?.length > 0) {
          const poi = result.poiList.pois[0]
          map.setZoomAndCenter(16, [poi.location.lng, poi.location.lat])
          const marker = new AMap.Marker({
            position: [poi.location.lng, poi.location.lat],
            title: poi.name,
            animation: 'AMAP_ANIMATION_DROP'
          })
          map.add(marker)
          if (lastMarker) map.remove(lastMarker)
          lastMarker = marker
        }
      })
    })
  } catch (err) {
    console.error('地点搜索失败:', err)
  }
}

const handleClickOutside = (e) => {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) showSuggestions.value = false
}

onMounted(() => { document.addEventListener('click', handleClickOutside) })
onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (abortController) abortController.abort()
  if (lastMarker) { try { props.view?.remove(lastMarker) } catch(e){} }
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.search-wrapper { position: relative; width: 400px; }
.search-input-group { position: relative; display: flex; align-items: center; }

.search-geo-left {
  width: 4px; height: 28px;
  background: var(--bauhaus-red);
  flex-shrink: 0;
  margin-right: 12px;
}

.search-box {
  background: #f8f6f3;
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 44px 10px 14px;
  outline: none; width: 100%;
  border: 2px solid transparent;
  font-family: var(--font-sans);
  transition: border-color var(--duration-fast);
}
.search-box::placeholder { color: var(--text-muted); font-size: 13px; }
.search-box:focus {
  background: #fff;
  border-color: #1a1a1a;
}

.search-btn {
  position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
  background: transparent; border: none; cursor: pointer; padding: 8px;
  color: #1a1a1a; transition: color 0.15s;
}
.search-btn:hover { color: var(--bauhaus-red); }

.search-suggestions {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0;
  background: #ffffff;
  border: 2px solid #1a1a1a;
  box-shadow: 4px 4px 0 rgba(0,0,0,0.06);
  max-height: 280px; overflow-y: auto;
  z-index: 10002; padding: 0;
}

.suggest-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--border-subtle);
}
.suggest-item:last-child { border-bottom: none; }

.suggest-dot {
  width: 6px; height: 6px;
  background: #1a1a1a;
  flex-shrink: 0;
}
.suggest-item:hover .suggest-dot,
.suggest-item--active .suggest-dot {
  background: var(--bauhaus-red);
}

.suggest-item:hover, .suggest-item--active { background: #f8f6f3; }

.suggest-item-main { display: flex; flex-direction: column; gap: 2px; }
.suggest-item-name { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.suggest-item-desc { font-size: 12px; color: var(--text-muted); }
.suggest-item-empty { justify-content: center; color: var(--text-muted); font-size: 13px; padding: 16px; }
.search-suggestions::-webkit-scrollbar { width: 4px; }
.search-suggestions::-webkit-scrollbar-thumb { background: #ccc; }
</style>
