from __future__ import annotations

import json
import logging
from uuid import uuid4

from redis import Redis
from rq import Queue

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class QueueService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._redis: Redis | None = None

    def _get_redis(self) -> Redis | None:
        if self._redis is not None:
            return self._redis
        try:
            self._redis = Redis.from_url(self.settings.redis_url)
            self._redis.ping()
            return self._redis
        except Exception as exc:  # noqa: BLE001
            logger.warning('Redis unavailable, queue fallback enabled: %s', exc)
            self._redis = None
            return None

    def enqueue(self, queue_name: str, job_name: str, payload: dict) -> str | None:
        redis_conn = self._get_redis()
        if redis_conn is None:
            return None

        queue = Queue(name=queue_name, connection=redis_conn)
        job = queue.enqueue(job_name, json.dumps(payload), job_timeout=180)
        return job.id

    def fake_job_id(self) -> str:
        return f'local-{uuid4().hex[:12]}'


queue_service = QueueService()
