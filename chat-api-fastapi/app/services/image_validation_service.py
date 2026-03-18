from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass
from typing import Any

from app.core.config import get_settings

ALLOWED_MIME_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
}

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}

CAKE_RELATED_TERMS = {
    'cake', 'birthday', 'wedding', 'cupcake', 'pastry', 'dessert', 'icing', 'fondant',
}

NON_CAKE_TERMS = {
    'car', 'bike', 'cat', 'dog', 'house', 'flower', 'landscape', 'person', 'selfie',
}


@dataclass
class ImageValidationResult:
    is_valid: bool
    user_message: str
    errors: list[str]
    warnings: list[str]
    metadata: dict[str, Any]


class ImageValidationService:
    def __init__(self) -> None:
        self.settings = get_settings()

    def validate_upload(
        self,
        *,
        file_name: str,
        mime_type: str,
        content: bytes,
    ) -> ImageValidationResult:
        errors: list[str] = []
        warnings: list[str] = []

        safe_name = (file_name or '').strip()
        lowered_name = safe_name.lower()
        detected_ext = self._extract_extension(lowered_name)

        if mime_type not in ALLOWED_MIME_TYPES:
            errors.append('Unsupported file type. Please upload JPG, PNG, or WEBP image.')

        if detected_ext and detected_ext not in ALLOWED_EXTENSIONS:
            errors.append('Unsupported file extension. Please use .jpg, .jpeg, .png, or .webp.')

        size_bytes = len(content)
        if size_bytes <= 0:
            errors.append('Uploaded file is empty.')

        if size_bytes > self.settings.custom_image_max_size_bytes:
            max_mb = self.settings.custom_image_max_size_bytes / (1024 * 1024)
            errors.append(f'File is too large. Maximum allowed size is {max_mb:.0f}MB.')

        if size_bytes < self.settings.custom_image_min_bytes:
            errors.append('Image quality is too low. Please upload a clearer, higher-quality image.')

        detected_format = self._detect_format(content)
        if not detected_format:
            errors.append('Invalid image file. Please upload a valid JPG, PNG, or WEBP image.')

        width = None
        height = None
        if detected_format:
            width, height = self._extract_dimensions(content, detected_format)
            if not width or not height:
                errors.append('Could not read image dimensions. Please upload another image.')

        if width and height:
            if width < self.settings.custom_image_min_width or height < self.settings.custom_image_min_height:
                errors.append(
                    'Image resolution is too low. Upload an image at least '
                    f"{self.settings.custom_image_min_width}x{self.settings.custom_image_min_height}."
                )

            if (width * height) < self.settings.custom_image_min_pixels:
                errors.append('Image quality is too low. Please upload a higher-resolution image.')

        cake_check = self._validate_cake_content(
            file_name=safe_name,
            mime_type=mime_type,
            content=content,
        )

        if not cake_check['is_cake']:
            errors.append('The uploaded image does not appear to be a cake. Please upload a cake reference image.')

        if cake_check.get('reason'):
            warnings.append(cake_check['reason'])

        checksum = hashlib.sha256(content).hexdigest()
        quality_score = self._quality_score(size_bytes=size_bytes, width=width, height=height)

        metadata = {
            'mimeType': mime_type,
            'sizeBytes': size_bytes,
            'width': width,
            'height': height,
            'checksum': checksum,
            'format': detected_format or '',
            'qualityScore': quality_score,
            'cakeCheck': {
                'isCake': bool(cake_check['is_cake']),
                'confidence': float(cake_check.get('confidence') or 0),
                'reason': cake_check.get('reason') or '',
                'checkedBy': cake_check.get('checked_by') or 'heuristic',
            },
        }

        is_valid = len(errors) == 0
        user_message = (
            'Image validated and uploaded successfully.'
            if is_valid
            else errors[0]
        )

        return ImageValidationResult(
            is_valid=is_valid,
            user_message=user_message,
            errors=errors,
            warnings=warnings,
            metadata=metadata,
        )

    @staticmethod
    def _extract_extension(file_name: str) -> str:
        if '.' not in file_name:
            return ''
        return f".{file_name.rsplit('.', 1)[1].lower()}"

    @staticmethod
    def _detect_format(content: bytes) -> str:
        if len(content) >= 8 and content[:8] == b'\x89PNG\r\n\x1a\n':
            return 'png'
        if len(content) >= 3 and content[:3] == b'\xff\xd8\xff':
            return 'jpeg'
        if len(content) >= 12 and content[:4] == b'RIFF' and content[8:12] == b'WEBP':
            return 'webp'
        return ''

    def _extract_dimensions(self, content: bytes, fmt: str) -> tuple[int | None, int | None]:
        if fmt == 'png':
            return self._png_dimensions(content)
        if fmt == 'jpeg':
            return self._jpeg_dimensions(content)
        if fmt == 'webp':
            return self._webp_dimensions(content)
        return None, None

    @staticmethod
    def _png_dimensions(content: bytes) -> tuple[int | None, int | None]:
        if len(content) < 24:
            return None, None
        width = int.from_bytes(content[16:20], 'big')
        height = int.from_bytes(content[20:24], 'big')
        return width, height

    @staticmethod
    def _jpeg_dimensions(content: bytes) -> tuple[int | None, int | None]:
        try:
            offset = 2
            content_len = len(content)
            while offset < content_len - 1:
                if content[offset] != 0xFF:
                    offset += 1
                    continue

                marker = content[offset + 1]
                offset += 2

                if marker in {0xD8, 0xD9}:
                    continue

                if offset + 1 >= content_len:
                    return None, None

                segment_length = int.from_bytes(content[offset:offset + 2], 'big')
                if segment_length < 2 or offset + segment_length > content_len:
                    return None, None

                if marker in {
                    0xC0, 0xC1, 0xC2, 0xC3,
                    0xC5, 0xC6, 0xC7,
                    0xC9, 0xCA, 0xCB,
                    0xCD, 0xCE, 0xCF,
                }:
                    if offset + 7 >= content_len:
                        return None, None
                    height = int.from_bytes(content[offset + 3:offset + 5], 'big')
                    width = int.from_bytes(content[offset + 5:offset + 7], 'big')
                    return width, height

                offset += segment_length
        except Exception:  # noqa: BLE001
            return None, None

        return None, None

    @staticmethod
    def _webp_dimensions(content: bytes) -> tuple[int | None, int | None]:
        if len(content) < 30:
            return None, None

        chunk_header = content[12:16]

        try:
            if chunk_header == b'VP8X' and len(content) >= 30:
                width = 1 + int.from_bytes(content[24:27], 'little')
                height = 1 + int.from_bytes(content[27:30], 'little')
                return width, height

            if chunk_header == b'VP8L' and len(content) >= 25:
                b0, b1, b2, b3 = content[21], content[22], content[23], content[24]
                width = ((b1 & 0x3F) << 8 | b0) + 1
                height = ((b3 & 0x0F) << 10 | b2 << 2 | (b1 & 0xC0) >> 6) + 1
                return width, height

            if chunk_header == b'VP8 ' and len(content) >= 30:
                start = 20
                if content[start + 3:start + 6] == b'\x9d\x01\x2a':
                    width = int.from_bytes(content[start + 6:start + 8], 'little') & 0x3FFF
                    height = int.from_bytes(content[start + 8:start + 10], 'little') & 0x3FFF
                    return width, height
        except Exception:  # noqa: BLE001
            return None, None

        return None, None

    def _validate_cake_content(self, *, file_name: str, mime_type: str, content: bytes) -> dict[str, Any]:
        if self.settings.gemini_api_key:
            gemini_result = self._check_with_gemini(mime_type=mime_type, content=content)
            if gemini_result is not None:
                return gemini_result

        normalized_name = file_name.lower()
        token_list = re.findall(r'[a-z]+', normalized_name)
        token_set = set(token_list)

        if token_set & NON_CAKE_TERMS:
            return {
                'is_cake': False,
                'confidence': 0.72,
                'reason': 'Filename suggests this may not be a cake image.',
                'checked_by': 'heuristic',
            }

        if token_set & CAKE_RELATED_TERMS:
            return {
                'is_cake': True,
                'confidence': 0.62,
                'reason': 'Cake-related keywords were detected in filename.',
                'checked_by': 'heuristic',
            }

        return {
            'is_cake': True,
            'confidence': 0.5,
            'reason': 'Cake content check fallback applied. Configure GEMINI_API_KEY for stronger validation.',
            'checked_by': 'heuristic',
        }

    def _check_with_gemini(self, *, mime_type: str, content: bytes) -> dict[str, Any] | None:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=self.settings.gemini_api_key)
            prompt = (
                'Classify the uploaded image for custom cake ordering. '
                'Respond ONLY with compact JSON: '
                '{"is_cake": true|false, "confidence": 0.0-1.0, "reason": "short reason"}.'
            )

            image_part = types.Part.from_bytes(data=content, mime_type=mime_type)
            response = client.models.generate_content(
                model=self.settings.gemini_model,
                contents=[prompt, image_part],
            )

            raw_text = (getattr(response, 'text', '') or '').strip()
            if not raw_text:
                return None

            json_text = raw_text
            if '```' in raw_text:
                chunks = re.findall(r'```(?:json)?\s*(\{.*?\})\s*```', raw_text, flags=re.S)
                if chunks:
                    json_text = chunks[0]

            data = json.loads(json_text)
            is_cake = bool(data.get('is_cake'))
            confidence = float(data.get('confidence') or 0)
            reason = str(data.get('reason') or '').strip()

            return {
                'is_cake': is_cake,
                'confidence': confidence,
                'reason': reason,
                'checked_by': 'gemini',
            }
        except Exception:  # noqa: BLE001
            return None

    @staticmethod
    def _quality_score(*, size_bytes: int, width: int | None, height: int | None) -> int:
        score = 35
        if size_bytes >= 60 * 1024:
            score += 20
        elif size_bytes >= 30 * 1024:
            score += 10

        if width and height:
            pixels = width * height
            if pixels >= 2_000_000:
                score += 30
            elif pixels >= 900_000:
                score += 20
            elif pixels >= 300_000:
                score += 10

        return max(1, min(score, 100))


image_validation_service = ImageValidationService()
