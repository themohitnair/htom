import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException

from modules.convert import html_to_markdown, markdown_to_html, analyze_text_statistics
from modules.models import (
    HealthCheck,
    HTMLRequest,
    MarkdownResponse,
    TextAnalysisRequest,
    TextStatsResponse,
    MarkdownRequest,
    HTMLCResponse,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler(),
    ],
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("FastAPI application starting up")
    yield
    logger.info("FastAPI application shutting down")


app = FastAPI(lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.middleware("http")
async def fix_https_urls(request: Request, call_next):
    if request.headers.get("x-forwarded-proto") == "https":
        request.scope["scheme"] = "https"
        request.scope["server"] = (request.headers.get("host", "localhost"), 443)

    response = await call_next(request)
    return response


@app.get("/app", response_class=HTMLResponse)
async def converter_app(request: Request):
    logger.info("Converter app interface accessed")
    return templates.TemplateResponse("converter.html", {"request": request})


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(
        f"HTTP exception on {request.url.path}: {exc.status_code} - {exc.detail}"
    )
    raise exc


@app.get("/")
async def health():
    logger.info("Health check endpoint accessed")
    return HealthCheck(status="ok")


@app.post("/convert")
async def convert(query: HTMLRequest):
    html_preview = query.html[:50] + "..." if len(query.html) > 50 else query.html
    logger.info(f"Starting HTML to Markdown conversion for input: {html_preview}")

    try:
        markdown = html_to_markdown(query.html)
        markdown_preview = markdown[:50] + "..." if len(markdown) > 50 else markdown
        logger.info(f"Conversion successful. Output: {markdown_preview}")
        return MarkdownResponse(markdown=markdown, success="ok")

    except Exception as e:
        logger.error(
            f"Conversion failed for input: {html_preview}. Error: {str(e)}",
            exc_info=True,
        )
        return MarkdownResponse(success="error")


@app.get("/stats", response_class=HTMLResponse)
async def text_analyzer(request: Request):
    logger.info("Text analyzer page accessed")
    return templates.TemplateResponse("stats.html", {"request": request})


@app.get("/about", response_class=HTMLResponse)
async def about_page(request: Request):
    logger.info("About page accessed")
    return templates.TemplateResponse("about.html", {"request": request})


@app.post("/analyze")
async def analyze_text(query: TextAnalysisRequest):
    text_preview = query.text[:50] + "..." if len(query.text) > 50 else query.text
    logger.info(f"Starting text analysis for input: {text_preview}")

    try:
        stats = analyze_text_statistics(query.text)
        logger.info("Text analysis successful")
        return TextStatsResponse(stats=stats, success="ok")

    except Exception as e:
        logger.error(
            f"Text analysis failed for input: {text_preview}. Error: {str(e)}",
            exc_info=True,
        )
        return TextStatsResponse(success="error")


@app.post("/md-to-html")
async def convert_markdown_to_html(query: MarkdownRequest):
    md_preview = (
        query.markdown[:50] + "..." if len(query.markdown) > 50 else query.markdown
    )
    logger.info(f"Starting Markdown to HTML conversion for input: {md_preview}")

    try:
        html = markdown_to_html(query.markdown)
        html_preview = html[:50] + "..." if len(html) > 50 else html
        logger.info(f"Markdown to HTML conversion successful. Output: {html_preview}")
        return HTMLCResponse(html=html, success="ok")

    except Exception as e:
        logger.error(
            f"Markdown to HTML conversion failed for input: {md_preview}. Error: {str(e)}",
            exc_info=True,
        )
        return HTMLCResponse(success="error")
