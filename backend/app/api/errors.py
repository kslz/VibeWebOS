from collections.abc import Awaitable, Callable
from typing import TypeVar

from fastapi import HTTPException

from app.services.deepseek_client import (
    DeepSeekClientError,
    DeepSeekProviderError,
    DeepSeekTimeoutError,
    MalformedDeepSeekResponseError,
    MissingDeepSeekApiKeyError,
)
from app.services.llm_response_validator import LlmResponseValidationError
from app.services.prompt_service import PromptServiceError

ResponseT = TypeVar("ResponseT")


async def execute_llm_route(handler: Callable[[], Awaitable[ResponseT]]) -> ResponseT:
    try:
        return await handler()
    except MissingDeepSeekApiKeyError as exc:
        raise _http_error(503, "missing_api_key", str(exc)) from exc
    except DeepSeekTimeoutError as exc:
        raise _http_error(504, "provider_timeout", str(exc)) from exc
    except (DeepSeekProviderError, MalformedDeepSeekResponseError) as exc:
        raise _http_error(502, "provider_error", str(exc)) from exc
    except (LlmResponseValidationError, PromptServiceError) as exc:
        raise _http_error(502, "invalid_llm_response", str(exc)) from exc
    except DeepSeekClientError as exc:
        raise _http_error(502, "provider_error", str(exc)) from exc


def _http_error(status_code: int, code: str, message: str) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": message,
        },
    )
