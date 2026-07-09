<template>
  <div class="sidebar">
    <div class="sidebar-inner">
      <!-- 头像区 -->
      <div class="user-badge">
        <div class="avatar-ring">
          <div class="avatar-inner">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="8" r="4"/><path d="M4 22c0-4.4 3.6-8 8-8s8 3.6 8 8"/>
            </svg>
          </div>
        </div>
        <span class="user-label">PANEL</span>
        <div class="user-dot online"></div>
      </div>

      <div class="sidebar-divider">
        <span class="divider-dot"></span>
        <span class="divider-line"></span>
        <span class="divider-dot"></span>
      </div>

      <!-- 收藏 -->
      <button @click="openModal('my-collection')" class="side-btn side-btn--red">
        <div class="side-btn-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <span class="side-btn-label">收藏</span>
        <div class="side-btn-bar" style="background:#c45b3d"></div>
      </button>

      <!-- 行程 -->
      <button @click="openModal('travel-plan-management')" class="side-btn side-btn--yellow">
        <div class="side-btn-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <span class="side-btn-label">行程</span>
        <div class="side-btn-bar" style="background:#d4a44a"></div>
      </button>

      <!-- 洞察 -->
      <button @click="openDashboard" class="side-btn side-btn--teal">
        <div class="side-btn-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path d="M18 20V10M12 20V4M6 20v-6"/>
          </svg>
        </div>
        <span class="side-btn-label">洞察</span>
        <div class="side-btn-bar" style="background:#3d8b7e"></div>
        <div class="side-btn-stat">+12%</div>
      </button>

      <!-- 设置 -->
      <button @click="openModal('system-settings')" class="side-btn side-btn--blue">
        <div class="side-btn-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8l1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
          </svg>
        </div>
        <span class="side-btn-label">设置</span>
        <div class="side-btn-bar" style="background:#2d5f8b"></div>
      </button>

      <!-- 底部状态指示 -->
      <div class="sidebar-footer">
        <div class="footer-stat">
          <span class="footer-stat-num">8.2k</span>
          <span class="footer-stat-label">今日活跃</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import emitter from '@/eventBus';
import { currentLanguage } from '@/eventBus';

const openModal = (modalName) => {
  emitter.emit('open-modal', modalName);
};

const openDashboard = () => {
  emitter.emit('toggle-dashboard');
};
</script>

<style scoped>
/* ═══════════════════════════════════
   Bauhaus Geometric SideBar
   ═══════════════════════════════════ */

.sidebar {
  width: 12rem;
  height: 100%;
  padding: 12px 0;
  box-sizing: border-box;
  background: transparent;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 30;
  pointer-events: none;
}

.sidebar-inner {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 0 8px;
  height: 100%;
  justify-content: center;
}

/* ── 头像 ── */
.user-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0 12px;
  position: relative;
}

.avatar-ring {
  width: 52px;
  height: 52px;
  border: 3px solid #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ffffff;
}

.avatar-inner {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bauhaus-red);
}

.user-label {
  font-size: 9px;
  color: #1a1a1a;
  font-weight: 800;
  letter-spacing: 3px;
}

.user-dot {
  width: 6px;
  height: 6px;
  background: var(--bauhaus-red);
  position: absolute;
  bottom: 10px;
  right: 28px;
}

/* ── 分割线 ── */
.sidebar-divider {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 70%;
  padding: 8px 0;
}

.divider-line {
  flex: 1;
  height: 2px;
  background: #1a1a1a;
}

.divider-dot {
  width: 4px;
  height: 4px;
  background: #1a1a1a;
}

/* ── 按钮 ── */
.side-btn {
  width: calc(100% - 4px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 18px 8px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  background: #ffffff;
  position: relative;
  color: #1a1a1a;
  border: 2px solid transparent;
  margin-bottom: 4px;
  letter-spacing: 1px;
}

.side-btn:hover {
  border-color: #1a1a1a;
  background: #f8f6f3;
}

.side-btn-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 左侧色条 */
.side-btn-bar {
  position: absolute;
  left: 0;
  top: 8px;
  bottom: 8px;
  width: 3px;
  opacity: 0;
  transition: opacity var(--duration-fast);
}
.side-btn:hover .side-btn-bar {
  opacity: 1;
}

/* 色系悬停 */
.side-btn--red:hover  { border-color: var(--bauhaus-red); color: var(--bauhaus-red); }
.side-btn--yellow:hover { border-color: var(--bauhaus-yellow); color: var(--bauhaus-yellow); }
.side-btn--teal:hover  { border-color: var(--bauhaus-teal); color: var(--bauhaus-teal); }
.side-btn--blue:hover  { border-color: var(--bauhaus-blue); color: var(--bauhaus-blue); }

/* 迷你统计 */
.side-btn-stat {
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 8px;
  font-weight: 800;
  color: var(--bauhaus-teal);
  font-family: var(--font-mono);
}

.side-btn-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.5px;
}

/* ── 底部 ── */
.sidebar-footer {
  margin-top: auto;
  padding: 12px 0 8px;
}

.footer-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 16px;
  background: #1a1a1a;
  color: #fff;
}

.footer-stat-num {
  font-size: 16px;
  font-weight: 900;
  font-family: var(--font-mono);
}

.footer-stat-label {
  font-size: 8px;
  font-weight: 600;
  letter-spacing: 2px;
  text-transform: uppercase;
  opacity: 0.6;
}
</style>
