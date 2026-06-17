from pathlib import Path


PROMPT_DIR = Path(__file__).resolve().parents[1] / "app" / "prompts"


def read_prompt(name: str) -> str:
    return (PROMPT_DIR / name).read_text(encoding="utf-8")


def test_generated_app_prompts_recommend_cdn_for_richer_toy_apps() -> None:
    for prompt_name in ["app_generate.md", "app_interact.md"]:
        prompt = read_prompt(prompt_name)

        assert "HTTPS CDN" in prompt
        assert "图表" in prompt
        assert "可视化" in prompt
        assert "游戏" in prompt
        assert "编辑器" in prompt
        assert "仪表盘" in prompt


def test_generated_app_prompts_preserve_parent_window_isolation() -> None:
    for prompt_name in ["app_generate.md", "app_interact.md"]:
        prompt = read_prompt(prompt_name)

        assert "window.parent" in prompt
        assert "window.top" in prompt
        assert "opener" in prompt
        assert "父页面 DOM" in prompt
        assert "桌面外壳" in prompt
        assert "任务栏" in prompt
        assert "开始菜单" in prompt
        assert "其他窗口" in prompt
