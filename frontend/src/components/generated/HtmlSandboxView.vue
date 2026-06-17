<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import {
  buildBrowserInteractionBridgeScript,
  buildGeneratedInteractionBridgeScript,
  generatedInteractionMessageType,
  isGeneratedAppInteractionMessage,
} from '@/components/generated/generatedInteractionBridge';
import type { GeneratedAppInteractionEvent } from '@/types/llm';

type InteractionBridgeMode = 'generated' | 'browser' | 'none';

const props = defineProps<{
  enableInteractionBridge?: boolean;
  html: string;
  interactionBridgeMode?: InteractionBridgeMode;
  title: string;
}>();

const emit = defineEmits<{
  interact: [event: GeneratedAppInteractionEvent];
}>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const activeInteractionBridgeMode = computed<InteractionBridgeMode>(() => {
  if (props.interactionBridgeMode) {
    return props.interactionBridgeMode;
  }

  return props.enableInteractionBridge === false ? 'none' : 'generated';
});

const interactionBridgeScript = computed(() => {
  if (activeInteractionBridgeMode.value === 'browser') {
    return buildBrowserInteractionBridgeScript(generatedInteractionMessageType);
  }

  if (activeInteractionBridgeMode.value === 'generated') {
    return buildGeneratedInteractionBridgeScript(generatedInteractionMessageType);
  }

  return '';
});

const sandboxHtml = computed(() =>
  interactionBridgeScript.value ? `${props.html}\n${interactionBridgeScript.value}` : props.html,
);

function handleMessage(event: MessageEvent) {
  if (activeInteractionBridgeMode.value === 'none') {
    return;
  }

  if (
    !isGeneratedAppInteractionMessage(
      event.data,
      event.source,
      iframeRef.value?.contentWindow,
      generatedInteractionMessageType,
    )
  ) {
    return;
  }

  emit('interact', {
    userAction: event.data.userAction,
    formValues: event.data.formValues,
  });
}

onMounted(() => {
  globalThis.window.addEventListener('message', handleMessage);
});

onBeforeUnmount(() => {
  globalThis.window.removeEventListener('message', handleMessage);
});
</script>

<template>
  <iframe
    ref="iframeRef"
    class="html-sandbox-view"
    :srcdoc="sandboxHtml"
    :title="title"
    sandbox="allow-forms allow-scripts allow-same-origin"
  />
</template>

<style lang="scss" scoped>
.html-sandbox-view {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #ffffff;
}
</style>
