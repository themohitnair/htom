from pydantic import BaseModel


class HTMLRequest(BaseModel):
    html: str | None


class MarkdownResponse(BaseModel):
    markdown: str | None
    success: str


class HealthCheck(BaseModel):
    status: str
