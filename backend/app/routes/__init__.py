from fastapi import APIRouter, Depends, HTTPException, Header
from ..telegram_auth import validate_init_data, get_or_create_user, get_user_club


async def get_current_user(init_data: str = Header(..., alias="X-Telegram-Init-Data")) -> dict:
    """Validate Telegram data, find/create user, return user dict with club info."""
    telegram_data = validate_init_data(init_data)
    if not telegram_data:
        raise HTTPException(status_code=401, detail="Invalid Telegram data")

    user = get_or_create_user(telegram_data)
    if not user:
        raise HTTPException(status_code=401, detail="Could not identify user")

    # Attach club info
    club = get_user_club(user["id"])
    user["_club"] = club
    user["_telegram_data"] = telegram_data
    return user


async def get_club_member(user: dict = Depends(get_current_user)) -> dict:
    """Require user to be a member of a club."""
    if not user.get("_club"):
        raise HTTPException(status_code=403, detail="Not a member of any club")
    return user