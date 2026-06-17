from __future__ import annotations

import re

from bs4 import BeautifulSoup, Tag


class HtmlSanitizationError(ValueError):
    pass


DISALLOWED_TAGS = {
    "base",
    "embed",
    "iframe",
    "link",
    "meta",
    "object",
    "script",
}
URL_ATTRIBUTES = {"action", "href", "poster", "src", "xlink:href"}
DANGEROUS_PROTOCOLS = ("data:text/html", "javascript:", "vbscript:")
SAFE_URL_PREFIXES = (
    "#",
    "/",
    "./",
    "../",
    "http://",
    "https://",
    "mailto:",
    "tel:",
    "data:image/",
)
URL_SCHEME_PATTERN = re.compile(r"^[a-z][a-z0-9+.-]*:", re.IGNORECASE)


def sanitize_html(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup.find_all(True):
        _validate_tag(tag)

    return str(soup)


def _validate_tag(tag: Tag) -> None:
    tag_name = tag.name.lower()

    if tag_name in DISALLOWED_TAGS:
        raise HtmlSanitizationError(f"Disallowed HTML tag: {tag_name}")

    for attribute_name, attribute_value in list(tag.attrs.items()):
        normalized_attribute = attribute_name.lower()

        if normalized_attribute.startswith("on"):
            raise HtmlSanitizationError(f"Disallowed event handler attribute: {attribute_name}")

        if normalized_attribute in URL_ATTRIBUTES:
            for value in _iter_attribute_values(attribute_value):
                _validate_url_attribute(attribute_name, value)


def _iter_attribute_values(attribute_value: object) -> list[str]:
    if isinstance(attribute_value, list):
        return [str(value).strip() for value in attribute_value]

    return [str(attribute_value).strip()]


def _validate_url_attribute(attribute_name: str, value: str) -> None:
    normalized_value = value.lower().replace("\u0000", "").strip()

    if not normalized_value:
        return

    if any(normalized_value.startswith(protocol) for protocol in DANGEROUS_PROTOCOLS):
        raise HtmlSanitizationError(f"Disallowed URL protocol in {attribute_name}.")

    if URL_SCHEME_PATTERN.match(normalized_value) and not any(
        normalized_value.startswith(prefix) for prefix in SAFE_URL_PREFIXES
    ):
        raise HtmlSanitizationError(f"Unsafe URL in {attribute_name}.")

    if attribute_name.lower() == "src" and normalized_value.endswith(".js"):
        raise HtmlSanitizationError("External JavaScript is not allowed.")
