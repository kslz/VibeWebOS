import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { systemConfig } from '@/config/systemConfig';
import type { BuiltInAppId } from '@/types/app';
import type { WindowBounds, WindowState } from '@/types/window';

const INITIAL_Z_INDEX = 20;
const WINDOW_OFFSET = 32;
const MIN_WINDOW_WIDTH = 360;
const MIN_WINDOW_HEIGHT = 240;
const TITLE_BAR_HEIGHT = 40;
const DESKTOP_EDGE_PADDING = 8;
const TASKBAR_RESERVED_HEIGHT = 72;
const loadingTextTimers = new Map<string, ReturnType<typeof setTimeout>>();

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

  function pickWaitingText(previousText?: string | null) {
    const waitingTexts: readonly string[] = systemConfig.waitingTexts;

    if (waitingTexts.length === 1) {
      return waitingTexts[0];
    }

    const nextTexts = previousText
      ? waitingTexts.filter((waitingText) => waitingText !== previousText)
      : waitingTexts;
    const index = Math.floor(Math.random() * nextTexts.length);

    return nextTexts[index];
  }

  function clearLoadingTextTimer(windowId: string) {
    const timer = loadingTextTimers.get(windowId);

    if (!timer) {
      return;
    }

    clearTimeout(timer);
    loadingTextTimers.delete(windowId);
  }

  function scheduleLoadingTextSwitch(windowId: string) {
    clearLoadingTextTimer(windowId);

    const timer = setTimeout(() => {
      const window = getWindow(windowId);

      if (!window || !window.loading) {
        loadingTextTimers.delete(windowId);
        return;
      }

      window.loadingText = pickWaitingText(window.loadingText);
      window.loadingTextKey += 1;
      scheduleLoadingTextSwitch(windowId);
    }, systemConfig.waitingTextSwitchDelayMs);

    loadingTextTimers.set(windowId, timer);
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
      loadingText: null,
      loadingTextKey: 0,
      error: null,
      retryToken: 0,
      content: {
        kind: 'builtin',
      },
    });

    activeWindowId.value = windowId;
    return windowId;
  }

  function closeWindow(windowId: string) {
    clearLoadingTextTimer(windowId);
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
    updates: Partial<Pick<WindowState, 'content' | 'title' | 'loading' | 'loadingText' | 'error'>>,
  ) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    Object.assign(window, updates);

    if (updates.loading === false) {
      clearLoadingTextTimer(windowId);
      window.loadingText = updates.loadingText ?? null;
    }

    if (updates.loading === true) {
      window.loadingText = updates.loadingText ?? pickWaitingText(window.loadingText);
      window.loadingTextKey += 1;
      scheduleLoadingTextSwitch(windowId);
    }
  }

  function startWindowLoading(windowId: string) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    window.loading = true;
    window.loadingText = pickWaitingText(window.loadingText);
    window.loadingTextKey += 1;
    window.error = null;
    scheduleLoadingTextSwitch(windowId);
  }

  function finishWindowLoading(windowId: string) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    clearLoadingTextTimer(windowId);
    window.loading = false;
    window.loadingText = null;
  }

  function failWindowOperation(windowId: string, error: string) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    clearLoadingTextTimer(windowId);
    window.loading = false;
    window.loadingText = null;
    window.error = error;
  }

  function retryWindowOperation(windowId: string) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    window.error = null;
    window.retryToken += 1;
  }

  return {
    activeWindowId,
    closeWindow,
    failWindowOperation,
    focusWindow,
    finishWindowLoading,
    maximizeWindow,
    minimizeWindow,
    moveWindow,
    openWindow,
    openWindows,
    resizeWindow,
    restoreMaximizedWindow,
    restoreWindow,
    retryWindowOperation,
    startWindowLoading,
    toggleWindowFromTaskbar,
    toggleMaximizeWindow,
    updateWindowContent,
    updateWindowBounds,
    visibleWindows,
    windows,
  };
});
