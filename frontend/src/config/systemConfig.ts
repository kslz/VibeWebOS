import type { BuiltInAppId, ThemeMode } from '@/types/app';
import { ui as rootRuntimeUiConfig } from '../../../config/app.config.json';

interface RuntimeUiConfig {
  systemName?: string;
  aboutText?: string;
  waitingTexts?: string[];
  waitingTextSwitchDelayMs?: number;
}

const defaultUiConfig = {
  systemName: 'VibeWebOS',
  aboutText:
    'VibeWebOS 是一个中文浏览器桌面 MVP。它以 Windows 11 风格呈现多窗口应用、浏览器和由大模型生成的页面内容，所有状态仅保存在当前浏览器内存中。',
  waitingTexts: [
    '正在整理你的想法...',
    '正在生成一个更像应用的界面...',
    '正在检查页面结构...',
    '正在准备窗口内容...',
  ],
  waitingTextSwitchDelayMs: 5000,
};

const runtimeUiConfig = (rootRuntimeUiConfig ?? {}) as RuntimeUiConfig;
const waitingTexts =
  runtimeUiConfig.waitingTexts && runtimeUiConfig.waitingTexts.length > 0
    ? runtimeUiConfig.waitingTexts
    : defaultUiConfig.waitingTexts;

export const systemConfig = {
  systemName: runtimeUiConfig.systemName ?? defaultUiConfig.systemName,
  aboutText: runtimeUiConfig.aboutText ?? defaultUiConfig.aboutText,
  defaultTheme: 'light' satisfies ThemeMode,
  waitingTexts,
  waitingTextSwitchDelayMs:
    runtimeUiConfig.waitingTextSwitchDelayMs && runtimeUiConfig.waitingTextSwitchDelayMs > 0
      ? runtimeUiConfig.waitingTextSwitchDelayMs
      : defaultUiConfig.waitingTextSwitchDelayMs,
  appSearch: {
    minResults: 2,
    maxResults: 3,
  },
  browser: {
    homeTitle: 'Vibe 浏览器',
  },
  desktopIconIds: ['browser', 'appSearch', 'settings', 'about'] satisfies BuiltInAppId[],
} as const;
