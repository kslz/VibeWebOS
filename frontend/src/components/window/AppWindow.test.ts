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

  it('retries the last failed generated app interaction instead of regenerating the app', () => {
    const source = readFileSync(fileURLToPath(new URL('./AppWindow.vue', import.meta.url)), 'utf8');

    expect(source).toContain('lastGeneratedInteraction');
    expect(source).toContain('void handleGeneratedInteraction(lastGeneratedInteraction.value)');
    expect(source).toContain('lastGeneratedInteraction.value = interaction');
    expect(source).toContain('lastGeneratedInteraction.value = null');
  });
});
