from __future__ import annotations

import json
import re
from urllib.request import Request, urlopen

from src.config import get_settings


def build_gemini_prompt(customer_inputs: dict) -> str:
    occasion = str(customer_inputs.get('occasion') or '').strip()
    flavor_hint = str(customer_inputs.get('flavor') or '').strip()
    notes = str(customer_inputs.get('notes') or '').strip()

    return (
        'You are a cake designer AI. Analyze the provided cake reference image and return ONLY valid JSON. '
        'Do not add markdown or extra text. '\
        'If uncertain, keep values empty and reduce confidence. '\
        'JSON schema: '\
        '{"description":"string",'\
        '"cakeType":"string",'\
        '"flavor":"string",'\
        '"shape":"string",'\
        '"designStyle":"string",'\
        '"colors":["string"],'\
        '"textOnCake":"string",'\
        '"layerCount":null,'\
        '"decorationElements":["string"],'\
        '"confidence":0.0,'\
        '"analysisStatus":"ready|needs_human_review"'\
        '}. '\
        f'Customer hints: occasion={occasion or ""}, flavor_hint={flavor_hint or ""}, notes={notes or ""}.'
    )


def _extract_json(raw_text: str) -> dict | None:
    text = (raw_text or '').strip()
    if not text:
        return None

    if text.startswith('```'):
        matches = re.findall(r'```(?:json)?\s*(\{.*?\})\s*```', text, flags=re.S)
        if matches:
            text = matches[0].strip()

    try:
        parsed = json.loads(text)
        return parsed if isinstance(parsed, dict) else None
    except Exception:  # noqa: BLE001
        pass

    start = text.find('{')
    end = text.rfind('}')
    if start >= 0 and end > start:
        snippet = text[start:end + 1]
        try:
            parsed = json.loads(snippet)
            return parsed if isinstance(parsed, dict) else None
        except Exception:  # noqa: BLE001
            return None

    return None


def _safe_float(value: object, default: float = 0.0) -> float:
    try:
        num = float(value)
    except Exception:  # noqa: BLE001
        return default
    if num < 0:
        return 0.0
    if num > 1:
        return 1.0
    return num


def _safe_layer_count(value: object) -> int | None:
    if value is None:
        return None
    try:
        parsed = int(value)
    except Exception:  # noqa: BLE001
        return None
    if parsed <= 0:
        return None
    if parsed > 10:
        return None
    return parsed


def _to_string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    results: list[str] = []
    for item in value:
        text = str(item or '').strip()
        if not text:
            continue
        if text.lower() in {entry.lower() for entry in results}:
            continue
        results.append(text)
    return results[:12]


def _download_image(image_url: str, timeout_secs: int) -> tuple[bytes, str]:
    req = Request(image_url, headers={'User-Agent': 'CakeHouse-AI-Worker/1.0'})
    with urlopen(req, timeout=timeout_secs) as response:
        content = response.read()
        mime = response.headers.get_content_type() or 'image/jpeg'

    if not content:
        raise ValueError('Downloaded image is empty')

    return content, mime


def _fallback_payload(*, error_message: str, raw_response: str = '', status: str = 'needs_human_review') -> dict:
    return {
        'description': 'Custom cake inspired by uploaded reference image.',
        'cakeType': '',
        'flavor': '',
        'shape': '',
        'designStyle': 'Custom',
        'colors': [],
        'textOnCake': '',
        'layerCount': None,
        'decorationElements': [],
        'confidence': 0.45,
        'extractedAttributes': {
            'style': 'Custom',
            'colors': [],
            'tiers': None,
            'textOnCake': '',
            'decorations': [],
        },
        'status': status,
        'errorMessage': error_message,
        'rawResponse': raw_response,
    }


def analyze_cake_image(image_url: str, customer_inputs: dict, *, attempt: int = 1) -> dict:
    settings = get_settings()

    if not settings.gemini_api_key:
        return _fallback_payload(
            error_message='GEMINI_API_KEY not configured in worker environment.',
            status='needs_human_review',
        )

    try:
        from google import genai
        from google.genai import types

        image_bytes, mime_type = _download_image(image_url, settings.ai_analysis_http_timeout_secs)

        client = genai.Client(api_key=settings.gemini_api_key)
        prompt = build_gemini_prompt(customer_inputs)
        image_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)

        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=[prompt, image_part],
        )

        raw_text = (getattr(response, 'text', '') or '').strip()
        parsed = _extract_json(raw_text)

        if not parsed:
            return _fallback_payload(
                error_message='Gemini returned unstructured output; retry recommended.',
                raw_response=raw_text,
                status='retryable',
            )

        description = str(parsed.get('description') or '').strip() or 'Custom cake inspired by uploaded reference image.'
        cake_type = str(parsed.get('cakeType') or '').strip()
        flavor = str(parsed.get('flavor') or '').strip()
        shape = str(parsed.get('shape') or '').strip()
        design_style = str(parsed.get('designStyle') or '').strip() or 'Custom'
        colors = _to_string_list(parsed.get('colors'))
        text_on_cake = str(parsed.get('textOnCake') or '').strip()
        layer_count = _safe_layer_count(parsed.get('layerCount'))
        decorations = _to_string_list(parsed.get('decorationElements'))
        confidence = _safe_float(parsed.get('confidence'), default=0.6)

        analysis_status = str(parsed.get('analysisStatus') or 'ready').strip().lower()
        if analysis_status not in {'ready', 'needs_human_review'}:
            analysis_status = 'ready'

        return {
            'description': description,
            'cakeType': cake_type,
            'flavor': flavor,
            'shape': shape,
            'designStyle': design_style,
            'colors': colors,
            'textOnCake': text_on_cake,
            'layerCount': layer_count,
            'decorationElements': decorations,
            'confidence': confidence,
            'extractedAttributes': {
                'style': design_style,
                'colors': colors,
                'tiers': layer_count,
                'textOnCake': text_on_cake,
                'decorations': decorations,
            },
            'status': analysis_status,
            'errorMessage': '',
            'rawResponse': raw_text,
            'analysisMeta': {
                'attempt': attempt,
                'model': settings.gemini_model,
            },
        }
    except Exception as exc:  # noqa: BLE001
        return _fallback_payload(
            error_message=str(exc),
            status='retryable',
        )
