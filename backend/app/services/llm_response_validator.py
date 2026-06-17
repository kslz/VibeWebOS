from __future__ import annotations

import json
from typing import Any, TypeVar

from pydantic import BaseModel, ValidationError

from app.config import settings
from app.schemas.app_generate import AppGenerateResponse
from app.schemas.app_interact import AppInteractResponse
from app.schemas.app_search import AppSearchResponse
from app.schemas.browser import BrowserInteractResponse, BrowserNavigateResponse
from app.services.html_sanitizer import HtmlSanitizationError, sanitize_html


class LlmResponseValidationError(ValueError):
    pass


ResponseModel = TypeVar("ResponseModel", bound=BaseModel)


def validate_app_search_response(raw_output: str) -> AppSearchResponse:
    return _validate_json_model(raw_output, AppSearchResponse)


def validate_app_generate_response(
    raw_output: str,
    *,
    max_html_length: int | None = None,
) -> AppGenerateResponse:
    return _validate_html_response(raw_output, AppGenerateResponse, max_html_length=max_html_length)


def validate_app_interact_response(
    raw_output: str,
    *,
    max_html_length: int | None = None,
) -> AppInteractResponse:
    return _validate_html_response(raw_output, AppInteractResponse, max_html_length=max_html_length)


def validate_browser_response(
    raw_output: str,
    *,
    max_html_length: int | None = None,
) -> BrowserNavigateResponse:
    return _validate_html_response(raw_output, BrowserNavigateResponse, max_html_length=max_html_length)


def validate_browser_interact_response(
    raw_output: str,
    *,
    max_html_length: int | None = None,
) -> BrowserInteractResponse:
    return _validate_html_response(raw_output, BrowserInteractResponse, max_html_length=max_html_length)


def _validate_json_model(raw_output: str, model_type: type[ResponseModel]) -> ResponseModel:
    payload = _parse_json(raw_output)

    try:
        return model_type.model_validate(payload)
    except ValidationError as exc:
        raise LlmResponseValidationError("LLM response is missing required fields.") from exc


def _validate_html_response(
    raw_output: str,
    model_type: type[ResponseModel],
    *,
    max_html_length: int | None,
) -> ResponseModel:
    response = _validate_json_model(raw_output, model_type)
    html = getattr(response, "html", None)

    if not isinstance(html, str):
        raise LlmResponseValidationError("LLM response is missing HTML content.")

    _validate_html_length(html, max_html_length)

    try:
        sanitized_html = sanitize_html(html)
    except HtmlSanitizationError as exc:
        raise LlmResponseValidationError(str(exc)) from exc

    return response.model_copy(update={"html": sanitized_html})


def _parse_json(raw_output: str) -> dict[str, Any]:
    try:
        payload = json.loads(raw_output)
    except json.JSONDecodeError as exc:
        raise LlmResponseValidationError("LLM response must be valid JSON.") from exc

    if not isinstance(payload, dict):
        raise LlmResponseValidationError("LLM response JSON must be an object.")

    return payload


def _validate_html_length(html: str, max_html_length: int | None) -> None:
    limit = max_html_length if max_html_length is not None else settings.max_html_length

    if len(html) > limit:
        raise LlmResponseValidationError("LLM response HTML exceeds the maximum length.")
