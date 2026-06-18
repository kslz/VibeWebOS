import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useWindowStore } from './windowStore';
import type { GeneratedAppCandidate } from '@/types/app';
import type { BrowserWindowPayload, GeneratedAppWindowPayload } from '@/types/llm';

const candidate: GeneratedAppCandidate = {
  id: 'context-checker',
  name: 'Context Checker',
  description: 'Exercises window-scoped LLM context behavior.',
  appType: 'tool',
  styleHint: 'plain',
};

describe('window-level LLM contexts', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('destroys generated app and browser contexts when windows close', () => {
    const store = useWindowStore();
    const appWindowId = store.openGeneratedAppWindow(candidate);
    const browserWindowId = store.openWindow('browser');

    store.setGeneratedAppContent(appWindowId, {
      windowTitle: 'Context App',
      html: '<main>app state</main>',
      summary: 'app summary',
    });
    store.setBrowserPageContent(browserWindowId, {
      pageTitle: 'Context Page',
      url: 'https://example.com/context',
      html: '<main>browser state</main>',
      summary: 'browser summary',
    });

    store.closeWindow(appWindowId);
    store.closeWindow(browserWindowId);

    expect(store.windows.find((window) => window.id === appWindowId)).toBeUndefined();
    expect(store.windows.find((window) => window.id === browserWindowId)).toBeUndefined();
    expect(store.getBrowserPayload(browserWindowId)).toBeNull();
  });

  it('keeps generated app and browser window contexts isolated from each other', () => {
    const store = useWindowStore();
    const appWindowId = store.openGeneratedAppWindow(candidate);
    const browserWindowId = store.openWindow('browser');

    store.setGeneratedAppContent(appWindowId, {
      windowTitle: 'Context App',
      html: '<main><button>Run app</button></main>',
      summary: 'generated app summary',
    });
    store.setBrowserPageContent(browserWindowId, {
      pageTitle: 'Context Page',
      url: 'https://example.com/page',
      html: '<main><a href="/next">Next</a></main>',
      summary: 'browser page summary',
    });

    store.applyGeneratedAppInteractionResponse(
      appWindowId,
      {
        windowTitle: 'Context App',
        html: '<main><button>Updated app</button></main>',
        summary: 'updated generated app summary',
      },
      'click button "Run app"',
    );
    store.applyBrowserPageInteractionResponse(
      browserWindowId,
      {
        pageTitle: 'Next Page',
        url: 'https://example.com/next',
        html: '<main>Next page</main>',
        summary: 'updated browser page summary',
      },
      'link a "Next"',
    );

    const appWindow = store.windows.find((window) => window.id === appWindowId);
    const browserWindow = store.windows.find((window) => window.id === browserWindowId);
    const appPayload = appWindow?.content.payload as GeneratedAppWindowPayload;
    const browserPayload = browserWindow?.content.payload as BrowserWindowPayload;

    expect(appPayload.context.currentHtml).toBe('<main><button>Updated app</button></main>');
    expect(appPayload.context.currentSummary).toBe('updated generated app summary');
    expect(appPayload.context.recentInteractionSummaries).toEqual(['click button "Run app"']);
    expect(appPayload.context).not.toHaveProperty('currentUrl');

    expect(browserPayload.context.currentUrl).toBe('https://example.com/next');
    expect(browserPayload.context.currentHtml).toBe('<main>Next page</main>');
    expect(browserPayload.context.currentSummary).toBe('updated browser page summary');
    expect(browserPayload.context.recentInteractionSummaries).toEqual(['link a "Next"']);
  });
});
