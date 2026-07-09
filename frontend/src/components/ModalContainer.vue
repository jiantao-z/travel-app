<template>
  <!-- 动态渲染当前激活的模态框 -->
  <component 
    :is="currentModal" 
    v-if="currentModal"
    :visible="modalVisible"
    @close="closeModal"
  />
</template>

<script setup>
import emitter from '@/eventBus'
import { ref, shallowRef, onMounted, onUnmounted } from 'vue' // 添加所有需要的API
// 导入所有模态框组件



import AuthModal from '@/components/modals/AuthModal.vue';
import MyCollectionModal from '@/components/modals/MyCollectionModal.vue';
import TravelPlanManagement from '@/components/travel/TravelPlanManagement.vue';
import SystemSettingsModal from '@/components/modals/SystemSettingsModal.vue';
import AiPlanningModal from '@/components/modals/AiPlanningModal.vue';

// 模态框组件映射
const modals = {
  
  'ai-planning': AiPlanningModal,
  
  'my-collection': MyCollectionModal,
  'auth': AuthModal,
  'travel-plan-management': TravelPlanManagement,
  'system-settings': SystemSettingsModal,
};

const currentModal = shallowRef(null);
const modalVisible = ref(false);

const modalState = shallowRef({})
const restrictedModals = [
  'route-planning',
  'route-sharing',
  'location-marking',
  'travel-plan-management',
  'my-collection',
  'attraction-recommendation',
];

// 打开模态框
const openModal = (modalName) => {
  // 登录拦截：如果是受限功能且未登录，弹出登录弹窗
  const isRestricted = restrictedModals.includes(modalName);
  const isLoggedIn = !!localStorage.getItem('token');
  if (isRestricted && !isLoggedIn) {
    // 可选：alert('请先登录！');
    currentModal.value = modals['auth'];
    modalVisible.value = true;
    return;
  }
  console.log('Opening modal:', modalName); // 添加调试日志
  
  // 先设置模态框组件
  currentModal.value = modals[modalName];
  
  // 延迟显示，确保组件完全挂载
  setTimeout(() => {
    modalVisible.value = true;
  }, 100);
};

// 关闭模态框
const closeModal = () => {
  modalVisible.value = false;
  // 延迟清除当前模态框引用，确保动画完成
  setTimeout(() => {
    currentModal.value = null;
  }, 300);
};

// 注册事件监听
emitter.on('open-modal', openModal);
</script>