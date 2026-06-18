from __future__ import annotations

import json
from pathlib import Path
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, PositiveFloat, PositiveInt, StringConstraints

NonEmptyString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class LlmRuntimeConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    provider: NonEmptyString = "deepseek"
    base_url: NonEmptyString = Field(default="https://api.deepseek.com", alias="baseUrl")
    model: NonEmptyString = "deepseek-v4-flash"
    request_timeout_seconds: PositiveFloat = Field(default=60, alias="requestTimeoutSeconds")


class UiRuntimeConfig(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    system_name: NonEmptyString = Field(default="VibeWebOS", alias="systemName")
    about_text: NonEmptyString = Field(
        default=(
            "VibeWebOS 鏄竴涓腑鏂囨祻瑙堝櫒妗岄潰 MVP銆傚畠浠?Windows 11 椋庢牸鍛堢幇澶氱獥鍙ｅ簲鐢ㄣ€?"
            "娴忚鍣ㄥ拰鐢卞ぇ妯″瀷鐢熸垚鐨勯〉闈㈠唴瀹癸紝鎵€鏈夌姸鎬佷粎淇濆瓨鍦ㄥ綋鍓嶆祻瑙堝櫒鍐呭瓨涓€?"
        ),
        alias="aboutText",
    )
    waiting_texts: list[NonEmptyString] = Field(
        default_factory=lambda: [
            "姝ｅ湪鏁寸悊浣犵殑鎯虫硶...",
            "姝ｅ湪鐢熸垚涓€涓洿鍍忓簲鐢ㄧ殑鐣岄潰...",
            "姝ｅ湪妫€鏌ラ〉闈㈢粨鏋?..",
            "姝ｅ湪鍑嗗绐楀彛鍐呭...",
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
