import logging
import markdown
import textstat
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


def markdown_to_html(markdown_content: str) -> str:
    logger.info("Starting Markdown to HTML conversion")
    html = markdown.markdown(markdown_content)
    logger.info("Markdown to HTML conversion complete")
    return html.strip()


def analyze_text_statistics(text: str) -> dict:
    logger.info("Starting text analysis")

    stats = {
        "word_count": textstat.lexicon_count(text, removepunct=True),
        "sentence_count": textstat.sentence_count(text),
        "character_count": len(text),
        "character_count_no_spaces": len(text.replace(" ", "")),
        "paragraph_count": len([p for p in text.split("\n\n") if p.strip()]),
        "reading_ease": round(textstat.flesch_reading_ease(text), 2),
        "grade_level": round(textstat.flesch_kincaid_grade(text), 2),
        "difficult_words": textstat.difficult_words(text),
        "syllable_count": textstat.syllable_count(text),
        "avg_sentence_length": round(textstat.avg_sentence_length(text), 2),
        "reading_time_minutes": round(
            textstat.lexicon_count(text, removepunct=True) / 200, 1
        ),
    }

    logger.info("Text analysis complete")
    return stats
