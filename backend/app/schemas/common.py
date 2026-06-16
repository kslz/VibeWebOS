from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

NonEmptyString = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]
UserActionType = Literal["click", "link", "submit"]
FormValues = dict[str, str]


class ApiBaseModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True)


class UserAction(ApiBaseModel):
    type: UserActionType
    target_text: NonEmptyString = Field(alias="targetText")
    target_tag: NonEmptyString = Field(alias="targetTag")
    target_description: NonEmptyString = Field(alias="targetDescription")


class GeneratedAppCandidate(ApiBaseModel):
    name: NonEmptyString
    description: NonEmptyString
    app_type: NonEmptyString = Field(alias="appType")
    style_hint: NonEmptyString = Field(alias="styleHint")


class HtmlResponse(ApiBaseModel):
    window_title: NonEmptyString = Field(alias="windowTitle")
    html: NonEmptyString
    summary: NonEmptyString
