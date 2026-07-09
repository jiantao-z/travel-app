import axios from 'axios';

// 后端 API 地址，可通过 .env 中的 VITE_API_BASE_URL 配置
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// 自动携带token
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default {
  // POI相关接口
  getPOIs(params) {
    return apiClient.get('/pois', { params })
  },
  getPOIDetails(id) {
    return apiClient.get(`/pois/${id}`)
  },
  searchPOIs(keyword) {
    return apiClient.get('/pois/search', { params: { q: keyword } })
  },

  // 用户登录
  login(username, password) {
    return apiClient.post('/auth/login', { username, password });
  },
  // 用户注册
  register(userData) {
    return apiClient.post('/auth/register', userData);
  },
  // 用户登出（前端只需清除token）
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return Promise.resolve();
  },

  
  // 收藏夹管理相关接口
  // ================================
  
  // 统一地点搜索（高德）- 用于收藏项与行程项选择
  searchAmapLocations(keyword, config = {}) {
    return apiClient.get('/locations/search', { ...(config || {}), params: { q: keyword, ...(config?.params || {}) } });
  },

  // 获取所有收藏夹（包含收藏项数量）
  getAllFavorites(config = {}) {
    return apiClient.get('/favorites', config);
  },
  
  // 创建收藏夹
  createFavorite(favData) {
    return apiClient.post('/favorites', favData);
  },
  
  // 更新收藏夹
  updateFavorite(favId, favData) {
    return apiClient.put(`/favorites/${favId}`, favData);
  },
  
  // 删除收藏夹
  deleteFavorite(favId) {
    return apiClient.delete(`/favorites/${favId}`);
  },
  
  // 获取收藏夹内项目（包含地点详细信息）
  getFavoriteItems(favId, config = {}) {
    return apiClient.get(`/favorites/${favId}/items`, config);
  },
  
  // 添加项目到收藏夹
  addFavoriteItem(favId, itemData) {
    return apiClient.post(`/favorites/${favId}/items`, itemData);
  },
  
  // 从收藏夹移除项目
  deleteFavoriteItem(favId, itemId) {
    return apiClient.delete(`/favorites/${favId}/items/${itemId}`);
  },
  
  // 搜索地点（用于收藏项）
  searchLocations(keyword, config = {}) {
    return apiClient.get('/locations/search', { ...(config || {}), params: { q: keyword, ...(config?.params || {}) } });
  },

  // 行程组相关接口
  // 获取所有行程组
  getAllTravelPlans(config = {}) {
    return apiClient.get('/travelPlans', config);
  },
  // 创建行程组
  createPlan(planData, config = {}) {
    return apiClient.post('/travelPlans', planData, config);
  },
  // 更新行程组
  updatePlan(planId, planData, config = {}) {
    return apiClient.put(`/travelPlans/${planId}`, planData, config);
  },
  // 重命名行程组
  
  // 重命名行程组
  renamePlan(planId, title) {
    return apiClient.put(`/travelPlans/${planId}`, { title });
  },
  // 删除行程组
  deletePlan(planId, config = {}) {
    return apiClient.delete(`/travelPlans/${planId}`, config);
  },

  // 获取行程详情（包含行程项）
  getTravelPlanDetails(planId, config = {}) {
    return apiClient.get(`/travelPlans/${planId}`, config);
  },
  // 获取行程项列表
  getPlanItems(planId, config = {}) {
    return apiClient.get(`/travelPlans/${planId}/itineraries`, config);
  },
  // 获取行程项列表
  getItineraryItems(planId, config = {}) {
    return apiClient.get(`/travelPlans/${planId}/itineraries`, config);
  },
  // 创建行程项
  createRoutePlan(planId, itemData, config = {}) {
    return apiClient.post(`/travelPlans/${planId}/itineraries`, itemData, config);
  },
  // 更新行程项
  updateItineraryItem(planId, itemId, itemData, config = {}) {
    return apiClient.put(`/travelPlans/${planId}/itineraries/${itemId}`, itemData, config);
  },
  // 删除行程项
  deleteItineraryItem(planId, itemId, config = {}) {
    return apiClient.delete(`/travelPlans/${planId}/itineraries/${itemId}`, config);
  },
  // 更新行程项排序
  updateItineraryOrder(planId, orderData, config = {}) {
    return apiClient.put(`/travelPlans/${planId}/itineraries-order`, orderData, config);
  },
  // 获取行程的地图几何
  getRouteGeometries(planId, config = {}) {
    return apiClient.get(`/travelPlans/${planId}/geometries`, config);
  },

  // ── 路径规划（调用高德 Web 服务 API） ──
  getDirections(type, params, config = {}) {
    // type: 'driving' | 'walking' | 'riding' | 'transit'
    // params: { origin, destination, city?, strategy? }
    return apiClient.get(`/directions/${type}`, { ...(config || {}), params: { ...params, ...(config?.params || {}) } });
  },
  // 保留原有POI搜索（用于主页面ArcGIS相关）
  searchPOIs(keyword, config = {}) {
    return apiClient.get('/pois/search', { ...(config || {}), params: { q: keyword, ...(config?.params || {}) } });
  },

  // 通用错误处理
  handleError(error) {
    if (error.response) {
      console.error('API Error:', error.response.data)
      return Promise.reject(error.response.data)
    }
    console.error('Request Error:', error.message)
    return Promise.reject(error)
  }
}