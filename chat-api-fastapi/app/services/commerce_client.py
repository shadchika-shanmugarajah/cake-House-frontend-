from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class CommerceClient:
    def __init__(self) -> None:
        self.settings = get_settings()

    @staticmethod
    def _auth_headers(token: str | None = None) -> dict[str, str]:
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        return headers

    async def search_products(self, query: str, limit: int = 6) -> list[dict[str, Any]]:
        params = {'search': query, 'limit': str(limit)}
        url = f"{self.settings.commerce_api_base_url}/products"

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                payload = response.json()
        except Exception as exc:  # noqa: BLE001
            logger.warning('Product search failed: %s', exc)
            return []

        if isinstance(payload, list):
            return payload
        if isinstance(payload, dict):
            items = payload.get('items') or payload.get('data') or payload.get('products') or []
            return items if isinstance(items, list) else []
        return []

    async def check_delivery_feasibility(
        self,
        address_id: str,
        delivery_date: str,
        delivery_slot: str,
        token: str | None = None,
    ) -> tuple[bool, str | None]:
        url = f"{self.settings.commerce_api_base_url}/delivery/feasibility"
        headers = self._auth_headers(token)

        body = {
            'addressId': address_id,
            'deliveryDate': delivery_date,
            'deliverySlot': delivery_slot,
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(url, json=body, headers=headers)
                if response.status_code == 404:
                    # If endpoint is not implemented on commerce API yet, allow flow for now.
                    return True, None
                response.raise_for_status()
                payload = response.json()
        except Exception as exc:  # noqa: BLE001
            logger.warning('Delivery feasibility check failed, allowing fallback: %s', exc)
            return True, None

        feasible = bool(payload.get('feasible', True))
        reason = payload.get('reason')
        return feasible, reason

    async def preview_chatbot_order(self, payload: dict[str, Any], token: str) -> dict[str, Any]:
        url = f"{self.settings.commerce_api_base_url}/orders/chatbot/preview"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=payload, headers=self._auth_headers(token))
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.json() if exc.response is not None else {}
            raise ValueError(detail.get('error') or detail.get('message') or 'Unable to preview order') from exc
        except Exception as exc:  # noqa: BLE001
            logger.warning('Chatbot order preview failed: %s', exc)
            raise ValueError('Unable to preview order right now. Please try again.') from exc

    async def place_chatbot_order(self, payload: dict[str, Any], token: str) -> dict[str, Any]:
        url = f"{self.settings.commerce_api_base_url}/orders/chatbot/place"
        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(url, json=payload, headers=self._auth_headers(token))
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.json() if exc.response is not None else {}
            raise ValueError(detail.get('error') or detail.get('message') or 'Unable to place order') from exc
        except Exception as exc:  # noqa: BLE001
            logger.warning('Chatbot order placement failed: %s', exc)
            raise ValueError('Unable to place order right now. Please try again.') from exc

    async def list_orders(self, token: str, *, page: int = 1, limit: int = 50) -> list[dict[str, Any]]:
        url = f"{self.settings.commerce_api_base_url}/orders"
        params = {'page': str(page), 'limit': str(limit)}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params, headers=self._auth_headers(token))
                response.raise_for_status()
                payload = response.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.json() if exc.response is not None else {}
            raise ValueError(detail.get('error') or detail.get('message') or 'Unable to fetch orders') from exc
        except Exception as exc:  # noqa: BLE001
            logger.warning('List orders failed: %s', exc)
            raise ValueError('Unable to fetch your orders right now.') from exc

        orders = payload.get('orders') if isinstance(payload, dict) else []
        return orders if isinstance(orders, list) else []

    async def get_order_tracking(self, token: str, order_id: str) -> dict[str, Any]:
        url = f"{self.settings.commerce_api_base_url}/orders/{order_id}/tracking"
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, headers=self._auth_headers(token))
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.json() if exc.response is not None else {}
            raise ValueError(detail.get('error') or detail.get('message') or 'Unable to fetch tracking status') from exc
        except Exception as exc:  # noqa: BLE001
            logger.warning('Order tracking fetch failed: %s', exc)
            raise ValueError('Unable to fetch order tracking right now.') from exc

    async def emit_notification(self, payload: dict[str, Any]) -> bool:
        url = f"{self.settings.commerce_api_base_url}/notifications/internal"
        internal_key = self.settings.notification_internal_key or self.settings.jwt_secret
        headers = {
            'Content-Type': 'application/json',
            'x-internal-notification-key': internal_key,
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                return True
        except Exception as exc:  # noqa: BLE001
            logger.warning('Emit notification failed: %s', exc)
            return False


commerce_client = CommerceClient()
