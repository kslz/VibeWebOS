import pytest

from app.services.llm_response_validator import (
    LlmResponseValidationError,
    validate_app_generate_response,
    validate_app_search_response,
    validate_browser_response,
)


def test_validates_app_search_json() -> None:
    response = validate_app_search_response(
        """
        {
          "results": [
            {"name": "看板", "description": "项目看板", "appType": "kanban", "styleHint": "清爽"},
            {"name": "日历", "description": "团队日历", "appType": "calendar", "styleHint": "明亮"}
          ]
        }
        """
    )

    assert len(response.results) == 2
    assert response.results[0].app_type == "kanban"


def test_rejects_non_json_output() -> None:
    with pytest.raises(LlmResponseValidationError):
        validate_app_search_response("这里是解释，不是 JSON")


def test_rejects_missing_required_fields() -> None:
    with pytest.raises(LlmResponseValidationError):
        validate_app_generate_response('{"windowTitle": "缺少字段", "html": "<div></div>"}')


def test_rejects_html_that_exceeds_limit() -> None:
    oversized_html = "<div>" + ("x" * 12) + "</div>"

    with pytest.raises(LlmResponseValidationError):
        validate_app_generate_response(
            f'{{"windowTitle": "长页面", "html": "{oversized_html}", "summary": "摘要"}}',
            max_html_length=10,
        )


def test_rejects_unsafe_html_in_json() -> None:
    with pytest.raises(LlmResponseValidationError):
        validate_browser_response(
            '{"pageTitle": "坏页面", "url": "https://example.com", '
            '"html": "<button onclick=\\"bad()\\">点我</button>", "summary": "摘要"}'
        )


def test_returns_sanitized_typed_response() -> None:
    response = validate_browser_response(
        '{"pageTitle": "Example", "url": "https://example.com", '
        '"html": "<section><h1>标题</h1><p>正文</p></section>", "summary": "摘要"}'
    )

    assert response.page_title == "Example"
    assert "<section>" in response.html
