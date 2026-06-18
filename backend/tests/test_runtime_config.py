from pathlib import Path

import pytest
from pydantic import ValidationError

from app.runtime_config import RuntimeConfig, load_runtime_config


def test_load_runtime_config_uses_defaults_when_file_is_missing(tmp_path: Path) -> None:
    config = load_runtime_config(tmp_path / "missing.json")

    assert config.llm.provider == "deepseek"
    assert config.llm.base_url == "https://api.deepseek.com"
    assert config.llm.model == "deepseek-v4-flash"
    assert config.llm.request_timeout_seconds == 60
    assert config.ui.system_name == "VibeWebOS"
    assert config.ui.waiting_text_switch_delay_ms == 5000
    assert config.ui.waiting_texts


def test_load_runtime_config_reads_root_json_values(tmp_path: Path) -> None:
    config_path = tmp_path / "app.config.json"
    config_path.write_text(
        """
        {
          "llm": {
            "provider": "openai-compatible",
            "baseUrl": "https://llm.example.com/v1",
            "model": "custom-model",
            "requestTimeoutSeconds": 120
          },
          "ui": {
            "systemName": "CustomOS",
            "aboutText": "Custom about text.",
            "waitingTexts": ["Thinking...", "Rendering..."],
            "waitingTextSwitchDelayMs": 3000
          }
        }
        """,
        encoding="utf-8",
    )

    config = load_runtime_config(config_path)

    assert config.llm.provider == "openai-compatible"
    assert config.llm.base_url == "https://llm.example.com/v1"
    assert config.llm.model == "custom-model"
    assert config.llm.request_timeout_seconds == 120
    assert config.ui.system_name == "CustomOS"
    assert config.ui.about_text == "Custom about text."
    assert config.ui.waiting_texts == ["Thinking...", "Rendering..."]
    assert config.ui.waiting_text_switch_delay_ms == 3000


def test_load_runtime_config_rejects_invalid_json(tmp_path: Path) -> None:
    config_path = tmp_path / "app.config.json"
    config_path.write_text("{ broken", encoding="utf-8")

    with pytest.raises(ValueError, match="Invalid runtime config JSON"):
        load_runtime_config(config_path)


def test_runtime_config_rejects_empty_waiting_texts() -> None:
    with pytest.raises(ValidationError):
        RuntimeConfig.model_validate(
            {
                "ui": {
                    "waitingTexts": [],
                }
            }
        )


def test_runtime_config_rejects_non_positive_timeout() -> None:
    with pytest.raises(ValidationError):
        RuntimeConfig.model_validate(
            {
                "llm": {
                    "requestTimeoutSeconds": 0,
                }
            }
        )


def test_runtime_config_does_not_define_api_key_fields() -> None:
    config = RuntimeConfig()
    serialized = config.model_dump(by_alias=True)

    assert "apiKey" not in str(serialized)
    assert "LLM_API_KEY" not in str(serialized)
