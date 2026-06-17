import { afterEach, describe, expect, it, vi } from 'vitest';

import { appSearch, LlmApiError } from './llmApi';

describe('llmApi', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes backend detail errors into LlmApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          detail: {
            code: 'provider_timeout',
            message: 'LLM 请求超时，请稍后重试。',
          },
        }),
        { status: 504, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(appSearch({ query: 'project' })).rejects.toMatchObject({
      name: 'FrontendApiError',
      message: 'LLM 请求超时，请稍后重试。',
      status: 504,
      code: 'provider_timeout',
    });
  });

  it('normalizes non-json backend errors into LlmApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Bad gateway', { status: 502 }));

    await expect(appSearch({ query: 'project' })).rejects.toBeInstanceOf(LlmApiError);
    await expect(appSearch({ query: 'project' })).rejects.toMatchObject({
      message: '请求失败，状态码 502',
      status: 502,
    });
  });

  it('normalizes network failures into LlmApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));

    await expect(appSearch({ query: 'project' })).rejects.toMatchObject({
      name: 'FrontendApiError',
      message: '无法连接到后端服务，请检查服务是否启动后重试。',
      code: 'network_error',
    });
  });
});
