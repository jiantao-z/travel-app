<template>
  <div class="top-bar">
    <!-- Logo区域 - 几何标识 -->
    <div class="logo-zone">
      <div class="logo-mark">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5"/>
          <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" stroke-width="2.5"/>
          <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2.5"/>
        </svg>
      </div>
      <div class="logo-text-block">
        <h1 class="logo-title">{{ t('appTitle') }}</h1>
        <span class="logo-sub">TRAVEL PLANNER</span>
      </div>
      <div class="logo-accent"></div>
    </div>

    <!-- 搜索和功能区 -->
    <div class="action-zone">
      <SearchBar v-if="view" :view="view" class="search-wrapper" />
      <div class="btn-group">
        <button @click="openModal('ai-planning')" class="top-btn btn-ai">
          <svg class="btn-geo-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          <span>AI规划</span>
        </button>
        <button @click="toggleExplore" class="top-btn btn-explore" :class="{ active: isExploring }">
          <svg class="btn-geo-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"/>
            <polygon points="16 12 12 8 8 12 12 10 16 12"/>
            <line x1="12" y1="10" x2="12" y2="16"/>
          </svg>
          <span>{{ isExploring ? '地图' : '探索' }}</span>
        </button>
        <button @click="openModal('auth')" class="top-btn btn-auth">
          <svg class="btn-geo-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
          </svg>
          <span>{{ isLoggedIn ? '退出' : '登录' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import emitter from '@/eventBus';
import { ref } from 'vue';
import SearchBar from './SearchBar.vue';
import { currentLanguage } from '@/eventBus';

const props = defineProps({
  view: { type: Object, required: false, default: null }
})

const isLoggedIn = ref(!!localStorage.getItem('token'));

const updateLoginStatus = () => {
  isLoggedIn.value = !!localStorage.getItem('token');
};
window.addEventListener('storage', updateLoginStatus);
emitter.on('login-status-changed', updateLoginStatus);

const translations = {
  zh: { appTitle: '智行规划师' },
  en: { appTitle: 'Travel Planner' }
};

const t = (key) => {
  return translations[currentLanguage.value]?.[key] || translations.zh[key] || key;
};

const openModal = (modalName) => {
  emitter.emit('open-modal', modalName);
};

const isExploring = ref(false);
const toggleExplore = () => {
  isExploring.value = !isExploring.value;
  emitter.emit('toggle-explore');
};
</script>

<style scoped>
/* ═══════════════════════════════════
   Bauhaus Geometric TopBar
   ═══════════════════════════════════ */

.top-bar {
  width: 100%;
  height: 5rem;
  display: flex;
  align-items: center;
  padding: 0 28px;
  box-sizing: border-box;
  background: #ffffff;
  border-bottom: 3px solid #1a1a1a;
  position: relative;
  z-index: 100;
}

/* ── Logo ── */
.logo-zone {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.logo-mark {
  color: var(--bauhaus-red);
  display: flex;
  align-items: center;
  width: 44px;
  height: 44px;
  justify-content: center;
  background: #f8f6f3;
  border: 2px solid #1a1a1a;
}

.logo-text-block {
  display: flex;
  flex-direction: column;
}

.logo-title {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
  color: #1a1a1a;
  letter-spacing: 1px;
  line-height: 1.1;
}

.logo-sub {
  font-size: 7px;
  font-weight: 800;
  color: var(--text-muted);
  letter-spacing: 3px;
  text-transform: uppercase;
}

.logo-accent {
  width: 4px;
  height: 28px;
  background: var(--bauhaus-yellow);
}

/* ── 操作区 ── */
.action-zone {
  flex: 1;
  display: flex;
  align-items: center;
  padding-left: 32px;
}

.search-wrapper {
  max-width: 440px;
}

.btn-group {
  margin-left: auto;
  display: flex;
  gap: 0;
}

/* ── 通用按钮 ── */
.top-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  background: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  white-space: nowrap;
  color: #1a1a1a;
  border: 2px solid transparent;
  letter-spacing: 0.5px;
  position: relative;
}

.top-btn:hover {
  border-color: #1a1a1a;
  background: #f8f6f3;
}

.top-btn:active {
  transform: scale(0.97);
}

.btn-geo-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* AI规划 */
.btn-ai {
  color: #ffffff;
  background: #1a1a1a;
  border-color: #1a1a1a;
}
.btn-ai:hover {
  background: var(--bauhaus-red);
  border-color: var(--bauhaus-red);
  color: #fff;
}

/* 探索 */
.btn-explore {
  border-left: none;
}
.btn-explore:hover {
  color: var(--bauhaus-blue);
  border-color: var(--bauhaus-blue);
}
.btn-explore.active {
  background: var(--bauhaus-blue);
  border-color: var(--bauhaus-blue);
  color: #fff;
}

/* 登录 */
.btn-auth {
  border-left: none;
}
.btn-auth:hover {
  background: var(--bauhaus-dark);
  border-color: var(--bauhaus-dark);
  color: #fff;
}

@media (max-width: 768px) {
  .top-bar { padding: 0 14px; }
  .logo-sub { display: none; }
  .logo-accent { display: none; }
  .top-btn { padding: 10px 14px; font-size: 12px; }
  .top-btn span { display: none; }
}
</style>
