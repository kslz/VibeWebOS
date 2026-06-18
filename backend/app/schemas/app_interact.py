from pydantic import Field

from app.schemas.common import ApiBaseModel, FormValues, HtmlResponse, NonEmptyString, UserAction


class AppInteractRequest(ApiBaseModel):
    window_title: NonEmptyString = Field(alias="windowTitle")
    current_summary: NonEmptyString = Field(alias="currentSummary")
    current_html: NonEmptyString = Field(alias="currentHtml")
    recent_interaction_summaries: list[str] = Field(default_factory=list, alias="recentInteractionSummaries")
    user_action: UserAction = Field(alias="userAction")
    form_values: FormValues = Field(default_factory=dict, alias="formValues")


class AppInteractResponse(HtmlResponse):
    pass
