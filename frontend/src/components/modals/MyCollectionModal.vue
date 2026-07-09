<template>
  <div v-if="visible" class="modal" @click.self="handleOutsideClick">
    <div class="modal-content" style="width: 1280px; height: 600px; overflow: hidden;">
      <div class="modal-header">
        <h2 class="modal-title"><el-icon :size="20" color="#56ab7a"><Star /></el-icon>收藏夹管理</h2>
        <span class="close" @click="close">&times;</span>
      </div>
      <div class="modal-body flex h-full">
        <!-- 左侧收藏夹列表 -->
        <div class="w-2/5 pl-4 pr-4 border-r border-gray-400"
          style="height: calc(100% - 40px); overflow-y: auto; min-height: 0;">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold">收藏夹列表</h3>
            <button class="group cursor-pointer outline-none hover:rotate-90 duration-300" title="Add New" @click="showCreateFavoriteModal = true">
              <svg
                class="stroke-yellow-400 fill-none group-hover:fill-yellow-800 group-active:stroke-yellow-200 group-active:fill-yellow-600 group-active:duration-0 duration-300"
                viewBox="0 0 24 24" height="40px" width="40px" xmlns="http://www.w3.org/2000/svg">
                <path stroke-width="1.5"
                  d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"></path>
                <path stroke-width="1.5" d="M8 12H16"></path>
                <path stroke-width="1.5" d="M12 16V8"></path>
              </svg>
            </button>
            
          </div>
          <div v-if="loading" class="text-center text-gray-400">加载中...</div>
          <div v-else>
            <div v-if="favoritesList.length === 0" class="text-center text-gray-400">暂无收藏夹，快来新建一个吧！</div>
            <div v-else class="space-y-4">
              <div v-for="fav in favoritesList" :key="fav.fav_id"
                class="bg-gray-50 rounded-lg p-4 mb-3 shadow-sm cursor-pointer hover:bg-emerald-50 border border-gray-100"
                :class="{ 'bg-emerald-100 border-emerald-200': selectedFavorite?.fav_id === fav.fav_id }" @click="selectFavorite(fav)">
                <div class="flex justify-between items-center mb-2">
                  <div>
                    <div class="font-medium text-base mb-2" style="color:#1e2a3a">
                      <el-icon :size="14" style="margin-right:4px;color:#56ab7a"><Folder /></el-icon>{{ fav.title }}
                    </div>
                    <div class="text-xs text-gray-600 mt-1">创建时间：{{ formatDateTime(fav.created_at) }}</div>
                  </div>
                  <div>
                    <button class="modal-btn modal-btn-secondary mr-2" @click.stop="openEditFavoriteModal(fav, $event)"
                      title="编辑收藏夹">
                      <el-icon :size="14"><Edit /></el-icon>
                    </button>
                    <button class="modal-btn modal-btn-secondary" @click.stop="deleteFavorite(fav.fav_id, $event)"
                      title="删除收藏夹">
                      <el-icon :size="14"><Delete /></el-icon>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧收藏项详情 -->
        <div class="w-3/5 pl-4" style="height: calc(100% - 40px); overflow-y: auto; min-height: 0;">
          <div v-if="!selectedFavorite" class="flex items-center justify-center h-full text-gray-400">
            请从左侧选择一个收藏夹
          </div>
          <div v-else-if="selectedFavorite">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-bold" style="color:#56ab7a">"{{ selectedFavorite.title }}" <h4 class="text-gray-600 inline">收藏夹的收录:</h4></h3>
              <button class="modal-btn modal-btn-primary" @click="showCreateItemModal = true">添加收藏项</button>
            </div>
            <div class="space-y-4">
              <div v-for="item in favoriteItems" :key="item.item_id" class="bg-gray-50 rounded-lg p-4 shadow-sm">
                <div class="flex justify-between items-center">
                  <div>
                    <div class="font-medium">{{ item.name }}</div>
                    <div class="text-sm text-gray-600 mb-1" v-if="item.longitude && item.latitude">
                      <span class="font-medium">坐标：</span>{{ item.longitude }}, {{ item.latitude }}
                    </div>
                    <div class="text-sm text-gray-600">
                      <span class="font-medium">地址：</span>{{ item.address }}
                    </div>
                  </div>
                  <div>
                    <button class="modal-btn modal-btn-secondary"
                      @click="deleteFavoriteItem(selectedFavorite.fav_id, item.item_id)">删除</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 新建收藏夹弹窗 -->
  <div v-if="showCreateFavoriteModal"
    class="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-[1000]">
    <div class="bg-white rounded-xl p-6 shadow-xl w-[480px]">
      <h4 class="font-bold mb-2">新建收藏夹</h4>
      <input v-model="newFavoriteTitle" placeholder="收藏夹名称" class="border rounded px-2 py-1 w-full mb-3"
        @keyup.enter="createFavorite" ref="createInput" autofocus />
      <div class="mb-3">
        <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea v-model="newFavoriteNote" placeholder="请输入收藏夹备注..." class="border rounded px-2 py-1 w-full"
          rows="3"></textarea>
      </div>
      <div class="flex justify-end">
        <button class="modal-btn modal-btn-secondary mr-2" @click="showCreateFavoriteModal = false">取消</button>
        <button class="modal-btn modal-btn-primary" @click="createFavorite">创建</button>
      </div>
    </div>
  </div>

  <!-- 编辑收藏夹弹窗 -->
  <div v-if="showEditFavoriteModal"
    class="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-[1000]">
    <div class="bg-white rounded-xl p-6 shadow-xl w-[480px]">
      <h4 class="font-bold mb-2">编辑收藏夹</h4>
      <input v-model="editFavoriteTitle" placeholder="收藏夹名称" class="border rounded px-2 py-1 w-full mb-3"
        @keyup.enter="updateFavorite" ref="editInput" autofocus />
      <div class="mb-3">
        <label class="block text-sm font-medium text-gray-700 mb-1">备注</label>
        <textarea v-model="editFavoriteNote" placeholder="请输入收藏夹备注..." class="border rounded px-2 py-1 w-full"
          rows="3"></textarea>
      </div>
      <div class="flex justify-end">
        <button class="modal-btn modal-btn-secondary mr-2" @click="showEditFavoriteModal = false">取消</button>
        <button class="modal-btn modal-btn-primary" @click="updateFavorite">保存</button>
      </div>
    </div>
  </div>

  <!-- 添加收藏项弹窗 -->
  <div v-if="showCreateItemModal"
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-[1000]">
    <div class="bg-white rounded-xl p-6 shadow-xl" style="width:1280px;height:600px;overflow:hidden;">
      <div class="flex h-full">
        <!-- 左侧搜索 -->
        <div class="w-1/2 pr-6 border-r border-gray-200 flex flex-col">
          <h4 class="text-xl font-semibold text-gray-800 mb-4">搜索收藏项</h4>

          <!-- 收藏夹选择提示 -->
          <div v-if="!selectedFavorite" class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-center text-yellow-800">
              <el-icon :size="14"><InfoFilled /></el-icon>
              <span class="text-sm font-medium">请先在左侧选择一个收藏夹</span>
            </div>
          </div>

          <div class="relative">
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
          </div>
          <p v-if="selectedLocation" class="mt-2 text-sm text-gray-600" data-selected-location>
            已选择：{{ selectedLocation.name }}
          </p>
        </div>

        <!-- 右侧预览 -->
        <div class="w-1/2 pl-4 flex flex-col">
          <h4 class="font-bold mb-2">添加收藏项</h4>

          <!-- 收藏夹信息显示 -->
          <div v-if="selectedFavorite" class="mb-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
            <div class="text-sm" style="color:#1e2a3a">
              <span class="font-medium">目标收藏夹：</span>"{{ selectedFavorite.title }}"
            </div>
          </div>

          <div v-if="selectedLocation" class="bg-emerald-50 rounded-lg p-4 shadow-sm border border-emerald-100">
            <div class="font-medium text-lg mb-2">{{ selectedLocation.name }}</div>
            <div class="text-sm text-gray-600 mb-1">
              <span class="font-medium">地址：</span>{{ selectedLocation.address }}
            </div>
            <div v-if="selectedLocation.province" class="text-sm text-gray-600">
              <span class="font-medium">地区：</span>
              {{ selectedFavorite.province }}{{ selectedLocation.city }}{{ selectedLocation.district }}
            </div>
          </div>
          <div v-else class="text-gray-400 flex items-center justify-center h-full">
            请从左侧选择要收藏的地点
          </div>
          <div class="mt-auto flex justify-end space-x-2">
            <button class="modal-btn modal-btn-secondary" @click="showCreateItemModal = false">取消</button>
            <button class="modal-btn modal-btn-primary" :disabled="!selectedLocation || !selectedFavorite"
              @click="addFavoriteItem">添加</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import api from '../../services/api';
import emitter from '../../eventBus';
import { Star, Folder, Edit, Delete, InfoFilled, Search } from '@element-plus/icons-vue';

const props = defineProps({
  visible: Boolean
});
const emit = defineEmits(['close']);

// 组件挂载状态
const isMounted = ref(false);
// 存储所有 pending 的请求
const pendingRequests = ref([]);

// 收藏夹相关状态
const favoritesList = ref([]);
const loading = ref(false);
const showCreateFavoriteModal = ref(false);
const showEditFavoriteModal = ref(false);
const newFavoriteTitle = ref('');
const newFavoriteNote = ref('');
const editFavoriteTitle = ref('');
const editFavoriteNote = ref('');
const editingFavorite = ref(null);
const selectedFavorite = ref(null);
const favoriteItems = ref([]);

// 收藏项相关状态
const showCreateItemModal = ref(false);
const searchKeyword = ref('');
const showSearchResults = ref(false);
const filteredLocations = ref([]);
const selectedLocation = ref(null);

// 新增：从地图弹窗接收的地点信息
const mapLocationData = ref(null);

// 已解耦类型，此函数保留但返回空字符串
const getLocationTypeName = (type) => {
  return '';
};

// 加载收藏夹列表
const loadFavorites = async () => {
  loading.value = true;
  const controller = new AbortController();
  pendingRequests.value.push(controller);

  try {
    const res = await api.getAllFavorites({ signal: controller.signal });
    if (isMounted.value) {
      favoritesList.value = res.data.map(fav => ({
        ...fav,
        item_count: fav.item_count || 0
      })).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  } finally {
    if (isMounted.value) {
      loading.value = false;
    }
  }
};

// 加载收藏项
const loadFavoriteItems = async (favId) => {
  if (!favId) return;
  try {
    const controller = new AbortController();
    pendingRequests.value.push(controller);

    const res = await api.getFavoriteItems(favId, { signal: controller.signal });
    if (isMounted.value) {
      favoriteItems.value = res.data;
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  }
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

  const controller = new AbortController();
  pendingRequests.value.push(controller);

  api.searchAmapLocations(searchKeyword.value, { signal: controller.signal })
    .then(res => {
      if (isMounted.value) {
        filteredLocations.value = Array.isArray(res?.data) ? res.data : [];
        showSearchResults.value = true;
      }
    })
    .catch(e => {
      if (e.name !== 'AbortError') {
        console.error('搜索地点失败:', e);
      }
    });
};

// 选择地点
const selectLocation = (loc) => {
  if (isMounted.value) {
    selectedLocation.value = loc;
    showSearchResults.value = false;
  }
};

// 点击弹窗空白处收起下拉
const handleClickOutside = (e) => {
  if (isMounted.value && !e.target.closest('.relative')) {
    showSearchResults.value = false;
  }
};

// 创建收藏夹
const createFavorite = async () => {
  if (!newFavoriteTitle.value.trim()) {
    alert('请输入收藏夹名称');
    return;
  }

  const controller = new AbortController();
  pendingRequests.value.push(controller);

  try {
    await api.createFavorite({
      title: newFavoriteTitle.value.trim(),
      notes: newFavoriteNote.value
    }, { signal: controller.signal });

    if (isMounted.value) {
      showCreateFavoriteModal.value = false;
      newFavoriteTitle.value = '';
      newFavoriteNote.value = '';
      loadFavorites();
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  }
};

// 显示编辑弹窗
const openEditFavoriteModal = (fav, event) => {
  event.stopPropagation();
  editingFavorite.value = fav;
  editFavoriteTitle.value = fav.title;
  editFavoriteNote.value = fav.notes || '';
  showEditFavoriteModal.value = true;
};

// 更新收藏夹
const updateFavorite = async () => {
  if (!editFavoriteTitle.value.trim()) {
    alert('请输入收藏夹名称');
    return;
  }

  const controller = new AbortController();
  pendingRequests.value.push(controller);

  try {
    await api.updateFavorite(editingFavorite.value.fav_id, {
      title: editFavoriteTitle.value.trim(),
      notes: editFavoriteNote.value
    }, { signal: controller.signal });

    if (isMounted.value) {
      showEditFavoriteModal.value = false;
      loadFavorites();
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  }
};

// 删除收藏夹
const deleteFavorite = async (favId, event) => {
  event.stopPropagation();
  if (!confirm('确定要删除该收藏夹吗？此操作不可撤销。')) return;

  const controller = new AbortController();
  pendingRequests.value.push(controller);

  try {
    await api.deleteFavorite(favId, { signal: controller.signal });
    if (isMounted.value) {
      loadFavorites();
      selectedFavorite.value = null;
      favoriteItems.value = [];
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  }
};

// 选择收藏夹
const selectFavorite = (fav) => {
  if (!fav || !fav.fav_id) return;
  selectedFavorite.value = fav;
  loadFavoriteItems(fav.fav_id);
};

// 添加收藏项
const addFavoriteItem = async () => {
  if (!selectedLocation.value) {
    alert('请选择要收藏的地点');
    return;
  }

  if (!selectedFavorite.value) {
    alert('请先选择一个收藏夹');
    return;
  }

  try {
    const controller = new AbortController();
    pendingRequests.value.push(controller);

    await api.addFavoriteItem(selectedFavorite.value.fav_id, {
      name: selectedLocation.value.name,
      address: selectedLocation.value.address,
      longitude: selectedLocation.value.longitude ?? null,
      latitude: selectedLocation.value.latitude ?? null,
    }, { signal: controller.signal });

    if (isMounted.value) {
      showCreateItemModal.value = false;
      selectedLocation.value = null;
      searchKeyword.value = '';
      loadFavoriteItems(selectedFavorite.value.fav_id);
    }
  } catch (e) {
    if (e.name !== 'AbortError') {
      api.handleError(e);
    }
  }
};

// 删除收藏项
const deleteFavoriteItem = async (favId, itemId) => {
  if (confirm('确定删除该收藏项吗？')) {
    try {
      await api.deleteFavoriteItem(favId, itemId);
      loadFavoriteItems(selectedFavorite.value.fav_id);
    } catch (e) {
      api.handleError(e);
    }
  }
};

// 监听从地图弹窗传来的地点信息
const handleAddToCollection = (locationData) => {
  console.log('MyCollectionModal: 收到 add-to-collection 事件', locationData);

  // 防止重复处理同一个事件
  if (mapLocationData.value &&
    mapLocationData.value.name === locationData.name &&
    mapLocationData.value.address === locationData.address) {
    console.log('MyCollectionModal: 跳过重复事件');
    return;
  }

  if (locationData && locationData.name) {
    mapLocationData.value = locationData;
    console.log('MyCollectionModal: 设置地点信息', locationData);

    // 自动填入搜索框和选择地点
    searchKeyword.value = locationData.name;
    console.log('MyCollectionModal: 设置 searchKeyword:', searchKeyword.value);

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
    console.log('MyCollectionModal: 设置 selectedLocation', selectedLocation.value);

    // 自动打开添加收藏项弹窗
    showCreateItemModal.value = true;
    console.log('MyCollectionModal: 弹窗状态', {
      showCreateItemModal: showCreateItemModal.value,
      searchKeyword: searchKeyword.value,
      selectedLocation: selectedLocation.value
    });

    // 延迟检查DOM状态
    setTimeout(() => {
      const searchInput = document.querySelector('[data-search-keyword]');
      const selectedLocationEl = document.querySelector('[data-selected-location]');
      console.log('MyCollectionModal: DOM状态检查', {
        searchInput: searchInput?.value,
        selectedLocationEl: selectedLocationEl?.textContent,
        searchKeywordRef: searchKeyword.value,
        selectedLocationRef: selectedLocation.value,
        selectedFavorite: selectedFavorite.value
      });
    }, 100);

  } else {
    console.log('MyCollectionModal: 地点数据无效', locationData);
  }
};

// 初始化加载
onMounted(() => {
  isMounted.value = true;
  console.log('MyCollectionModal: 组件开始挂载');

  // 监听事件 - 只注册一次
  emitter.off('add-to-collection', handleAddToCollection); // 先移除，防止重复
  emitter.on('add-to-collection', handleAddToCollection);
  console.log('MyCollectionModal: 事件监听器已注册，等待事件...');

  // 如果当前可见，则加载数据
  if (props.visible) {
    loadFavorites();
  }

  document.addEventListener('click', handleClickOutside);

  // 延迟检查事件监听器状态
  setTimeout(() => {
    console.log('MyCollectionModal: 挂载完成，事件监听器状态检查');
    console.log('MyCollectionModal: isMounted =', isMounted.value);
    console.log('MyCollectionModal: 事件监听器数量 =', emitter.events['add-to-collection']?.length || 0);
  }, 100);
});

// 监听visible属性变化
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    console.log('MyCollectionModal: 模态框变为可见，加载收藏夹数据');
    // 当模态框变为可见时，加载收藏夹数据
    loadFavorites();
  }
}, { immediate: true });

// 组件卸载时清理
onUnmounted(() => {
  isMounted.value = false;
  pendingRequests.value.forEach(controller => {
    controller.abort();
  });
  pendingRequests.value = [];
  document.removeEventListener('click', handleClickOutside);

  // 移除事件监听
  emitter.off('add-to-collection', handleAddToCollection);
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

/* 卡片列表 */
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
input, textarea {
  border: 2px solid #1a1a1a !important;
  font-family: var(--font-sans) !important;
  padding: 8px 12px !important;
}
input:focus, textarea:focus {
  border-color: var(--bauhaus-red) !important;
  outline: none;
}

/* 弹窗内的弹窗 */
.fixed.inset-0 > .bg-white {
  border: 3px solid #1a1a1a !important;
  box-shadow: 6px 6px 0 rgba(0,0,0,0.08) !important;
}

@media (prefers-reduced-motion: reduce) {
  .modal { animation: none; }
}
</style>