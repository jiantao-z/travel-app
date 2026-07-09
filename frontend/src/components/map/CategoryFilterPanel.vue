<template>
  <div class="filter-panel">
    <div v-if="category === 'scenic'">
      <div class="section-title">景点类型</div>
      <div class="option-group">
        <button :class="['option-btn', { active: isAllSelected('scenic') }]" @click="selectAll('scenic')">全选</button>
        <button v-for="item in scenicType" :key="item"
          :class="['option-btn', { active: selected.scenicTypes.includes(item) }]"
          @click="toggle('scenic', item)">{{ item }}</button>
      </div>
    </div>
    <div v-else-if="category === 'hotel'">
      <div class="section-title">星级</div>
      <div class="option-group">
        <button :class="['option-btn', { active: isAllSelected('hotel') }]" @click="selectAll('hotel')">全选</button>
        <button v-for="item in hotelStar" :key="item"
          :class="['option-btn', { active: selected.hotelStars.includes(item) }]"
          @click="toggle('hotel', item)">{{ item }}</button>
      </div>
    </div>
    <div v-else-if="category === 'food'">
      <div class="section-title">类型</div>
      <div class="option-group">
        <button :class="['option-btn', { active: isAllSelected('food') }]" @click="selectAll('food')">全选</button>
        <button v-for="item in foodType" :key="item"
          :class="['option-btn', { active: selected.foodTypes.includes(item) }]"
          @click="toggle('food', item)">{{ item }}</button>
      </div>
    </div>
    <div v-else-if="category === 'airport'">
      <div class="section-title">类型</div>
      <div class="option-group">
        <button :class="['option-btn', { active: isAllSelected('airport') }]" @click="selectAll('airport')">全选</button>
        <button v-for="item in airportType" :key="item"
          :class="['option-btn', { active: selected.airportTypes.includes(item) }]"
          @click="toggle('airport', item)">{{ item }}</button>
      </div>
    </div>
    <div v-else-if="category === 'train'">
      <div class="section-title">类型</div>
      <div class="option-group">
        <button :class="['option-btn', { active: isAllSelected('train') }]" @click="selectAll('train')">全选</button>
        <button v-for="item in trainType" :key="item"
          :class="['option-btn', { active: selected.trainTypes.includes(item) }]"
          @click="toggle('train', item)">{{ item }}</button>
      </div>
    </div>
    <div class="panel-actions">
      <button class="reset-btn" @click="reset">重置</button>
      <button class="ok-btn" @click="onOk">完成</button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
const props = defineProps({
  category: String,
  modelValue: Object
})
const emit = defineEmits(['update:modelValue', 'ok'])

const scenicType = ['1A', '2A', '3A', '4A', '5A']
const hotelStar = ['1星', '2星', '3星', '4星', '5星']
const foodType = ['中餐厅', '西餐厅', '茶饮']
const airportType = ['国际机场', '国内机场']
const trainType = ['火车站', '地铁站']

const selected = reactive({
  scenicTypes: [],
  hotelStars: [],
  foodTypes: [],
  trainTypes: [],
  airportTypes: []
})
watch(() => props.modelValue, v => {
  if (v) Object.assign(selected, v)
}, { immediate: true })

function reset() {
  selected.scenicTypes = []
  selected.hotelStars = []
  selected.foodTypes = []
  selected.trainTypes = []
  selected.airportTypes = []
}
function onOk() {
  emit('update:modelValue', { ...selected })
  emit('ok', { ...selected })
}

function toggle(category, item) {
  const key = getKey(category)
  const arr = selected[key]
  const idx = arr.indexOf(item)
  if (idx === -1) arr.push(item)
  else arr.splice(idx, 1)
}

function selectAll(category) {
  const key = getKey(category)
  const options = getOptions(category)
  if (isAllSelected(category)) selected[key] = []
  else selected[key] = options.slice()
}

function isAllSelected(category) {
  const key = getKey(category)
  const options = getOptions(category)
  return selected[key]?.length === options.length && options.length > 0
}

function getKey(category) {
  switch (category) {
    case 'scenic': return 'scenicTypes'
    case 'hotel': return 'hotelStars'
    case 'food': return 'foodTypes'
    case 'train': return 'trainTypes'
    case 'airport': return 'airportTypes'
    default: return ''
  }
}

function getOptions(category) {
  switch (category) {
    case 'scenic': return scenicType
    case 'hotel': return hotelStar
    case 'food': return foodType
    case 'train': return trainType
    case 'airport': return airportType
    default: return []
  }
}
</script>

<style scoped>
.filter-panel {
  background: #ffffff;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.08);
  padding: 24px 28px 20px 28px;
  min-width: 320px;
  max-width: 380px;
  position: absolute;
  top: 50px;
  left: 0;
  z-index: 2000;
  border: 2px solid #1a1a1a;
}

.section-title {
  font-size: 11px;
  color: #1a1a1a;
  margin: 14px 0 10px 0;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 2px;
}

.option-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 4px;
}

.option-btn {
  background: #f8f6f3;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #1a1a1a;
  cursor: pointer;
  border: 2px solid transparent;
  font-family: var(--font-sans);
  transition: all var(--duration-fast) var(--ease-out);
}

.option-btn.active,
.option-btn:hover {
  background: #1a1a1a;
  color: #ffffff;
  border-color: #1a1a1a;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.reset-btn {
  background: #f8f6f3;
  padding: 8px 20px;
  color: #1a1a1a;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 2px solid #e0dcd5;
  font-family: var(--font-sans);
  transition: all var(--duration-fast) var(--ease-out);
}

.reset-btn:hover {
  border-color: #1a1a1a;
  background: #ffffff;
}

.ok-btn {
  background: #1a1a1a;
  border: 2px solid #1a1a1a;
  padding: 8px 20px;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: var(--font-sans);
  transition: all var(--duration-fast) var(--ease-out);
}

.ok-btn:hover {
  background: var(--bauhaus-red);
  border-color: var(--bauhaus-red);
}
</style>