from __future__ import annotations

from pathlib import Path


class PromptServiceError(RuntimeError):
    pass


class PromptNotFoundError(PromptServiceError):
    pass


class PromptService:
    def __init__(self, prompt_dir: Path | None = None) -> None:
        self.prompt_dir = prompt_dir or Path(__file__).resolve().parents[1] / "prompts"

    def load_prompt(self, filename: str) -> str:
        prompt_path = self._resolve_prompt_path(filename)

        try:
            return prompt_path.read_text(encoding="utf-8")
        except FileNotFoundError as exc:
            raise PromptNotFoundError(f"Prompt template not found: {filename}") from exc

    def render_prompt(self, filename: str, **values: object) -> str:
        template = self.load_prompt(filename)
        return template.format(**values)

    def _resolve_prompt_path(self, filename: str) -> Path:
        if Path(filename).name != filename or not filename.endswith(".md"):
            raise PromptServiceError(f"Invalid prompt filename: {filename}")

        prompt_path = (self.prompt_dir / filename).resolve()
        prompt_root = self.prompt_dir.resolve()

        if prompt_path.parent != prompt_root:
            raise PromptServiceError(f"Invalid prompt filename: {filename}")

        return prompt_path
