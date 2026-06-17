# VibeWebOS

VibeWebOS 是一个运行在浏览器里的桌面系统 MVP，整体体验参考 Windows 11。当前版本包含内置桌面窗口、应用搜索，以及由 LLM 生成并在 iframe 沙箱中渲染的应用窗口。

## 当前能力

- 桌面外壳：任务栏、开始菜单、桌面图标、窗口拖拽/缩放、最小化/最大化/关闭。
- 内置应用：浏览器、应用搜索、设置、关于系统。
- 窗口级 loading 状态和可重试错误提示。
- 通过 `POST /api/app-search` 调用 DeepSeek 进行应用搜索。
- 通过 `POST /api/app-generate` 根据候选应用生成 HTML 应用窗口。
- 生成应用通过 `srcdoc` iframe 沙箱渲染，避免影响桌面外壳、任务栏、开始菜单或其他窗口。
- 每个生成应用窗口维护独立的窗口级 LLM 上下文，仅存在于当前页面会话中。
- 生成应用窗口上下文只保存当前 HTML、当前摘要、临时表单值和最近交互摘要，不保存完整历史对话。

## 项目结构

```text
backend/   FastAPI 后端、DeepSeek 客户端、提示词渲染、响应校验
frontend/  Vue 3 + Pinia + Vite 桌面前端
docs/      设计文档和实施计划
```

## 后端启动

安装依赖时建议使用国内 PyPI 镜像：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

启动后端前，先通过环境变量设置 DeepSeek API Key：

```powershell
$env:DEEPSEEK_API_KEY = "your-api-key"
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

健康检查地址：

```text
http://127.0.0.1:8000/health
```

成功时返回：

```json
{ "status": "ok" }
```

## 前端启动

安装依赖时建议使用国内 npm 镜像：

```powershell
cd frontend
npm install --registry=https://registry.npmmirror.com
npm run dev -- --host 127.0.0.1
```

打开：

```text
http://127.0.0.1:5173
```

Vite 开发服务器会把 `/api` 请求代理到 `http://127.0.0.1:8000`。

## 验证命令

前端：

```powershell
cd frontend
npm test
npm run build
```

后端：

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest tests
```

## LLM 上下文策略

每个生成应用窗口都会维护独立的窗口级 LLM 上下文。上下文只存在于当前页面会话中，不做持久化保存；窗口关闭后，对应上下文立即销毁。不同窗口之间的上下文互不共享，避免多窗口内容互相污染。

窗口级上下文只保存少量当前工作状态：

- 当前 HTML
- 当前摘要
- 临时表单值
- 最近若干次交互摘要

前端窗口状态不会保存完整历史对话。
