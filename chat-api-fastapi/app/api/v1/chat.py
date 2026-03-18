from fastapi import APIRouter, Header, HTTPException, status

from app.core.security import CurrentUserId
from app.schemas.chat import ChatMessageRequest, ChatMessageResponse, StartSessionRequest, StartSessionResponse
from app.services.chat_service import chat_service

router = APIRouter()


@router.post('/session/start', response_model=StartSessionResponse)
async def start_session(payload: StartSessionRequest, user_id: str = CurrentUserId) -> StartSessionResponse:
    return await chat_service.start_session(user_id, payload)


@router.post('/message', response_model=ChatMessageResponse)
async def send_message(
    payload: ChatMessageRequest,
    user_id: str = CurrentUserId,
    authorization: str | None = Header(default=None, alias='Authorization'),
) -> ChatMessageResponse:
    try:
        return await chat_service.handle_message(
            user_id,
            payload.session_id,
            payload.message,
            authorization_header=authorization,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
