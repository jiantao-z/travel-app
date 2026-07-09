<template>
  <form @submit.prevent="handleSubmit">
    <!-- 目的地 -->
    <div class="mb-3">
      <label class="form-label fw-bold">目的地</label>
      <input
        v-model.trim="form.destination"
        type="text"
        class="form-control"
        placeholder="城市或景区"
        required
      />
    </div>

    <!-- 天数 / 预算 -->
    <div class="row g-3 mb-3">
      <div class="col-md-6">
        <label class="form-label fw-bold">天数</label>
        <input
          v-model.number="form.days"
          type="number"
          min="1"
          class="form-control"
          required
        />
      </div>
      <div class="col-md-6">
        <label class="form-label fw-bold">预算 (¥)</label>
        <input
          v-model.number="form.budget"
          type="number"
          min="0"
          class="form-control"
          required
        />
      </div>
    </div>

    <!-- 兴趣多选 -->
    <div class="mb-3">
      <label class="form-label fw-bold">兴趣爱好</label>
      <select v-model="form.interests" multiple class="form-select">
        <option value="food">美食</option>
        <option value="culture">文化</option>
        <option value="nature">自然风光</option>
        <option value="shopping">购物</option>
      </select>
      <div class="form-text">Ctrl/⌘ 可多选</div>
    </div>

    <!-- 提交按钮 -->
    <button
      type="submit"
      class="btn btn-primary w-100"
      :disabled="loading"
    >
      <span
        v-if="loading"
        class="spinner-border spinner-border-sm me-1"
      />
      {{ loading ? '生成中...' : '生成路线' }}
    </button>
  </form>

  <!-- 结果 -->
  <div v-if="plan" class="mt-4">
    <h6>您的定制路线：</h6>
    <pre
      class="bg-light p-2 border"
      style="white-space: pre-wrap; font-size: 0.9rem"
      >{{ plan }}</pre
    >
    <button class="btn btn-success btn-sm mt-2" @click="savePlan">
      保存到本地
    </button>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import axios from 'axios'

const form = reactive({
  destination: '',
  days: 3,
  budget: 5000,
  interests: []
})
const loading = ref(false)
const plan = ref('')

const handleSubmit = async () => {
  loading.value = true
  try {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    const { data } = await axios.post(
      `${API_BASE}/ai/plan`,
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content:
              '你是一个专业的旅游规划助手。根据用户提供的目的地、天数、预算和兴趣，生成详细的旅游路线。'
          },
          {
            role: 'user',
            content: `我想去${form.destination}旅游${form.days}天，预算${form.budget}元，我的兴趣是：${form.interests.join(
              ', '
            )}。请帮我规划详细的行程，包括景点推荐、交通建议和餐饮推荐。`
          }
        ],
        stream: false
      }
    )
    plan.value = data.choices[0].message.content
  } catch (e) {
    alert('生成失败：' + e.message)
  } finally {
    loading.value = false
  }
}

const savePlan = () => {
  localStorage.setItem('savedPlan', plan.value)
  alert('已保存！')
}
</script>