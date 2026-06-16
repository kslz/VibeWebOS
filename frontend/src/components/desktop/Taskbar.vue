<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import type { WindowState } from '@/types/window';

defineProps<{
  activeWindowId: string | null;
  startMenuOpen: boolean;
  statusText: string;
  windows: WindowState[];
}>();

defineEmits<{
  toggleStart: [];
  toggleWindow: [windowId: string];
}>();

const now = ref(new Date());
let timerId: number | undefined;

const currentTime = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now.value),
);

const currentDate = computed(() =>
  new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(now.value),
);

onMounted(() => {
  timerId = window.setInterval(() => {
    now.value = new Date();
  }, 60_000);
});

onBeforeUnmount(() => {
  if (timerId !== undefined) {
    window.clearInterval(timerId);
  }
});
</script>

<template>
  <footer class="taskbar" aria-label="任务栏">
    <button
      class="taskbar__start"
      type="button"
      :aria-expanded="startMenuOpen"
      aria-label="开始"
      @click="$emit('toggleStart')"
    >
      <span aria-hidden="true">⊞</span>
    </button>
    <div class="taskbar__windows" aria-label="打开的窗口">
      <button
        v-for="window in windows"
        :key="window.id"
        class="taskbar__window"
        :class="{ 'taskbar__window--active': activeWindowId === window.id && !window.minimized }"
        type="button"
        @click="$emit('toggleWindow', window.id)"
      >
        {{ window.title }}
      </button>
      <span v-if="windows.length === 0" class="taskbar__placeholder">{{ statusText }}</span>
    </div>
    <div class="taskbar__status" aria-label="系统状态">
      <span class="taskbar__network" aria-hidden="true">Wi-Fi</span>
      <time class="taskbar__clock" :datetime="now.toISOString()">
        <span>{{ currentTime }}</span>
        <span>{{ currentDate }}</span>
      </time>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.taskbar {
  position: absolute;
  right: 12px;
  bottom: 10px;
  left: 12px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  height: 48px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-taskbar-bg);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.18);
  backdrop-filter: blur(20px);
}

.taskbar__start {
  display: grid;
  width: 38px;
  height: 34px;
  place-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--color-text-primary);
  background: transparent;
  font-size: 20px;
}

.taskbar__start:hover,
.taskbar__start:focus-visible,
.taskbar__start[aria-expanded='true'] {
  border-color: var(--color-border);
  background: rgba(148, 163, 184, 0.16);
  outline: none;
}

.taskbar__windows {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  height: 100%;
}

.taskbar__window {
  max-width: 180px;
  height: 34px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--color-text-primary);
  background: rgba(148, 163, 184, 0.1);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taskbar__window:hover,
.taskbar__window:focus-visible,
.taskbar__window--active {
  border-color: var(--color-border);
  background: rgba(148, 163, 184, 0.2);
  outline: none;
}

.taskbar__placeholder {
  max-width: 100%;
  padding: 6px 10px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taskbar__status {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-primary);
  font-size: 12px;
}

.taskbar__network {
  color: var(--color-text-secondary);
}

.taskbar__clock {
  display: grid;
  gap: 1px;
  min-width: 48px;
  text-align: right;
}
</style>
