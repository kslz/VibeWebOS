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
    expect(source).toContain('browserInteract');
    expect(source).toContain('recentInteractionSummaries: context.recentInteractionSummaries');
    expect(source).toContain('redactFormValues');
    expect(source).toContain('formValues: redactFormValues(interaction.formValues)');
    expect(source).toContain('windowStore.applyBrowserPageInteractionResponse');
    expect(source).toContain('handleBrowserInteraction');
    expect(source).toContain('lastBrowserInteraction');
    expect(source).toContain('void handleBrowserInteraction(lastBrowserInteraction.value)');
    expect(source).toContain('<HtmlSandboxView');
    expect(source).toContain('interaction-bridge-mode="browser"');
    expect(source).toContain('@interact="handleBrowserInteraction"');
  });
});
