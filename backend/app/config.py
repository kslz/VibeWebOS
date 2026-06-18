from collections.abc import Callable
from typing import Any, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from app.runtime_config import load_runtime_config

runtime_config = load_runtime_config()

SettingsSource = Callable[[], dict[str, Any]]


def _allowlisted_settings_source(source: SettingsSource) -> SettingsSource:
    allowed_keys = {"LLM_API_KEY", "MAX_HTML_LENGTH", "app_name", "max_html_length"}

    def load() -> dict[str, Any]:
        return {key: value for key, value in source().items() if key in allowed_keys}

    return load


class Settings(BaseSettings):
    app_name: str = "VibeWebOS API"
    deepseek_api_key: Optional[str] = Field(default=None, alias="LLM_API_KEY")
    deepseek_base_url: str = str(runtime_config.llm.base_url)
    deepseek_model: str = runtime_config.llm.model
    request_timeout_seconds: float = runtime_config.llm.request_timeout_seconds
    max_html_length: int = Field(default=80000, alias="MAX_HTML_LENGTH")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        populate_by_name=True,
        extra="ignore",
    )

    @classmethod
    def settings_customise_sources(
        cls,
        settings_cls: type[BaseSettings],
        init_settings: SettingsSource,
        env_settings: SettingsSource,
        dotenv_settings: SettingsSource,
        file_secret_settings: SettingsSource,
    ) -> tuple[SettingsSource, ...]:
        return (
            init_settings,
            _allowlisted_settings_source(env_settings),
            _allowlisted_settings_source(dotenv_settings),
            file_secret_settings,
        )


settings = Settings()
