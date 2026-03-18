from __future__ import annotations

import re


ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}


def validate_image_url(image_url: str) -> tuple[bool, str | None]:
    if not image_url:
        return False, 'Image URL is missing'

    lowered = image_url.lower()
    if not any(lowered.endswith(ext) or f"{ext}?" in lowered for ext in ALLOWED_EXTENSIONS):
        return False, 'Unsupported image format. Allowed: jpg, jpeg, png, webp.'

    if not re.match(r'^https?://', image_url):
        return False, 'Image URL must be HTTP/HTTPS.'

    return True, None
