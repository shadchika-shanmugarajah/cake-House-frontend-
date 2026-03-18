from __future__ import annotations

import json
import re
from typing import Any

from app.core.config import get_settings


class CakeImageAiService:
    def __init__(self) -> None:
        self.settings = get_settings()

    @staticmethod
    def _extract_json(raw_text: str) -> dict[str, Any] | None:
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
            try:
                parsed = json.loads(text[start:end + 1])
                return parsed if isinstance(parsed, dict) else None
            except Exception:  # noqa: BLE001
                return None

        return None

    @staticmethod
    def _to_string_list(value: Any) -> list[str]:
        if not isinstance(value, list):
            return []
        items: list[str] = []
        for raw in value:
            text = str(raw or '').strip()
            if not text:
                continue
            if text.lower() in {entry.lower() for entry in items}:
                continue
            items.append(text)
        return items[:12]

    @staticmethod
    def _safe_float(value: Any, default: float = 0.0) -> float:
        try:
            number = float(value)
        except Exception:  # noqa: BLE001
            return default
        if number < 0:
            return 0.0
        if number > 1:
            return 1.0
        return number

    @staticmethod
    def _safe_layer_count(value: Any) -> int | None:
        if value is None:
            return None
        try:
            parsed = int(value)
            if 1 <= parsed <= 10:
                return parsed
            return None
        except Exception:  # noqa: BLE001
            pass

        text = str(value or '')
        match = re.search(r'(\d+)', text)
        if not match:
            return None
        parsed = int(match.group(1))
        if 1 <= parsed <= 10:
            return parsed
        return None

    @staticmethod
    def _build_prompt() -> str:
        return (
            'Analyze this uploaded cake reference image and return ONLY valid compact JSON. '
            'Do not include markdown. '
            'Schema: '
            '{"description":"string",'
            '"cakeType":"string",'
            '"flavor":"string",'
            '"shape":"string",'
            '"designStyle":"string",'
            '"colors":["string"],'
            '"textOnCake":"string",'
            '"layerCount":null,'
            '"decorationElements":["string"],'
            '"confidence":0.0}.'
        )

    @staticmethod
    def _fallback(*, status: str, error_message: str = '', raw_response: str = '') -> dict[str, Any]:
        return {
            'status': status,
            'description': '',
            'cakeType': '',
            'flavor': '',
            'shape': '',
            'designStyle': '',
            'colors': [],
            'textOnCake': '',
            'layerCount': None,
            'decorationElements': [],
            'confidence': 0.0,
            'errorMessage': error_message,
            'rawResponse': raw_response,
        }

    def analyze_uploaded_image(self, *, content: bytes, mime_type: str) -> dict[str, Any]:
        if not self.settings.gemini_api_key:
            return self._fallback(
                status='not_configured',
                error_message='Gemini API key is not configured for image analysis.',
            )

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.settings.gemini_api_key)
            image_part = types.Part.from_bytes(data=content, mime_type=mime_type)
            response = client.models.generate_content(
                model=self.settings.gemini_model,
                contents=[
                    self._build_prompt(),
                    image_part,
                ],
            )

            raw_text = (getattr(response, 'text', '') or '').strip()
            parsed = self._extract_json(raw_text)
            if not parsed:
                return self._fallback(
                    status='failed',
                    error_message='AI response could not be parsed. Please retry analysis.',
                    raw_response=raw_text,
                )

            description = str(parsed.get('description') or '').strip()
            return {
                'status': 'ready' if description else 'failed',
                'description': description,
                'cakeType': str(parsed.get('cakeType') or '').strip(),
                'flavor': str(parsed.get('flavor') or '').strip(),
                'shape': str(parsed.get('shape') or '').strip(),
                'designStyle': str(parsed.get('designStyle') or '').strip(),
                'colors': self._to_string_list(parsed.get('colors')),
                'textOnCake': str(parsed.get('textOnCake') or '').strip(),
                'layerCount': self._safe_layer_count(parsed.get('layerCount')),
                'decorationElements': self._to_string_list(parsed.get('decorationElements')),
                'confidence': self._safe_float(parsed.get('confidence'), 0.0),
                'errorMessage': '' if description else 'AI did not return a clear description.',
                'rawResponse': raw_text,
            }
        except Exception as exc:  # noqa: BLE001
            return self._fallback(
                status='failed',
                error_message=f'AI analysis failed: {exc}',
            )


cake_image_ai_service = CakeImageAiService()
