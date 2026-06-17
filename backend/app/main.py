from fastapi import FastAPI

from app.api import app_generate, app_interact, app_search, browser
from app.config import settings

app = FastAPI(title=settings.app_name)
app.include_router(app_search.router, prefix="/api")
app.include_router(app_generate.router, prefix="/api")
app.include_router(app_interact.router, prefix="/api")
app.include_router(browser.router, prefix="/api")


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
