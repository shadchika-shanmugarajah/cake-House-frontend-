from __future__ import annotations

import os

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class WorkerSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    redis_url: str = Field(default='redis://localhost:6379/0', alias='REDIS_URL')
    mongo_uri: str = Field(default='mongodb://localhost:27017', alias='MONGODB_URI')
    mongo_db_name: str = Field(default='cake_house', alias='MONGODB_DB_NAME')
    gemini_api_key: str = Field(default='', alias='GEMINI_API_KEY')
    gemini_model: str = Field(default='gemini-3-flash-preview', alias='GEMINI_MODEL')
    ai_analysis_max_retries: int = Field(default=2, alias='AI_ANALYSIS_MAX_RETRIES')
    ai_analysis_http_timeout_secs: int = Field(default=12, alias='AI_ANALYSIS_HTTP_TIMEOUT_SECS')


def get_settings() -> WorkerSettings:
    return WorkerSettings()


os.environ.setdefault('PYTHONPATH', os.getcwd())
