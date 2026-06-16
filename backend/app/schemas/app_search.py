from typing import Annotated

from pydantic import Field

from app.schemas.common import ApiBaseModel, GeneratedAppCandidate, NonEmptyString


class AppSearchRequest(ApiBaseModel):
    query: NonEmptyString


class AppSearchResponse(ApiBaseModel):
    results: Annotated[list[GeneratedAppCandidate], Field(min_length=2, max_length=3)]
