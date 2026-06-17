import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useWindowStore } from './windowStore';
import type { GeneratedAppCandidate } from '@/types/app';

const candidate: GeneratedAppCandidate = {
  id: 'error-hardening',
  name: 'Error Hardening',
  description: 'Exercises request races and closed-window responses.',
  appType: 'tool',
  styleHint: 'plain',
};

describe('window request error handling', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('prevents duplicate concurrent requests in the same window', () => {
    const store = useWindowStore();
    const windowId = store.openGeneratedAppWindow(candidate);

    const firstRequestId = store.startWindowLoading(windowId);
    const secondRequestId = store.startWindowLoading(windowId);

    const window = store.windows.find((item) => item.id === windowId);

    expect(firstRequestId).toBe(1);
    expect(secondRequestId).toBeNull();
    expect(window?.activeRequestId).toBe(firstRequestId);
    expect(window?.requestSequence).toBe(1);
    expect(window?.loading).toBe(true);
  });

  it('ignores stale responses after a generated app window closes', () => {
    const store = useWindowStore();
    const windowId = store.openGeneratedAppWindow(candidate);
    const requestId = store.startWindowLoading(windowId);

    store.closeWindow(windowId);
    store.applyGeneratedAppInteractionResponse(
      windowId,
      {
        windowTitle: 'Stale',
        html: '<main>stale</main>',
        summary: 'stale',
      },
      'click button "stale"',
      requestId ?? undefined,
    );
    store.failWindowOperation(windowId, 'stale error', requestId ?? undefined);

    expect(store.windows.find((item) => item.id === windowId)).toBeUndefined();
  });

  it('keeps concurrent requests in different windows independent', () => {
    const store = useWindowStore();
    const firstWindowId = store.openGeneratedAppWindow(candidate);
    const secondWindowId = store.openGeneratedAppWindow({
      ...candidate,
      id: 'second-error-hardening',
      name: 'Second Error Hardening',
    });

    const firstRequestId = store.startWindowLoading(firstWindowId);
    const secondRequestId = store.startWindowLoading(secondWindowId);

    expect(firstRequestId).toBe(1);
    expect(secondRequestId).toBe(1);

    store.failWindowOperation(firstWindowId, 'first failed', firstRequestId ?? undefined);

    const firstWindow = store.windows.find((item) => item.id === firstWindowId);
    const secondWindow = store.windows.find((item) => item.id === secondWindowId);

    expect(firstWindow?.loading).toBe(false);
    expect(firstWindow?.error).toBe('first failed');
    expect(secondWindow?.loading).toBe(true);
    expect(secondWindow?.error).toBeNull();
    expect(secondWindow?.activeRequestId).toBe(secondRequestId);
  });

  it('preserves previous generated app HTML when an interaction fails', () => {
    const store = useWindowStore();
    const windowId = store.openGeneratedAppWindow(candidate);

    store.setGeneratedAppContent(windowId, {
      windowTitle: 'Usable App',
      html: '<main><button>Still usable</button></main>',
      summary: 'Previous usable state.',
    });
    const requestId = store.startWindowLoading(windowId);

    store.failWindowOperation(windowId, 'interaction failed', requestId ?? undefined);

    const window = store.windows.find((item) => item.id === windowId);
    const payload = window?.content.payload as { html: string; summary: string };

    expect(window?.error).toBe('interaction failed');
    expect(payload.html).toBe('<main><button>Still usable</button></main>');
    expect(payload.summary).toBe('Previous usable state.');
  });
});
