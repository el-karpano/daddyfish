from fastapi import APIRouter, Depends
from . import get_current_user

router = APIRouter(prefix="/api", tags=["me"])


@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    club = user.get("_club")
    return {
        "id": user["id"],
        "telegram_id": user["telegram_id"],
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "username": user.get("username", ""),
        "avatar_url": user.get("avatar_url"),
        "color": user.get("color", "#20D879"),
        "club": {
            "id": club["id"],
            "name": club.get("name", ""),
            "role": club.get("user_role", "member"),
            "member_count": club.get("_member_count"),
        } if club else None,
    }