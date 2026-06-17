from fastapi import APIRouter, Depends

from app.api.dependencies import get_deepseek_client, get_prompt_service
from app.api.errors import execute_llm_route
from app.schemas.app_search import AppSearchRequest, AppSearchResponse
from app.services.deepseek_client import DeepSeekClient
from app.services.llm_response_validator import validate_app_search_response
from app.services.prompt_service import PromptService

router = APIRouter()


@router.post("/app-search", response_model=AppSearchResponse)
async def app_search(
    request: AppSearchRequest,
    deepseek_client: DeepSeekClient = Depends(get_deepseek_client),
    prompt_service: PromptService = Depends(get_prompt_service),
) -> AppSearchResponse:
    async def handler() -> AppSearchResponse:
        prompt = prompt_service.render_prompt("app_search.md", query=request.query)
        raw_response = await deepseek_client.complete(prompt)
        return validate_app_search_response(raw_response)

    return await execute_llm_route(handler)
