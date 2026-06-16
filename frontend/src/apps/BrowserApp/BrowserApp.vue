<script setup lang="ts">
import { ref, watch } from 'vue';

import { browserNavigate, LlmApiError } from '@/api/llmApi';
import { systemConfig } from '@/config/systemConfig';
import { useWindowStore } from '@/stores/windowStore';

const props = defineProps<{
  retryToken: number;
  windowId: string;
}>();

const windowStore = useWindowStore();
const browserInput = ref('');
const currentUrl = ref('');
const currentSummary = ref('');
const pageTitle = ref<string>(systemConfig.browser.homeTitle);
const lastSubmittedInput = ref('');

async function navigate(nextInput = browserInput.value) {
  const trimmedInput = nextInput.trim();

  if (!trimmedInput) {
    windowStore.failWindowOperation(props.windowId, '请输入网址、关键词或问题后再搜索。');
    return;
  }

  lastSubmittedInput.value = trimmedInput;
  const requestId = windowStore.startWindowLoading(props.windowId);

  if (requestId === null) {
    return;
  }

  try {
    const response = await browserNavigate({
      input: trimmedInput,
      currentUrl: currentUrl.value,
      currentSummary: currentSummary.value,
    });

    if (!windowStore.isWindowRequestCurrent(props.windowId, requestId)) {
      return;
    }

    currentUrl.value = response.url;
    currentSummary.value = response.summary;
    pageTitle.value = response.pageTitle;
    windowStore.updateWindowContent(
      props.windowId,
      {
        content: {
          kind: 'browserHtml',
          payload: response,
        },
        title: response.pageTitle,
      },
      requestId,
    );
    windowStore.finishWindowLoading(props.windowId, requestId);
  } catch (error) {
    const message =
      error instanceof LlmApiError ? error.message : '浏览器请求暂时不可用，请稍后重试。';

    windowStore.failWindowOperation(props.windowId, message, requestId);
  }
}

watch(
  () => props.retryToken,
  () => {
    if (lastSubmittedInput.value) {
      void navigate(lastSubmittedInput.value);
    }
  },
);
</script>

<template>
  <section class="browser-app">
    <div class="browser-app__hero">
      <p class="browser-app__eyebrow">{{ pageTitle }}</p>
      <h2>想看什么网页？</h2>
      <form class="browser-app__search" @submit.prevent="navigate()">
        <label class="browser-app__label" for="browser-query">地址或搜索内容</label>
        <div class="browser-app__search-row">
          <input
            id="browser-query"
            v-model="browserInput"
            class="browser-app__input"
            type="search"
            placeholder="输入网址、关键词或自然语言问题"
          />
          <button class="browser-app__button" type="submit">搜索</button>
        </div>
      </form>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.browser-app {
  display: grid;
  min-height: 100%;
  place-items: center;
  padding: 28px;
}

.browser-app__hero {
  display: grid;
  width: min(680px, 100%);
  gap: 16px;
  text-align: center;
}

.browser-app__eyebrow {
  margin: 0;
  color: var(--color-accent);
  font-size: 13px;
  font-weight: 700;
}

.browser-app h2 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 32px;
}

.browser-app__search {
  display: grid;
  gap: 8px;
}

.browser-app__label {
  color: var(--color-text-secondary);
  font-size: 12px;
  text-align: left;
}

.browser-app__search-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.browser-app__input {
  min-width: 0;
  height: 42px;
  padding: 0 14px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-text-primary);
  background: var(--color-panel-bg);
}

.browser-app__button {
  height: 42px;
  padding: 0 18px;
  border: 1px solid var(--color-accent);
  border-radius: 8px;
  color: #ffffff;
  background: var(--color-accent);
}
</style>
