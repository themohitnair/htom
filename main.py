from fastapi import FastAPI

from modules.convert import html_to_markdown
from modules.models import HealthCheck, HTMLRequest, MarkdownResponse

app = FastAPI()


@app.get("/")
async def health():
    return HealthCheck(status="ok")


@app.post("/convert")
async def convert(query: HTMLRequest):
    try:
        markdown = html_to_markdown(query.html)
    except Exception:
        return MarkdownResponse(success="error")

    return MarkdownResponse(markdown=markdown, success="ok")
