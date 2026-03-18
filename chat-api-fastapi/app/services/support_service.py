from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from fastapi import HTTPException, status

from app.db.mongo import get_database
from app.schemas.support import HandoffRequest, HandoffResponse


class SupportService:
    async def create_handoff(self, user_id: str, payload: HandoffRequest) -> HandoffResponse:
        db = get_database()
        session = await db.chat_sessions.find_one({'sessionId': payload.session_id, 'userId': user_id})
        if not session:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Session not found')

        ticket_id = f"SUP-{uuid4().hex[:10].upper()}"
        now = datetime.utcnow()

        await db.support_tickets.insert_one(
            {
                'ticketId': ticket_id,
                'userId': user_id,
                'sessionId': payload.session_id,
                'reason': payload.reason,
                'status': 'open',
                'priority': 'medium',
                'assignedTo': None,
                'messages': [],
                'createdAt': now,
                'updatedAt': now,
            }
        )

        await db.chat_sessions.update_one(
            {'sessionId': payload.session_id, 'userId': user_id},
            {
                '$set': {
                    'status': 'handed_off',
                    'handedOffToSupport': True,
                    'updatedAt': datetime.utcnow(),
                }
            },
        )

        return HandoffResponse(
            ticket_id=ticket_id,
            status='open',
            message='A support agent will contact you shortly.',
        )


support_service = SupportService()
