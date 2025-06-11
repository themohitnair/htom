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


class TextAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: Optional[str] = None


class TextStatsResponse(BaseModel):
    stats: Optional[dict] = None
    success: str


class MarkdownRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    markdown: Optional[str] = None


class HTMLCResponse(BaseModel):
    html: Optional[str] = None
    success: str
