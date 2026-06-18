<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { browserInteract, browserNavigate, LlmApiError } from '@/api/llmApi';
import HtmlSandboxView from '@/components/generated/HtmlSandboxView.vue';
import { systemConfig } from '@/config/systemConfig';
import { useWindowStore } from '@/stores/windowStore';
import type { GeneratedAppInteractionEvent, UserAction } from '@/types/llm';
import { redactFormValues } from '@/utils/redactFormValues';

const props = defineProps<{
  retryToken: number;
  windowId: string;
}>();

const windowStore = useWindowStore();
const browserInput = ref('');
const lastSubmittedInput = ref('');
const lastBrowserInteraction = ref<GeneratedAppInteractionEvent | null>(null);
const browserPayload = computed(() => windowStore.getBrowserPayload(props.windowId));
const browserContext = computed(() => browserPayload.value?.context);
const pageTitle = computed(() => browserPayload.value?.pageTitle ?? systemConfig.browser.homeTitle);
const currentUrl = computed(() => browserPayload.value?.url ?? '');
const browserHtml = computed(() => browserPayload.value?.html ?? '');

function summarizeInteraction(userAction: UserAction) {
  const label = userAction.targetText || userAction.targetDescription || userAction.targetTag;

  return `${userAction.type} ${userAction.targetTag} "${label}"`;
}

async function navigate(nextInput = browserInput.value) {
  const trimmedInput = nextInput.trim();
  const context = browserContext.value;

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
      currentUrl: context?.currentUrl ?? '',
      currentSummary: context?.currentSummary ?? '',
    });

    if (!windowStore.isWindowRequestCurrent(props.windowId, requestId)) {
      return;
    }

    windowStore.setBrowserPageContent(props.windowId, response, requestId);
    lastBrowserInteraction.value = null;
    windowStore.finishWindowLoading(props.windowId, requestId);
  } catch (error) {
    const message =
      error instanceof LlmApiError ? error.message : '浏览器请求暂时不可用，请稍后重试。';

    windowStore.failWindowOperation(props.windowId, message, requestId);
  }
}

async function handleBrowserInteraction(interaction: GeneratedAppInteractionEvent) {
  const context = browserContext.value;

  if (!context) {
    return;
  }

  const requestId = windowStore.startWindowLoading(props.windowId);

  if (requestId === null) {
    return;
  }

  try {
    lastBrowserInteraction.value = interaction;
    const response = await browserInteract({
      currentUrl: context.currentUrl,
      currentSummary: context.currentSummary,
      currentHtml: context.currentHtml,
      recentInteractionSummaries: context.recentInteractionSummaries,
      userAction: interaction.userAction,
      formValues: redactFormValues(interaction.formValues),
    });

    if (!windowStore.isWindowRequestCurrent(props.windowId, requestId)) {
      return;
    }

    windowStore.applyBrowserPageInteractionResponse(
      props.windowId,
      response,
      summarizeInteraction(interaction.userAction),
      requestId,
    );
    lastBrowserInteraction.value = null;
    windowStore.finishWindowLoading(props.windowId, requestId);
  } catch (error) {
    const message =
      error instanceof LlmApiError ? error.message : '浏览器页面交互暂时不可用，请稍后重试。';

    windowStore.failWindowOperation(props.windowId, message, requestId);
  }
}

watch(
  () => props.retryToken,
  () => {
    if (lastBrowserInteraction.value) {
      void handleBrowserInteraction(lastBrowserInteraction.value);
      return;
    }

    if (lastSubmittedInput.value) {
      void navigate(lastSubmittedInput.value);
    }
  },
);
</script>

<template>
  <section class="browser-app">
    <div class="browser-app__toolbar" :class="{ 'browser-app__toolbar--home': !browserHtml }">
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
      <p v-if="currentUrl" class="browser-app__url">{{ currentUrl }}</p>
    </div>
    <HtmlSandboxView
      v-if="browserHtml"
      :html="browserHtml"
      interaction-bridge-mode="browser"
      :title="pageTitle"
      @interact="handleBrowserInteraction"
    />
  </section>
</template>

<style lang="scss" scoped>
.browser-app {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 100%;
  gap: 14px;
  padding: 18px;
}

.browser-app__toolbar {
  display: grid;
  width: min(680px, 100%);
  gap: 14px;
  justify-self: center;
  text-align: center;
}

.browser-app__toolbar--home {
  align-self: center;
  padding: 24px 0;
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
  font-size: 30px;
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

.browser-app__input:focus {
  border-color: var(--color-accent);
  outline: none;
}

.browser-app__button {
  height: 42px;
  padding: 0 18px;
  border: 1px solid var(--color-accent);
  border-radius: 8px;
  color: #ffffff;
  background: var(--color-accent);
}

.browser-app__button:hover,
.browser-app__button:focus-visible {
  border-color: var(--color-accent-strong);
  background: var(--color-accent-strong);
  outline: none;
}

.browser-app__url {
  margin: -6px 0 0;
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
