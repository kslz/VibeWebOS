from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated
from urllib.parse import urlparse

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    PositiveFloat,
    PositiveInt,
    StringConstraints,
    field_validator,
)

NonEmptyString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class LlmRuntimeConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provider: NonEmptyString = "deepseek"
    base_url: NonEmptyString = Field(default="https://api.deepseek.com", alias="baseUrl")
    model: NonEmptyString = "deepseek-v4-flash"
    request_timeout_seconds: PositiveFloat = Field(default=60, alias="requestTimeoutSeconds")

    @field_validator("base_url")
    @classmethod
    def validate_base_url(cls, value: str) -> str:
        parsed = urlparse(value)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("baseUrl must be an absolute HTTP(S) URL.")
        return value


class UiRuntimeConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    system_name: NonEmptyString = Field(default="VibeWebOS", alias="systemName")
    about_text: NonEmptyString = Field(
        default=(
            "VibeWebOS 是一个中文浏览器桌面 MVP。它以 Windows 11 风格呈现多窗口应用、"
            "浏览器和由大模型生成的页面内容，所有状态仅保存在当前浏览器内存中。"
        ),
        alias="aboutText",
    )
    waiting_texts: list[NonEmptyString] = Field(
        default_factory=lambda: [
            "正在整理你的想法...",
            "正在生成一个更像应用的界面...",
            "正在检查页面结构...",
            "正在准备窗口内容...",
        ],
        alias="waitingTexts",
        min_length=1,
    )
    waiting_text_switch_delay_ms: PositiveInt = Field(default=5000, alias="waitingTextSwitchDelayMs")


class RuntimeConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    llm: LlmRuntimeConfig = Field(default_factory=LlmRuntimeConfig)
    ui: UiRuntimeConfig = Field(default_factory=UiRuntimeConfig)


DEFAULT_RUNTIME_CONFIG = RuntimeConfig()


def default_config_path() -> Path:
    return Path(__file__).resolve().parents[2] / "config" / "app.config.json"


def load_runtime_config(config_path: Path | None = None) -> RuntimeConfig:
    path = config_path or default_config_path()

    if not path.exists():
        return DEFAULT_RUNTIME_CONFIG

    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid runtime config JSON: {path}") from exc

    return RuntimeConfig.model_validate(payload)
