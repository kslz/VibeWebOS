from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_deepseek_client
from app.main import app
from app.services.deepseek_client import (
    DeepSeekProviderError,
    DeepSeekTimeoutError,
    MissingDeepSeekApiKeyError,
)


class FakeDeepSeekClient:
    def __init__(self, response: str) -> None:
        self.response = response
        self.prompts: list[str] = []

    async def complete(self, prompt: str, *, system_prompt: str | None = None) -> str:
        self.prompts.append(prompt)
        return self.response


class RaisingDeepSeekClient:
    def __init__(self, error: Exception) -> None:
        self.error = error

    async def complete(self, prompt: str, *, system_prompt: str | None = None) -> str:
        raise self.error


@pytest.fixture(autouse=True)
def clear_overrides() -> Iterator[None]:
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def override_client(fake_client: FakeDeepSeekClient) -> None:
    app.dependency_overrides[get_deepseek_client] = lambda: fake_client


def test_app_search_route_returns_validated_candidates() -> None:
    fake_client = FakeDeepSeekClient(
        """
        {
          "results": [
            {"name": "看板", "description": "项目看板", "appType": "kanban", "styleHint": "清爽"},
            {"name": "日历", "description": "团队日历", "appType": "calendar", "styleHint": "明亮"}
          ]
        }
        """
    )
    override_client(fake_client)

    response = TestClient(app).post("/api/app-search", json={"query": "项目管理"})

    assert response.status_code == 200
    assert response.json()["results"][0]["appType"] == "kanban"
    assert "项目管理" in fake_client.prompts[0]


def test_app_generate_route_sanitizes_and_returns_html() -> None:
    fake_client = FakeDeepSeekClient(
        '{"windowTitle": "项目看板", "html": "<section><h1>看板</h1></section>", "summary": "摘要"}'
    )
    override_client(fake_client)

    response = TestClient(app).post(
        "/api/app-generate",
        json={
            "name": "项目看板",
            "description": "管理项目任务",
            "appType": "kanban",
            "styleHint": "清爽",
        },
    )

    assert response.status_code == 200
    assert response.json()["windowTitle"] == "项目看板"
    assert "<section>" in response.json()["html"]
    assert "项目看板" in fake_client.prompts[0]


def test_app_interact_route_returns_next_state() -> None:
    fake_client = FakeDeepSeekClient(
        '{"windowTitle": "项目看板", "html": "<section><p>已更新</p></section>", "summary": "已更新"}'
    )
    override_client(fake_client)

    response = TestClient(app).post(
        "/api/app-interact",
        json={
            "windowTitle": "项目看板",
            "currentSummary": "旧状态",
            "currentHtml": "<section></section>",
            "userAction": {
                "type": "click",
                "targetText": "新增",
                "targetTag": "button",
                "targetDescription": "新增按钮",
            },
            "formValues": {},
        },
    )

    assert response.status_code == 200
    assert response.json()["summary"] == "已更新"
    assert "旧状态" in fake_client.prompts[0]


def test_browser_navigate_route_returns_browser_contract() -> None:
    fake_client = FakeDeepSeekClient(
        '{"pageTitle": "Example", "url": "https://example.com", "html": "<main>内容</main>", "summary": "摘要"}'
    )
    override_client(fake_client)

    response = TestClient(app).post(
        "/api/browser-navigate",
        json={"input": "https://example.com", "currentUrl": "", "currentSummary": ""},
    )

    assert response.status_code == 200
    assert response.json()["pageTitle"] == "Example"
    assert "https://example.com" in fake_client.prompts[0]


def test_browser_interact_route_returns_browser_next_state() -> None:
    fake_client = FakeDeepSeekClient(
        '{"pageTitle": "About", "url": "https://example.com/about", "html": "<main>关于</main>", "summary": "关于页"}'
    )
    override_client(fake_client)

    response = TestClient(app).post(
        "/api/browser-interact",
        json={
            "currentUrl": "https://example.com",
            "currentSummary": "首页",
            "currentHtml": "<main></main>",
            "userAction": {
                "type": "link",
                "targetText": "关于",
                "targetTag": "a",
                "targetDescription": "关于链接",
            },
            "formValues": {},
        },
    )

    assert response.status_code == 200
    assert response.json()["url"] == "https://example.com/about"
    assert "首页" in fake_client.prompts[0]


def test_route_returns_controlled_error_for_invalid_llm_json() -> None:
    override_client(FakeDeepSeekClient("not-json"))

    response = TestClient(app).post("/api/app-search", json={"query": "项目管理"})

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "invalid_llm_response"


def test_route_returns_controlled_error_for_unsafe_html() -> None:
    override_client(
        FakeDeepSeekClient(
            '{"pageTitle": "Bad", "url": "https://example.com", '
            '"html": "<script>alert(1)</script>", "summary": "摘要"}'
        )
    )

    response = TestClient(app).post(
        "/api/browser-navigate",
        json={"input": "https://example.com", "currentUrl": "", "currentSummary": ""},
    )

    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "invalid_llm_response"


@pytest.mark.parametrize(
    ("error", "status_code", "code"),
    [
        (MissingDeepSeekApiKeyError("missing"), 503, "missing_api_key"),
        (DeepSeekTimeoutError("timeout"), 504, "provider_timeout"),
        (DeepSeekProviderError("bad upstream"), 502, "provider_error"),
    ],
)
def test_route_returns_controlled_provider_errors(
    error: Exception,
    status_code: int,
    code: str,
) -> None:
    app.dependency_overrides[get_deepseek_client] = lambda: RaisingDeepSeekClient(error)

    response = TestClient(app).post("/api/app-search", json={"query": "项目管理"})

    assert response.status_code == status_code
    assert response.json()["detail"]["code"] == code
