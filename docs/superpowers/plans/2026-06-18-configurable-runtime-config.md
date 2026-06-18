# Configurable Runtime Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add root-level runtime configuration for non-sensitive LLM and UI settings while keeping API keys only in `.env` as `LLM_API_KEY`.

**Architecture:** A root `config/app.config.json` stores non-sensitive defaults for LLM provider/base URL/model/request timeout and UI copy. Backend code loads and validates the root config with Pydantic, then combines it with `LLM_API_KEY` from environment variables. Frontend code imports only the `ui` portion through the existing `systemConfig` facade so API keys and backend-only LLM settings never enter the frontend bundle.

**Tech Stack:** Python, FastAPI, Pydantic Settings, Vue 3, TypeScript, Vite JSON import, Pinia, Vitest, pytest.

## Global Constraints

- API keys must exist only in `.env` or environment variables as `LLM_API_KEY`.
- Do not support `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, `DEEPSEEK_MODEL`, `REQUEST_TIMEOUT_SECONDS`, or `LLM_REQUEST_TIMEOUT_SECONDS` in the new configuration path.
- LLM model default is `deepseek-v4-flash`.
- LLM request timeout is configured only by `config/app.config.json` field `llm.requestTimeoutSeconds`.
- The frontend may import only `ui` configuration fields.
- The frontend must never import, display, serialize, or bundle `LLM_API_KEY`.
- Missing `config/app.config.json` must fall back to code defaults.
- Existing MVP scope remains unchanged: no config UI, no database, no persistent user settings, no generated-app security model change.

---

## File Map

- Create: `config/app.config.json`
  - Root non-sensitive runtime config.
- Create: `backend/app/runtime_config.py`
  - Pydantic config models and root config loader.
- Modify: `backend/app/config.py`
  - Use `RuntimeConfig` defaults and `LLM_API_KEY`.
- Modify: `backend/app/services/deepseek_client.py`
  - Continue consuming settings, now backed by runtime config.
- Create: `backend/tests/test_runtime_config.py`
  - Backend config loading, validation, defaults, and secret-boundary tests.
- Modify: `frontend/src/config/systemConfig.ts`
  - Merge code defaults with root config `ui` values.
- Create or modify: `frontend/src/config/systemConfig.test.ts`
  - Frontend config facade tests.
- Modify: `frontend/src/vite-env.d.ts`
  - Add JSON module typing if needed by TypeScript.
- Modify: `README.md`
  - Document root config and `backend/.env`.
- Modify: `backend/.env.example`
  - Keep only `LLM_API_KEY`.
- Modify: `docs/验收记录.md`
  - Add final note that runtime config remains non-sensitive and API key is env-only.

---

### Task 1: Root Runtime Config File and Backend Loader

**Files:**
- Create: `config/app.config.json`
- Create: `backend/app/runtime_config.py`
- Create: `backend/tests/test_runtime_config.py`

**Interfaces:**
- Produces:
  - `RuntimeConfig`
  - `LlmRuntimeConfig`
  - `UiRuntimeConfig`
  - `load_runtime_config(config_path: Path | None = None) -> RuntimeConfig`
  - `DEFAULT_RUNTIME_CONFIG: RuntimeConfig`

- [ ] **Step 1: Write failing tests for defaults, file loading, invalid JSON, invalid values, and secret exclusion**

Create `backend/tests/test_runtime_config.py`:

```python
from pathlib import Path

import pytest
from pydantic import ValidationError

from app.runtime_config import RuntimeConfig, load_runtime_config


def test_load_runtime_config_uses_defaults_when_file_is_missing(tmp_path: Path) -> None:
    config = load_runtime_config(tmp_path / "missing.json")

    assert config.llm.provider == "deepseek"
    assert config.llm.base_url == "https://api.deepseek.com"
    assert config.llm.model == "deepseek-v4-flash"
    assert config.llm.request_timeout_seconds == 60
    assert config.ui.system_name == "VibeWebOS"
    assert config.ui.waiting_text_switch_delay_ms == 5000
    assert config.ui.waiting_texts


def test_load_runtime_config_reads_root_json_values(tmp_path: Path) -> None:
    config_path = tmp_path / "app.config.json"
    config_path.write_text(
        """
        {
          "llm": {
            "provider": "openai-compatible",
            "baseUrl": "https://llm.example.com/v1",
            "model": "custom-model",
            "requestTimeoutSeconds": 120
          },
          "ui": {
            "systemName": "CustomOS",
            "aboutText": "Custom about text.",
            "waitingTexts": ["Thinking...", "Rendering..."],
            "waitingTextSwitchDelayMs": 3000
          }
        }
        """,
        encoding="utf-8",
    )

    config = load_runtime_config(config_path)

    assert config.llm.provider == "openai-compatible"
    assert config.llm.base_url == "https://llm.example.com/v1"
    assert config.llm.model == "custom-model"
    assert config.llm.request_timeout_seconds == 120
    assert config.ui.system_name == "CustomOS"
    assert config.ui.about_text == "Custom about text."
    assert config.ui.waiting_texts == ["Thinking...", "Rendering..."]
    assert config.ui.waiting_text_switch_delay_ms == 3000


def test_load_runtime_config_rejects_invalid_json(tmp_path: Path) -> None:
    config_path = tmp_path / "app.config.json"
    config_path.write_text("{ broken", encoding="utf-8")

    with pytest.raises(ValueError, match="Invalid runtime config JSON"):
        load_runtime_config(config_path)


def test_runtime_config_rejects_empty_waiting_texts() -> None:
    with pytest.raises(ValidationError):
        RuntimeConfig.model_validate(
            {
                "ui": {
                    "waitingTexts": [],
                }
            }
        )


def test_runtime_config_rejects_non_positive_timeout() -> None:
    with pytest.raises(ValidationError):
        RuntimeConfig.model_validate(
            {
                "llm": {
                    "requestTimeoutSeconds": 0,
                }
            }
        )


def test_runtime_config_does_not_define_api_key_fields() -> None:
    config = RuntimeConfig()
    serialized = config.model_dump(by_alias=True)

    assert "apiKey" not in str(serialized)
    assert "LLM_API_KEY" not in str(serialized)
```

- [ ] **Step 2: Run tests and verify they fail**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/test_runtime_config.py -q
```

Expected: fail with `ModuleNotFoundError: No module named 'app.runtime_config'`.

- [ ] **Step 3: Add root config file**

Create `config/app.config.json`:

```json
{
  "llm": {
    "provider": "deepseek",
    "baseUrl": "https://api.deepseek.com",
    "model": "deepseek-v4-flash",
    "requestTimeoutSeconds": 60
  },
  "ui": {
    "systemName": "VibeWebOS",
    "aboutText": "VibeWebOS 是一个中文浏览器桌面 MVP。它以 Windows 11 风格呈现多窗口应用、浏览器和由大模型生成的页面内容，所有状态仅保存在当前浏览器内存中。",
    "waitingTexts": [
      "正在整理你的想法...",
      "正在生成一个更像应用的界面...",
      "正在检查页面结构...",
      "正在准备窗口内容..."
    ],
    "waitingTextSwitchDelayMs": 5000
  }
}
```

- [ ] **Step 4: Implement backend runtime config loader**

Create `backend/app/runtime_config.py`:

```python
from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, PositiveFloat, PositiveInt, StringConstraints

NonEmptyString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class LlmRuntimeConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provider: NonEmptyString = "deepseek"
    base_url: HttpUrl = Field(default="https://api.deepseek.com", alias="baseUrl")
    model: NonEmptyString = "deepseek-v4-flash"
    request_timeout_seconds: PositiveFloat = Field(default=60, alias="requestTimeoutSeconds")


class UiRuntimeConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    system_name: NonEmptyString = Field(default="VibeWebOS", alias="systemName")
    about_text: NonEmptyString = Field(
        default=(
            "VibeWebOS 是一个中文浏览器桌面 MVP。它以 Windows 11 风格呈现多窗口应用、"
            "浏览器和由大模型生成的页面内容，所有状态仅保存在当前浏览器内存中。"
        ),
        alias="aboutText",
    )
    waiting_texts: list[NonEmptyString] = Field(
        default_factory=lambda: [
            "正在整理你的想法...",
            "正在生成一个更像应用的界面...",
            "正在检查页面结构...",
            "正在准备窗口内容...",
        ],
        alias="waitingTexts",
        min_length=1,
    )
    waiting_text_switch_delay_ms: PositiveInt = Field(default=5000, alias="waitingTextSwitchDelayMs")


class RuntimeConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    llm: LlmRuntimeConfig = Field(default_factory=LlmRuntimeConfig)
    ui: UiRuntimeConfig = Field(default_factory=UiRuntimeConfig)


DEFAULT_RUNTIME_CONFIG = RuntimeConfig()


def default_config_path() -> Path:
    return Path(__file__).resolve().parents[2] / "config" / "app.config.json"


def load_runtime_config(config_path: Path | None = None) -> RuntimeConfig:
    path = config_path or default_config_path()

    if not path.exists():
        return DEFAULT_RUNTIME_CONFIG

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid runtime config JSON: {path}") from exc

    return RuntimeConfig.model_validate(payload)
```

- [ ] **Step 5: Run backend config tests**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/test_runtime_config.py -q
```

Expected: all tests pass.

- [ ] **Step 6: Commit Task 1**

```powershell
git add config/app.config.json backend/app/runtime_config.py backend/tests/test_runtime_config.py
git commit -m "feat: add runtime config loader"
```

---

### Task 2: Wire Backend Settings to Runtime Config and LLM_API_KEY

**Files:**
- Modify: `backend/app/config.py`
- Modify: `backend/app/services/deepseek_client.py`
- Modify: `backend/tests/test_runtime_config.py`
- Modify: `backend/tests/test_api_routes.py`

**Interfaces:**
- Consumes: `load_runtime_config()` and `DEFAULT_RUNTIME_CONFIG` from Task 1.
- Produces:
  - `Settings.deepseek_api_key` backed by `LLM_API_KEY`
  - `Settings.deepseek_base_url` backed by `config/app.config.json`
  - `Settings.deepseek_model` backed by `config/app.config.json`
  - `Settings.request_timeout_seconds` backed by `config/app.config.json`

- [ ] **Step 1: Add failing settings tests**

Append to `backend/tests/test_runtime_config.py`:

```python
from app.config import Settings


def test_settings_reads_llm_api_key_only_from_generic_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("LLM_API_KEY", "generic-key")
    monkeypatch.setenv("DEEPSEEK_API_KEY", "legacy-key")

    settings = Settings()

    assert settings.deepseek_api_key == "generic-key"


def test_settings_ignores_legacy_deepseek_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.setenv("DEEPSEEK_API_KEY", "legacy-key")

    settings = Settings()

    assert settings.deepseek_api_key is None


def test_settings_uses_runtime_config_for_llm_defaults(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("DEEPSEEK_BASE_URL", raising=False)
    monkeypatch.delenv("DEEPSEEK_MODEL", raising=False)
    monkeypatch.delenv("REQUEST_TIMEOUT_SECONDS", raising=False)

    settings = Settings()

    assert settings.deepseek_base_url == "https://api.deepseek.com"
    assert settings.deepseek_model == "deepseek-v4-flash"
    assert settings.request_timeout_seconds == 60
```

- [ ] **Step 2: Run settings tests and verify they fail**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/test_runtime_config.py -q
```

Expected: fail because `Settings` still reads legacy env names and default model `deepseek-chat`.

- [ ] **Step 3: Modify backend settings**

Update `backend/app/config.py`:

```python
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.runtime_config import load_runtime_config

runtime_config = load_runtime_config()


class Settings(BaseSettings):
    app_name: str = "VibeWebOS API"
    deepseek_api_key: Optional[str] = Field(default=None, alias="LLM_API_KEY")
    deepseek_base_url: str = str(runtime_config.llm.base_url)
    deepseek_model: str = runtime_config.llm.model
    request_timeout_seconds: float = runtime_config.llm.request_timeout_seconds
    max_html_length: int = 80000

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        populate_by_name=True,
        extra="ignore",
    )


settings = Settings()
```

- [ ] **Step 4: Verify DeepSeekClient still consumes settings without signature changes**

No code change should be required in `backend/app/services/deepseek_client.py` if it already reads:

```python
self.api_key = api_key if api_key is not None else settings.deepseek_api_key
self.base_url = (base_url or settings.deepseek_base_url).rstrip("/")
self.model = model or settings.deepseek_model
self.timeout_seconds = timeout_seconds or settings.request_timeout_seconds
```

If code differs, update it to match this behavior.

- [ ] **Step 5: Run backend tests**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests/test_runtime_config.py tests/test_api_routes.py -q
```

Expected: all tests pass.

- [ ] **Step 6: Run full backend suite**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests
```

Expected: all tests pass.

- [ ] **Step 7: Commit Task 2**

```powershell
git add backend/app/config.py backend/app/services/deepseek_client.py backend/tests/test_runtime_config.py backend/tests/test_api_routes.py
git commit -m "feat: use runtime config for backend llm settings"
```

---

### Task 3: Frontend UI Config from Root Config

**Files:**
- Modify: `frontend/src/config/systemConfig.ts`
- Create: `frontend/src/config/systemConfig.test.ts`
- Modify: `frontend/src/vite-env.d.ts`

**Interfaces:**
- Consumes: `config/app.config.json` from Task 1.
- Produces: `systemConfig` with configured `systemName`, `aboutText`, `waitingTexts`, and `waitingTextSwitchDelayMs`.

- [ ] **Step 1: Add TypeScript JSON typing if needed**

Open `frontend/src/vite-env.d.ts`. If it only contains Vite defaults, keep them and add:

```ts
declare module '*.json' {
  const value: unknown;
  export default value;
}
```

If TypeScript already accepts JSON imports through Vite, this step may be unnecessary; prefer the smallest working change.

- [ ] **Step 2: Write frontend config tests**

Create `frontend/src/config/systemConfig.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { systemConfig } from './systemConfig';

describe('systemConfig runtime config', () => {
  it('loads UI copy from the root runtime config', () => {
    expect(systemConfig.systemName).toBe('VibeWebOS');
    expect(systemConfig.aboutText).toContain('VibeWebOS');
    expect(systemConfig.waitingTexts).toEqual([
      '正在整理你的想法...',
      '正在生成一个更像应用的界面...',
      '正在检查页面结构...',
      '正在准备窗口内容...',
    ]);
    expect(systemConfig.waitingTextSwitchDelayMs).toBe(5000);
  });

  it('does not expose LLM config to the frontend facade', () => {
    expect(systemConfig).not.toHaveProperty('llm');
    expect(JSON.stringify(systemConfig)).not.toContain('LLM_API_KEY');
    expect(JSON.stringify(systemConfig)).not.toContain('deepseek-v4-flash');
    expect(JSON.stringify(systemConfig)).not.toContain('api.deepseek.com');
  });
});
```

- [ ] **Step 3: Run frontend config tests and verify they fail if hardcoded copy differs**

Run:

```powershell
cd frontend
npm test -- systemConfig
```

Expected: fail if `systemConfig.ts` still contains old hardcoded/mojibake copy or does not import root config.

- [ ] **Step 4: Implement frontend config merge**

Update `frontend/src/config/systemConfig.ts`:

```ts
import type { BuiltInAppId, ThemeMode } from '@/types/app';
import rootRuntimeConfig from '../../../config/app.config.json';

interface RuntimeUiConfig {
  systemName?: string;
  aboutText?: string;
  waitingTexts?: string[];
  waitingTextSwitchDelayMs?: number;
}

interface RuntimeConfigFile {
  ui?: RuntimeUiConfig;
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

const runtimeConfig = rootRuntimeConfig as RuntimeConfigFile;
const runtimeUiConfig = runtimeConfig.ui ?? {};
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
```

- [ ] **Step 5: Run frontend config tests**

Run:

```powershell
cd frontend
npm test -- systemConfig
```

Expected: pass.

- [ ] **Step 6: Run frontend lint and typecheck**

Run:

```powershell
cd frontend
npm run lint
npm run typecheck
```

Expected: both pass.

- [ ] **Step 7: Commit Task 3**

```powershell
git add frontend/src/config/systemConfig.ts frontend/src/config/systemConfig.test.ts frontend/src/vite-env.d.ts
git commit -m "feat: load frontend ui config from root config"
```

---

### Task 4: Documentation and Env Example

**Files:**
- Modify: `README.md`
- Modify: `backend/.env.example`
- Modify: `docs/验收记录.md`

**Interfaces:**
- Consumes: `config/app.config.json`, `backend/.env.example`, and `LLM_API_KEY` behavior from prior tasks.
- Produces: user-facing setup instructions for root runtime config and env key.

- [ ] **Step 1: Ensure env example contains only LLM_API_KEY**

Set `backend/.env.example` exactly:

```env
# Copy this file to backend/.env and fill in your own key.
# Do not commit backend/.env.

# API key for the configured LLM provider.
LLM_API_KEY=
```

- [ ] **Step 2: Update README configuration section**

Add a section after backend startup instructions. The inserted README section must say:

- Non-sensitive runtime config lives at `config/app.config.json`.
- Users may edit `llm.provider`, `llm.baseUrl`, `llm.model`, `llm.requestTimeoutSeconds`, `ui.systemName`, `ui.aboutText`, `ui.waitingTexts`, and `ui.waitingTextSwitchDelayMs`.
- API Key must not be written to `config/app.config.json`.
- Users should copy `backend/.env.example` to `backend/.env`.
- `backend/.env` contains only `LLM_API_KEY` with the user's own key as its value.
- Complex generated apps that time out can use a larger `llm.requestTimeoutSeconds` value in `config/app.config.json`.

Use fenced blocks only for the exact command examples:

```powershell
copy backend\.env.example backend\.env
```

```env
LLM_API_KEY=
```

- [ ] **Step 3: Update acceptance record**

Append a `Runtime Config Follow-Up` section to `docs/验收记录.md` with these exact points:

- Root non-sensitive config is documented at `config/app.config.json`.
- API key remains env-only as `LLM_API_KEY`.
- LLM request timeout is controlled by `llm.requestTimeoutSeconds`, not `.env`.
- Frontend imports only UI config.

- [ ] **Step 4: Run doc-related checks**

Run:

```powershell
rg -n "DEEPSEEK_API_KEY|DEEPSEEK_MODEL|DEEPSEEK_BASE_URL|REQUEST_TIMEOUT_SECONDS|LLM_REQUEST_TIMEOUT_SECONDS" README.md backend/.env.example docs/superpowers/specs/2026-06-18-configurable-runtime-config-design.md
```

Expected: no output.

- [ ] **Step 5: Commit Task 4**

```powershell
git add README.md backend/.env.example docs/验收记录.md
git commit -m "docs: document runtime configuration"
```

---

### Task 5: Final Verification and Secret Scan

**Files:**
- Modify only if verification exposes a problem:
  - `frontend/`
  - `backend/`
  - `README.md`
  - `docs/验收记录.md`

**Interfaces:**
- Consumes all prior task outputs.
- Produces a release-ready branch with verified runtime config behavior.

- [ ] **Step 1: Run backend full suite**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests
```

Expected: all tests pass.

- [ ] **Step 2: Run frontend lint**

Run:

```powershell
cd frontend
npm run lint
```

Expected: exit code 0.

- [ ] **Step 3: Run frontend tests**

Run:

```powershell
cd frontend
npm test
```

Expected: all tests pass. On Windows, Vitest may print worker `kill EPERM` warnings after tests pass; record the warning only if exit code remains 0.

- [ ] **Step 4: Run frontend typecheck**

Run:

```powershell
cd frontend
npm run typecheck
```

Expected: exit code 0.

- [ ] **Step 5: Run frontend production build**

Run:

```powershell
cd frontend
npm run build
```

Expected: exit code 0.

- [ ] **Step 6: Secret scan**

Run:

```powershell
cd ..
$secretPattern = "sk-[A-Za-z0-9]{16,}|" + "LLM_API_KEY=" + ".+"
rg -n $secretPattern -g "!frontend/node_modules/**" -g "!frontend/dist/**" -g "!backend/.venv/**" -g "!**/.git/**" .
```

Expected: no real key. `backend/.env.example` may contain `LLM_API_KEY` with an empty value.

- [ ] **Step 7: Verify startup paths**

Run:

```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In another terminal:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/health
```

Expected: `{"status":"ok"}`.

Run frontend:

```powershell
cd frontend
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

Expected: desktop loads and About page uses configured text.

- [ ] **Step 8: Commit final verification docs if changed**

If docs were updated with verification notes:

```powershell
git add README.md docs/验收记录.md
git commit -m "chore: verify runtime configuration"
```

If no files changed, skip commit.

---

## Self-Review

- Spec coverage: Tasks cover root config, backend loader, backend LLM settings, env-only API key, JSON-only timeout/model/base URL, frontend UI-only config import, documentation, final verification, and secret scan.
- Placeholder scan: No unresolved placeholder text remains; each implementation step includes exact file paths and commands.
- Type consistency: `RuntimeConfig`, `LlmRuntimeConfig`, `UiRuntimeConfig`, `load_runtime_config`, `systemConfig`, `LLM_API_KEY`, and `llm.requestTimeoutSeconds` are named consistently across tasks.
