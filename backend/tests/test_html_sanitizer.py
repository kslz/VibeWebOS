import pytest

from app.services.html_sanitizer import HtmlSanitizationError, sanitize_html


def test_preserves_safe_rich_html() -> None:
    html = """
    <section class="dashboard">
      <style>.card { color: #123456; }</style>
      <div class="card" data-view="main">
        <h2>项目进度</h2>
        <form><input name="keyword" value="里程碑"><button type="submit">搜索</button></form>
        <table><tr><th>事项</th></tr><tr><td>设计</td></tr></table>
        <img src="https://example.com/cover.png" alt="封面">
        <svg viewBox="0 0 10 10"><path d="M0 0L10 10"></path></svg>
      </div>
    </section>
    """

    sanitized = sanitize_html(html)

    assert "<form>" in sanitized
    assert "<table>" in sanitized
    assert "<svg" in sanitized
    assert "https://example.com/cover.png" in sanitized
    assert "onclick" not in sanitized


@pytest.mark.parametrize(
    "html",
    [
        "<script>alert(1)</script>",
        "<iframe src='https://example.com'></iframe>",
        "<button onclick='steal()'>点我</button>",
        "<a href='javascript:alert(1)'>坏链接</a>",
        "<script src='https://example.com/app.js'></script>",
        "<img src='ftp://example.com/file.png'>",
        "<img src='https://example.com/tracker.js'>",
        "<meta http-equiv='refresh' content='0;url=https://example.com'>",
    ],
)
def test_rejects_unsafe_html(html: str) -> None:
    with pytest.raises(HtmlSanitizationError):
        sanitize_html(html)
