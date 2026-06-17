import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

describe('BrowserApp', () => {
  it('uses window-level browser context and renders returned HTML', () => {
    const source = readFileSync(fileURLToPath(new URL('./BrowserApp.vue', import.meta.url)), 'utf8');

    expect(source).toContain('browserPayload');
    expect(source).toContain('windowStore.getBrowserPayload');
    expect(source).toContain("currentUrl: context?.currentUrl ?? ''");
    expect(source).toContain("currentSummary: context?.currentSummary ?? ''");
    expect(source).toContain('windowStore.setBrowserPageContent');
    expect(source).toContain('<HtmlSandboxView');
    expect(source).toContain(':enable-interaction-bridge="false"');
  });
});
