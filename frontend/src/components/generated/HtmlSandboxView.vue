<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import type { GeneratedAppInteractionEvent } from '@/types/llm';

const props = defineProps<{
  html: string;
  title: string;
}>();

const emit = defineEmits<{
  interact: [event: GeneratedAppInteractionEvent];
}>();

const iframeRef = ref<HTMLIFrameElement | null>(null);
const messageType = 'vibewebos:generated-interaction';
const interactionBridgeScript = `
<script>
(function () {
  var MESSAGE_TYPE = '${messageType}';

  function cleanText(value) {
    return String(value || '').replace(/\\s+/g, ' ').trim().slice(0, 160);
  }

  function targetText(element) {
    if (!element) {
      return '';
    }

    return cleanText(element.innerText || element.textContent || element.value || element.getAttribute('aria-label') || '');
  }

  function describeTarget(element) {
    if (!element) {
      return '';
    }

    var parts = [element.tagName.toLowerCase()];
    var role = element.getAttribute('role');
    var label = element.getAttribute('aria-label');
    var name = element.getAttribute('name');
    var href = element.getAttribute('href');
    var type = element.getAttribute('type');

    if (type) parts.push('type=' + type);
    if (role) parts.push('role=' + role);
    if (label) parts.push('label=' + cleanText(label));
    if (name) parts.push('name=' + cleanText(name));
    if (href) parts.push('href=' + cleanText(href));

    return parts.join(' ');
  }

  function redactControlValue(control) {
    var key = [
      control.getAttribute('name'),
      control.getAttribute('id'),
      control.getAttribute('autocomplete'),
      control.getAttribute('aria-label'),
      control.getAttribute('placeholder')
    ].join(' ').toLowerCase();
    var type = String(control.getAttribute('type') || '').toLowerCase();
    var value = String(control.value || '');

    if (type === 'password' || key.indexOf('password') !== -1 || key.indexOf('pwd') !== -1) {
      return '[redacted password]';
    }

    if (key.indexOf('code') !== -1 || key.indexOf('otp') !== -1 || key.indexOf('verification') !== -1) {
      return '[redacted verification code]';
    }

    if (key.indexOf('card') !== -1 || key.indexOf('phone') !== -1 || key.indexOf('id') !== -1) {
      return value ? '[redacted sensitive value]' : '';
    }

    return value;
  }

  function collectFormValues(form) {
    var values = {};
    var controls = Array.prototype.slice.call(form.elements || []);

    controls.forEach(function (control) {
      if (!control || control.disabled || !control.name) {
        return;
      }

      var tag = control.tagName.toLowerCase();
      var type = String(control.type || '').toLowerCase();

      if (tag === 'button' || type === 'button' || type === 'submit' || type === 'reset') {
        return;
      }

      if ((type === 'checkbox' || type === 'radio') && !control.checked) {
        return;
      }

      if (tag === 'select' && control.multiple) {
        values[control.name] = Array.prototype.slice.call(control.selectedOptions || [])
          .map(function (option) { return option.value; })
          .join(', ');
        return;
      }

      values[control.name] = redactControlValue(control);
    });

    return values;
  }

  function postInteraction(userAction, formValues) {
    window.parent.postMessage({
      type: MESSAGE_TYPE,
      userAction: userAction,
      formValues: formValues || {}
    }, '*');
  }

  document.addEventListener('click', function (event) {
    var target = event.target && event.target.closest
      ? event.target.closest('a,button,[role="button"],input[type="button"],input[type="submit"]')
      : null;

    if (!target) {
      return;
    }

    var tag = target.tagName.toLowerCase();
    var type = String(target.getAttribute('type') || '').toLowerCase();

    if ((tag === 'button' || tag === 'input') && (type === 'submit' || (!type && tag === 'button')) && target.closest('form')) {
      return;
    }

    event.preventDefault();
    postInteraction({
      type: tag === 'a' ? 'link' : 'click',
      targetTag: tag,
      targetText: targetText(target),
      targetDescription: describeTarget(target)
    });
  }, true);

  document.addEventListener('submit', function (event) {
    var form = event.target;
    event.preventDefault();

    postInteraction({
      type: 'submit',
      targetTag: 'form',
      targetText: targetText(event.submitter) || targetText(form),
      targetDescription: describeTarget(form)
    }, collectFormValues(form));
  }, true);
})();
<\/script>`;

const sandboxHtml = computed(() => `${props.html}\n${interactionBridgeScript}`);

function isInteractionEvent(value: unknown): value is GeneratedAppInteractionEvent & { type: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Partial<GeneratedAppInteractionEvent> & { type?: string };
  const action = payload.userAction;

  return (
    payload.type === messageType &&
    Boolean(action) &&
    typeof action?.type === 'string' &&
    typeof action?.targetTag === 'string' &&
    typeof action?.targetText === 'string' &&
    typeof action?.targetDescription === 'string' &&
    Boolean(payload.formValues) &&
    typeof payload.formValues === 'object'
  );
}

function handleMessage(event: MessageEvent) {
  if (event.source !== iframeRef.value?.contentWindow || !isInteractionEvent(event.data)) {
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
    sandbox="allow-forms allow-scripts"
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
