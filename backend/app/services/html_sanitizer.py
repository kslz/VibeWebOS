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
DISALLOWED_SCRIPT_PATTERNS = {
    "network_api": re.compile(r"\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b", re.IGNORECASE),
    "storage_api": re.compile(r"\b(localStorage|sessionStorage|indexedDB)\b", re.IGNORECASE),
    "cookie_api": re.compile(r"\bdocument\s*\.\s*cookie\b", re.IGNORECASE),
    "clipboard_api": re.compile(r"\bnavigator\s*\.\s*clipboard\b", re.IGNORECASE),
    "media_api": re.compile(r"\bnavigator\s*\.\s*mediaDevices\b", re.IGNORECASE),
    "location_api": re.compile(r"\bnavigator\s*\.\s*geolocation\b", re.IGNORECASE),
    "download_api": re.compile(r"\bdownload\s*=", re.IGNORECASE),
    "parent_window": re.compile(r"\b(window\s*\.\s*)?(parent|top|opener)\b", re.IGNORECASE),
    "module_import": re.compile(r"\bimport\s*(?:\(|[\w{*])", re.IGNORECASE),
    "dynamic_code": re.compile(r"\beval\s*\(|\b(?:new\s+)?Function\s*\("),
    "document_write": re.compile(r"\bdocument\s*\.\s*write\s*\(", re.IGNORECASE),
}


def sanitize_html(html: str, *, allow_inline_script: bool = True) -> str:
    soup = BeautifulSoup(html, "html.parser")

    for tag in soup.find_all(True):
        _validate_tag(tag, allow_inline_script=allow_inline_script)

    return str(soup)


def _validate_tag(tag: Tag, *, allow_inline_script: bool) -> None:
    tag_name = tag.name.lower()

    if tag_name in DISALLOWED_TAGS:
        raise HtmlSanitizationError(f"Disallowed HTML tag: {tag_name}")

    if tag_name == "script" and not allow_inline_script:
        raise HtmlSanitizationError("Inline JavaScript is not allowed in this context.")

    if tag_name == "script":
        _validate_script_tag(tag)

    for attribute_name, attribute_value in list(tag.attrs.items()):
        normalized_attribute = attribute_name.lower()

        if normalized_attribute.startswith("on"):
            raise HtmlSanitizationError(f"Disallowed event handler attribute: {attribute_name}")

        if normalized_attribute in URL_ATTRIBUTES:
            for value in _iter_attribute_values(attribute_value):
                _validate_url_attribute(attribute_name, value)


def _validate_script_tag(tag: Tag) -> None:
    script_type = str(tag.attrs.get("type", "")).lower().strip()

    if "src" in tag.attrs:
        raise HtmlSanitizationError("External JavaScript is not allowed.")

    if script_type and script_type not in {"text/javascript", "application/javascript", "module"}:
        raise HtmlSanitizationError(f"Unsupported script type: {script_type}")

    script_content = tag.string or tag.get_text()

    for pattern_name, pattern in DISALLOWED_SCRIPT_PATTERNS.items():
        if pattern.search(script_content):
            raise HtmlSanitizationError(f"Disallowed JavaScript capability: {pattern_name}")


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
