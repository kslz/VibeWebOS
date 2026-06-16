import { computed, ref } from 'vue';
import { defineStore } from 'pinia';

import { systemConfig } from '@/config/systemConfig';
import type { BuiltInAppDefinition, BuiltInAppId } from '@/types/app';

const appDefinitions: Record<BuiltInAppId, BuiltInAppDefinition & { iconSymbol: string }> = {
  browser: {
    id: 'browser',
    title: '浏览器',
    description: '搜索和访问生成的网页内容',
    iconSymbol: 'B',
  },
  appSearch: {
    id: 'appSearch',
    title: '应用搜索',
    description: '用自然语言查找并生成应用',
    iconSymbol: 'A',
  },
  settings: {
    id: 'settings',
    title: '设置',
    description: '调整系统外观和偏好',
    iconSymbol: 'S',
  },
  about: {
    id: 'about',
    title: '关于系统',
    description: '查看系统说明和版本信息',
    iconSymbol: 'i',
  },
};

export const useDesktopStore = defineStore('desktop', () => {
  const isStartMenuOpen = ref(false);
  const lastOpenedAppId = ref<BuiltInAppId | null>(null);

  const desktopApps = computed(() =>
    systemConfig.desktopIconIds.map((appId) => appDefinitions[appId]),
  );

  const selectedAppTitle = computed(() => {
    if (!lastOpenedAppId.value) {
      return '准备就绪';
    }

    return `已选择 ${appDefinitions[lastOpenedAppId.value].title}`;
  });

  function toggleStartMenu() {
    isStartMenuOpen.value = !isStartMenuOpen.value;
  }

  function closeStartMenu() {
    isStartMenuOpen.value = false;
  }

  function openApp(appId: BuiltInAppId) {
    lastOpenedAppId.value = appId;
    closeStartMenu();
  }

  return {
    desktopApps,
    isStartMenuOpen,
    lastOpenedAppId,
    selectedAppTitle,
    closeStartMenu,
    openApp,
    toggleStartMenu,
  };
});
