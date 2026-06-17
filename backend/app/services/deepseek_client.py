from __future__ import annotations

from collections.abc import Sequence
from typing import Any

import httpx

from app.config import settings


class DeepSeekClientError(RuntimeError):
    pass


class MissingDeepSeekApiKeyError(DeepSeekClientError):
    pass


class DeepSeekTimeoutError(DeepSeekClientError):
    pass


class DeepSeekProviderError(DeepSeekClientError):
    pass


class MalformedDeepSeekResponseError(DeepSeekClientError):
    pass


class DeepSeekClient:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        timeout_seconds: float | None = None,
        http_client: httpx.AsyncClient | None = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else settings.deepseek_api_key
        self.base_url = (base_url or settings.deepseek_base_url).rstrip("/")
        self.model = model or settings.deepseek_model
        self.timeout_seconds = timeout_seconds or settings.request_timeout_seconds
        self._http_client = http_client

    async def complete(self, prompt: str, *, system_prompt: str | None = None) -> str:
        if not self.api_key:
            raise MissingDeepSeekApiKeyError("DeepSeek API key is not configured.")

        messages = self._build_messages(prompt, system_prompt)
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.7,
        }

        response_data = await self._post_chat_completions(payload)
        return self._extract_content(response_data)

    def _build_messages(self, prompt: str, system_prompt: str | None) -> list[dict[str, str]]:
        messages: list[dict[str, str]] = []

        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})

        messages.append({"role": "user", "content": prompt})
        return messages

    async def _post_chat_completions(self, payload: dict[str, Any]) -> dict[str, Any]:
        client = self._http_client

        if client is not None:
            return await self._post_with_client(client, payload)

        async with httpx.AsyncClient(timeout=self.timeout_seconds) as owned_client:
            return await self._post_with_client(owned_client, payload)

    async def _post_with_client(
        self,
        client: httpx.AsyncClient,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        try:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
        except httpx.TimeoutException as exc:
            raise DeepSeekTimeoutError("DeepSeek API request timed out.") from exc
        except httpx.HTTPError as exc:
            raise DeepSeekProviderError("DeepSeek API request failed.") from exc

        if response.status_code < 200 or response.status_code >= 300:
            raise DeepSeekProviderError(
                f"DeepSeek API returned non-2xx status: {response.status_code}."
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise MalformedDeepSeekResponseError("DeepSeek API returned invalid JSON.") from exc

        if not isinstance(data, dict):
            raise MalformedDeepSeekResponseError("DeepSeek API response must be a JSON object.")

        return data

    def _extract_content(self, data: dict[str, Any]) -> str:
        choices = data.get("choices")

        if not isinstance(choices, Sequence) or isinstance(choices, (str, bytes)) or not choices:
            raise MalformedDeepSeekResponseError("DeepSeek API response is missing choices.")

        first_choice = choices[0]

        if not isinstance(first_choice, dict):
            raise MalformedDeepSeekResponseError("DeepSeek API choice must be an object.")

        message = first_choice.get("message")

        if not isinstance(message, dict):
            raise MalformedDeepSeekResponseError("DeepSeek API response is missing message.")

        content = message.get("content")

        if not isinstance(content, str) or not content.strip():
            raise MalformedDeepSeekResponseError("DeepSeek API response is missing content.")

        return content
