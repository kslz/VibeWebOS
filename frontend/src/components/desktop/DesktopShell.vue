<script setup lang="ts">
import { computed } from 'vue';

import DesktopIcon from '@/components/desktop/DesktopIcon.vue';
import StartMenu from '@/components/desktop/StartMenu.vue';
import Taskbar from '@/components/desktop/Taskbar.vue';
import { systemConfig } from '@/config/systemConfig';
import { useDesktopStore } from '@/stores/desktopStore';
import { useThemeStore } from '@/stores/themeStore';

const desktopStore = useDesktopStore();
const themeStore = useThemeStore();

const themeToggleText = computed(() => (themeStore.mode === 'light' ? '深色' : '浅色'));
</script>

<template>
  <main class="desktop-shell" :data-theme="themeStore.mode" @click.self="desktopStore.closeStartMenu">
    <section class="desktop-shell__workspace" :aria-label="`${systemConfig.systemName} 桌面`">
      <div class="desktop-shell__icons" aria-label="桌面图标">
        <DesktopIcon
          v-for="app in desktopStore.desktopApps"
          :id="app.id"
          :key="app.id"
          :title="app.title"
          :description="app.description"
          :icon-symbol="app.iconSymbol"
          @open="desktopStore.openApp"
        />
      </div>

      <button class="desktop-shell__theme-toggle" type="button" @click="themeStore.toggleTheme">
        切换{{ themeToggleText }}主题
      </button>
    </section>

    <StartMenu
      v-if="desktopStore.isStartMenuOpen"
      :apps="desktopStore.desktopApps"
      @open="desktopStore.openApp"
    />
    <Taskbar
      :start-menu-open="desktopStore.isStartMenuOpen"
      :status-text="desktopStore.selectedAppTitle"
      @toggle-start="desktopStore.toggleStartMenu"
    />
  </main>
</template>

<style lang="scss" scoped>
.desktop-shell {
  position: relative;
  min-width: 320px;
  min-height: 100vh;
  overflow: hidden;
  color: var(--color-text-primary);
  background: var(--color-desktop-bg);
  transition:
    color 160ms ease,
    background 160ms ease;
}

.desktop-shell__workspace {
  position: absolute;
  inset: 0;
  padding: 28px 24px 74px;
}

.desktop-shell__icons {
  display: grid;
  grid-auto-flow: row;
  grid-template-columns: 86px;
  align-content: start;
  gap: 12px;
}

.desktop-shell__theme-toggle {
  position: absolute;
  top: 24px;
  right: 24px;
  min-width: 132px;
  padding: 10px 16px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 8px;
  color: #ffffff;
  background: rgba(15, 23, 42, 0.34);
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.2);
  backdrop-filter: blur(12px);
}

.desktop-shell__theme-toggle:hover,
.desktop-shell__theme-toggle:focus-visible {
  border-color: rgba(255, 255, 255, 0.48);
  background: rgba(15, 23, 42, 0.46);
  outline: none;
}
</style>
