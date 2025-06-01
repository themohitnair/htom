import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.exceptions import HTTPException

from modules.convert import html_to_markdown
from modules.models import HealthCheck, HTMLRequest, MarkdownResponse

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
    """Fix HTTPS URL generation behind Cloud Run proxy"""

    # Cloud Run sets x-forwarded-proto header
    if request.headers.get("x-forwarded-proto") == "https":
        # Force the request scheme to HTTPS for url_for() generation
        request.scope["scheme"] = "https"
        request.scope["server"] = (request.headers.get("host", "localhost"), 443)

    response = await call_next(request)
    return response


@app.get("/app", response_class=HTMLResponse)
async def converter_app(request: Request):
    """Serve the HTML converter interface"""
    logger.info("Converter app interface accessed")
    return templates.TemplateResponse("converter.html", {"request": request})


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Log HTTP exceptions"""
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
