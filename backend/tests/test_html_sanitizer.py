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


def test_preserves_safe_inline_script_for_local_generated_app_logic() -> None:
    html = """
    <section>
      <output id="total">0</output>
      <button id="add" type="button">+1</button>
      <script>
        const total = document.querySelector('#total');
        const add = document.querySelector('#add');
        let count = 0;
        add.addEventListener('click', () => {
          count += 1;
          total.textContent = String(count);
        });
      </script>
    </section>
    """

    sanitized = sanitize_html(html)

    assert "<script>" in sanitized
    assert "addEventListener" in sanitized
    assert "fetch(" not in sanitized


def test_preserves_safe_inline_script_with_function_callback() -> None:
    html = """
    <section>
      <button id="add" type="button">+1</button>
      <script>
        const add = document.querySelector('#add');
        add.addEventListener('click', function () {
          add.textContent = '+2';
        });
      </script>
    </section>
    """

    sanitized = sanitize_html(html)

    assert "function ()" in sanitized
    assert "addEventListener" in sanitized


@pytest.mark.parametrize(
    "html",
    [
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


@pytest.mark.parametrize(
    "script",
    [
        "fetch('/api/private')",
        "new XMLHttpRequest()",
        "new WebSocket('wss://example.com')",
        "new EventSource('/stream')",
        "localStorage.setItem('x', '1')",
        "sessionStorage.getItem('x')",
        "indexedDB.open('x')",
        "document.cookie = 'x=1'",
        "navigator.clipboard.writeText('x')",
        "navigator.mediaDevices.getUserMedia({ audio: true })",
        "navigator.geolocation.getCurrentPosition(() => {})",
        "window.parent.document.body",
        "window.top.location = 'https://example.com'",
        "opener.location = 'https://example.com'",
        "import value from 'https://example.com/app.js'",
        "import('https://example.com/app.js')",
        "Function('return window')()",
        "new Function('return window')",
        "eval('window')",
    ],
)
def test_rejects_dangerous_inline_script_capabilities(script: str) -> None:
    with pytest.raises(HtmlSanitizationError):
        sanitize_html(f"<section><script>{script}</script></section>")
