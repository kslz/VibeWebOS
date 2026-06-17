import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { systemConfig } from '@/config/systemConfig';
import { useWindowStore } from './windowStore';
import type { BrowserWindowPayload } from '@/types/llm';

describe('browser windows', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes isolated window-level browser context without full chat history', () => {
    const store = useWindowStore();

    const firstWindowId = store.openWindow('browser');
    const secondWindowId = store.openWindow('browser');

    const firstWindow = store.windows.find((window) => window.id === firstWindowId);
    const secondWindow = store.windows.find((window) => window.id === secondWindowId);
    const firstPayload = firstWindow?.content.payload as BrowserWindowPayload;
    const secondPayload = secondWindow?.content.payload as BrowserWindowPayload;

    expect(firstWindow?.content.kind).toBe('builtin');
    expect(secondWindow?.content.kind).toBe('builtin');
    expect(firstPayload).toEqual({
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
    });
    expect(secondPayload).toEqual(firstPayload);
    expect(firstPayload.context).not.toBe(secondPayload.context);
    expect(firstPayload).not.toHaveProperty('messages');
    expect(firstPayload).not.toHaveProperty('history');
  });

  it('updates only the navigated browser window context', () => {
    const store = useWindowStore();
    const firstWindowId = store.openWindow('browser');
    const secondWindowId = store.openWindow('browser');

    store.setBrowserPageContent(firstWindowId, {
      pageTitle: '搜索结果',
      url: 'search://项目管理',
      html: '<main><h1>项目管理</h1></main>',
      summary: '项目管理搜索结果。',
    });

    const firstWindow = store.windows.find((window) => window.id === firstWindowId);
    const secondWindow = store.windows.find((window) => window.id === secondWindowId);
    const firstPayload = firstWindow?.content.payload as BrowserWindowPayload;
    const secondPayload = secondWindow?.content.payload as BrowserWindowPayload;

    expect(firstWindow?.title).toBe('搜索结果');
    expect(firstPayload.context.currentUrl).toBe('search://项目管理');
    expect(firstPayload.context.currentHtml).toBe('<main><h1>项目管理</h1></main>');
    expect(firstPayload.context.currentSummary).toBe('项目管理搜索结果。');
    expect(secondWindow?.title).toBe('浏览器');
    expect(secondPayload.context.currentUrl).toBe('');
    expect(secondPayload.context.currentHtml).toBe('');
    expect(secondPayload.context.currentSummary).toBe('');
  });

  it('updates only the interacted browser window context after page interaction', () => {
    const store = useWindowStore();
    const firstWindowId = store.openWindow('browser');
    const secondWindowId = store.openWindow('browser');

    store.setBrowserPageContent(firstWindowId, {
      pageTitle: '第一页',
      url: 'https://example.com/first',
      html: '<main><a href="/next">下一页</a></main>',
      summary: '第一页摘要。',
    });
    store.setBrowserPageContent(secondWindowId, {
      pageTitle: '第二页',
      url: 'https://example.com/second',
      html: '<main><a href="/other">其他页</a></main>',
      summary: '第二页摘要。',
    });

    store.applyBrowserPageInteractionResponse(
      firstWindowId,
      {
        pageTitle: '下一页',
        url: 'https://example.com/next',
        html: '<main><h1>下一页</h1></main>',
        summary: '下一页摘要。',
      },
      'link a "下一页"',
    );

    const firstWindow = store.windows.find((window) => window.id === firstWindowId);
    const secondWindow = store.windows.find((window) => window.id === secondWindowId);
    const firstPayload = firstWindow?.content.payload as BrowserWindowPayload;
    const secondPayload = secondWindow?.content.payload as BrowserWindowPayload;

    expect(firstWindow?.title).toBe('下一页');
    expect(firstPayload.context.currentUrl).toBe('https://example.com/next');
    expect(firstPayload.context.currentHtml).toBe('<main><h1>下一页</h1></main>');
    expect(firstPayload.context.currentSummary).toBe('下一页摘要。');
    expect(firstPayload.context.recentInteractionSummaries).toEqual(['link a "下一页"']);
    expect(secondWindow?.title).toBe('第二页');
    expect(secondPayload.context.currentUrl).toBe('https://example.com/second');
    expect(secondPayload.context.currentHtml).toBe('<main><a href="/other">其他页</a></main>');
    expect(secondPayload.context.currentSummary).toBe('第二页摘要。');
    expect(secondPayload.context.recentInteractionSummaries).toEqual([]);
  });
});
