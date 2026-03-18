from __future__ import annotations

import json
from datetime import datetime

from pymongo import MongoClient

from src.config import get_settings
from src.services.gemini_vision_service import analyze_cake_image


def _collection():
    settings = get_settings()
    client = MongoClient(settings.mongo_uri)
    return client[settings.mongo_db_name].custom_order_requests


def analyze_cake_image_task(payload_json: str) -> dict:
    payload = json.loads(payload_json)
    request_id = payload.get('requestId')
    image_url = payload.get('imageUrl')
    customer_inputs = payload.get('customerInputs') or {}
    settings = get_settings()

    max_attempts = max(1, int(settings.ai_analysis_max_retries) + 1)
    final_analysis = {}
    last_error = ''

    attempts_used = 0
    for attempt in range(1, max_attempts + 1):
        attempts_used = attempt
        analysis = analyze_cake_image(
            image_url=image_url,
            customer_inputs=customer_inputs,
            attempt=attempt,
        )
        final_analysis = analysis
        last_error = str(analysis.get('errorMessage') or '')

        if analysis.get('status') != 'retryable':
            break

    next_status = 'awaiting_user_confirmation'
    if final_analysis.get('status') == 'needs_human_review':
        next_status = 'awaiting_admin_quote'
    retry_exhausted = final_analysis.get('status') == 'retryable'
    if final_analysis.get('status') == 'retryable':
        next_status = 'awaiting_admin_quote'
        final_analysis['status'] = 'needs_human_review'
        if not final_analysis.get('errorMessage'):
            final_analysis['errorMessage'] = 'AI analysis failed repeatedly; moved to manual review.'

    col = _collection()
    col.update_one(
        {'requestId': request_id},
        {
            '$set': {
                'status': next_status,
                'aiResult': final_analysis,
                'aiAnalysis': {
                    'attempted': attempts_used,
                    'lastError': last_error,
                    'retryable': retry_exhausted,
                    'updatedAt': datetime.utcnow(),
                },
                'updatedAt': datetime.utcnow(),
            }
        },
    )

    return {
        'requestId': request_id,
        'status': next_status,
        'aiStatus': final_analysis.get('status'),
        'attempted': attempts_used,
    }
