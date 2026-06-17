import type { GeneratedAppInteractionEvent } from '@/types/llm';

export const generatedInteractionMessageType = 'vibewebos:generated-interaction';
export const generatedLlmRequestMessageType = 'vibewebos:llm-request';

export function buildGeneratedInteractionBridgeScript(
  messageType = generatedInteractionMessageType,
) {
  return `
<script>
(function () {
  var MESSAGE_TYPE = '${messageType}';
  var LLM_REQUEST_TYPE = '${generatedLlmRequestMessageType}';

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
    var action = element.getAttribute('data-vibe-llm-action') || element.getAttribute('data-vibe-llm-submit');
    var role = element.getAttribute('role');
    var label = element.getAttribute('aria-label');
    var name = element.getAttribute('name');
    var href = element.getAttribute('href');
    var type = element.getAttribute('type');

    if (action) parts.push('llmAction=' + cleanText(action));
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

    if (
      (key.indexOf('payment') !== -1 || key.indexOf('pay') !== -1 || key.indexOf('支付') !== -1) &&
      (type === 'password' || key.indexOf('password') !== -1 || key.indexOf('pwd') !== -1 || key.indexOf('密码') !== -1)
    ) {
      return '用户输入了支付密码';
    }

    if (type === 'password' || key.indexOf('password') !== -1 || key.indexOf('pwd') !== -1 || key.indexOf('密码') !== -1) {
      return '用户输入了密码';
    }

    if (
      key.indexOf('code') !== -1 ||
      key.indexOf('otp') !== -1 ||
      key.indexOf('verification') !== -1 ||
      key.indexOf('验证码') !== -1 ||
      key.indexOf('校验码') !== -1
    ) {
      return '用户输入了验证码';
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
      ? event.target.closest('[data-vibe-llm-action]')
      : null;

    if (!target) {
      return;
    }

    event.preventDefault();
    postInteraction({
      type: target.tagName.toLowerCase() === 'a' ? 'link' : 'click',
      targetTag: target.tagName.toLowerCase(),
      targetText: targetText(target),
      targetDescription: describeTarget(target)
    });
  }, true);

  document.addEventListener('submit', function (event) {
    var form = event.target && event.target.closest
      ? event.target.closest('form[data-vibe-llm-submit]')
      : null;

    if (!form) {
      return;
    }

    event.preventDefault();
    postInteraction({
      type: 'submit',
      targetTag: 'form',
      targetText: targetText(event.submitter) || targetText(form),
      targetDescription: describeTarget(form)
    }, collectFormValues(form));
  }, true);

  window.addEventListener('message', function (event) {
    var data = event.data || {};

    if (data.type !== LLM_REQUEST_TYPE || !data.userAction) {
      return;
    }

    postInteraction(data.userAction, data.formValues || {});
  });
})();
<\/script>`;
}

export function buildBrowserInteractionBridgeScript(
  messageType = generatedInteractionMessageType,
) {
  return `
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

    if (
      (key.indexOf('payment') !== -1 || key.indexOf('pay') !== -1 || key.indexOf('支付') !== -1) &&
      (type === 'password' || key.indexOf('password') !== -1 || key.indexOf('pwd') !== -1 || key.indexOf('密码') !== -1)
    ) {
      return '用户输入了支付密码';
    }

    if (type === 'password' || key.indexOf('password') !== -1 || key.indexOf('pwd') !== -1 || key.indexOf('密码') !== -1) {
      return '用户输入了密码';
    }

    if (
      key.indexOf('code') !== -1 ||
      key.indexOf('otp') !== -1 ||
      key.indexOf('verification') !== -1 ||
      key.indexOf('验证码') !== -1 ||
      key.indexOf('校验码') !== -1
    ) {
      return '用户输入了验证码';
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
      ? event.target.closest('a[href]')
      : null;

    if (!target) {
      return;
    }

    event.preventDefault();
    postInteraction({
      type: 'link',
      targetTag: target.tagName.toLowerCase(),
      targetText: targetText(target),
      targetDescription: describeTarget(target)
    });
  }, true);

  document.addEventListener('submit', function (event) {
    var form = event.target && event.target.closest
      ? event.target.closest('form')
      : null;

    if (!form) {
      return;
    }

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
}

export function isGeneratedAppInteractionMessage(
  value: unknown,
  source: unknown,
  expectedSource: unknown,
  messageType = generatedInteractionMessageType,
): value is GeneratedAppInteractionEvent & { type: string } {
  if (source !== expectedSource || !value || typeof value !== 'object') {
    return false;
  }

  const payload = value as Partial<GeneratedAppInteractionEvent> & { type?: string };
  const action = payload.userAction;

  return (
    (payload.type === messageType || payload.type === generatedLlmRequestMessageType) &&
    Boolean(action) &&
    typeof action?.type === 'string' &&
    typeof action?.targetTag === 'string' &&
    typeof action?.targetText === 'string' &&
    typeof action?.targetDescription === 'string' &&
    Boolean(payload.formValues) &&
    typeof payload.formValues === 'object'
  );
}
