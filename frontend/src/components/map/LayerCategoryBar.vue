<template>
  <div class="layer-category-bar">
    <div v-for="item in allCategories" :key="item.value" style="position:relative;">
      <button
        :class="['category-btn', {active: activeCategory===item.value}]"
        @click="openFilter(item.value, $event)"
      >
        <span class="cat-dot" :class="`cat-dot--${item.value}`"></span>
        <span class="label">{{item.label}}</span>
        <svg class="cat-arrow" width="12" height="12" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5z" fill="currentColor"/>
        </svg>
      </button>
      <CategoryFilterPanel
        v-show="showFilter && filterCategory===item.value"
        :category="filterCategory"
        :modelValue="filterValues[item.value]"
        @update:modelValue="v=>filterValues[item.value]=v"
        @ok="onFilterOk(item.value, $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import CategoryFilterPanel from './CategoryFilterPanel.vue'

const emit = defineEmits(['select','filter'])

const allCategories = [
  { label: '景点', value: 'scenic' },
  { label: '酒店', value: 'hotel' },
  { label: '美食', value: 'food' },
  { label: '机场', value: 'airport' },
  { label: '火车站', value: 'train' },
]

const activeCategory = ref('scenic')
const showFilter = ref(false)
const filterCategory = ref('scenic')
const filterValues = reactive({
  scenic: {}, hotel: {}, food: {}, shopping: {}, airport: {}, train: {},
})

function openFilter(category, event) {
  filterCategory.value = category
  showFilter.value = true
  activeCategory.value = category
  event?.stopPropagation()
}
function onFilterOk(category, values) {
  showFilter.value = false
  emit('filter', { category, values })
}
function handleClickOutside(e) {
  if (!e.target.closest('.filter-panel')) {
    showFilter.value = false
  }
}
onMounted(()=>{ window.addEventListener('click', handleClickOutside) })
onBeforeUnmount(()=>{ window.removeEventListener('click', handleClickOutside) })
</script>

<style scoped>
.layer-category-bar {
  display: flex;
  align-items: flex-end;
  gap: 0;
  position: absolute;
  top: 16px;
  left: 216px;
  z-index: 10001;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #ffffff;
  height: 40px;
  padding: 0 18px;
  font-size: 13px;
  color: #1a1a1a;
  cursor: pointer;
  outline: none;
  transition: all var(--duration-fast) var(--ease-out);
  position: relative;
  font-weight: 700;
  letter-spacing: 0.5px;
  border: 2px solid transparent;
  border-left: none;
}
.category-btn:first-child { border-left: 2px solid transparent; }

.cat-dot {
  width: 7px; height: 7px;
  background: #1a1a1a;
  flex-shrink: 0;
}
.cat-dot--scenic  { background: var(--bauhaus-red); }
.cat-dot--hotel   { background: var(--bauhaus-yellow); }
.cat-dot--food    { background: var(--bauhaus-coral); }
.cat-dot--airport { background: var(--bauhaus-teal); }
.cat-dot--train   { background: var(--bauhaus-blue); }

.cat-arrow {
  opacity: 0.3; color: #1a1a1a;
  transition: opacity 0.2s;
}

.category-btn:hover,
.category-btn.active {
  border-color: #1a1a1a;
  background: #f8f6f3;
}
.category-btn:hover .cat-arrow,
.category-btn.active .cat-arrow { opacity: 0.9; }

.label {
  font-size: 13px;
  font-weight: 700;
}
</style>
