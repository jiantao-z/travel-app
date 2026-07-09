

<template>
  <div v-if="visible" class="modal" @click.self="handleOutsideClick">
    <div class="modal-content">
      <div class="modal-header">
        <h2 class="modal-title"><el-icon :size="20" color="#56ab7a"><Setting /></el-icon>{{ t('systemSettings') }}</h2>
        <span class="close" @click="close">&times;</span>
      </div>
    <div class="modal-body">
                <div class="mt-4 space-y-4">
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="font-medium text-gray-800 mb-3">{{ t('appearanceSettings') }}</h3>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <span>{{ t('themeMode') }}</span>
                                <div class="flex items-center">
                                    <button 
                                        @click="setTheme('light')"
                                        :class="[
                                            'px-3 py-1 rounded-l-md transition-colors',
                                            currentTheme === 'light' 
                                                ? ' text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        ]"
                                        :style="currentTheme === 'light' ? {background:'var(--accent)'} : {}""
                                    >
                                        {{ t('light') }}
                                    </button>
                                    <button 
                                        @click="setTheme('dark')"
                                        :class="[
                                            'px-3 py-1 rounded-r-md transition-colors',
                                            currentTheme === 'dark' 
                                                ? ' text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        ]"
                                        :style="currentTheme === 'dark' ? {background:'var(--accent)'} : {}"
                                    >
                                        {{ t('dark') }}
                                    </button>
                                </div>
                            </div>
                            <div class="flex items-center justify-between">
                                <span>{{ t('mapStyle') }}</span>
                                <select :value="currentMapStyle" class="px-3 py-1 border border-gray-300 rounded-md" name="map-style" @change="onMapStyleChange">
                                    <option value="0">{{ t('standard') }}</option>
                                    <option value="1">{{ t('satellite') }}</option>
                                    <option value="2">{{ t('navigation') }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h3 class="font-medium text-gray-800 mb-3">{{ t('languageAndRegion') }}</h3>
                        <div>
                            <div class="flex items-center justify-between">
                                <span>{{ t('displayLanguage') }}</span>
                                <select 
                                    :value="currentLanguage" 
                                    class="px-3 py-1 border border-gray-300 rounded-md" 
                                    name="language"
                                    @change="onLanguageChange"
                                >
                                    <option value="zh">{{ t('simplifiedChinese') }}</option>
                                    <option value="en">{{ t('english') }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

      <div class="modal-footer">
        <button class="modal-btn modal-btn-secondary" @click="close">{{ t('cancel') }}</button>
        <button class="modal-btn modal-btn-primary" @click="saveSettings">{{ t('saveSettings') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';
import emitter, { currentMapStyle, currentLanguage, currentTheme } from '@/eventBus'
import { Setting } from '@element-plus/icons-vue'

const props = defineProps({
  visible: Boolean
});

const emit = defineEmits(['close']);

// 语言包
const translations = {
  zh: {
    systemSettings: '系统设置',
    appearanceSettings: '外观设置',
    themeMode: '主题模式',
    light: '浅色',
    dark: '深色',
    mapStyle: '地图样式',
    standard: '标准',
    satellite: '卫星',
    navigation: '导航',
    languageAndRegion: '语言与地区',
    displayLanguage: '显示语言',
    simplifiedChinese: '简体中文',
    english: 'English',
    cancel: '取消',
    saveSettings: '保存设置'
  },
  en: {
    systemSettings: 'System Settings',
    appearanceSettings: 'Appearance Settings',
    themeMode: 'Theme Mode',
    light: 'Light',
    dark: 'Dark',
    mapStyle: 'Map Style',
    standard: 'Standard',
    satellite: 'Satellite',
    navigation: 'Navigation',
    languageAndRegion: 'Language & Region',
    displayLanguage: 'Display Language',
    simplifiedChinese: '简体中文',
    english: 'English',
    cancel: 'Cancel',
    saveSettings: 'Save Settings'
  }
};

// 翻译函数
const t = (key) => {
  return translations[currentLanguage.value][key] || key;
};

const onMapStyleChange = (event) => {
  const value = event.target.value
  currentMapStyle.value = value
  emitter.emit('map-style-changed', value)
}

const onLanguageChange = (event) => {
  const value = event.target.value
  currentLanguage.value = value
  emitter.emit('language-changed', value)
}

const setTheme = (theme) => {
  currentTheme.value = theme
  emitter.emit('theme-changed', theme)
  // 应用主题到 body
  document.body.className = theme === 'dark' ? 'dark' : ''
}

const saveSettings = () => {
  // 保存设置到 localStorage
  localStorage.setItem('language', currentLanguage.value)
  localStorage.setItem('theme', currentTheme.value)
  localStorage.setItem('mapStyle', currentMapStyle.value)
  
  // 触发设置保存事件
  emitter.emit('settings-saved', {
    language: currentLanguage.value,
    theme: currentTheme.value,
    mapStyle: currentMapStyle.value
  })
  
  close()
}

// 初始化设置
const initSettings = () => {
  // 从 localStorage 读取设置
  const savedLanguage = localStorage.getItem('language')
  const savedTheme = localStorage.getItem('theme')
  const savedMapStyle = localStorage.getItem('mapStyle')
  
  if (savedLanguage) currentLanguage.value = savedLanguage
  if (savedTheme) {
    currentTheme.value = savedTheme
    document.body.className = savedTheme === 'dark' ? 'dark' : ''
  }
  if (savedMapStyle) currentMapStyle.value = savedMapStyle
}

// 组件挂载时初始化设置
initSettings()

// 关闭模态框
const close = () => {
  emit('close');
};

// 点击模态框外部关闭
const handleOutsideClick = (event) => {
  if (event.target.classList.contains('modal')) {
    close();
  }
};
</script>

<style scoped>
.modal {
  display: block;
  position: fixed;
  z-index: 9999;
  left: 0; top: 0;
  width: 100%; height: 100%;
  overflow: auto;
  background-color: rgba(0,0,0,0.5);
  animation: fadeIn 0.25s ease-out forwards;
}

.modal-content {
  background-color: #ffffff;
  margin: 10% auto;
  border: 3px solid #1a1a1a;
  box-shadow: 6px 6px 0 rgba(0,0,0,0.08);
  width: 80%;
  max-width: 600px;
  overflow: hidden;
}

.modal-header {
  padding: 20px 28px;
  background-color: #1a1a1a;
  border-bottom: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header .modal-title { color: #fff !important; font-weight: 900; }

.modal-title {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--text-primary);
  display: flex; align-items: center; gap: 8px;
}

.close {
  color: rgba(255,255,255,0.5);
  font-size: 1.5rem;
  font-weight: bold;
  transition: color 0.2s;
  cursor: pointer;
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
}
.close:hover { color: #fff; }

.modal-body {
  padding: 28px;
  line-height: 1.6;
  color: #1a1a1a;
}

.modal-footer {
  padding: 18px 28px;
  background-color: #f8f6f3;
  border-top: 2px solid #e0dcd5;
  display: flex;
  justify-content: flex-end;
}

.modal-btn {
  padding: 10px 22px;
  font-weight: 700;
  font-size: 13px;
  transition: all var(--duration-fast) var(--ease-out);
  margin-left: 10px;
  cursor: pointer;
  border: 2px solid transparent;
  font-family: var(--font-sans);
  letter-spacing: 0.5px;
}

.modal-btn-primary {
  background: #1a1a1a;
  color: #fff;
  border-color: #1a1a1a;
}
.modal-btn-primary:hover { background: var(--bauhaus-red); border-color: var(--bauhaus-red); }

.modal-btn-secondary {
  background-color: #ffffff;
  color: #1a1a1a;
  border-color: #1a1a1a;
}
.modal-btn-secondary:hover { background: #f8f6f3; }

/* 设置项卡片 */
.bg-gray-50 {
  background: #f8f6f3 !important;
  border: 2px solid #e0dcd5 !important;
  padding: 18px !important;
}

/* 主题切换按钮 */
button.rounded-l-md, button.rounded-r-md { border-radius: 0 !important; border: 2px solid #1a1a1a !important; }

select {
  border: 2px solid #1a1a1a !important;
  padding: 6px 12px !important;
  font-weight: 600 !important;
  font-family: var(--font-sans) !important;
  background: #fff !important;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

@media (max-width: 768px) {
  .modal-content { width: 90%; margin: 15% auto; }
}
</style>