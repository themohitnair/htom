import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from starlette.exceptions import HTTPException

from modules.convert import html_to_markdown
from modules.models import HealthCheck, HTMLRequest, MarkdownResponse

# Configure logging
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
    # Startup logic
    logger.info("FastAPI application starting up")
    yield
    # Shutdown logic
    logger.info("FastAPI application shutting down")


app = FastAPI(lifespan=lifespan)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and their processing time"""
    start_time = time.time()

    logger.info(
        f"Incoming request: {request.method} {request.url.path} from {request.client.host}"
    )

    response = await call_next(request)

    process_time = time.time() - start_time

    # Log response details
    logger.info(
        f"Request completed: {request.method} {request.url.path} - "
        f"Status: {response.status_code} - Time: {process_time:.3f}s"
    )

    return response


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
