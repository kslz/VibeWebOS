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


def test_preserves_open_generated_app_runtime_capabilities() -> None:
    html = """
    <section>
      <button onclick="renderChart()" type="button">刷新图表</button>
      <canvas id="chart"></canvas>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        localStorage.setItem('vibe-demo', '1');
        fetch('https://api.example.com/data.json');
        const socket = new WebSocket('wss://example.com/live');
        socket.close();
      </script>
    </section>
    """

    sanitized = sanitize_html(html)

    assert 'onclick="renderChart()"' in sanitized
    assert 'src="https://cdn.jsdelivr.net/npm/chart.js"' in sanitized
    assert "localStorage" in sanitized
    assert "fetch" in sanitized
    assert "WebSocket" in sanitized


@pytest.mark.parametrize(
    "html",
    [
        "<iframe src='https://example.com'></iframe>",
        "<a href='javascript:alert(1)'>坏链接</a>",
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
        "window.parent.document.body",
        "window.top.location = 'https://example.com'",
        "opener.location = 'https://example.com'",
        "document.body.ownerDocument.defaultView.parent.document.body",
    ],
)
def test_rejects_parent_window_escape_capabilities(script: str) -> None:
    with pytest.raises(HtmlSanitizationError):
        sanitize_html(f"<section><script>{script}</script></section>")
