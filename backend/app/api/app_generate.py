from fastapi import APIRouter, Depends

from app.api.dependencies import get_deepseek_client, get_prompt_service
from app.api.errors import execute_llm_route
from app.schemas.app_generate import AppGenerateRequest, AppGenerateResponse
from app.services.deepseek_client import DeepSeekClient
from app.services.llm_response_validator import validate_app_generate_response
from app.services.prompt_service import PromptService

router = APIRouter()


@router.post("/app-generate", response_model=AppGenerateResponse)
async def app_generate(
    request: AppGenerateRequest,
    deepseek_client: DeepSeekClient = Depends(get_deepseek_client),
    prompt_service: PromptService = Depends(get_prompt_service),
) -> AppGenerateResponse:
    async def handler() -> AppGenerateResponse:
        prompt = prompt_service.render_prompt(
            "app_generate.md",
            name=request.name,
            description=request.description,
            app_type=request.app_type,
            style_hint=request.style_hint,
        )
        raw_response = await deepseek_client.complete(prompt)
        return validate_app_generate_response(raw_response)

    return await execute_llm_route(handler)
