from pydantic import Field

from app.schemas.common import ApiBaseModel, FormValues, HtmlResponse, NonEmptyString, UserAction


class AppInteractRequest(ApiBaseModel):
    window_title: NonEmptyString = Field(alias="windowTitle")
    current_summary: NonEmptyString = Field(alias="currentSummary")
    current_html: NonEmptyString = Field(alias="currentHtml")
    user_action: UserAction = Field(alias="userAction")
    form_values: FormValues = Field(default_factory=dict, alias="formValues")


class AppInteractResponse(HtmlResponse):
    pass
