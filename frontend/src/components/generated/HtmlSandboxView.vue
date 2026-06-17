<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import {
  buildGeneratedInteractionBridgeScript,
  generatedInteractionMessageType,
  isGeneratedAppInteractionMessage,
} from '@/components/generated/generatedInteractionBridge';
import type { GeneratedAppInteractionEvent } from '@/types/llm';

const props = defineProps<{
  html: string;
  title: string;
}>();

const emit = defineEmits<{
  interact: [event: GeneratedAppInteractionEvent];
}>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const interactionBridgeScript = buildGeneratedInteractionBridgeScript(generatedInteractionMessageType);

const sandboxHtml = computed(() => `${props.html}\n${interactionBridgeScript}`);

function handleMessage(event: MessageEvent) {
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
