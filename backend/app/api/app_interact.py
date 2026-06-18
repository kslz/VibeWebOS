from fastapi import APIRouter, Depends

from app.api.dependencies import get_deepseek_client, get_prompt_service
from app.api.errors import execute_llm_route
from app.schemas.app_interact import AppInteractRequest, AppInteractResponse
from app.services.deepseek_client import DeepSeekClient
from app.services.llm_response_validator import validate_app_interact_response
from app.services.prompt_service import PromptService

router = APIRouter()


@router.post("/app-interact", response_model=AppInteractResponse)
async def app_interact(
    request: AppInteractRequest,
    deepseek_client: DeepSeekClient = Depends(get_deepseek_client),
    prompt_service: PromptService = Depends(get_prompt_service),
) -> AppInteractResponse:
    async def handler() -> AppInteractResponse:
        prompt = prompt_service.render_prompt(
            "app_interact.md",
            window_title=request.window_title,
            current_summary=request.current_summary,
            current_html=request.current_html,
            recent_interaction_summaries=request.recent_interaction_summaries,
            user_action=request.user_action.model_dump(by_alias=True),
            form_values=request.form_values,
        )
        raw_response = await deepseek_client.complete(prompt)
        return validate_app_interact_response(raw_response)

    return await execute_llm_route(handler)
