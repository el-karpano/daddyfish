from fastapi import APIRouter, Depends, HTTPException, Header
from ..telegram_auth import validate_init_data, is_allowed_user


async def get_current_user(init_data: str = Header(..., alias="X-Telegram-Init-Data")) -> int:
    user_data = validate_init_data(init_data)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid Telegram data")
    user_id = user_data.get("id")
    if not user_id or not is_allowed_user(user_id):
        raise HTTPException(status_code=403, detail="Access denied")
    return user_id
