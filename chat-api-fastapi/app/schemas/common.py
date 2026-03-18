from datetime import datetime
from pydantic import BaseModel, Field


class ApiError(BaseModel):
    code: str
    message: str
    details: list[dict] = Field(default_factory=list)
    request_id: str | None = None


class ErrorEnvelope(BaseModel):
    error: ApiError


class MetaResponse(BaseModel):
    created_at: datetime = Field(default_factory=datetime.utcnow)
