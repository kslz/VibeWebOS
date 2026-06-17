import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

describe('HtmlSandboxView', () => {
  it('uses an open generated app sandbox without top-level navigation', () => {
    const source = readFileSync(fileURLToPath(new URL('./HtmlSandboxView.vue', import.meta.url)), 'utf8');

    expect(source).toContain('sandbox="allow-forms allow-scripts allow-same-origin"');
    expect(source).not.toContain('allow-top-navigation');
  });
});
