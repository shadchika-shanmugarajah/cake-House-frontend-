# Cake House Chat API (FastAPI)

This service handles chatbot communication, custom-order AI orchestration, queue dispatch, and support handoff.

## Quick Start

```bash
cd chat-api-fastapi
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8001
```

Base URL: `http://localhost:8001/chat-api/v1`

## Endpoints

- `POST /chat/session/start`
- `POST /chat/message`
- `GET /products/search`
- `GET /products/categories`
- `POST /custom/upload-url`
- `POST /custom/submit`
- `GET /custom/{requestId}/status`
- `POST /custom/{requestId}/confirm`
- `POST /support/handoff`
- `GET /health`

## WebSocket

- `ws://localhost:8001/ws/notifications`
- Subscribe message example:

```json
{
  "type": "subscribe",
  "channels": ["user:<userId>", "admin:orders"]
}
```

## Notes

- If `GEMINI_API_KEY` is missing, chatbot gracefully falls back with safe text responses.
- Queue jobs are still accepted even if Redis is unavailable (local fallback job IDs are returned).
