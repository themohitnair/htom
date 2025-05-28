from typing import Optional

from pydantic import BaseModel, ConfigDict


class HTMLRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    html: Optional[str] = None


class MarkdownResponse(BaseModel):
    markdown: Optional[str] = None
    success: str


class HealthCheck(BaseModel):
    status: str
