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
        raise _http_error(503, "missing_api_key") from exc
    except DeepSeekTimeoutError as exc:
        raise _http_error(504, "provider_timeout") from exc
    except (DeepSeekProviderError, MalformedDeepSeekResponseError) as exc:
        raise _http_error(502, "provider_error") from exc
    except (LlmResponseValidationError, PromptServiceError) as exc:
        raise _http_error(502, "invalid_llm_response") from exc
    except DeepSeekClientError as exc:
        raise _http_error(502, "provider_error") from exc


def _http_error(status_code: int, code: str) -> HTTPException:
    messages = {
        "missing_api_key": "LLM 服务未配置，请先设置 API Key。",
        "provider_timeout": "LLM 请求超时，请稍后重试。",
        "provider_error": "LLM 服务暂时不可用，请稍后重试。",
        "invalid_llm_response": "LLM 返回内容格式不正确，请重试。",
    }

    return HTTPException(
        status_code=status_code,
        detail={
            "code": code,
            "message": messages[code],
        },
    )
