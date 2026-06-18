import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

describe('AppWindow', () => {
  it('redacts generated app interaction form values before calling the LLM API', () => {
    const source = readFileSync(fileURLToPath(new URL('./AppWindow.vue', import.meta.url)), 'utf8');

    expect(source).toContain('appInteract');
    expect(source).toContain('redactFormValues');
    expect(source).toContain('formValues: redactFormValues(interaction.formValues)');
  });

  it('builds generated app interaction requests from the current window context only', () => {
    const source = readFileSync(fileURLToPath(new URL('./AppWindow.vue', import.meta.url)), 'utf8');

    expect(source).toContain('const context = generatedPayload.context');
    expect(source).toContain('currentSummary: context.currentSummary');
    expect(source).toContain('currentHtml: context.currentHtml');
    expect(source).toContain('recentInteractionSummaries: context.recentInteractionSummaries');
    expect(source).not.toContain('openWindows.value.map');
    expect(source).not.toContain('windows.value.map');
  });

  it('retries the last failed generated app interaction instead of regenerating the app', () => {
    const source = readFileSync(fileURLToPath(new URL('./AppWindow.vue', import.meta.url)), 'utf8');

    expect(source).toContain('lastGeneratedInteraction');
    expect(source).toContain('void handleGeneratedInteraction(lastGeneratedInteraction.value)');
    expect(source).toContain('lastGeneratedInteraction.value = interaction');
    expect(source).toContain('lastGeneratedInteraction.value = null');
  });
});
