<template>
  <div id="pointview" :class="{ 'dark-mode': isDarkMode }">
    <span class="pv-dot"></span>
    <span class="pv-text">{{ point }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { currentTheme } from '@/eventBus';

defineProps({
  point: { type: String, default: "" }
})

const isDarkMode = computed(() => currentTheme.value === 'dark');
</script>

<style scoped>
#pointview {
  position: absolute;
  bottom: 100px;
  left: 32px;
  width: auto;
  height: auto;
  min-height: 5px;
  padding: 8px 14px 8px 10px;
  white-space: pre-line;
  font-size: 11px;
  color: #1a1a1a;
  z-index: 9999;
  background: #ffffff;
  border: 2px solid #1a1a1a;
  font-family: var(--font-mono);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pv-dot {
  width: 5px;
  height: 5px;
  background: var(--bauhaus-red);
  flex-shrink: 0;
  animation: pvBlink 1.5s ease-in-out infinite;
}

@keyframes pvBlink {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.3;
  }
}

#pointview.dark-mode {
  background: #1c1c1c;
  color: #e8e6e3;
  border-color: #3a3a3a;
}
</style>
