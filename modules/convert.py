import logging

import html2text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def html_to_markdown(html_content: str) -> str:
    logger.info("Starting HTML to Markdown conversion")
    converter = html2text.HTML2Text()
    converter.ignore_links = False
    converter.ignore_images = False
    converter.ignore_emphasis = False
    converter.bypass_tables = False

    logger.debug("Converter configuration set")
    markdown = converter.handle(html_content)

    logger.info("Conversion complete")
    return markdown.strip()
