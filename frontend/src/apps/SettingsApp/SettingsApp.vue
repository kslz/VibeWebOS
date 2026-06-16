<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore';
import { useWindowStore } from '@/stores/windowStore';
import type { ThemeMode } from '@/types/app';

const themeStore = useThemeStore();
const windowStore = useWindowStore();

const themeOptions: Array<{ label: string; value: ThemeMode }> = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
];
</script>

<template>
  <section class="settings-app">
    <header class="settings-app__header">
      <p class="settings-app__eyebrow">系统设置</p>
      <h2>外观</h2>
    </header>
    <div class="settings-app__panel">
      <span class="settings-app__label">主题模式</span>
      <div class="settings-app__segments" role="group" aria-label="主题模式">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          class="settings-app__segment"
          :class="{ 'settings-app__segment--active': themeStore.mode === option.value }"
          type="button"
          @click="themeStore.setTheme(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
    <button class="settings-app__about" type="button" @click="windowStore.openWindow('about')">
      关于系统
    </button>
  </section>
</template>

<style lang="scss" scoped>
.settings-app {
  display: grid;
  align-content: start;
  gap: 16px;
  padding: 24px;
}

.settings-app__header {
  display: grid;
  gap: 6px;
}

.settings-app__eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 700;
}

.settings-app h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 24px;
}

.settings-app__panel {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: rgba(148, 163, 184, 0.08);
}

.settings-app__label {
  color: var(--color-text-secondary);
  font-size: 13px;
}

.settings-app__segments {
  display: inline-grid;
  grid-template-columns: repeat(2, minmax(72px, 1fr));
  width: min(220px, 100%);
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-panel-bg);
}

.settings-app__segment {
  height: 32px;
  border: 0;
  border-radius: 6px;
  color: var(--color-text-secondary);
  background: transparent;
}

.settings-app__segment--active {
  color: #ffffff;
  background: var(--color-accent);
}

.settings-app__about {
  justify-self: start;
  height: 38px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  background: var(--color-panel-bg);
}
</style>
