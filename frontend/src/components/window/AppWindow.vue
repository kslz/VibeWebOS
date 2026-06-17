<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue';

import AppSearch from '@/apps/AppSearch/AppSearch.vue';
import AboutApp from '@/apps/AboutApp/AboutApp.vue';
import BrowserApp from '@/apps/BrowserApp/BrowserApp.vue';
import { appGenerate, appInteract, LlmApiError } from '@/api/llmApi';
import HtmlSandboxView from '@/components/generated/HtmlSandboxView.vue';
import SettingsApp from '@/apps/SettingsApp/SettingsApp.vue';
import WindowLoadingOverlay from '@/components/loading/WindowLoadingOverlay.vue';
import WindowResizeHandle from '@/components/window/WindowResizeHandle.vue';
import WindowTitleBar from '@/components/window/WindowTitleBar.vue';
import { useWindowStore } from '@/stores/windowStore';
import type { BuiltInAppId } from '@/types/app';
import type { GeneratedAppInteractionEvent, GeneratedAppWindowPayload, UserAction } from '@/types/llm';
import type { WindowBounds, WindowResizeDirection, WindowState } from '@/types/window';
import { redactFormValues } from '@/utils/redactFormValues';

const props = defineProps<{
  active: boolean;
  window: WindowState;
}>();

const emit = defineEmits<{
  close: [windowId: string];
  focus: [windowId: string];
  maximize: [windowId: string];
  minimize: [windowId: string];
}>();

const windowStore = useWindowStore();
const MIN_WINDOW_WIDTH = 360;
const MIN_WINDOW_HEIGHT = 240;
const resizeDirections: WindowResizeDirection[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const builtInApps = {
  browser: BrowserApp,
  appSearch: AppSearch,
  settings: SettingsApp,
  about: AboutApp,
} satisfies Record<BuiltInAppId, unknown>;

const windowStyle = computed(() => ({
  left: `${props.window.x}px`,
  top: `${props.window.y}px`,
  width: `${props.window.width}px`,
  height: `${props.window.height}px`,
  zIndex: props.window.zIndex,
}));

const builtInComponent = computed(() => {
  if (props.window.content.kind !== 'builtin') {
    return null;
  }

  return builtInApps[props.window.appId as BuiltInAppId] ?? null;
});

const generatedAppPayload = computed(() => {
  if (props.window.content.kind !== 'generatedHtml') {
    return null;
  }

  return props.window.content.payload as GeneratedAppWindowPayload;
});

const loadingText = computed(() => props.window.loadingText ?? '正在准备窗口内容...');

async function retryWindowError() {
  const generatedPayload = generatedAppPayload.value;

  if (!generatedPayload) {
    windowStore.retryWindowOperation(props.window.id);
    return;
  }

  if (props.window.loading) {
    return;
  }

  const requestId = windowStore.startWindowLoading(props.window.id);

  if (requestId === null) {
    return;
  }

  try {
    const response = await appGenerate(generatedPayload.candidate);

    if (!windowStore.isWindowRequestCurrent(props.window.id, requestId)) {
      return;
    }

    windowStore.setGeneratedAppContent(props.window.id, response, requestId);
    windowStore.finishWindowLoading(props.window.id, requestId);
  } catch (error) {
    const message =
      error instanceof LlmApiError ? error.message : '应用生成暂时不可用，请稍后重试。';

    windowStore.failWindowOperation(props.window.id, message, requestId);
  }
}

function summarizeInteraction(userAction: UserAction) {
  const text = userAction.targetText || userAction.targetDescription || userAction.targetTag;

  return `${userAction.type} ${userAction.targetTag} "${text}"`.slice(0, 160);
}

async function handleGeneratedInteraction(interaction: GeneratedAppInteractionEvent) {
  const generatedPayload = generatedAppPayload.value;

  if (!generatedPayload || props.window.loading) {
    return;
  }

  const requestId = windowStore.startWindowLoading(props.window.id);

  if (requestId === null) {
    return;
  }

  try {
    const context = generatedPayload.context;
    const response = await appInteract({
      windowTitle: props.window.title,
      currentSummary: context.currentSummary,
      currentHtml: context.currentHtml,
      userAction: interaction.userAction,
      formValues: redactFormValues(interaction.formValues),
    });

    if (!windowStore.isWindowRequestCurrent(props.window.id, requestId)) {
      return;
    }

    windowStore.applyGeneratedAppInteractionResponse(
      props.window.id,
      response,
      summarizeInteraction(interaction.userAction),
      requestId,
    );
    windowStore.finishWindowLoading(props.window.id, requestId);
  } catch (error) {
    const message =
      error instanceof LlmApiError ? error.message : '应用交互暂时不可用，请稍后重试。';

    windowStore.failWindowOperation(props.window.id, message, requestId);
  }
}

let stopPointerInteraction: (() => void) | null = null;

function stopCurrentPointerInteraction() {
  stopPointerInteraction?.();
  stopPointerInteraction = null;
}

function startDrag(event: PointerEvent) {
  if (props.window.maximized) {
    return;
  }

  emit('focus', props.window.id);
  stopCurrentPointerInteraction();
  event.preventDefault();

  const origin = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    windowX: props.window.x,
    windowY: props.window.y,
  };

  function handlePointerMove(moveEvent: PointerEvent) {
    windowStore.moveWindow(
      props.window.id,
      origin.windowX + moveEvent.clientX - origin.pointerX,
      origin.windowY + moveEvent.clientY - origin.pointerY,
    );
  }

  function handlePointerUp() {
    stopCurrentPointerInteraction();
  }

  globalThis.window.addEventListener('pointermove', handlePointerMove);
  globalThis.window.addEventListener('pointerup', handlePointerUp, { once: true });
  stopPointerInteraction = () => {
    globalThis.window.removeEventListener('pointermove', handlePointerMove);
    globalThis.window.removeEventListener('pointerup', handlePointerUp);
  };
}

function startResize(direction: WindowResizeDirection, event: PointerEvent) {
  if (props.window.maximized) {
    return;
  }

  emit('focus', props.window.id);
  stopCurrentPointerInteraction();
  event.preventDefault();

  const origin = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    bounds: {
      x: props.window.x,
      y: props.window.y,
      width: props.window.width,
      height: props.window.height,
    },
  };

  function buildBounds(moveEvent: PointerEvent): WindowBounds {
    const deltaX = moveEvent.clientX - origin.pointerX;
    const deltaY = moveEvent.clientY - origin.pointerY;
    const bounds = { ...origin.bounds };

    if (direction.includes('e')) {
      bounds.width = origin.bounds.width + deltaX;
    }

    if (direction.includes('s')) {
      bounds.height = origin.bounds.height + deltaY;
    }

    if (direction.includes('w')) {
      bounds.x = origin.bounds.x + deltaX;
      bounds.width = origin.bounds.width - deltaX;

      if (bounds.width < MIN_WINDOW_WIDTH) {
        bounds.x = origin.bounds.x + origin.bounds.width - MIN_WINDOW_WIDTH;
        bounds.width = MIN_WINDOW_WIDTH;
      }
    }

    if (direction.includes('n')) {
      bounds.y = origin.bounds.y + deltaY;
      bounds.height = origin.bounds.height - deltaY;

      if (bounds.height < MIN_WINDOW_HEIGHT) {
        bounds.y = origin.bounds.y + origin.bounds.height - MIN_WINDOW_HEIGHT;
        bounds.height = MIN_WINDOW_HEIGHT;
      }
    }

    return bounds;
  }

  function handlePointerMove(moveEvent: PointerEvent) {
    windowStore.resizeWindow(props.window.id, buildBounds(moveEvent));
  }

  function handlePointerUp() {
    stopCurrentPointerInteraction();
  }

  globalThis.window.addEventListener('pointermove', handlePointerMove);
  globalThis.window.addEventListener('pointerup', handlePointerUp, { once: true });
  stopPointerInteraction = () => {
    globalThis.window.removeEventListener('pointermove', handlePointerMove);
    globalThis.window.removeEventListener('pointerup', handlePointerUp);
  };
}

onBeforeUnmount(() => {
  stopCurrentPointerInteraction();
});
</script>

<template>
  <article
    class="app-window"
    :class="{ 'app-window--active': active, 'app-window--maximized': window.maximized }"
    :style="windowStyle"
    :aria-label="window.title"
    @pointerdown="$emit('focus', window.id)"
  >
    <WindowTitleBar
      :maximized="window.maximized"
      :title="window.title"
      @close="$emit('close', window.id)"
      @maximize="$emit('maximize', window.id)"
      @minimize="$emit('minimize', window.id)"
      @start-drag="startDrag"
    />
    <section class="app-window__body">
      <div class="app-window__content" :class="{ 'app-window__content--loading': window.loading }">
        <component
          :is="builtInComponent"
          v-if="builtInComponent"
          :retry-token="window.retryToken"
          :window-id="window.id"
        />
        <HtmlSandboxView
          v-else-if="generatedAppPayload"
          :html="generatedAppPayload.html"
          :title="window.title"
          @interact="handleGeneratedInteraction"
        />
        <div v-else class="app-window__placeholder">窗口内容暂未接入。</div>
      </div>
      <div v-if="window.error" class="app-window__error" role="alert">
        <span>{{ window.error }}</span>
        <button class="app-window__retry" type="button" @click="retryWindowError">
          重试
        </button>
      </div>
      <WindowLoadingOverlay
        v-if="window.loading"
        :text="loadingText"
        :text-key="window.loadingTextKey"
      />
    </section>
    <template v-if="!window.maximized">
      <WindowResizeHandle
        v-for="direction in resizeDirections"
        :key="direction"
        :direction="direction"
        @start-resize="startResize"
      />
    </template>
  </article>
</template>

<style lang="scss" scoped>
.app-window {
  position: absolute;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 360px;
  min-height: 240px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-window-bg);
  box-shadow: var(--shadow-window);
}

.app-window--active {
  border-color: color-mix(in srgb, var(--color-accent) 58%, var(--color-border));
}

.app-window--maximized {
  border-radius: 8px;
}

.app-window__body {
  position: relative;
  min-height: 0;
  color: var(--color-text-primary);
  background: var(--color-window-bg);
}

.app-window__content {
  height: 100%;
  padding: 20px;
}

.app-window__content--loading {
  user-select: none;
}

.app-window__placeholder {
  display: grid;
  height: 100%;
  place-items: center;
  color: var(--color-text-secondary);
}

.app-window__error {
  position: absolute;
  right: 16px;
  bottom: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid #dc2626;
  border-radius: 8px;
  color: #991b1b;
  background: #fee2e2;
  box-shadow: 0 14px 36px rgba(127, 29, 29, 0.16);
}

.app-window__retry {
  flex: 0 0 auto;
  height: 30px;
  padding: 0 12px;
  border: 1px solid #991b1b;
  border-radius: 8px;
  color: #991b1b;
  background: #ffffff;
}

.app-window__retry:hover,
.app-window__retry:focus-visible {
  color: #ffffff;
  background: #991b1b;
  outline: none;
}
</style>
