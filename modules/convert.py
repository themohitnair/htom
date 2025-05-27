import html2text


def html_to_markdown(html_content: str) -> str:
    converter = html2text.HTML2Text()
    converter.ignore_links = False
    converter.ignore_images = False
    converter.ignore_emphasis = False
    converter.bypass_tables = False
    markdown = converter.handle(html_content)
    return markdown.strip()
