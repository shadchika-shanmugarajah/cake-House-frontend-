from redis import Redis
from redis.exceptions import ConnectionError as RedisConnectionError
from rq import Connection, Queue, Worker

from src.config import get_settings


def run_worker(queue_name: str) -> None:
    settings = get_settings()
    redis_conn = Redis.from_url(settings.redis_url)
    redis_conn.ping()

    with Connection(redis_conn):
        worker = Worker([Queue(queue_name)])
        worker.work()


if __name__ == '__main__':
    # Start worker for both queues from two processes in production.
    # Example:
    # python -m src.app image_validation
    # python -m src.app image_analysis
    import sys

    queue = sys.argv[1] if len(sys.argv) > 1 else 'image_validation'
    try:
        run_worker(queue)
    except RedisConnectionError:
        print(
            'Failed to connect to Redis queue server.\n'
            'Set REDIS_URL correctly and make sure Redis is running (default: redis://localhost:6379/0).'
        )
        raise SystemExit(1)
