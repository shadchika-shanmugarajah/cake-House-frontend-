from __future__ import annotations

import uuid
from datetime import datetime
from pathlib import Path
import re

from app.core.config import get_settings


class StorageService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._local_root = Path(self.settings.cloud_upload_local_dir)
        self._local_custom_dir = self._local_root / 'custom'
        self._local_custom_dir.mkdir(parents=True, exist_ok=True)

    def create_upload_url(self, file_name: str) -> tuple[str, str, int]:
        token = uuid.uuid4().hex
        safe_name = self._safe_file_name(file_name)
        file_url = self._build_public_url(f'{token}-{safe_name}')
        upload_url = f"{file_url}?signature=fake-signature&expires=900"
        return upload_url, file_url, 900

    def store_custom_image(self, *, file_name: str, mime_type: str, content: bytes) -> dict:
        extension = self._extension_from_mime(mime_type, file_name)
        token = uuid.uuid4().hex
        safe_name = self._safe_file_name(file_name)
        name_without_ext = safe_name.rsplit('.', 1)[0] if '.' in safe_name else safe_name
        timestamp = datetime.utcnow().strftime('%Y%m%d%H%M%S')
        stored_name = f'{timestamp}-{token[:10]}-{name_without_ext}{extension}'

        target_path = self._local_custom_dir / stored_name
        target_path.write_bytes(content)

        file_url = self._build_public_url(stored_name)

        return {
            'file_url': file_url,
            'storage_key': f'custom/{stored_name}',
            'stored_name': stored_name,
            'mime_type': mime_type,
        }

    @staticmethod
    def _safe_file_name(file_name: str) -> str:
        name = (file_name or 'image').strip().lower().replace(' ', '-')
        name = re.sub(r'[^a-z0-9._-]+', '-', name)
        name = re.sub(r'-{2,}', '-', name).strip('-.')
        return name or 'image'

    @staticmethod
    def _extension_from_mime(mime_type: str, file_name: str) -> str:
        mime_map = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
        }

        if mime_type in mime_map:
            return mime_map[mime_type]

        lowered = (file_name or '').lower()
        if lowered.endswith('.png'):
            return '.png'
        if lowered.endswith('.webp'):
            return '.webp'
        return '.jpg'

    def _build_public_url(self, file_name: str) -> str:
        public_base = self.settings.cloud_public_base_url.rstrip('/')
        if public_base.endswith('/uploads'):
            return f'{public_base}/custom/{file_name}'
        if public_base.endswith('/uploads/custom'):
            return f'{public_base}/{file_name}'
        return f'{public_base}/uploads/custom/{file_name}'


storage_service = StorageService()
