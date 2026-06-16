# VibeWebOS

VibeWebOS 是一个中文 Windows 11 风格的浏览器桌面 MVP。当前 Task 1 只包含前端与后端脚手架，不包含 DeepSeek 集成。

## 前端启动

```bash
cd frontend
npm install
npm run dev
```

默认开发地址为 `http://localhost:5173`。

## 后端启动

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

健康检查地址为 `http://localhost:8000/health`，成功时返回：

```json
{ "status": "ok" }
```
