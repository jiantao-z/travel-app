<template>
  <div>
    <h2>兴趣点列表</h2>
    <div v-if="loading">加载中...</div>
    <div v-else>
      <div v-for="poi in pois" :key="poi.id" class="poi-item">
        <h3>{{ poi.name }}</h3>
        <p>{{ poi.description }}</p>
        <p>坐标: {{ poi.latitude }}, {{ poi.longitude }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../../services/api';

export default {
  data() {
    return {
      pois: [],
      loading: false,
      error: null
    };
  },
  async created() {
    try {
      this.loading = true;
      const response = await api.getPOIs();
      this.pois = response.data;
    } catch (err) {
      this.error = err.message;
      console.error('获取POI失败:', err);
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.poi-item {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>