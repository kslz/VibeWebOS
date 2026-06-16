import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import type { BuiltInAppId } from '@/types/app';
import type { WindowContentState, WindowState } from '@/types/window';

const INITIAL_Z_INDEX = 20;
const WINDOW_OFFSET = 32;

const windowTitles: Record<BuiltInAppId, string> = {
  browser: '浏览器',
  appSearch: '应用搜索',
  settings: '设置',
  about: '关于系统',
};

export const useWindowStore = defineStore('window', () => {
  const windows = ref<WindowState[]>([]);
  const activeWindowId = ref<string | null>(null);
  const nextWindowNumber = ref(1);
  const nextZIndex = ref(INITIAL_Z_INDEX);

  const visibleWindows = computed(() => windows.value.filter((window) => !window.minimized));
  const openWindows = computed(() => [...windows.value]);

  function getWindow(windowId: string) {
    return windows.value.find((window) => window.id === windowId);
  }

  function focusWindow(windowId: string) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    nextZIndex.value += 1;
    window.zIndex = nextZIndex.value;
    activeWindowId.value = windowId;
  }

  function openWindow(appId: BuiltInAppId) {
    const index = windows.value.length;
    const title = windowTitles[appId];
    const windowId = `window-${nextWindowNumber.value}`;

    nextWindowNumber.value += 1;
    nextZIndex.value += 1;

    const content: WindowContentState = {
      kind: 'builtin',
      payload: {
        appId,
        message: `${title} 窗口内容将在后续任务中接入。`,
      },
    };

    windows.value.push({
      id: windowId,
      appId,
      title,
      x: 140 + (index % 6) * WINDOW_OFFSET,
      y: 88 + (index % 5) * WINDOW_OFFSET,
      width: 620,
      height: 420,
      zIndex: nextZIndex.value,
      minimized: false,
      maximized: false,
      loading: false,
      error: null,
      content,
    });

    activeWindowId.value = windowId;
    return windowId;
  }

  function closeWindow(windowId: string) {
    windows.value = windows.value.filter((window) => window.id !== windowId);

    if (activeWindowId.value === windowId) {
      const nextActiveWindow = [...visibleWindows.value].sort((a, b) => b.zIndex - a.zIndex)[0];
      activeWindowId.value = nextActiveWindow?.id ?? null;
    }
  }

  function minimizeWindow(windowId: string) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    window.minimized = true;

    if (activeWindowId.value === windowId) {
      const nextActiveWindow = [...visibleWindows.value].sort((a, b) => b.zIndex - a.zIndex)[0];
      activeWindowId.value = nextActiveWindow?.id ?? null;
    }
  }

  function restoreWindow(windowId: string) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    window.minimized = false;
    focusWindow(windowId);
  }

  function toggleWindowFromTaskbar(windowId: string) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    if (window.minimized || activeWindowId.value !== windowId) {
      restoreWindow(windowId);
      return;
    }

    minimizeWindow(windowId);
  }

  function updateWindowContent(
    windowId: string,
    updates: Partial<Pick<WindowState, 'content' | 'title' | 'loading' | 'error'>>,
  ) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    Object.assign(window, updates);
  }

  return {
    activeWindowId,
    closeWindow,
    focusWindow,
    minimizeWindow,
    openWindow,
    openWindows,
    restoreWindow,
    toggleWindowFromTaskbar,
    updateWindowContent,
    visibleWindows,
    windows,
  };
});
