import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { systemConfig } from '@/config/systemConfig';
import { useThemeStore } from './themeStore';

describe('theme store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('starts from the configured default theme', () => {
    const store = useThemeStore();

    expect(store.mode).toBe(systemConfig.defaultTheme);
  });

  it('sets the active theme explicitly', () => {
    const store = useThemeStore();

    store.setTheme('dark');
    expect(store.mode).toBe('dark');

    store.setTheme('light');
    expect(store.mode).toBe('light');
  });

  it('toggles between light and dark modes in memory', () => {
    const store = useThemeStore();

    store.setTheme('light');
    store.toggleTheme();
    expect(store.mode).toBe('dark');

    store.toggleTheme();
    expect(store.mode).toBe('light');
  });
});
