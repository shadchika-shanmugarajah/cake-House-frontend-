from fastapi import APIRouter

from app.core.security import CurrentUserId
from app.schemas.support import HandoffRequest, HandoffResponse
from app.services.support_service import support_service

router = APIRouter()


@router.post('/handoff', response_model=HandoffResponse)
async def handoff(payload: HandoffRequest, user_id: str = CurrentUserId) -> HandoffResponse:
    return await support_service.create_handoff(user_id, payload)
