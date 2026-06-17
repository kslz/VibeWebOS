from app.services.deepseek_client import DeepSeekClient
from app.services.prompt_service import PromptService


def get_deepseek_client() -> DeepSeekClient:
    return DeepSeekClient()


def get_prompt_service() -> PromptService:
    return PromptService()
