<script setup lang="ts">
import AppWindow from '@/components/window/AppWindow.vue';
import { useWindowStore } from '@/stores/windowStore';

const windowStore = useWindowStore();
</script>

<template>
  <section class="window-manager" aria-label="窗口区域">
    <AppWindow
      v-for="window in windowStore.visibleWindows"
      :key="window.id"
      :active="windowStore.activeWindowId === window.id"
      :window="window"
      @close="windowStore.closeWindow"
      @focus="windowStore.focusWindow"
      @maximize="windowStore.toggleMaximizeWindow"
      @minimize="windowStore.minimizeWindow"
    />
  </section>
</template>

<style lang="scss" scoped>
.window-manager {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.window-manager :deep(.app-window) {
  pointer-events: auto;
}
</style>
