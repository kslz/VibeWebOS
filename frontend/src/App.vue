<script setup lang="ts">
import { systemConfig } from '@/config/systemConfig';
import { useThemeStore } from '@/stores/themeStore';

const themeStore = useThemeStore();
</script>

<template>
  <main class="vibe-webos" :data-theme="themeStore.mode">
    <section class="vibe-webos__panel" aria-label="VibeWebOS placeholder">
      <p class="vibe-webos__eyebrow">{{ systemConfig.systemName }} MVP</p>
      <h1>欢迎来到 {{ systemConfig.systemName }}</h1>
      <p>{{ systemConfig.aboutText }}</p>
      <button class="vibe-webos__theme-toggle" type="button" @click="themeStore.toggleTheme">
        切换{{ themeStore.mode === 'light' ? '深色' : '浅色' }}主题
      </button>
    </section>
  </main>
</template>

<style lang="scss">
.vibe-webos {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 24px;
  color: var(--color-text-primary);
  background: var(--color-desktop-bg);
  transition:
    color 160ms ease,
    background 160ms ease;
}

.vibe-webos__panel {
  width: min(560px, 100%);
  padding: 32px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel-bg);
  box-shadow: var(--shadow-window);
  text-align: center;
  transition:
    border-color 160ms ease,
    background 160ms ease,
    box-shadow 160ms ease;
}

.vibe-webos__eyebrow {
  margin: 0 0 8px;
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0 0 12px;
  font-size: clamp(32px, 6vw, 48px);
  line-height: 1.1;
}

p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.vibe-webos__theme-toggle {
  min-width: 132px;
  margin-top: 24px;
  padding: 10px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: #ffffff;
  background: var(--color-accent);
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.24);
}
</style>
