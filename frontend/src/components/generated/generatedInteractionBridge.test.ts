// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildBrowserInteractionBridgeScript,
  buildGeneratedInteractionBridgeScript,
  isGeneratedAppInteractionMessage,
} from './generatedInteractionBridge';

let bridgeInstalled = false;
let browserBridgeInstalled = false;

describe('generated interaction bridge', () => {
  function installBridge() {
    if (bridgeInstalled) {
      return;
    }

    const script = buildGeneratedInteractionBridgeScript('vibewebos:generated-interaction');
    const scriptBody = script.match(/<script>\n([\s\S]*)<\/script>/)?.[1];

    if (!scriptBody) {
      throw new Error('Bridge script body not found');
    }

    window.eval(scriptBody);
    bridgeInstalled = true;
  }

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('only wires marked generated app controls to LLM actions', () => {
    const script = buildGeneratedInteractionBridgeScript('vibewebos:generated-interaction');

    expect(script).toContain('[data-vibe-llm-action]');
    expect(script).toContain('[data-vibe-llm-submit]');
    expect(script).toContain('vibewebos:llm-request');
    expect(script).not.toContain("closest('a,button");
    expect(script).not.toContain('closest("a,button');
  });

  it('does not post an interaction for unmarked local controls', () => {
    document.body.innerHTML = '<button type="button">+1</button>';
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});

    installBridge();
    document.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(postMessage).not.toHaveBeenCalled();
  });

  it('posts an interaction for marked llm action controls', () => {
    document.body.innerHTML = '<button type="button" data-vibe-llm-action="summarize">Summarize</button>';
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});

    installBridge();
    document.querySelector('button')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'vibewebos:generated-interaction',
        formValues: {},
        userAction: expect.objectContaining({
          type: 'click',
          targetTag: 'button',
          targetText: 'Summarize',
        }),
      }),
      '*',
    );
  });

  it('collects form values only for marked llm submit forms', () => {
    document.body.innerHTML = `
      <form data-vibe-llm-submit="save">
        <input name="title" value="Roadmap" />
        <input name="password" type="password" value="secret" />
        <button type="submit">Save</button>
      </form>
    `;
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});

    installBridge();
    document.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', { bubbles: true }));

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'vibewebos:generated-interaction',
        formValues: {
          title: 'Roadmap',
          password: '用户输入了密码',
        },
        userAction: expect.objectContaining({
          type: 'submit',
          targetTag: 'form',
        }),
      }),
      '*',
    );
  });

  it('does not collect form values for unmarked local forms', () => {
    document.body.innerHTML = `
      <form>
        <input name="title" value="Local only" />
        <button type="submit">Save</button>
      </form>
    `;
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});

    installBridge();
    document.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', { bubbles: true }));

    expect(postMessage).not.toHaveBeenCalled();
  });

  it('accepts only interaction messages from the current iframe source', () => {
    const expectedSource = {};
    const otherSource = {};
    const message = {
      type: 'vibewebos:generated-interaction',
      userAction: {
        type: 'click',
        targetTag: 'button',
        targetText: 'Summarize',
        targetDescription: 'button data-vibe-llm-action=summarize',
      },
      formValues: {},
    };

    expect(isGeneratedAppInteractionMessage(message, expectedSource, expectedSource)).toBe(true);
    expect(isGeneratedAppInteractionMessage(message, otherSource, expectedSource)).toBe(false);
  });

  it('accepts explicit llm request messages from generated app scripts', () => {
    const expectedSource = {};
    const message = {
      type: 'vibewebos:llm-request',
      userAction: {
        type: 'submit',
        targetTag: 'form',
        targetText: 'Plan next step',
        targetDescription: 'form data-vibe-llm-submit=plan',
      },
      formValues: {
        goal: 'Ship MVP',
      },
    };

    expect(isGeneratedAppInteractionMessage(message, expectedSource, expectedSource)).toBe(true);
  });
});

describe('browser interaction bridge', () => {
  function installBrowserBridge() {
    if (browserBridgeInstalled) {
      return;
    }

    const script = buildBrowserInteractionBridgeScript('vibewebos:generated-interaction');
    const scriptBody = script.match(/<script>\n([\s\S]*)<\/script>/)?.[1];

    if (!scriptBody) {
      throw new Error('Browser bridge script body not found');
    }

    window.eval(scriptBody);
    browserBridgeInstalled = true;
  }

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('captures browser page link clicks', () => {
    document.body.innerHTML = '<a href="https://example.com/project">项目详情</a>';
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});

    installBrowserBridge();
    document.querySelector('a')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'vibewebos:generated-interaction',
        formValues: {},
        userAction: expect.objectContaining({
          type: 'link',
          targetTag: 'a',
          targetText: '项目详情',
          targetDescription: expect.stringContaining('href=https://example.com/project'),
        }),
      }),
      '*',
    );
  });

  it('captures browser page form submissions with current values', () => {
    document.body.innerHTML = `
      <form action="/search">
        <input name="keyword" value="项目管理" />
        <select name="type"><option value="all" selected>全部</option></select>
        <button type="submit">搜索</button>
      </form>
    `;
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});

    installBrowserBridge();
    document.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', { bubbles: true }));

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'vibewebos:generated-interaction',
        formValues: {
          keyword: '项目管理',
          type: 'all',
        },
        userAction: expect.objectContaining({
          type: 'submit',
          targetTag: 'form',
        }),
      }),
      '*',
    );
  });

  it('keeps maskable browser values available for parent-window redaction summaries', () => {
    document.body.innerHTML = `
      <form action="/pay">
        <input name="bankCard" value="6222021234567890123" />
        <input name="phone" value="13800138000" />
        <input name="password" type="password" value="secret" />
        <button type="submit">提交</button>
      </form>
    `;
    const postMessage = vi.spyOn(window.parent, 'postMessage').mockImplementation(() => {});

    installBrowserBridge();
    document.querySelector('form')?.dispatchEvent(new SubmitEvent('submit', { bubbles: true }));

    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        formValues: {
          bankCard: '6222021234567890123',
          phone: '13800138000',
          password: '用户输入了密码',
        },
      }),
      '*',
    );
  });
});
