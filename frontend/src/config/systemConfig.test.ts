import { afterEach, describe, expect, it, vi } from 'vitest';

const runtimeUiConfigPath = './runtime-ui-config.json';

const importSystemConfig = async () => {
  const module = await import('./systemConfig');
  return module.systemConfig;
};

describe('systemConfig runtime config', () => {
  afterEach(() => {
    vi.doUnmock(runtimeUiConfigPath);
    vi.resetModules();
  });

  it('loads UI copy from the root runtime config', async () => {
    const systemConfig = await importSystemConfig();

    expect(systemConfig.systemName).toBe('VibeWebOS');
    expect(systemConfig.aboutText).toContain('VibeWebOS');
    expect(systemConfig.waitingTexts).toEqual([
      '正在整理你的想法...',
      '正在生成一个更像应用的界面...',
      '正在检查页面结构...',
      '正在准备窗口内容...',
    ]);
    expect(systemConfig.waitingTextSwitchDelayMs).toBe(5000);
  });

  it('uses values from the frontend-safe UI config artifact', async () => {
    vi.doMock(runtimeUiConfigPath, () => ({
      default: {
        systemName: 'Custom OS',
        aboutText: 'Custom about text',
        waitingTexts: ['Custom waiting text'],
        waitingTextSwitchDelayMs: 1234,
      },
    }));
    vi.resetModules();

    const systemConfig = await importSystemConfig();

    expect(systemConfig.systemName).toBe('Custom OS');
    expect(systemConfig.aboutText).toBe('Custom about text');
    expect(systemConfig.waitingTexts).toEqual(['Custom waiting text']);
    expect(systemConfig.waitingTextSwitchDelayMs).toBe(1234);
    expect(systemConfig).not.toHaveProperty('llm');
    expect(JSON.stringify(systemConfig)).not.toContain('LLM_API_KEY');
    expect(JSON.stringify(systemConfig)).not.toContain('deepseek-v4-flash');
    expect(JSON.stringify(systemConfig)).not.toContain('api.deepseek.com');
  });

  it('keeps the frontend-safe UI config artifact free of LLM markers', async () => {
    const runtimeUiConfig = await import(runtimeUiConfigPath);
    const serializedConfig = JSON.stringify(runtimeUiConfig.default);

    expect(serializedConfig).not.toContain('llm');
    expect(serializedConfig).not.toContain('LLM_API_KEY');
    expect(serializedConfig).not.toContain('deepseek-v4-flash');
    expect(serializedConfig).not.toContain('api.deepseek.com');
  });

  it('does not expose LLM config to the frontend facade', async () => {
    const systemConfig = await importSystemConfig();

    expect(systemConfig).not.toHaveProperty('llm');
    expect(JSON.stringify(systemConfig)).not.toContain('LLM_API_KEY');
    expect(JSON.stringify(systemConfig)).not.toContain('deepseek-v4-flash');
    expect(JSON.stringify(systemConfig)).not.toContain('api.deepseek.com');
  });
});
