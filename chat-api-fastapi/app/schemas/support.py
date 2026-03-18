from pydantic import BaseModel


class HandoffRequest(BaseModel):
    session_id: str
    reason: str = 'User requested support'


class HandoffResponse(BaseModel):
    ticket_id: str
    status: str
    message: str
