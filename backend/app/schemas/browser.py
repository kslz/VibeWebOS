from pydantic import Field

from app.schemas.common import ApiBaseModel, FormValues, NonEmptyString, UserAction


class BrowserNavigateRequest(ApiBaseModel):
    input: NonEmptyString
    current_url: str = Field(default="", alias="currentUrl")
    current_summary: str = Field(default="", alias="currentSummary")


class BrowserNavigateResponse(ApiBaseModel):
    page_title: NonEmptyString = Field(alias="pageTitle")
    url: NonEmptyString
    html: NonEmptyString
    summary: NonEmptyString


class BrowserInteractRequest(ApiBaseModel):
    current_url: NonEmptyString = Field(alias="currentUrl")
    current_summary: NonEmptyString = Field(alias="currentSummary")
    current_html: NonEmptyString = Field(alias="currentHtml")
    recent_interaction_summaries: list[str] = Field(default_factory=list, alias="recentInteractionSummaries")
    user_action: UserAction = Field(alias="userAction")
    form_values: FormValues = Field(default_factory=dict, alias="formValues")


class BrowserInteractResponse(BrowserNavigateResponse):
    pass
