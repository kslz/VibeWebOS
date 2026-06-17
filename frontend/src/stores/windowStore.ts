import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { systemConfig } from '@/config/systemConfig';
import type { BuiltInAppId, GeneratedAppCandidate } from '@/types/app';
import type { AppGenerateResponse, BrowserNavigateResponse, BrowserWindowPayload, GeneratedAppWindowPayload } from '@/types/llm';
import type { WindowBounds, WindowState } from '@/types/window';

const INITIAL_Z_INDEX = 20;
const WINDOW_OFFSET = 32;
const MIN_WINDOW_WIDTH = 360;
const MIN_WINDOW_HEIGHT = 240;
const TITLE_BAR_HEIGHT = 40;
const DESKTOP_EDGE_PADDING = 8;
const TASKBAR_RESERVED_HEIGHT = 72;
const MAX_RECENT_INTERACTION_SUMMARIES = 6;
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
      requestSequence: 0,
      activeRequestId: null,
      content: {
        kind: 'builtin',
        payload: appId === 'browser' ? createBrowserPayload() : undefined,
      },
    });

    activeWindowId.value = windowId;
    return windowId;
  }

  function createBrowserPayload(): BrowserWindowPayload {
    return {
      pageTitle: systemConfig.browser.homeTitle,
      url: '',
      html: '',
      summary: '',
      context: {
        currentHtml: '',
        currentSummary: '',
        temporaryFormValues: {},
        recentInteractionSummaries: [],
        currentUrl: '',
      },
    };
  }

  function createGeneratedAppPayload(candidate: GeneratedAppCandidate): GeneratedAppWindowPayload {
    return {
      candidate,
      html: '',
      summary: '',
      context: {
        currentHtml: '',
        currentSummary: '',
        temporaryFormValues: {},
        recentInteractionSummaries: [],
      },
    };
  }

  function openGeneratedAppWindow(candidate: GeneratedAppCandidate) {
    const index = windows.value.length;
    const generatedAppId = `generated:${candidate.id ?? nextWindowNumber.value}` as const;
    const windowId = `window-${nextWindowNumber.value}`;

    nextWindowNumber.value += 1;
    nextZIndex.value += 1;

    windows.value.push({
      id: windowId,
      appId: generatedAppId,
      title: candidate.name,
      x: 172 + (index % 6) * WINDOW_OFFSET,
      y: 104 + (index % 5) * WINDOW_OFFSET,
      width: 760,
      height: 520,
      zIndex: nextZIndex.value,
      minimized: false,
      maximized: false,
      loading: false,
      loadingText: null,
      loadingTextKey: 0,
      error: null,
      retryToken: 0,
      requestSequence: 0,
      activeRequestId: null,
      content: {
        kind: 'generatedHtml',
        payload: createGeneratedAppPayload(candidate),
      },
    });

    activeWindowId.value = windowId;
    return windowId;
  }

  function getGeneratedAppPayload(windowId: string) {
    const window = getWindow(windowId);

    if (window?.content.kind !== 'generatedHtml') {
      return null;
    }

    return window.content.payload as GeneratedAppWindowPayload;
  }

  function setGeneratedAppContent(
    windowId: string,
    response: AppGenerateResponse,
    requestId?: number,
  ) {
    const window = getWindow(windowId);

    if (!window || window.content.kind !== 'generatedHtml' || !isWindowRequestCurrent(windowId, requestId)) {
      return;
    }

    const payload = window.content.payload as GeneratedAppWindowPayload;
    payload.html = response.html;
    payload.summary = response.summary;
    payload.context.currentHtml = response.html;
    payload.context.currentSummary = response.summary;
    window.title = response.windowTitle;
  }

  function applyGeneratedAppInteractionResponse(
    windowId: string,
    response: AppGenerateResponse,
    interactionSummary: string,
    requestId?: number,
  ) {
    const window = getWindow(windowId);

    if (!window || window.content.kind !== 'generatedHtml' || !isWindowRequestCurrent(windowId, requestId)) {
      return;
    }

    const payload = window.content.payload as GeneratedAppWindowPayload;
    payload.html = response.html;
    payload.summary = response.summary;
    payload.context.currentHtml = response.html;
    payload.context.currentSummary = response.summary;
    payload.context.recentInteractionSummaries = [
      ...payload.context.recentInteractionSummaries,
      interactionSummary,
    ].slice(-MAX_RECENT_INTERACTION_SUMMARIES);
    window.title = response.windowTitle;
  }

  function getBrowserPayload(windowId: string) {
    const window = getWindow(windowId);

    if (window?.appId !== 'browser' || window.content.kind !== 'builtin') {
      return null;
    }

    if (!window.content.payload) {
      window.content.payload = createBrowserPayload();
    }

    return window.content.payload as BrowserWindowPayload;
  }

  function setBrowserPageContent(
    windowId: string,
    response: BrowserNavigateResponse,
    requestId?: number,
  ) {
    const window = getWindow(windowId);

    if (!window || window.appId !== 'browser' || window.content.kind !== 'builtin' || !isWindowRequestCurrent(windowId, requestId)) {
      return;
    }

    const payload = getBrowserPayload(windowId);

    if (!payload) {
      return;
    }

    payload.pageTitle = response.pageTitle;
    payload.url = response.url;
    payload.html = response.html;
    payload.summary = response.summary;
    payload.context.currentUrl = response.url;
    payload.context.currentHtml = response.html;
    payload.context.currentSummary = response.summary;
    window.title = response.pageTitle;
  }

  function applyBrowserPageInteractionResponse(
    windowId: string,
    response: BrowserNavigateResponse,
    interactionSummary: string,
    requestId?: number,
  ) {
    const window = getWindow(windowId);

    if (!window || window.appId !== 'browser' || window.content.kind !== 'builtin' || !isWindowRequestCurrent(windowId, requestId)) {
      return;
    }

    const payload = getBrowserPayload(windowId);

    if (!payload) {
      return;
    }

    payload.pageTitle = response.pageTitle;
    payload.url = response.url;
    payload.html = response.html;
    payload.summary = response.summary;
    payload.context.currentUrl = response.url;
    payload.context.currentHtml = response.html;
    payload.context.currentSummary = response.summary;
    payload.context.recentInteractionSummaries = [
      ...payload.context.recentInteractionSummaries,
      interactionSummary,
    ].slice(-MAX_RECENT_INTERACTION_SUMMARIES);
    window.title = response.pageTitle;
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
    requestId?: number,
  ) {
    const window = getWindow(windowId);

    if (!window || !isWindowRequestCurrent(windowId, requestId)) {
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
      return null;
    }

    window.requestSequence += 1;
    window.activeRequestId = window.requestSequence;
    window.loading = true;
    window.loadingText = pickWaitingText(window.loadingText);
    window.loadingTextKey += 1;
    window.error = null;
    scheduleLoadingTextSwitch(windowId);

    return window.activeRequestId;
  }

  function finishWindowLoading(windowId: string, requestId?: number) {
    const window = getWindow(windowId);

    if (!window || !isWindowRequestCurrent(windowId, requestId)) {
      return;
    }

    clearLoadingTextTimer(windowId);
    window.loading = false;
    window.loadingText = null;
    if (requestId !== undefined) {
      window.activeRequestId = null;
    }
  }

  function failWindowOperation(windowId: string, error: string, requestId?: number) {
    const window = getWindow(windowId);

    if (!window || !isWindowRequestCurrent(windowId, requestId)) {
      return;
    }

    clearLoadingTextTimer(windowId);
    window.loading = false;
    window.loadingText = null;
    window.error = error;
    if (requestId !== undefined) {
      window.activeRequestId = null;
    }
  }

  function retryWindowOperation(windowId: string) {
    const window = getWindow(windowId);

    if (!window) {
      return;
    }

    window.error = null;
    window.retryToken += 1;
  }

  function isWindowRequestCurrent(windowId: string, requestId?: number) {
    if (requestId === undefined) {
      return true;
    }

    const window = getWindow(windowId);

    return Boolean(window && window.activeRequestId === requestId);
  }

  return {
    activeWindowId,
    applyBrowserPageInteractionResponse,
    applyGeneratedAppInteractionResponse,
    closeWindow,
    failWindowOperation,
    focusWindow,
    finishWindowLoading,
    maximizeWindow,
    minimizeWindow,
    moveWindow,
    openWindow,
    openGeneratedAppWindow,
    openWindows,
    resizeWindow,
    restoreMaximizedWindow,
    restoreWindow,
    isWindowRequestCurrent,
    retryWindowOperation,
    getBrowserPayload,
    setBrowserPageContent,
    setGeneratedAppContent,
    startWindowLoading,
    toggleWindowFromTaskbar,
    toggleMaximizeWindow,
    updateWindowContent,
    updateWindowBounds,
    visibleWindows,
    windows,
  };
});
