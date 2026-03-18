from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor

from app.core.config import get_settings
from app.services.prompt_builder import build_general_prompt

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._executor = ThreadPoolExecutor(max_workers=2)

    async def generate_reply(self, user_message: str) -> str:
        if not self.settings.gemini_api_key:
            return 'I can help with cakes, custom orders, tracking, and support. What would you like next?'

        try:
            return await self._call_gemini(user_message)
        except Exception as exc:  # noqa: BLE001
            logger.exception('Gemini request failed: %s', exc)
            return 'I am having a temporary AI issue. You can continue with menu browsing or connect to human support.'

    async def _call_gemini(self, user_message: str) -> str:
        prompt = build_general_prompt(user_message)

        def _run() -> str:
            from google import genai

            client = genai.Client(api_key=self.settings.gemini_api_key)
            response = client.models.generate_content(
                model=self.settings.gemini_model,
                contents=[prompt],
            )
            text = getattr(response, 'text', None)
            return (text or '').strip() or 'How can I assist with your cake order today?'

        from asyncio import get_running_loop

        loop = get_running_loop()
        return await loop.run_in_executor(self._executor, _run)


gemini_service = GeminiService()
