from __future__ import annotations

import json
from collections import defaultdict

from fastapi import WebSocket


class WebSocketManager:
    def __init__(self) -> None:
        self.connections_by_channel: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()

    def subscribe(self, websocket: WebSocket, channels: list[str]) -> None:
        for channel in channels:
            self.connections_by_channel[channel].add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        for sockets in self.connections_by_channel.values():
            sockets.discard(websocket)

    async def broadcast(self, channel: str, event: str, data: dict) -> None:
        payload = json.dumps({'event': event, 'data': data}, default=str)
        stale: list[WebSocket] = []
        for websocket in self.connections_by_channel.get(channel, set()):
            try:
                await websocket.send_text(payload)
            except Exception:  # noqa: BLE001
                stale.append(websocket)

        for websocket in stale:
            self.disconnect(websocket)


ws_manager = WebSocketManager()
