<template>
  <div v-if="visible" class="modal" @click.self="handleOutsideClick">
    <div class="modal-content" style="width: 1280px; height: 600px; overflow: hidden;">
      <div class="modal-header">
        <h2 class="modal-title"><el-icon :size="20" color="#56ab7a"><Calendar /></el-icon>行程管理</h2>
        <span class="close" @click="close">&times;</span>
      </div>
      <div class="modal-body flex h-full">
        <!-- 左侧行程组列表 -->
        <div class="w-2/5 pr-4 border-r border-gray-300"
          style="height: calc(100% - 40px); overflow-y: auto; min-height: 0;">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold">行程组列表</h3>
            <button class="modal-btn modal-btn-primary" @click="showCreateModal = true">新建行程组</button>
          </div>
          <div v-if="loading" class="text-center text-gray-400">加载中...</div>
          <div v-else>
            <div v-if="travelPlans.length === 0" class="text-center text-gray-400">暂无行程组，快来新建一个吧！</div>
            <div v-else class="space-y-4">
              <div v-for="plan in travelPlans" :key="plan.route_id"
                class="bg-gray-50 rounded-lg p-6 mb-6 shadow-sm cursor-pointer hover:bg-emerald-50 border border-gray-100"
                :class="{ 'bg-emerald-100 border-emerald-200': selectedPlan?.route_id === plan.route_id }" @click="selectPlan(plan)">
                <!-- 原有内部结构不变 -->
                <div class="flex justify-between items-center mb-2">
                  <div>
                    <div class="font-medium text-base mb-2" style="color:#1e2a3a">
                      <el-icon :size="14" style="margin-right:4px;color:#56ab7a"><Calendar /></el-icon>{{ plan.title }}
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-sm whitespace-nowrap">
                      <div class="text-gray-600">开始: {{ formatDate(plan.start_time) }}</div>
                      <div class="text-gray-600">结束: {{ formatDate(plan.end_time) }}</div>
                    </div>
                    <div class="text-xs text-gray-400 mt-1">创建时间：{{ formatDateTime(plan.created_at) }}</div>
                  </div>
                  <div>
                    <button class="modal-btn modal-btn-secondary mr-2" @click.stop="openEditModal(plan, $event)"
                      title="编辑行程组">
                      <el-icon :size="14"><Edit /></el-icon>
                    </button>
                    <button class="modal-btn modal-btn-secondary" @click.stop="deletePlan(plan.route_id, $event)"
                      title="删除行程组">
                      <el-icon :size="14"><Delete /></el-icon>
                    </button>
                    <button class="modal-btn modal-btn-secondary ml-2" @click.stop="openMapPreview(plan, $event)"
                      title="地图预览">
                      <el-icon :size="14"><MapLocation /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧行程项详情 -->
        <div class="w-3/5 pl-4" style="height: calc(100% - 40px); overflow-y: auto; min-height: 0;">
          <div v-if="!selectedPlan" class="flex items-center justify-center h-full text-gray-400">
            请从左侧选择一个行程组
          </div>
          <div v-else-if="selectedPlan">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold">{{ selectedPlan.title }} 的行程</h3>
              <button class="modal-btn modal-btn-primary" @click="showCreateItemModal = true">添加行程项</button>
            </div>
            <div class="space-y-4">
              <div v-if="routePlans.length === 0" class="text-center text-gray-400 py-8">暂无行程项，请添加</div>
              <div v-for="item in routePlans" :key="item.plan_id" class="bg-gray-50 rounded-lg p-4 shadow-sm border border-gray-100">
                <div class="flex justify-between items-center">
                  <div>

                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <div
                        class="w-5 h-5 text-gray-700 rounded-full border-2 border-emerald-400 bg-emerald-50 text-s flex items-center justify-center">
                        {{ item.sort_order }}
                      </div>
                      <div class="font-medium">{{ item.name }}</div>
                    </div>
                    <div class="text-sm text-gray-600 mb-1">预计到达: {{ formatDateTime(item.estimated_arrival) }}</div>
                    <div class="text-sm text-gray-600 mb-1">停留时长: {{ item.duration_minutes }}分钟</div>
                    <div class="text-sm text-gray-600">交通方式：
                      <select v-model="item.transportation_mode" @change="updateTransportationMode(item)"
                        class="border rounded px-2 py-1 text-sm">
                        <option v-for="mode in transportationModes" :key="mode" :value="mode">{{ mode }}</option>
                      </select>
                    </div>
                  </div>
                  <div class="flex items-center">
                    <button class="modal-btn modal-btn-secondary mr-2" @click="moveItemUp(item)"><svg t="1755438550048" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1744" width="20" height="20"><path d="M504.67 144.17H95.44c-17.67 0-32 14.33-32 32s14.33 32 32 32h409.22c17.67 0 32-14.33 32-32s-14.32-32-31.99-32zM505.17 470.69H95.44c-17.67 0-32 14.33-32 32s14.33 32 32 32h409.73c17.67 0 32-14.33 32-32s-14.33-32-32-32zM505.17 799.22H95.94c-17.67 0-32 14.33-32 32s14.33 32 32 32h409.22c17.67 0 32-14.33 32-32 0.01-17.68-14.32-32-31.99-32zM789.5 206c-17.67 0-32 14.33-32 32v615.22c0 17.67 14.33 32 32 32s32-14.33 32-32V238c0-17.67-14.33-32-32-32z" p-id="1745" fill="#8a8a8a"></path><path d="M805.31 127.89l142.26 153.73c13.75 14.86 13.92 39.13 0.36 54.22-13.55 15.08-35.69 15.26-49.44 0.4L789.87 218.86 680.42 336.4c-13.79 14.82-35.93 14.56-49.44-0.56-13.51-15.13-13.28-39.4 0.51-54.21l143.19-153.78c8.52-9.15 22.14-9.13 30.63 0.04z" p-id="1746" fill="#8a8a8a"></path></svg>
                    </button>
                    
                    <button class="modal-btn modal-btn-secondary mr-2" @click="moveItemDown(item)"><svg t="1755438774567" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1744" width="20" height="20"><path d="M504.67 144.17H95.44c-17.67 0-32 14.33-32 32s14.33 32 32 32h409.22c17.67 0 32-14.33 32-32s-14.32-32-31.99-32zM789.5 121c-17.67 0-32 14.33-32 32v615.22c0 17.67 14.33 32 32 32s32-14.33 32-32V153c0-17.67-14.33-32-32-32zM505.17 470.69H95.44c-17.67 0-32 14.33-32 32s14.33 32 32 32h409.73c17.67 0 32-14.33 32-32s-14.33-32-32-32zM505.17 799.22H95.94c-17.67 0-32 14.33-32 32s14.33 32 32 32h409.22c17.67 0 32-14.33 32-32 0.01-17.68-14.32-32-31.99-32z" p-id="1745" fill="#8a8a8a"></path><path d="M773.68 878.32L631.42 724.59c-13.75-14.86-13.92-39.13-0.36-54.22 13.55-15.08 35.69-15.26 49.44-0.4l108.63 117.38L898.58 669.8c13.79-14.82 35.93-14.56 49.44 0.56 13.51 15.13 13.28 39.4-0.51 54.21l-143.2 153.8c-8.51 9.15-22.14 9.12-30.63-0.05z" p-id="1746" fill="#8a8a8a"></path></svg>
                    </button>
                    <button class="modal-btn modal-btn-secondary mr-2"
                      @click="editItem(selectedPlan.route_id, item)">编辑</button>
                    <button class="modal-btn modal-btn-secondary"
                      @click="deleteItem(selectedPlan.route_id, item.plan_id)">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>


  <!-- 新建行程组弹窗 -->
  <div v-if="showCreateModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-[1000]">
    <div class="bg-white rounded-xl p-6 shadow-xl w-[480px]">
      <h4 class="font-bold mb-2">新建行程组</h4>
      <input v-model="newPlanTitle" placeholder="行程组名称" class="border rounded px-2 py-1 w-full mb-3"
        @keyup.enter="createTravelPlan" ref="createInput" autofocus />
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
          <input v-model="newPlanStartDate" type="date" placeholder="选择开始日期" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
          <input v-model="newPlanEndDate" type="date" placeholder="选择结束日期" class="w-full border rounded px-2 py-1" />
        </div>
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea v-model="newPlanNote" placeholder="请输入行程备注..." class="border rounded px-2 py-1 w-full"
          rows="3"></textarea>
      </div>
      <div class="flex justify-end">
        <button class="modal-btn modal-btn-secondary mr-2" @click="showCreateModal = false">取消</button>
        <button class="modal-btn modal-btn-primary" @click="createTravelPlan">创建</button>
      </div>
    </div>
  </div>

  <!-- 编辑行程组弹窗 -->
  <div v-if="showEditModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-[1000]">
    <div class="bg-white rounded-xl p-6 shadow-xl w-[480px]">
      <h4 class="font-bold mb-2">编辑行程组</h4>
      <input v-model="editPlanTitle" placeholder="行程组名称" class="border rounded px-2 py-1 w-full mb-3"
        @keyup.enter="updateTravelPlan" ref="editInput" autofocus />
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
          <input v-model="editPlanStartDate" type="date" placeholder="选择开始日期" class="w-full border rounded px-2 py-1" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
          <input v-model="editPlanEndDate" type="date" placeholder="选择结束日期" class="w-full border rounded px-2 py-1" />
        </div>
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea v-model="editPlanNote" placeholder="请输入行程备注..." class="border rounded px-2 py-1 w-full"
          rows="3"></textarea>
      </div>
      <div class="flex justify-end">
        <button class="modal-btn modal-btn-secondary mr-2" @click="showEditModal = false">取消</button>
        <button class="modal-btn modal-btn-primary" @click="updateTravelPlan">保存</button>
      </div>
    </div>
  </div>

  <!-- 添加行程项弹窗 -->
  <div v-if="showCreateItemModal"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-[1000]">
    <div class="bg-white rounded-xl p-6 shadow-xl" style="width:1280px;height:600px;overflow:hidden;">
      <div class="flex h-full">
        <!-- 左侧搜索 -->
        <div class="w-1/2 pr-6 border-r border-gray-200 flex flex-col">
          <h4 class="text-xl font-semibold text-gray-800 mb-4">选择行程项</h4>

          <!-- 行程组选择 -->
          <div class="mb-4">
            <h5 class="font-medium text-gray-700 mb-2">选择目标行程组</h5>
            <div v-if="travelPlans.length === 0" class="text-sm text-gray-500">暂无行程组，请先创建</div>
            <div v-else class="space-y-2 max-h-32 overflow-y-auto">
              <div v-for="plan in travelPlans" :key="plan.route_id"
                class="p-2 bg-gray-50 rounded-lg shadow-sm cursor-pointer hover:bg-emerald-50 border border-gray-200"
                :class="{ 'bg-emerald-100 border-emerald-200': selectedPlan?.route_id === plan.route_id }"
                @click="selectPlan(plan)">
                <div class="font-medium text-sm">{{ plan.title }}</div>
                <div class="text-xs text-gray-500">{{ formatDate(plan.start_time) }} - {{ formatDate(plan.end_time) }}
                </div>
              </div>
            </div>
          </div>

          <!-- 行程组选择提示 -->
          <div v-if="!selectedPlan" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-center text-yellow-800">
              <el-icon :size="14" style="margin-right:6px"><InfoFilled /></el-icon>
              <span class="text-sm font-medium">请先在上方选择一个行程组</span>
            </div>
          </div>

          <div class="mb-3">
            <button class="modal-btn modal-btn-secondary mr-2" :class="{ 'bg-emerald-100': activeAddTab === 'search' }"
              @click="activeAddTab = 'search'">搜索</button>
            <button class="modal-btn modal-btn-secondary" :class="{ 'bg-emerald-100': activeAddTab === 'favorites' }"
              @click="switchToFavorites()">从收藏夹</button>
          </div>
          <div v-if="activeAddTab === 'search'" class="relative">
            <input v-model="searchKeyword" @input="filterLocations" @focus="showSearchResults = true"
              placeholder="搜索地点..."
              class="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              data-search-keyword />
            <span class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
              <el-icon :size="16"><Search /></el-icon>
            </span>
            <div v-if="showSearchResults && filteredLocations.length"
              class="absolute z-[1001] mt-1 w-full max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-md">
              <div v-for="loc in filteredLocations" :key="loc.id" @click="selectLocation(loc)"
                class="px-4 py-2 text-sm hover:bg-blue-50 cursor-pointer">
                <div class="font-medium">{{ loc.name }}</div>
                <div class="text-xs text-gray-500">{{ loc.address }}</div>
              </div>
            </div>
            <p v-if="selectedLocation" class="mt-2 text-sm text-gray-600" data-selected-location>已选择：{{
              selectedLocation.name }}</p>
          </div>
          <div v-else class="overflow-y-auto" style="max-height: 420px;">
            <div v-if="favoriteLoading" class="text-gray-400">加载收藏夹...</div>
            <div v-else>
              <div v-for="fav in favoriteList" :key="fav.fav_id" class="mb-2">
                <div class="font-medium mb-1">{{ fav.title }}  <div class="inline text-sm text-gray-500">收藏夹</div></div>
                <div class="ml-2 border border-gray-300 rounded p-2">
                  <div v-if="!favoriteItemsMap[fav.fav_id]" class="text-sm text-gray-500 cursor-pointer"
                    @click="loadFavoriteItems(fav.fav_id)">展开查看项目</div>
                  <div v-else>
                    <div v-for="fi in favoriteItemsMap[fav.fav_id]" :key="fi.item_id"
                      class="px-2 py-1 text-sm hover:bg-blue-100 cursor-pointer" @click="selectFavoriteItem(fi)">
                      {{ fi.name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧表单 -->
        <div class="w-1/2 pl-4 flex flex-col">
          <h4 class="font-bold mb-2">添加行程项</h4>

          <!-- 行程组信息显示 -->
          <div v-if="selectedPlan" class="mb-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <div class="text-sm text-gray-700">
              <span class="font-medium">目标行程组：</span>{{ selectedPlan.title }}
            </div>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium mb-1">行程项名称</label>
            <input v-model="newItemTitle" class="border rounded px-2 py-1 w-full" />
          </div>


          <div class="mb-3">
            <label class="block text-sm font-medium mb-1">预计到达时间</label>
            <input v-model="estimatedArrival" type="datetime-local" class="border rounded px-2 py-1 w-full" required>
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium mb-1">停留时长(分钟)</label>
            <input v-model="durationMinutes" type="number" min="1" class="border rounded px-2 py-1 w-full" required>
          </div>
          <div class="mb-3">
            <label class="block text-sm font-medium mb-1">交通方式</label>
            <select v-model="newItemTransportation" class="border rounded px-2 py-1 w-full">
              <option v-for="mode in transportationModes" :key="mode" :value="mode">{{ mode }}</option>
            </select>
          </div>
          <div class="mt-auto flex justify-end space-x-2">
            <button class="modal-btn modal-btn-secondary" @click="showCreateItemModal = false">取消</button>
            <button class="modal-btn modal-btn-primary" :disabled="!selectedPlan || !estimatedArrival"
              @click="createTravelItem">添加</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 编辑行程项弹窗 -->
  <div v-if="showEditItemModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-[1000]">
    <div class="bg-white rounded-xl p-6 shadow-xl" style="width:600px;">
      <h4 class="text-xl font-semibold text-gray-800 mb-4">编辑行程项</h4>

      <div class="mb-3">
        <label class="block text-sm font-medium mb-1">行程项名称</label>
        <input v-model="newItemTitle" class="border rounded px-2 py-1 w-full" />
      </div>

      <div class="mb-3">
        <label class="block text-sm font-medium mb-1">预计到达时间</label>
        <input v-model="estimatedArrival" type="datetime-local" class="border rounded px-2 py-1 w-full" required>
      </div>

      <div class="mb-3">
        <label class="block text-sm font-medium mb-1">停留时长(分钟)</label>
        <input v-model="durationMinutes" type="number" min="1" class="border rounded px-2 py-1 w-full" required>
      </div>
      <div class="mb-3">
        <label class="block text-sm font-medium mb-1">交通方式</label>
        <select v-model="editingTransportation" class="border rounded px-2 py-1 w-full">
          <option v-for="mode in transportationModes" :key="mode" :value="mode">{{ mode }}</option>
        </select>
      </div>

      <div class="flex justify-end space-x-2 mt-4">
        <button class="modal-btn modal-btn-secondary" @click="showEditItemModal = false">取消</button>
        <button class="modal-btn modal-btn-primary" @click="saveEditItem">保存</button>
      </div>
    </div>
  </div>

  <!-- 地图预览组件 -->
  <RouteMapPreview :visible="showMapPreview" :planId="mapPreviewPlanId" @close="closeMapPreview" />

</template>

<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance, watch } from 'vue';
import api from '../../services/api';
import RouteMapPreview from '../map/RouteMapPreview.vue';
import emitter from '../../eventBus';
import { Calendar, Edit, Delete, MapLocation, InfoFilled, Search } from '@element-plus/icons-vue';

const props = defineProps({
  visible: Boolean
});
const emit = defineEmits(['close']);

// 添加组件是否挂载的标志
const isMounted = ref(false);
// 存储所有 pending 的请求
const pendingRequests = ref([]);

const travelPlans = ref([]);
const loading = ref(false);
const showCreateModal = ref(false);
const showEditModal = ref(false);
const newPlanTitle = ref('');
const newPlanStartDate = ref('');
const newPlanEndDate = ref('');
const newPlanNote = ref('');
const editPlanTitle = ref('');
const editPlanStartDate = ref('');
const editPlanEndDate = ref('');
const editPlanNote = ref('');
const editingPlan = ref(null);
const selectedPlan = ref(null);
const routePlans = ref([]);
const showCreateItemModal = ref(false);
const showEditItemModal = ref(false); // 编辑行程项模态框显示状态
const editingItem = ref(null); // 当前正在编辑的行程项
const transportationModes = ['步行', '公交', '地铁', '骑行', '打车', '自驾'];
// 地图预览
const showMapPreview = ref(false);
const mapPreviewPlanId = ref(null);
// 收藏夹添加
const activeAddTab = ref('search');
const favoriteList = ref([]);
const favoriteItemsMap = ref({});
const favoriteLoading = ref(false);
const editingTransportation = ref('步行');
// 行程项搜索相关
const searchKeyword = ref('');      // 输入框关键词
const showSearchResults = ref(false); // 是否展示下拉
const filteredLocations = ref([]);    // 下拉列表
const selectedLocation = ref(null);  // 最终选中的地点

// 新增：从地图弹窗接收的地点信息
const mapLocationData = ref(null);


// 加载行程组列表
const loadTravelPlans = async () => {

  loading.value = true;
  // 创建一个新的请求控制器
  const controller = new AbortController();
  pendingRequests.value.push(controller);
  try {


    const res = await api.getAllTravelPlans({ signal: controller.signal });

    // 检查组件是否仍在挂载状态
    if (isMounted.value) {
      travelPlans.value = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  } catch (e) {
    // 忽略中止错误
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  } finally {
    if (isMounted.value) {
      loading.value = false;
    }
  }
};

// 加载行程项
const loadTravelItems = async (planId) => {
  if (!planId) return;
  try {
    const controller = new AbortController();
    pendingRequests.value.push(controller);

    const res = await api.getItineraryItems(planId, { signal: controller.signal });

    if (isMounted.value) {
      routePlans.value = res.data;
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  }
};

// 格式化日期
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

// 格式化日期时间
const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString();
};

// 关闭模态框
const close = () => {
  emit('close');
};

// 点击外部关闭模态框
const handleOutsideClick = (event) => {
  if (event.target.classList.contains('modal')) {
    close();
  }
};


// 根据关键词实时过滤地点
const filterLocations = () => {
  if (!searchKeyword.value.trim()) {
    filteredLocations.value = [];
    showSearchResults.value = false;
    return;
  }

  // 创建请求并存储控制器
  const controller = new AbortController();
  pendingRequests.value.push(controller);

  api.searchAmapLocations(searchKeyword.value, { signal: controller.signal })
    .then(res => {
      if (isMounted.value) {
        // 确保响应数据是数组
        const results = Array.isArray(res?.data) ? res.data : [];
        // 过滤掉无效结果
        filteredLocations.value = results.filter(item => item.name);
        showSearchResults.value = true;
      }
    })
    .catch(e => {
      if (e.name !== 'AbortError') {
        console.error('搜索地点失败:', e);
      }
    });
};

// 下拉点击后回填输入框
const selectLocation = (loc) => {
  if (isMounted.value) {
    selectedLocation.value = loc;
    searchKeyword.value = loc.name;
    newItemTitle.value = loc.name;   // 自动填到右侧表单名称
    showSearchResults.value = false;
  }
};

// 点击弹窗空白处收起下拉
const handleClickOutside = (e) => {
  if (isMounted.value && !e.target.closest('.relative')) {
    showSearchResults.value = false;
  }
};

// 新建行程组
const createTravelPlan = async () => {
  if (!newPlanTitle.value.trim()) {
    alert('请输入行程组名称');
    return;
  }
  if (!newPlanStartDate.value || !newPlanEndDate.value) {
    alert('请选择开始和结束日期');
    return;
  }
  if (new Date(newPlanStartDate.value) > new Date(newPlanEndDate.value)) {
    alert('开始日期不能晚于结束日期');
    return;
  }
  const controller = new AbortController();
  pendingRequests.value.push(controller);

  try {

    await api.createPlan({
      title: newPlanTitle.value.trim(),
      start_time: newPlanStartDate.value,
      end_time: newPlanEndDate.value,
      notes: newPlanNote.value
    }, { signal: controller.signal });

    if (isMounted.value) {
      showCreateModal.value = false;
      resetNewPlanForm();
      loadTravelPlans();
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  }
};

// 重置新建表单
const resetNewPlanForm = () => {
  newPlanTitle.value = '';
  newPlanStartDate.value = '';
  newPlanEndDate.value = '';
  newPlanNote.value = '';
};

// 显示编辑弹窗
const openEditModal = (plan, event) => {
  event.stopPropagation();
  editingPlan.value = plan;
  editPlanTitle.value = plan.title;
  editPlanStartDate.value = plan.start_time.split('T')[0];
  editPlanEndDate.value = plan.end_time.split('T')[0];
  editPlanNote.value = plan.notes || '';
  showEditModal.value = true;
};

// 更新行程组
const updateTravelPlan = async () => {
  if (!editPlanTitle.value.trim()) {
    alert('请输入行程组名称');
    return;
  }
  if (!editPlanStartDate.value || !editPlanEndDate.value) {
    alert('请选择开始和结束日期');
    return;
  }
  if (new Date(editPlanStartDate.value) > new Date(editPlanEndDate.value)) {
    alert('开始日期不能晚于结束日期');
    return;
  }
  const controller = new AbortController();
  pendingRequests.value.push(controller);
  try {


    await api.updatePlan(editingPlan.value.route_id, {
      title: editPlanTitle.value.trim(),
      start_time: editPlanStartDate.value,
      end_time: editPlanEndDate.value,
      notes: editPlanNote.value
    }, { signal: controller.signal });

    if (isMounted.value) {
      showEditModal.value = false;
      loadTravelPlans();
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  }
};

// 删除行程组
const deletePlan = async (planId, event) => {
  event.stopPropagation();
  if (!confirm('确定要删除该行程组吗？此操作不可撤销。')) return;
  const controller = new AbortController();
  pendingRequests.value.push(controller);
  try {


    await api.deletePlan(planId, { signal: controller.signal });

    if (isMounted.value) {
      loadTravelPlans();
      selectedPlan.value = null;
      routePlans.value = [];
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  }
};

// 选择行程组
const selectPlan = (plan) => {
  if (!plan || !plan.route_id) return;
  selectedPlan.value = plan;
  loadTravelItems(plan.route_id);
};

// 添加行程项
const newItemTitle = ref('');
const estimatedArrival = ref('');
const durationMinutes = ref(60);
const newItemTransportation = ref('步行');


const createTravelItem = async () => {
  if (!selectedPlan.value) {
    alert('请先选择一个行程组');
    return;
  }

  if (!estimatedArrival.value) {
    alert('请设置预计到达时间');
    return;
  }

  try {
    const controller = new AbortController();
    pendingRequests.value.push(controller);

    const payload = {
      estimated_arrival: estimatedArrival.value,
      duration_minutes: durationMinutes.value,
      name: newItemTitle.value,
      address: selectedLocation.value?.address || '',
      longitude: selectedLocation.value?.longitude ?? null,
      latitude: selectedLocation.value?.latitude ?? null,
      transportation_mode: newItemTransportation.value
    };

    // 如选择了地点，确保标题
    if (selectedLocation.value) {
      payload.title = selectedLocation.value.name;
      payload.sort_order = 0;
    }

    await api.createRoutePlan(selectedPlan.value.route_id, payload, { signal: controller.signal });

    if (isMounted.value) {
      showCreateItemModal.value = false;
      newItemTitle.value = '';
      estimatedArrival.value = '';
      durationMinutes.value = 60;
      selectedLocation.value = null;
      searchKeyword.value = '';
      loadTravelItems(selectedPlan.value.route_id);
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  }
};

// 编辑行程项
const editItem = async (planId, item) => {
  // 设置当前编辑的行程项
  editingItem.value = { ...item };
  // 设置表单值
  newItemTitle.value = item.name;
  estimatedArrival.value = item.estimated_arrival;
  durationMinutes.value = item.duration_minutes;
  editingTransportation.value = item.transportation_mode || '步行';
  // 打开编辑模态框
  showEditItemModal.value = true;
};

// 保存编辑的行程项
const saveEditItem = async () => {
  try {
    const res = await api.updateItineraryItem(selectedPlan.value.route_id, editingItem.value.plan_id, {
      title: newItemTitle.value,
      name: newItemTitle.value,
      address: editingItem.value.address || '',
      longitude: editingItem.value.longitude ?? null,
      latitude: editingItem.value.latitude ?? null,
      estimated_arrival: estimatedArrival.value,
      duration_minutes: durationMinutes.value,
      transportation_mode: editingTransportation.value
    });
    // 关闭编辑模态框
    showEditItemModal.value = false;
    // 重新加载行程项列表
    loadTravelItems(selectedPlan.value.route_id);
  } catch (e) {
    api.handleError(e);
  }
};

// 删除行程项
const deleteItem = async (planId, itemId) => {
  if (confirm('确定删除该行程项吗？')) {
    try {
      const res = await api.deleteItineraryItem(planId, itemId);
      // 后端返回的是 { message: '删除行程项成功' }，不是 res.success
      loadTravelItems(selectedPlan.value.route_id);
    } catch (e) {
      api.handleError(e);
    }
  }
};

// 更新单个行程项的交通方式
const updateTransportationMode = async (item) => {
  try {
    await api.updateItineraryItem(selectedPlan.value.route_id, item.plan_id, {
      title: item.name,
      name: item.name,
      address: item.address || '',
      longitude: item.longitude ?? null,
      latitude: item.latitude ?? null,
      estimated_arrival: item.estimated_arrival,
      duration_minutes: item.duration_minutes,
      transportation_mode: item.transportation_mode,
    });
  } catch (e) {
    api.handleError(e);
  }
};

// 交换两个项的位置
function swapItems(indexA, indexB) {
  const tmp = routePlans.value[indexA];
  routePlans.value[indexA] = routePlans.value[indexB];
  routePlans.value[indexB] = tmp;
}

// 持久化当前顺序到后端
const persistOrder = async () => {
  const order = routePlans.value.map((it, idx) => ({ plan_id: it.plan_id, sort_order: idx + 1 }));
  try {
    await api.updateItineraryOrder(selectedPlan.value.route_id, { order });
  } catch (e) {
    api.handleError(e);
  }
};


// 同步更新所有元素的 sort_order 与数组顺序一致
const syncSortOrder = () => {
  routePlans.value.forEach((item, index) => {
    // 直接修改元素的 sort_order 属性（Vue 响应式会检测到变化）
    item.sort_order = index + 1; 
  });
};

// 上移：修正索引查找条件
const moveItemUp = async (item) => {
  // 关键修正：通过 plan_id 查找当前项索引（plan_id 唯一）
  const index = routePlans.value.findIndex(i => i.plan_id === item.plan_id);
  if (index <= 0) return; // 第一项无法上移
  swapItems(index, index - 1);
  syncSortOrder(); // 同步更新 sort_order
  await persistOrder();
};

// 下移：同理修正索引查找条件
const moveItemDown = async (item) => {
  const index = routePlans.value.findIndex(i => i.plan_id === item.plan_id); // 用 plan_id 查找
  if (index === -1 || index >= routePlans.value.length - 1) return; // 最后一项无法下移
  swapItems(index, index + 1);
  syncSortOrder(); // 同步更新 sort_order
  await persistOrder();
};

// 打开地图预览（城市名由后端根据坐标自动识别，无需前端传递）
const openMapPreview = (plan, event) => {
  event?.stopPropagation?.();
  mapPreviewPlanId.value = plan.route_id;
  showMapPreview.value = true;
};
const closeMapPreview = () => {
  showMapPreview.value = false;
  mapPreviewPlanId.value = null;
};

// 收藏夹相关
const switchToFavorites = async () => {
  activeAddTab.value = 'favorites';
  favoriteLoading.value = true;
  try {
    const res = await api.getAllFavorites();
    favoriteList.value = Array.isArray(res?.data) ? res.data : [];
  } catch (e) {
    api.handleError(e);
  } finally {
    favoriteLoading.value = false;
  }
};
const loadFavoriteItems = async (favId) => {
  if (favoriteItemsMap.value[favId]) {
    delete favoriteItemsMap.value[favId];
    favoriteItemsMap.value = { ...favoriteItemsMap.value };
    return;
  }
  try {
    const res = await api.getFavoriteItems(favId);
    favoriteItemsMap.value = { ...favoriteItemsMap.value, [favId]: Array.isArray(res?.data) ? res.data : [] };
  } catch (e) {
    api.handleError(e);
  }
};
const selectFavoriteItem = (fi) => {
  selectedLocation.value = {
    name: fi.name,
    address: fi.address,
    longitude: fi.longitude ?? null,
    latitude: fi.latitude ?? null,
  };
  searchKeyword.value = fi.name;
  newItemTitle.value = fi.name;
};

// 监听从地图弹窗传来的地点信息
const handleAddToItinerary = (locationData) => {
  console.log('TravelPlanManagement: 收到 add-to-itinerary 事件', locationData);

  // 防止重复处理同一个事件
  if (mapLocationData.value &&
    mapLocationData.value.name === locationData.name &&
    mapLocationData.value.address === locationData.address) {
    console.log('TravelPlanManagement: 跳过重复事件');
    return;
  }

  if (locationData && locationData.name) {
    mapLocationData.value = locationData;
    console.log('TravelPlanManagement: 设置地点信息', locationData);

    // 自动填入搜索框和选择地点
    searchKeyword.value = locationData.name;
    console.log('TravelPlanManagement: 设置 searchKeyword:', searchKeyword.value);

    selectedLocation.value = {
      name: locationData.name,
      address: locationData.address || '',
      longitude: locationData.longitude,
      latitude: locationData.latitude,
      type: locationData.type || '',
      province: locationData.district ? '陕西省' : '',
      city: locationData.district ? '西安市' : '',
      district: locationData.district || ''
    };
    console.log('TravelPlanManagement: 设置 selectedLocation', selectedLocation.value);

    // 自动填入行程项名称
    newItemTitle.value = locationData.name;

    // 自动打开添加行程项弹窗
    showCreateItemModal.value = true;
    // 切换到搜索标签页
    activeAddTab.value = 'search';
    console.log('TravelPlanManagement: 弹窗状态', {
      showCreateItemModal: showCreateItemModal.value,
      activeAddTab: activeAddTab.value,
      searchKeyword: searchKeyword.value,
      selectedLocation: selectedLocation.value,
      newItemTitle: newItemTitle.value
    });

    // 延迟检查DOM状态
    setTimeout(() => {
      const searchInput = document.querySelector('[data-search-keyword]');
      const selectedLocationEl = document.querySelector('[data-selected-location]');
      console.log('TravelPlanManagement: DOM状态检查', {
        searchInput: searchInput?.value,
        selectedLocationEl: selectedLocationEl?.textContent,
        searchKeywordRef: searchKeyword.value,
        selectedLocationRef: selectedLocation.value,
        selectedPlan: selectedPlan.value,
        newItemTitleRef: newItemTitle.value
      });
    }, 100);

  } else {
    console.log('TravelPlanManagement: 地点数据无效', locationData);
  }
};

// 初始化加载
onMounted(() => {
  isMounted.value = true;
  console.log('TravelPlanManagement: 组件开始挂载');

  // 监听事件 - 只注册一次
  emitter.off('add-to-itinerary', handleAddToItinerary); // 先移除，防止重复
  emitter.on('add-to-itinerary', handleAddToItinerary);
  console.log('TravelPlanManagement: 事件监听器已注册，等待事件...');

  // 如果当前可见，则加载数据
  if (props.visible) {
    loadTravelPlans();
  }

  document.addEventListener('click', handleClickOutside);

  // 延迟检查事件监听器状态
  setTimeout(() => {
    console.log('TravelPlanManagement: 挂载完成，事件监听器状态检查');
    console.log('TravelPlanManagement: isMounted =', isMounted.value);
    console.log('TravelPlanManagement: 事件监听器数量 =', emitter.events['add-to-itinerary']?.length || 0);
  }, 100);
});

// 监听visible属性变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    console.log('TravelPlanManagement: 模态框变为可见，加载行程数据');
    // 当模态框变为可见时，加载行程数据
    loadTravelPlans();
  }
}, { immediate: true });

// 组件卸载时清理
onUnmounted(() => {
  isMounted.value = false;
  // 取消所有pending的请求
  pendingRequests.value.forEach(controller => {
    controller.abort();
  });
  pendingRequests.value = [];
  document.removeEventListener('click', handleClickOutside);

  // 移除事件监听
  emitter.off('add-to-itinerary', handleAddToItinerary);
});
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.25s ease-out;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.modal-content {
  background: #ffffff;
  border: 3px solid #1a1a1a;
  box-shadow: 6px 6px 0 rgba(0,0,0,0.08);
  max-height: 80vh;
  overflow-y: auto;
  padding: 24px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 3px solid #1a1a1a;
}

.modal-title {
  font-size: 1.2rem;
  font-weight: 900;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.close {
  font-size: 1.5rem;
  cursor: pointer;
  color: #1a1a1a;
  transition: color 0.2s;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid #1a1a1a;
  background: #fff;
}
.close:hover { background: #1a1a1a; color: #fff; }

.modal-body { margin-bottom: 20px; }

/* 卡片 */
.bg-gray-50 {
  background: #f8f6f3 !important;
  border: 2px solid #e0dcd5 !important;
}
.bg-emerald-50 { background: rgba(91,140,111,0.06) !important; border-color: rgba(91,140,111,0.15) !important; }
.bg-emerald-100 { background: rgba(91,140,111,0.1) !important; border-color: rgba(91,140,111,0.2) !important; }

.modal-btn {
  padding: 8px 18px;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
  border: 2px solid transparent;
  font-family: var(--font-sans);
  letter-spacing: 0.5px;
}
.modal-btn:active { transform: scale(0.97); }

.modal-btn-primary {
  background: #1a1a1a;
  color: #fff;
  border-color: #1a1a1a;
}
.modal-btn-primary:hover { background: var(--bauhaus-red); border-color: var(--bauhaus-red); }
.modal-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.modal-btn-secondary {
  background: #fff;
  color: #1a1a1a;
  border: 2px solid #1a1a1a;
}
.modal-btn-secondary:hover { background: #f8f6f3; }

/* 输入框 */
input, textarea, select {
  border: 2px solid #1a1a1a !important;
  font-family: var(--font-sans) !important;
  padding: 8px 12px !important;
}
input:focus, textarea:focus, select:focus {
  border-color: var(--bauhaus-red) !important;
  outline: none;
}

/* 子弹窗 */
.fixed.inset-0 > .bg-white {
  border: 3px solid #1a1a1a !important;
  box-shadow: 6px 6px 0 rgba(0,0,0,0.08) !important;
}

/* 行程项序号圆圈 */
.w-5.h-5.rounded-full {
  border-radius: 0 !important;
  background: #1a1a1a !important;
  color: #fff !important;
  border-color: #1a1a1a !important;
}

@media (prefers-reduced-motion: reduce) {
  .modal { animation: none; }
}
</style>