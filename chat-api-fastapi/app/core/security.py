from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt

from app.core.config import get_settings


async def get_current_user_id(
    authorization: str | None = Header(default=None),
    x_user_id: str | None = Header(default=None),
) -> str:
    if x_user_id:
        return x_user_id

    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Unauthorized')

    token = authorization.split(' ', 1)[1].strip()
    settings = get_settings()

    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = str(
            payload.get('id')
            or payload.get('userId')
            or payload.get('sub')
            or payload.get('_id')
            or ''
        ).strip()

        # Compatibility fallback for tokens that only carry email/username.
        if not user_id:
            email = str(payload.get('email') or payload.get('username') or '').strip().lower()
            if email:
                user_id = f'user-{email}'
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token') from exc

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token payload')

    return user_id


CurrentUserId = Depends(get_current_user_id)
