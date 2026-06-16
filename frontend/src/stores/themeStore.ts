import { defineStore } from 'pinia';
import { ref } from 'vue';

import { systemConfig } from '@/config/systemConfig';
import type { ThemeMode } from '@/types/app';

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(systemConfig.defaultTheme);

  function setTheme(nextMode: ThemeMode) {
    mode.value = nextMode;
  }

  function toggleTheme() {
    mode.value = mode.value === 'light' ? 'dark' : 'light';
  }

  return {
    mode,
    setTheme,
    toggleTheme,
  };
});
