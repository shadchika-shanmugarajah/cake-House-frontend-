from __future__ import annotations

import json
from datetime import datetime

from pymongo import MongoClient

from src.config import get_settings
from src.services.moderation_service import validate_image_url


def _collection():
    settings = get_settings()
    client = MongoClient(settings.mongo_uri)
    return client[settings.mongo_db_name].custom_order_requests


def validate_image_task(payload_json: str) -> dict:
    payload = json.loads(payload_json)
    request_id = payload.get('requestId')
    image_url = payload.get('imageUrl')

    is_valid, reason = validate_image_url(image_url)

    col = _collection()
    if not is_valid:
        col.update_one(
            {'requestId': request_id},
            {
                '$set': {
                    'status': 'awaiting_user_confirmation',
                    'aiResult.status': 'failed',
                    'aiResult.errorMessage': reason,
                    'updatedAt': datetime.utcnow(),
                }
            },
        )
        return {'requestId': request_id, 'status': 'failed', 'reason': reason}

    col.update_one(
        {'requestId': request_id},
        {
            '$set': {
                'status': 'ai_processing',
                'aiResult.status': 'pending',
                'updatedAt': datetime.utcnow(),
            }
        },
    )
    return {'requestId': request_id, 'status': 'validated'}
