<script setup lang="ts">
import { computed } from 'vue';

import WindowTitleBar from '@/components/window/WindowTitleBar.vue';
import type { WindowState } from '@/types/window';

const props = defineProps<{
  active: boolean;
  window: WindowState;
}>();

defineEmits<{
  close: [windowId: string];
  focus: [windowId: string];
  minimize: [windowId: string];
}>();

const windowStyle = computed(() => ({
  left: `${props.window.x}px`,
  top: `${props.window.y}px`,
  width: `${props.window.width}px`,
  height: `${props.window.height}px`,
  zIndex: props.window.zIndex,
}));

const contentMessage = computed(() => {
  const payload = props.window.content.payload;

  if (payload && typeof payload === 'object' && 'message' in payload) {
    return String((payload as { message: string }).message);
  }

  return '静态窗口内容';
});
</script>

<template>
  <article
    class="app-window"
    :class="{ 'app-window--active': active }"
    :style="windowStyle"
    :aria-label="window.title"
    @pointerdown="$emit('focus', window.id)"
  >
    <WindowTitleBar
      :title="window.title"
      @close="$emit('close', window.id)"
      @minimize="$emit('minimize', window.id)"
    />
    <section class="app-window__body">
      <div v-if="window.error" class="app-window__error" role="alert">{{ window.error }}</div>
      <div v-else class="app-window__placeholder">
        <p class="app-window__kind">{{ window.content.kind }}</p>
        <h2>{{ window.title }}</h2>
        <p>{{ contentMessage }}</p>
      </div>
    </section>
  </article>
</template>

<style lang="scss" scoped>
.app-window {
  position: absolute;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 320px;
  min-height: 220px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-window-bg);
  box-shadow: var(--shadow-window);
}

.app-window--active {
  border-color: color-mix(in srgb, var(--color-accent) 58%, var(--color-border));
}

.app-window__body {
  min-height: 0;
  padding: 20px;
  color: var(--color-text-primary);
  background: var(--color-window-bg);
}

.app-window__placeholder {
  display: grid;
  align-content: center;
  height: 100%;
  gap: 10px;
  text-align: center;
}

.app-window__kind {
  margin: 0;
  color: var(--color-accent);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.app-window__placeholder h2 {
  margin: 0;
  font-size: 24px;
}

.app-window__placeholder p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.app-window__error {
  padding: 12px;
  border: 1px solid #dc2626;
  border-radius: 8px;
  color: #991b1b;
  background: #fee2e2;
}
</style>
