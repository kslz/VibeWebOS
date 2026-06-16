<script setup lang="ts">
import DesktopIcon from '@/components/desktop/DesktopIcon.vue';
import StartMenu from '@/components/desktop/StartMenu.vue';
import Taskbar from '@/components/desktop/Taskbar.vue';
import WindowManager from '@/components/window/WindowManager.vue';
import { systemConfig } from '@/config/systemConfig';
import { useDesktopStore } from '@/stores/desktopStore';
import { useThemeStore } from '@/stores/themeStore';
import { useWindowStore } from '@/stores/windowStore';

const desktopStore = useDesktopStore();
const themeStore = useThemeStore();
const windowStore = useWindowStore();
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

    </section>

    <WindowManager />
    <StartMenu
      v-if="desktopStore.isStartMenuOpen"
      :apps="desktopStore.desktopApps"
      @open="desktopStore.openApp"
    />
    <Taskbar
      :active-window-id="windowStore.activeWindowId"
      :start-menu-open="desktopStore.isStartMenuOpen"
      :status-text="desktopStore.selectedAppTitle"
      :windows="windowStore.openWindows"
      @toggle-start="desktopStore.toggleStartMenu"
      @toggle-window="windowStore.toggleWindowFromTaskbar"
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

</style>
