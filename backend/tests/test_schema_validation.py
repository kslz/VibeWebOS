import pytest
from pydantic import ValidationError

from app.schemas.app_search import AppSearchResponse
from app.schemas.browser import BrowserInteractRequest
from app.schemas.common import UserAction


def test_app_search_response_requires_two_to_three_results() -> None:
    with pytest.raises(ValidationError):
        AppSearchResponse.model_validate(
            {
                "results": [
                    {
                        "name": "Only One",
                        "description": "One result is not enough.",
                        "appType": "tool",
                        "styleHint": "plain",
                    }
                ]
            }
        )

    with pytest.raises(ValidationError):
        AppSearchResponse.model_validate(
            {
                "results": [
                    {
                        "name": f"App {index}",
                        "description": "Too many results.",
                        "appType": "tool",
                        "styleHint": "plain",
                    }
                    for index in range(4)
                ]
            }
        )


def test_user_action_accepts_frontend_aliases_and_rejects_unknown_action_type() -> None:
    action = UserAction.model_validate(
        {
            "type": "click",
            "targetText": "保存",
            "targetTag": "button",
            "targetDescription": "button 保存",
        }
    )

    assert action.target_text == "保存"

    with pytest.raises(ValidationError):
        UserAction.model_validate(
            {
                "type": "hover",
                "targetText": "保存",
                "targetTag": "button",
                "targetDescription": "button 保存",
            }
        )


def test_browser_interact_request_rejects_missing_window_context() -> None:
    with pytest.raises(ValidationError):
        BrowserInteractRequest.model_validate(
            {
                "currentUrl": "https://example.com",
                "currentSummary": "Example page.",
                "userAction": {
                    "type": "link",
                    "targetText": "下一页",
                    "targetTag": "a",
                    "targetDescription": "a href=/next",
                },
                "formValues": {},
            }
        )


def test_interact_requests_accept_recent_window_interaction_summaries() -> None:
    from app.schemas.app_interact import AppInteractRequest

    request = AppInteractRequest.model_validate(
        {
            "windowTitle": "Calculator",
            "currentSummary": "Current calculator state.",
            "currentHtml": "<main>1 + 1</main>",
            "recentInteractionSummaries": ["click button \"1\"", "click button \"+\""],
            "userAction": {
                "type": "click",
                "targetText": "=",
                "targetTag": "button",
                "targetDescription": "button =",
            },
            "formValues": {},
        }
    )

    assert request.recent_interaction_summaries == ["click button \"1\"", "click button \"+\""]
