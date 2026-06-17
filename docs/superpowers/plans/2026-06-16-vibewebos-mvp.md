# VibeWebOS MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first version of VibeWebOS: a Chinese Windows 11-like browser desktop with multi-window apps, DeepSeek-powered generated app/browser content, per-window loading/error states, and no persistence.

**Architecture:** The frontend is a Vue 3 + TypeScript + Vite + Pinia desktop shell that keeps all state in memory. The backend is a FastAPI service that wraps DeepSeek calls, prompt templates, response schema validation, sensitive input redaction, and HTML boundary validation. Generated apps are local-first but intentionally open for a toy project: HTML/CSS/JavaScript, HTTPS CDN libraries, browser-side state, and complex frontend logic run inside a sandboxed iframe, while explicitly marked LLM actions call backend endpoints with isolated window context. The key runtime boundary is parent-window isolation, not a strict ban on ordinary browser APIs.

**Tech Stack:** Vue 3, TypeScript, Vite, Pinia, SCSS, Python, FastAPI, Pydantic, HTTPX, DeepSeek API.

---

## Implementation Checklist

### Task 1: Project Scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.ts`
- Create: `frontend/src/App.vue`
- Create: `backend/requirements.txt`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `README.md`

- [ ] Create the `frontend/` Vite Vue TypeScript project structure.
- [ ] Install and register Vue, Pinia, TypeScript, Vite, and SCSS support.
- [ ] Create the `backend/` FastAPI project structure.
- [ ] Add `/health` endpoint returning `{ "status": "ok" }`.
- [ ] Add README startup commands for frontend and backend.
- [ ] Verify frontend starts with `npm run dev`.
- [ ] Verify backend starts with `uvicorn app.main:app --reload`.
- [ ] Commit as `chore: scaffold frontend and backend`.

**Acceptance:**
- Frontend shows a placeholder VibeWebOS screen.
- Backend `/health` responds successfully.
- No DeepSeek integration exists yet.

### Task 2: Shared Configuration and Types

**Files:**
- Create: `frontend/src/config/systemConfig.ts`
- Create: `frontend/src/types/app.ts`
- Create: `frontend/src/types/window.ts`
- Create: `frontend/src/types/llm.ts`
- Modify: `frontend/src/App.vue`
- Modify: `backend/app/config.py`

- [ ] Define `systemName`, `aboutText`, `defaultTheme`, `waitingTexts`, result count bounds, browser home title, and desktop icon ids in frontend config.
- [ ] Define frontend types for built-in app ids, generated app candidates, LLM HTML responses, browser responses, user actions, and window state.
- [ ] Define backend config for `DEEPSEEK_API_KEY`, `DEEPSEEK_BASE_URL`, request timeout, and maximum HTML length.
- [ ] Ensure the frontend config does not contain API keys.
- [ ] Add a visible placeholder using `systemName`.
- [ ] Commit as `chore: add shared config and domain types`.

**Acceptance:**
- About text can be changed from one config file.
- Waiting text list is centralized.
- DeepSeek API key is backend-only.

### Task 3: Global Styles and Theme Foundation

**Files:**
- Create: `frontend/src/styles/global.scss`
- Create: `frontend/src/styles/themes.scss`
- Create: `frontend/src/stores/themeStore.ts`
- Modify: `frontend/src/main.ts`
- Modify: `frontend/src/App.vue`

- [ ] Add global reset, full-viewport layout, font stack, and base app background.
- [ ] Add light and dark theme CSS variables for desktop, taskbar, window, panel, text, border, accent, and shadow colors.
- [ ] Create `themeStore` with `light` and `dark` modes, defaulting from config.
- [ ] Apply the active theme as a root class or data attribute.
- [ ] Add a temporary theme toggle in `App.vue` for verification only.
- [ ] Verify theme switch updates colors without page reload.
- [ ] Remove the temporary toggle once SettingsApp owns this behavior in Task 9.
- [ ] Commit as `feat: add theme foundation`.

**Acceptance:**
- Light and dark themes work entirely in memory.
- Refreshing the page returns to the configured default theme.

### Task 4: Desktop Shell and Static Desktop Icons

**Files:**
- Create: `frontend/src/components/desktop/DesktopShell.vue`
- Create: `frontend/src/components/desktop/DesktopIcon.vue`
- Create: `frontend/src/components/desktop/StartMenu.vue`
- Create: `frontend/src/components/desktop/Taskbar.vue`
- Create: `frontend/src/stores/desktopStore.ts`
- Modify: `frontend/src/App.vue`

- [ ] Build the full-screen desktop shell with a Windows 11-like background.
- [ ] Render exactly four desktop icons: 浏览器, 应用搜索, 设置, 关于系统.
- [ ] Build a bottom taskbar with start button, window area placeholder, status area, and current time.
- [ ] Build a simple start menu with the same four app entries.
- [ ] Add clock updates once per minute.
- [ ] Opening desktop icons and start menu entries should call a placeholder `openApp(appId)` action.
- [ ] Verify no file system, recycle bin, right-click menu, or wallpaper switching UI is present.
- [ ] Commit as `feat: build desktop shell`.

**Acceptance:**
- Page opens to a Chinese desktop-like environment.
- Desktop icons and start menu show only the MVP apps.
- No LLM requests are possible from shell interactions.

### Task 5: Window Store and Basic Window Lifecycle

**Files:**
- Create: `frontend/src/stores/windowStore.ts`
- Create: `frontend/src/components/window/WindowManager.vue`
- Create: `frontend/src/components/window/AppWindow.vue`
- Create: `frontend/src/components/window/WindowTitleBar.vue`
- Modify: `frontend/src/components/desktop/DesktopShell.vue`
- Modify: `frontend/src/components/desktop/Taskbar.vue`

- [ ] Implement `openWindow`, `closeWindow`, `focusWindow`, `minimizeWindow`, `restoreWindow`, and `updateWindowContent`.
- [ ] Store window id, app id, title, x/y position, width, height, z-index, minimized flag, maximized flag, loading flag, error, content kind, and content payload.
- [ ] Render windows through `WindowManager`.
- [ ] Add close and minimize controls to each title bar.
- [ ] Clicking a window brings it to front.
- [ ] Taskbar lists open windows and restores/minimizes them.
- [ ] Closing a window removes its state permanently.
- [ ] Refreshing the page clears all windows.
- [ ] Commit as `feat: add basic window manager`.

**Acceptance:**
- Multiple static windows can be opened and closed.
- Taskbar reflects the current open windows.
- Window state is memory-only.

### Task 6: Drag, Resize, Maximize, and Layering

**Files:**
- Create: `frontend/src/components/window/WindowResizeHandle.vue`
- Modify: `frontend/src/components/window/AppWindow.vue`
- Modify: `frontend/src/components/window/WindowTitleBar.vue`
- Modify: `frontend/src/stores/windowStore.ts`

- [ ] Add pointer-based window dragging from the title bar.
- [ ] Clamp window movement so the title bar remains reachable.
- [ ] Add resize handles with minimum width and height.
- [ ] Add maximize and restore behavior.
- [ ] Preserve pre-maximize bounds for restore.
- [ ] Ensure dragging, resizing, minimizing, maximizing, closing, and taskbar clicks never trigger LLM requests.
- [ ] Verify multiple windows maintain correct z-index order.
- [ ] Commit as `feat: support window movement and resizing`.

**Acceptance:**
- Windows can drag, resize, minimize, maximize, restore, close, and stack correctly.

### Task 7: Built-in App Routing

**Files:**
- Create: `frontend/src/apps/BrowserApp/BrowserApp.vue`
- Create: `frontend/src/apps/AppSearch/AppSearch.vue`
- Create: `frontend/src/apps/AppSearch/SearchResultList.vue`
- Create: `frontend/src/apps/SettingsApp/SettingsApp.vue`
- Create: `frontend/src/apps/AboutApp/AboutApp.vue`
- Modify: `frontend/src/components/window/AppWindow.vue`
- Modify: `frontend/src/stores/windowStore.ts`
- Modify: `frontend/src/stores/desktopStore.ts`

- [ ] Map `browser`, `appSearch`, `settings`, and `about` app ids to built-in Vue components.
- [ ] Open built-in apps from desktop icons.
- [ ] Open built-in apps from the start menu.
- [ ] Render BrowserApp as a static Chinese minimalist search page.
- [ ] Render AppSearch as a static search form and empty result area.
- [ ] Render SettingsApp with theme mode controls and about entry.
- [ ] Render AboutApp using `aboutText` from config.
- [ ] Remove the temporary theme toggle from Task 3.
- [ ] Commit as `feat: add built-in apps`.

**Acceptance:**
- All four built-in apps open in windows.
- Settings changes theme in memory.
- About text comes from config.

### Task 8: Per-Window Loading and Error States

**Files:**
- Create: `frontend/src/components/loading/WindowLoadingOverlay.vue`
- Modify: `frontend/src/stores/windowStore.ts`
- Modify: `frontend/src/components/window/AppWindow.vue`
- Modify: `frontend/src/config/systemConfig.ts`

- [ ] Add per-window loading state with a random waiting text when an LLM operation starts.
- [ ] Switch waiting text after 5 seconds if the operation is still pending.
- [ ] Add a light transition when waiting text changes.
- [ ] Lock only the current window content while loading.
- [ ] Keep title bar, other windows, taskbar, start menu, and settings usable.
- [ ] Add per-window error state with retry affordance.
- [ ] Preserve previous usable HTML/content when a request fails.
- [ ] Commit as `feat: add per-window loading and errors`.

**Acceptance:**
- Multiple windows can independently show loading overlays.
- A loading window does not block the whole desktop.

### Task 9: Frontend API Client

**Files:**
- Create: `frontend/src/api/llmApi.ts`
- Modify: `frontend/src/types/llm.ts`
- Modify: `frontend/src/apps/AppSearch/AppSearch.vue`
- Modify: `frontend/src/apps/BrowserApp/BrowserApp.vue`

- [ ] Add typed `appSearch`, `appGenerate`, `appInteract`, `browserNavigate`, and `browserInteract` functions.
- [ ] Handle non-2xx backend responses as typed frontend errors.
- [ ] Add request cancellation or stale response guards at the window level.
- [ ] Ensure empty user input is rejected before calling backend.
- [ ] Wire AppSearch and BrowserApp to call placeholder API methods behind feature paths.
- [ ] Commit as `feat: add frontend llm api client`.

**Acceptance:**
- API functions are centralized.
- Empty input does not call backend.
- Closed-window or stale responses cannot mutate unrelated windows.

### Task 10: Backend Schemas

**Files:**
- Create: `backend/app/schemas/app_search.py`
- Create: `backend/app/schemas/app_generate.py`
- Create: `backend/app/schemas/app_interact.py`
- Create: `backend/app/schemas/browser.py`
- Create: `backend/app/schemas/common.py`

- [ ] Define Pydantic request and response models for `/api/app-search`.
- [ ] Define Pydantic request and response models for `/api/app-generate`.
- [ ] Define Pydantic request and response models for `/api/app-interact`.
- [ ] Define Pydantic request and response models for `/api/browser-navigate`.
- [ ] Define Pydantic request and response models for `/api/browser-interact`.
- [ ] Define shared `UserAction` and `formValues` schema.
- [ ] Enforce 2 to 3 app search results in response validation.
- [ ] Commit as `feat: define backend api schemas`.

**Acceptance:**
- All API contracts from the design document are represented as Pydantic models.

### Task 11: Prompt Templates and DeepSeek Client

**Files:**
- Create: `backend/app/services/deepseek_client.py`
- Create: `backend/app/services/prompt_service.py`
- Create: `backend/app/prompts/app_search.md`
- Create: `backend/app/prompts/app_generate.md`
- Create: `backend/app/prompts/app_interact.md`
- Create: `backend/app/prompts/browser_navigate.md`
- Create: `backend/app/prompts/browser_interact.md`
- Modify: `backend/app/config.py`

- [ ] Implement prompt template loading by filename.
- [ ] Write app search prompt requiring Chinese UI, realistic app candidates, JSON-only output, and 2 to 3 results.
- [ ] Write app generation prompt requiring JSON-only output with `windowTitle`, `html`, and `summary`.
- [ ] Write app interaction prompt requiring JSON-only next-state output.
- [ ] Write browser navigate prompt requiring simulated website/search content and no claim of real website access.
- [ ] Write browser interact prompt requiring simulated navigation/form feedback.
- [ ] Implement DeepSeek HTTP client with timeout and backend-only API key.
- [ ] Add clear backend errors for missing API key, timeout, non-2xx response, and malformed provider response.
- [ ] Commit as `feat: add prompts and deepseek client`.

**Acceptance:**
- Prompts enforce local-first generated apps: ordinary interactions use local JavaScript, HTTPS CDN libraries are allowed for richer toy apps, and only explicitly marked controls request LLM.
- Prompts preserve parent-window isolation: generated apps must not access the desktop shell, taskbar, start menu, parent DOM, top window, opener, or sibling windows.
- API key is read only from backend environment.

### Task 12: JSON Validation and HTML Sanitization

**Files:**
- Create: `backend/app/services/html_sanitizer.py`
- Create: `backend/app/services/llm_response_validator.py`
- Create: `backend/tests/test_html_sanitizer.py`
- Create: `backend/tests/test_llm_response_validator.py`
- Modify: `backend/requirements.txt`

- [ ] Parse LLM output as JSON and reject non-JSON content.
- [ ] Validate required fields for each response kind.
- [ ] Enforce maximum HTML length.
- [ ] Allow generated app inline `script` and HTTPS external scripts for local app behavior.
- [ ] Reject dangerous protocols, top-level navigation attempts, parent-window access, opener access, sibling-window access, and attempts to escape the iframe sandbox.
- [ ] Preserve allowed HTML, CSS, form controls, tables, cards, images, SVG, and icons.
- [ ] Add tests for accepted safe HTML.
- [ ] Add tests for accepted inline script and accepted HTTPS CDN script URLs in generated app HTML.
- [ ] Add tests for rejected parent-window access, top-window access, opener access, dangerous protocols, and meta refresh.
- [ ] Commit as `feat: validate llm json and sanitize html`.

**Acceptance:**
- Backend returns generated app HTML/JS only after validating JSON structure, size, dangerous protocols, and parent-window isolation boundaries.
- Invalid LLM output becomes a controlled backend error.

### Task 13: Backend API Routes

**Files:**
- Create: `backend/app/api/app_search.py`
- Create: `backend/app/api/app_generate.py`
- Create: `backend/app/api/app_interact.py`
- Create: `backend/app/api/browser.py`
- Modify: `backend/app/main.py`
- Modify: `backend/app/services/deepseek_client.py`
- Modify: `backend/app/services/llm_response_validator.py`

- [ ] Implement `POST /api/app-search`.
- [ ] Implement `POST /api/app-generate`.
- [ ] Implement `POST /api/app-interact`.
- [ ] Implement `POST /api/browser-navigate`.
- [ ] Implement `POST /api/browser-interact`.
- [ ] Load the correct prompt for each endpoint.
- [ ] Call DeepSeek through the shared client.
- [ ] Validate JSON structure and sanitize HTML before returning.
- [ ] Return controlled errors for provider failure, timeout, invalid JSON, missing fields, and unsafe HTML.
- [ ] Commit as `feat: expose llm api routes`.

**Acceptance:**
- All five endpoints match the design document contracts.
- No route performs persistence or real webpage access.

### Task 14: App Search LLM Integration

**Files:**
- Modify: `frontend/src/apps/AppSearch/AppSearch.vue`
- Modify: `frontend/src/apps/AppSearch/SearchResultList.vue`
- Modify: `frontend/src/api/llmApi.ts`
- Modify: `frontend/src/stores/windowStore.ts`

- [ ] Submit app search on enter or search button click.
- [ ] Set only the AppSearch window to loading during search.
- [ ] Call `POST /api/app-search`.
- [ ] Render 2 to 3 candidate apps with name, description, app type, and style hint.
- [ ] Show retryable error inside the AppSearch window on failure.
- [ ] Prevent duplicate concurrent search submissions for the same window.
- [ ] Commit as `feat: connect app search to llm`.

**Acceptance:**
- Search returns and displays 2 to 3 realistic app candidates.
- Search loading does not block the desktop.

### Task 15: Generated App Window Rendering

**Files:**
- Create: `frontend/src/components/generated/HtmlSandboxView.vue`
- Modify: `frontend/src/apps/AppSearch/AppSearch.vue`
- Modify: `frontend/src/stores/windowStore.ts`
- Modify: `frontend/src/components/window/AppWindow.vue`
- Modify: `frontend/src/types/llm.ts`

- [ ] Call `POST /api/app-generate` when a candidate app is clicked.
- [ ] Open a new generated app window for the selected candidate.
- [ ] Show loading only in the generated app window while generating.
- [ ] Render returned HTML inside `HtmlSandboxView`.
- [ ] Scope generated content so it cannot affect desktop shell, taskbar, start menu, or other windows.
- [ ] Store generated window title, HTML, and summary in window state.
- [ ] Initialize an independent window-level LLM context for each generated app window.
- [ ] Store only current HTML, current summary, current temporary form values, and recent interaction summaries in the generated window context.
- [ ] Do not store full conversation history in generated app window context.
- [ ] Show retryable error if generation fails.
- [ ] Commit as `feat: render generated app windows`.

**Acceptance:**
- Candidate selection creates a visually reasonable generated app window.
- Generated content cannot escape its window.
- Each generated app window has isolated LLM context that is not shared with other windows.

### Task 16: Generated App Interaction Capture

**Files:**
- Modify: `frontend/src/components/generated/HtmlSandboxView.vue`
- Modify: `frontend/src/api/llmApi.ts`
- Modify: `frontend/src/stores/windowStore.ts`
- Modify: `frontend/src/types/llm.ts`

- [ ] Capture clicks on generated buttons.
- [ ] Capture clicks on generated links.
- [ ] Capture generated form submissions.
- [ ] Collect target text, target tag, and a useful target description.
- [ ] Collect form values only at submit time.
- [ ] Do not trigger LLM calls for hover, normal typing, window operations, taskbar clicks, start menu clicks, or theme changes.
- [ ] Call `POST /api/app-interact` with current window title, summary, HTML, user action, and redacted form values.
- [ ] Build `POST /api/app-interact` payload only from the current generated app window context.
- [ ] Append only a short interaction summary to that window's recent interaction summaries after success.
- [ ] Never include another window's HTML, summary, form values, or interaction summaries in the request.
- [ ] Replace only the current generated app window HTML and summary after a successful response.
- [ ] Commit as `feat: handle generated app interactions`.

**Acceptance:**
- Clicking generated controls updates that window through LLM.
- Other windows remain usable during the request.
- Generated app interactions cannot pollute or read context from sibling windows.

### Task 16.5: Generated App Open Runtime Migration

**Files:**
- Modify: `frontend/src/components/generated/HtmlSandboxView.vue`
- Modify: `backend/app/prompts/app_generate.md`
- Modify: `backend/app/prompts/app_interact.md`
- Modify: `backend/app/services/html_sanitizer.py`
- Modify: `backend/tests/test_html_sanitizer.py`
- Modify: `backend/tests/test_llm_response_validator.py`

- [ ] Keep generated app interaction policy local-first by default.
- [ ] Let unmarked generated app buttons, links, and forms run inside the iframe without calling LLM.
- [ ] Change generated app runtime from constrained inline JavaScript to open toy-app JavaScript.
- [ ] Allow inline scripts, normal function callbacks, ordinary event handler attributes, browser-side state, network APIs, and HTTPS external scripts.
- [ ] Allow generated apps to load common HTTPS CDN libraries for charts, visualization, games, utilities, and richer controls.
- [ ] Keep parent-window isolation: reject direct access to `window.parent`, `window.top`, `opener`, parent DOM, sibling windows, and top-level navigation attempts.
- [ ] Keep dangerous protocol rejection for `javascript:`, `vbscript:`, and `data:text/html`.
- [ ] Update generated app iframe sandbox to include `allow-scripts`, `allow-forms`, and `allow-same-origin`, while avoiding `allow-top-navigation`.
- [ ] Capture clicks only on generated controls explicitly marked with `data-vibe-llm-action`.
- [ ] Capture links only when explicitly marked with `data-vibe-llm-action`.
- [ ] Capture form submissions only when explicitly marked with `data-vibe-llm-submit`.
- [ ] Support generated app scripts sending a parent message of type `vibewebos:llm-request` when they intentionally need LLM help.
- [ ] Collect target text, target tag, and useful target description only for marked LLM actions.
- [ ] Collect form values only for marked LLM submit actions.
- [ ] Keep app-interact payloads scoped to the current generated app window context only.
- [ ] Update `app_generate.md` to encourage local JavaScript and CDN libraries for non-LLM behavior.
- [ ] Update `app_interact.md` so returned HTML preserves open local-first runtime behavior.
- [ ] Update sanitizer tests proving CDN scripts, network APIs, browser-side state, and event handler attributes are accepted for generated apps.
- [ ] Update sanitizer tests proving parent-window escape attempts and dangerous protocols are still rejected.
- [ ] Add frontend tests proving unmarked generated app controls do not call `POST /api/app-interact`.
- [ ] Add frontend tests proving marked generated app controls and `vibewebos:llm-request` messages call `POST /api/app-interact` with only current window context.
- [ ] Verify a generated calculator-like app can add/subtract locally without showing LLM loading.
- [ ] Verify a generated chart or visualization app can load a CDN library and render inside the iframe.
- [ ] Commit as `feat: support open generated app runtime`.

**Acceptance:**
- Calculator-like and other generated app controls respond immediately without waiting for LLM.
- CDN-backed generated app features can run inside the iframe.
- Unmarked generated app interactions do not call LLM.
- Marked generated controls and explicit `vibewebos:llm-request` messages update that window through LLM.
- Generated app JavaScript remains sandboxed from the parent shell and cannot affect desktop shell, taskbar, start menu, parent window, or sibling windows.
- Generated app interactions cannot pollute or read context from sibling windows.

### Task 17: Prompt and Validator Open Runtime Alignment

**Files:**
- Modify: `backend/app/prompts/app_generate.md`
- Modify: `backend/app/prompts/app_interact.md`
- Modify: `backend/app/services/llm_response_validator.py`
- Modify: `backend/tests/test_llm_response_validator.py`

- [ ] Keep BrowserApp validator behavior strict: browser simulated pages still do not execute generated JavaScript.
- [ ] Keep generated App validator behavior open: allow inline JavaScript, HTTPS script URLs, browser state APIs, and network APIs.
- [ ] Make prompts explicitly recommend CDN libraries when they materially improve charts, visualizations, games, editors, or dashboards.
- [ ] Make prompts explicitly say generated apps must not access parent, top, opener, desktop shell, taskbar, start menu, or sibling windows.
- [ ] Add validator tests showing generated app responses can include CDN scripts.
- [ ] Add validator tests showing browser page responses still reject scripts.
- [ ] Commit as `feat: align prompts with open app runtime`.

**Acceptance:**
- Generated app LLM responses can express richer toy apps without sanitizer false positives.
- Browser simulated pages keep their stricter no-script boundary.
- Parent-window isolation remains enforced.

### Task 18: Browser Navigation Integration

**Files:**
- Modify: `frontend/src/apps/BrowserApp/BrowserApp.vue`
- Modify: `frontend/src/components/generated/HtmlSandboxView.vue`
- Modify: `frontend/src/api/llmApi.ts`
- Modify: `frontend/src/types/llm.ts`

- [ ] Build the browser homepage as a Chinese minimalist search page.
- [ ] Support address/search bar enter.
- [ ] Support natural language queries.
- [ ] Support URL-like inputs such as `https://xxx.com`.
- [ ] Call `POST /api/browser-navigate`.
- [ ] Render returned browser HTML and title.
- [ ] Track current URL and summary in the browser window state.
- [ ] Initialize and update an independent window-level LLM context for each browser window.
- [ ] Store only current HTML, current summary, current temporary form values, current URL, and recent interaction summaries in the browser window context.
- [ ] Do not store full conversation history in browser window context.
- [ ] Do not perform real webpage navigation.
- [ ] Commit as `feat: connect browser navigation to llm`.

**Acceptance:**
- Browser can simulate search results and website pages from URL or natural language input.
- Each browser window has isolated LLM context that is not shared with other browser or generated app windows.

### Task 19: Browser Page Interaction

**Files:**
- Modify: `frontend/src/apps/BrowserApp/BrowserApp.vue`
- Modify: `frontend/src/components/generated/HtmlSandboxView.vue`
- Modify: `frontend/src/api/llmApi.ts`

- [x] Capture clicks on links inside browser page content.
- [x] Capture form submissions inside browser page content.
- [x] Call `POST /api/browser-interact` with current URL, summary, HTML, user action, and redacted form values.
- [x] Build `POST /api/browser-interact` payload only from the current browser window context.
- [x] Append only a short interaction summary to that browser window's recent interaction summaries after success.
- [x] Never include another window's HTML, summary, URL, form values, or interaction summaries in the request.
- [x] Update current browser page title, URL, HTML, and summary on success.
- [x] Show retryable error inside the browser window on failure.
- [x] Ensure browser pages do not display “AI 生成” or “模拟内容” labels.
- [x] Commit as `feat: handle browser page interactions`.

**Acceptance:**
- Browser links and forms produce simulated next pages.
- Browser does not open real tabs, download files, upload files, or access real websites.
- Browser interactions cannot pollute or read context from sibling windows.

### Task 20: Sensitive Input Redaction

**Files:**
- Create: `frontend/src/utils/redactFormValues.ts`
- Create: `frontend/src/utils/redactFormValues.test.ts`
- Modify: `frontend/src/components/generated/generatedInteractionBridge.ts`
- Modify: `frontend/src/apps/BrowserApp/BrowserApp.vue`

- [x] Redact password fields as `用户输入了密码`.
- [x] Redact payment password fields as `用户输入了支付密码`.
- [x] Redact verification code fields as `用户输入了验证码`.
- [x] Redact bank card, ID card, and phone values into masked summaries.
- [x] Preserve normal search terms, normal text fields, addresses, normal form values, and payment amount.
- [x] Add tests covering password, payment password, verification code, bank card, ID card, phone, email, and normal text.
- [x] Use redaction before marked app interaction requests and browser interaction requests.
- [x] Confirm generated app form values are collected only for marked LLM submit actions, not ordinary local form submissions.
- [x] Document that generated apps may still send their own network requests in the toy runtime; redaction protects only VibeWebOS-to-LLM payloads.
- [x] Commit as `feat: redact sensitive llm form values`.

**Acceptance:**
- Raw sensitive values are not sent to backend from marked generated app submissions or browser page submissions.
- Local generated app code is not treated as trusted, but VibeWebOS only redacts values it forwards to LLM.

### Task 21: Error Handling and Race Conditions

**Files:**
- Modify: `frontend/src/stores/windowStore.ts`
- Modify: `frontend/src/api/llmApi.ts`
- Modify: `frontend/src/components/window/AppWindow.vue`
- Modify: `backend/app/api/app_search.py`
- Modify: `backend/app/api/app_generate.py`
- Modify: `backend/app/api/app_interact.py`
- Modify: `backend/app/api/browser.py`

- [ ] Prevent repeated clicks from creating duplicate concurrent requests in the same window.
- [ ] Ignore responses for windows that have already been closed.
- [ ] Destroy a generated app or browser window's LLM context immediately when that window closes.
- [ ] Verify stale responses cannot recreate or mutate context for a closed window.
- [ ] Verify concurrent requests in different windows keep independent contexts.
- [ ] Preserve previous usable HTML when interaction or browser requests fail.
- [ ] Provide retry buttons for app search, app generation, app interaction, browser navigation, and browser interaction errors.
- [ ] Ensure backend errors are normalized into frontend-friendly messages.
- [ ] Verify backend timeout, non-JSON, missing fields, and parent-isolation violations show window-local errors.
- [ ] Commit as `fix: harden llm request error handling`.

**Acceptance:**
- Failures stay inside the affected window.
- The desktop shell remains usable after backend or provider errors.

### Task 22: Frontend Visual Polish

**Files:**
- Modify: `frontend/src/styles/global.scss`
- Modify: `frontend/src/styles/themes.scss`
- Modify: `frontend/src/components/desktop/DesktopShell.vue`
- Modify: `frontend/src/components/desktop/DesktopIcon.vue`
- Modify: `frontend/src/components/desktop/Taskbar.vue`
- Modify: `frontend/src/components/desktop/StartMenu.vue`
- Modify: `frontend/src/components/window/AppWindow.vue`
- Modify: `frontend/src/apps/BrowserApp/BrowserApp.vue`
- Modify: `frontend/src/apps/AppSearch/AppSearch.vue`
- Modify: `frontend/src/apps/SettingsApp/SettingsApp.vue`
- Modify: `frontend/src/apps/AboutApp/AboutApp.vue`

- [ ] Refine desktop background, taskbar translucency, window shadows, rounded corners, and title bar controls.
- [ ] Keep visual style serious and operating-system-like, not obviously comedic.
- [ ] Use Chinese UI text throughout system surfaces.
- [ ] Keep AboutApp as the only place that explains the project is a simulated system.
- [ ] Ensure generated pages and browser pages do not show “AI 生成” or “模拟内容” labels.
- [ ] Verify text does not overflow compact controls.
- [ ] Verify light and dark themes are both readable.
- [ ] Commit as `style: polish desktop visual design`.

**Acceptance:**
- The first viewport reads as a polished Chinese Windows 11-like desktop.

### Task 23: Automated Tests

**Files:**
- Create or modify: `backend/tests/`
- Create or modify: `frontend/src/**/*.test.ts`
- Modify: `frontend/package.json`
- Modify: `backend/requirements.txt`

- [ ] Add backend tests for schema validation.
- [ ] Add backend tests for HTML sanitizer.
- [ ] Add backend tests for LLM response validator.
- [ ] Add backend tests for route error mapping with mocked DeepSeek client.
- [ ] Add frontend tests for theme store.
- [ ] Add frontend tests for window store lifecycle.
- [ ] Add frontend tests for sensitive input redaction.
- [ ] Add frontend tests for stale response guards.
- [ ] Add frontend tests for window-level LLM context creation, isolation, and destruction on close.
- [ ] Add frontend tests proving generated app and browser windows do not share context.
- [ ] Add frontend tests proving unmarked generated app controls do not call LLM.
- [ ] Add frontend tests proving marked generated app controls and `vibewebos:llm-request` messages call LLM with only current window context.
- [ ] Add backend tests for open generated app runtime acceptance: inline scripts, HTTPS CDN scripts, event handler attributes, network APIs, and browser-side state.
- [ ] Add backend tests for parent-window isolation rejection: parent, top, opener, top navigation, and dangerous protocols.
- [ ] Add test scripts to frontend and backend startup docs.
- [ ] Commit as `test: cover core mvp behavior`.

**Acceptance:**
- Parent-isolation-sensitive backend behavior has regression tests.
- Window lifecycle and redaction behavior have frontend tests.
- Window-level LLM context isolation has frontend regression tests.

### Task 24: Manual Acceptance Pass

**Files:**
- Create: `docs/验收记录.md`
- Modify: `README.md`

- [ ] Start backend with a real or mocked DeepSeek configuration.
- [ ] Start frontend.
- [ ] Verify all 27 acceptance criteria from `docs/设计文档.md`.
- [ ] Record pass/fail notes in `docs/验收记录.md`.
- [ ] Add known limitations matching the first-version non-goals.
- [ ] Confirm refresh clears all windows and generated state.
- [ ] Confirm closing a window loses that window state.
- [ ] Confirm closing a generated app or browser window immediately destroys its LLM context.
- [ ] Confirm two generated/browser windows cannot read or update each other's HTML, summary, form values, or recent interaction summaries.
- [ ] Confirm calculator-like generated app interactions respond locally without LLM waiting state.
- [ ] Confirm a CDN-backed generated app can render a chart or visualization.
- [ ] Confirm generated app scripts cannot access parent DOM, desktop shell, taskbar, start menu, or sibling windows.
- [ ] Confirm only marked generated app actions trigger `/api/app-interact`.
- [ ] Confirm DeepSeek API key is absent from frontend code.
- [ ] Commit as `docs: add mvp acceptance record`.

**Acceptance:**
- Every MVP acceptance criterion is either passed or explicitly documented with a blocking issue.

### Task 25: Final Hardening and Release Prep

**Files:**
- Modify: `README.md`
- Modify: `docs/验收记录.md`
- Modify as needed: `frontend/`
- Modify as needed: `backend/`

- [ ] Run frontend lint, typecheck, tests, and production build.
- [ ] Run backend tests.
- [ ] Run a final manual smoke test for desktop, window controls, app search, generated app, browser, settings, about, loading, and errors.
- [ ] Remove temporary debug UI and console noise.
- [ ] Confirm first-version non-goals are not accidentally implemented.
- [ ] Commit as `chore: prepare mvp release`.

**Acceptance:**
- The project can be started from README instructions.
- MVP behavior matches the design document.

---

## Dependency Order

1. Tasks 1 to 3 establish the project foundation.
2. Tasks 4 to 8 build the desktop, windows, built-in apps, and per-window UX.
3. Tasks 9 to 13 build the typed frontend/backend LLM contract.
4. Tasks 14 to 19 connect application search, generated apps, and browser flows.
5. Task 16.5 is a required migration checkpoint after the already-completed Task 16: it replaces the constrained generated app runtime with an open toy-app runtime while preserving parent-window isolation.
6. Tasks 20 to 25 redact LLM-bound form values, harden errors, polish, test, and verify the MVP.

## Scope Guardrails

- Do not add user accounts.
- Do not add a database or persistent storage.
- Do not add real file system access.
- Do not perform real webpage access from BrowserApp.
- Do not add multiple browser tabs, favorites, downloads, uploads, wallpaper switching, language switching, plugin systems, app marketplace, or mobile adaptation.
- Do not put DeepSeek API keys in frontend code.
- Do not execute generated app JavaScript outside the sandboxed generated app iframe.
- Generated app JavaScript may use inline scripts, HTTPS CDN libraries, network APIs, and browser-side state because this is a toy project.
- Generated app JavaScript must not access parent windows, top windows, opener windows, parent DOM, sibling windows, desktop shell, taskbar, start menu, or other VibeWebOS internals.
- BrowserApp remains simulated and must not perform real webpage navigation or execute generated browser-page JavaScript.
- Do not implement real login, payment, transfer, attack, or privacy collection capabilities.

## Self-Review

- Spec coverage: The checklist covers desktop shell, taskbar, start menu, clock, four icons, multi-window lifecycle, built-in apps, theme switching, About config, five backend APIs, DeepSeek prompts, JSON validation, HTML boundary validation, app search, app generation, generated app interaction, open generated app runtime, browser navigation, browser interaction, waiting states, errors, sensitive input redaction, and acceptance.
- Placeholder scan: No task is left as TBD or “implement later”; each task has explicit files, steps, and acceptance criteria.
- Type consistency: Frontend and backend task names consistently use app search, app generate, app interact, browser navigate, browser interact, generated HTML, summary, and user action concepts from the design document.
