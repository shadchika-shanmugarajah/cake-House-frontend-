from contextlib import asynccontextmanager
import json
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.logging import setup_logging
from app.db.mongo import close_mongo, connect_mongo
from app.websocket.manager import ws_manager


@asynccontextmanager
async def lifespan(_: FastAPI):
    setup_logging()
    await connect_mongo()
    try:
        yield
    finally:
        await close_mongo()


settings = get_settings()
app = FastAPI(title=settings.app_name, debug=settings.app_debug, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
    allow_credentials=True,
)

app.include_router(api_router, prefix=settings.api_prefix)

upload_root = Path(settings.cloud_upload_local_dir)
upload_root.mkdir(parents=True, exist_ok=True)
app.mount('/chat-api/uploads', StaticFiles(directory=str(upload_root)), name='chat_uploads')


@app.websocket('/ws/notifications')
async def notifications_socket(websocket: WebSocket) -> None:
    await ws_manager.connect(websocket)
    try:
        while True:
            payload = await websocket.receive_text()
            message = json.loads(payload)
            if message.get('type') == 'subscribe':
                channels = message.get('channels') or []
                if isinstance(channels, list):
                    ws_manager.subscribe(websocket, [str(c) for c in channels])
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
