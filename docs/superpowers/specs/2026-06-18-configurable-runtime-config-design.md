# Configurable Runtime Config Design

Date: 2026-06-18

Branch: `codex/configurable-llm-and-text`

## Goal

Move non-sensitive runtime configuration out of hardcoded frontend/backend modules into a root-level config file, while keeping API keys only in `.env` or environment variables.

This should make it easy to change:

- LLM provider name
- LLM API base URL
- LLM model
- waiting-state copy
- waiting text switch interval
- system name
- About page introduction text

without editing source code.

## Non-Goals

- Do not store API keys in JSON config.
- Do not expose API keys to the frontend.
- Do not add a configuration UI.
- Do not add a database or persistent user settings.
- Do not support per-user or per-window config overrides.
- Do not change the generated app security model.

## Config File

Add a root-level config file:

```text
config/app.config.json
```

Initial shape:

```json
{
  "llm": {
    "provider": "deepseek",
    "baseUrl": "https://api.deepseek.com",
    "model": "deepseek-chat"
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

## Sensitive Config

API keys remain backend-only and must be loaded from `.env` or real environment variables.

Supported names:

```env
LLM_API_KEY=...
DEEPSEEK_API_KEY=...
```

`LLM_API_KEY` is the preferred generic name. `DEEPSEEK_API_KEY` remains supported for compatibility with the current MVP.

No API key is written to `config/app.config.json`, frontend source, frontend build output, README examples with real values, tests, or docs.

## Precedence

Configuration precedence:

```text
code defaults < config/app.config.json < .env / environment variables
```

Details:

- Code defaults keep the app bootable when the config file is missing.
- `config/app.config.json` provides shared non-sensitive defaults.
- Environment variables may override backend runtime values such as API key, base URL, model, timeout, and HTML length limits.
- Product copy such as waiting texts and About text should usually come from `config/app.config.json`, not `.env`.

## Backend Design

Backend config loading should:

- Read `config/app.config.json` from the repository root.
- Validate the config with Pydantic models.
- Fall back to built-in defaults if the file is missing.
- Fail fast with a clear error if the file exists but contains invalid JSON or invalid field types.
- Use `llm.baseUrl` and `llm.model` as defaults for `DeepSeekClient`.
- Use `LLM_API_KEY` first, then `DEEPSEEK_API_KEY`, for the API key.
- Preserve current env compatibility:
  - `DEEPSEEK_BASE_URL`
  - `DEEPSEEK_MODEL`
  - `REQUEST_TIMEOUT_SECONDS`
  - `MAX_HTML_LENGTH`

Recommended model names:

- `RuntimeConfig`
- `LlmRuntimeConfig`
- `UiRuntimeConfig`

The backend should expose only non-sensitive UI config if the frontend needs to fetch runtime copy dynamically.

## Frontend Design

The frontend currently imports hardcoded values from `frontend/src/config/systemConfig.ts`.

Recommended implementation:

- Keep `systemConfig.ts` as the frontend-facing typed config API.
- Make `systemConfig.ts` load values from a generated or imported config module derived from `config/app.config.json`.
- Keep defaults in frontend code so the app can still build if the config file is missing.
- Only expose `ui` config to the frontend.
- Do not expose `llm` config to the frontend unless there is a clear non-sensitive reason. The frontend does not need API base URL, model, or provider to call the app backend.

The first implementation can use a build-time import with Vite JSON support, as long as only non-sensitive UI fields are imported into frontend code.

If direct root JSON import is awkward for Vite, add a small script or Vite alias later; avoid duplicating config in separate frontend and backend files.

## API Design

No new API is required for the first version if frontend UI config is build-time loaded.

An optional future endpoint can be added later:

```text
GET /api/runtime-config
```

If added, it must return only:

```json
{
  "ui": {
    "systemName": "...",
    "aboutText": "...",
    "waitingTexts": ["..."],
    "waitingTextSwitchDelayMs": 5000
  }
}
```

It must never return API keys, raw env values, request headers, or backend-only LLM settings.

## Error Handling

- Missing config file: use defaults and continue.
- Invalid JSON: backend should fail startup with a clear config error; frontend build should fail clearly if it imports the invalid file.
- Invalid UI fields:
  - empty waiting text list: fall back to default waiting texts or reject with a clear validation error.
  - non-positive switch delay: fall back or reject with a clear validation error.
- Missing API key: keep existing behavior, return a controlled backend error when an LLM route is called.

## Testing

Backend tests:

- Loads defaults when `config/app.config.json` is missing.
- Loads LLM base URL/model from config file.
- `LLM_API_KEY` takes priority over `DEEPSEEK_API_KEY`.
- Existing `DEEPSEEK_*` environment variables remain compatible.
- Invalid config JSON produces a clear error.
- Runtime config never serializes API keys.

Frontend tests:

- `systemConfig` exposes configured `systemName`, `aboutText`, `waitingTexts`, and `waitingTextSwitchDelayMs`.
- About app renders configured About text.
- Window loading uses configured waiting text list and switch delay.
- No frontend code path imports or displays API keys.

Verification:

- `npm run lint`
- `npm test`
- `npm run typecheck`
- `npm run build`
- `python -m pytest tests`
- Secret scan for `sk-...` patterns outside ignored dependency/build directories.

## Documentation Updates

Update README with:

- `config/app.config.json` location and example.
- `.env` API key guidance.
- Supported env variable names.
- Warning that API keys must not be committed.
- Example commands for editing config and starting frontend/backend.

Update acceptance docs if behavior changes are visible to users.

## Open Decisions

Resolved:

- API Key is stored only in `.env` or environment variables.
- The shared non-sensitive config file lives at the project root under `config/app.config.json`.

Not included in this design:

- Runtime editing UI.
- Hot reloading config without restarting services.
- Multiple named config profiles.
