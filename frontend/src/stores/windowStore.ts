import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import type { BuiltInAppId } from '@/types/app';
import type { WindowBounds, WindowContentState, WindowState } from '@/types/window';

const INITIAL_Z_INDEX = 20;
const WINDOW_OFFSET = 32;
const MIN_WINDOW_WIDTH = 360;
const MIN_WINDOW_HEIGHT = 240;
const TITLE_BAR_HEIGHT = 40;
const DESKTOP_EDGE_PADDING = 8;
const TASKBAR_RESERVED_HEIGHT = 72;

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

  function getViewportBounds() {
    if (typeof globalThis.window === 'undefined') {
      return {
        width: 1280,
        height: 720,
      };
    }

    return {
      width: globalThis.window.innerWidth,
      height: globalThis.window.innerHeight,
    };
  }

  function clampBounds(bounds: WindowBounds): WindowBounds {
    const viewport = getViewportBounds();
    const maxWidth = Math.max(MIN_WINDOW_WIDTH, viewport.width - DESKTOP_EDGE_PADDING * 2);
    const maxHeight = Math.max(
      MIN_WINDOW_HEIGHT,
      viewport.height - TASKBAR_RESERVED_HEIGHT - DESKTOP_EDGE_PADDING * 2,
    );
    const width = Math.min(Math.max(bounds.width, MIN_WINDOW_WIDTH), maxWidth);
    const height = Math.min(Math.max(bounds.height, MIN_WINDOW_HEIGHT), maxHeight);
    const minReachableX = DESKTOP_EDGE_PADDING + TITLE_BAR_HEIGHT - width;
    const maxReachableX = viewport.width - DESKTOP_EDGE_PADDING - TITLE_BAR_HEIGHT;
    const maxReachableY = viewport.height - TASKBAR_RESERVED_HEIGHT - TITLE_BAR_HEIGHT;

    return {
      x: Math.min(Math.max(bounds.x, minReachableX), maxReachableX),
      y: Math.min(Math.max(bounds.y, DESKTOP_EDGE_PADDING), maxReachableY),
      width,
      height,
    };
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

  function updateWindowBounds(windowId: string, bounds: WindowBounds) {
    const window = getWindow(windowId);

    if (!window || window.maximized) {
      return;
    }

    Object.assign(window, clampBounds(bounds));
  }

  function moveWindow(windowId: string, x: number, y: number) {
    const window = getWindow(windowId);

    if (!window || window.maximized) {
      return;
    }

    updateWindowBounds(windowId, {
      x,
      y,
      width: window.width,
      height: window.height,
    });
  }

  function resizeWindow(windowId: string, bounds: WindowBounds) {
    updateWindowBounds(windowId, bounds);
  }

  function maximizeWindow(windowId: string) {
    const window = getWindow(windowId);

    if (!window || window.maximized) {
      return;
    }

    const viewport = getViewportBounds();

    window.restoreBounds = {
      x: window.x,
      y: window.y,
      width: window.width,
      height: window.height,
    };
    window.x = DESKTOP_EDGE_PADDING;
    window.y = DESKTOP_EDGE_PADDING;
    window.width = Math.max(MIN_WINDOW_WIDTH, viewport.width - DESKTOP_EDGE_PADDING * 2);
    window.height = Math.max(
      MIN_WINDOW_HEIGHT,
      viewport.height - TASKBAR_RESERVED_HEIGHT - DESKTOP_EDGE_PADDING * 2,
    );
    window.maximized = true;
    focusWindow(windowId);
  }

  function restoreMaximizedWindow(windowId: string) {
    const window = getWindow(windowId);

    if (!window || !window.maximized) {
      return;
    }

    const restoreBounds = window.restoreBounds;

    if (restoreBounds) {
      Object.assign(window, clampBounds(restoreBounds));
    }

    window.maximized = false;
    window.restoreBounds = undefined;
    focusWindow(windowId);
  }

  function toggleMaximizeWindow(windowId: string) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    if (window.maximized) {
      restoreMaximizedWindow(windowId);
      return;
    }

    maximizeWindow(windowId);
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
    maximizeWindow,
    minimizeWindow,
    moveWindow,
    openWindow,
    openWindows,
    resizeWindow,
    restoreMaximizedWindow,
    restoreWindow,
    toggleWindowFromTaskbar,
    toggleMaximizeWindow,
    updateWindowContent,
    updateWindowBounds,
    visibleWindows,
    windows,
  };
});
