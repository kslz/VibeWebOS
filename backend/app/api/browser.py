from fastapi import APIRouter, Depends

from app.api.dependencies import get_deepseek_client, get_prompt_service
from app.api.errors import execute_llm_route
from app.schemas.browser import (
    BrowserInteractRequest,
    BrowserInteractResponse,
    BrowserNavigateRequest,
    BrowserNavigateResponse,
)
from app.services.deepseek_client import DeepSeekClient
from app.services.llm_response_validator import (
    validate_browser_interact_response,
    validate_browser_response,
)
from app.services.prompt_service import PromptService

router = APIRouter()


@router.post("/browser-navigate", response_model=BrowserNavigateResponse)
async def browser_navigate(
    request: BrowserNavigateRequest,
    deepseek_client: DeepSeekClient = Depends(get_deepseek_client),
    prompt_service: PromptService = Depends(get_prompt_service),
) -> BrowserNavigateResponse:
    async def handler() -> BrowserNavigateResponse:
        prompt = prompt_service.render_prompt(
            "browser_navigate.md",
            input=request.input,
            current_url=request.current_url,
            current_summary=request.current_summary,
        )
        raw_response = await deepseek_client.complete(prompt)
        return validate_browser_response(raw_response)

    return await execute_llm_route(handler)


@router.post("/browser-interact", response_model=BrowserInteractResponse)
async def browser_interact(
    request: BrowserInteractRequest,
    deepseek_client: DeepSeekClient = Depends(get_deepseek_client),
    prompt_service: PromptService = Depends(get_prompt_service),
) -> BrowserInteractResponse:
    async def handler() -> BrowserInteractResponse:
        prompt = prompt_service.render_prompt(
            "browser_interact.md",
            current_url=request.current_url,
            current_summary=request.current_summary,
            current_html=request.current_html,
            recent_interaction_summaries=request.recent_interaction_summaries,
            user_action=request.user_action.model_dump(by_alias=True),
            form_values=request.form_values,
        )
        raw_response = await deepseek_client.complete(prompt)
        return validate_browser_interact_response(raw_response)

    return await execute_llm_route(handler)
