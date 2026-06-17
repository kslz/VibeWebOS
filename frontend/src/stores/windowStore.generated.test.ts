import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import { useWindowStore } from './windowStore';
import type { GeneratedAppCandidate } from '@/types/app';
import type { GeneratedAppWindowPayload } from '@/types/llm';

const candidate: GeneratedAppCandidate = {
  id: 'project-board',
  name: 'Project Board',
  description: 'Track task stages, owners, and deadlines.',
  appType: 'dashboard',
  styleHint: 'clean productivity',
};

describe('generated app windows', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes isolated window-level context without full chat history', () => {
    const store = useWindowStore();

    const firstWindowId = store.openGeneratedAppWindow(candidate);
    const secondWindowId = store.openGeneratedAppWindow({
      ...candidate,
      id: 'risk-radar',
      name: 'Risk Radar',
    });

    store.setGeneratedAppContent(firstWindowId, {
      windowTitle: 'Project Board',
      html: '<main><h1>Project Status</h1></main>',
      summary: 'Project progress overview.',
    });

    const firstWindow = store.windows.find((window) => window.id === firstWindowId);
    const secondWindow = store.windows.find((window) => window.id === secondWindowId);

    expect(firstWindow?.content.kind).toBe('generatedHtml');
    expect(secondWindow?.content.kind).toBe('generatedHtml');

    const firstPayload = firstWindow?.content.payload as GeneratedAppWindowPayload;
    const secondPayload = secondWindow?.content.payload as GeneratedAppWindowPayload;

    expect(firstPayload?.context).toEqual({
      currentHtml: '<main><h1>Project Status</h1></main>',
      currentSummary: 'Project progress overview.',
      temporaryFormValues: {},
      recentInteractionSummaries: [],
    });
    expect(secondPayload?.context).toEqual({
      currentHtml: '',
      currentSummary: '',
      temporaryFormValues: {},
      recentInteractionSummaries: [],
    });
    expect(firstPayload?.context).not.toBe(secondPayload?.context);
    expect(firstPayload).not.toHaveProperty('messages');
    expect(firstPayload).not.toHaveProperty('history');
    expect(secondPayload).not.toHaveProperty('messages');
    expect(secondPayload).not.toHaveProperty('history');
  });
});
