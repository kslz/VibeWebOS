import { afterEach, describe, expect, it, vi } from 'vitest';

const rootConfigPath = '../../../config/app.config.json';

const importSystemConfig = async () => {
  const module = await import('./systemConfig');
  return module.systemConfig;
};

describe('systemConfig runtime config', () => {
  afterEach(() => {
    vi.doUnmock(rootConfigPath);
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

  it('uses only ui values from the root runtime config', async () => {
    vi.doMock(rootConfigPath, () => ({
      default: {
        llm: {
          baseUrl: 'https://api.deepseek.com',
          model: 'deepseek-v4-flash',
          apiKeyEnv: 'LLM_API_KEY',
        },
        ui: {
          systemName: 'Custom OS',
          aboutText: 'Custom about text',
          waitingTexts: ['Custom waiting text'],
          waitingTextSwitchDelayMs: 1234,
        },
      },
      ui: {
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

  it('does not expose LLM config to the frontend facade', async () => {
    const systemConfig = await importSystemConfig();

    expect(systemConfig).not.toHaveProperty('llm');
    expect(JSON.stringify(systemConfig)).not.toContain('LLM_API_KEY');
    expect(JSON.stringify(systemConfig)).not.toContain('deepseek-v4-flash');
    expect(JSON.stringify(systemConfig)).not.toContain('api.deepseek.com');
  });
});
