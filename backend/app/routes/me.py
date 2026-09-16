from fastapi import APIRouter, Depends
from ..database import supabase
from . import get_current_user

router = APIRouter(prefix="/api", tags=["me"])


@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    club = user.get("_club")
    # Get member count if club exists
    member_count = None
    if club:
        resp = supabase.table("club_members").select("id", count="exact").eq(
            "club_id", club["id"]
        ).execute()
        member_count = resp.count or 0

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
            "member_count": member_count,
        } if club else None,
    }


@router.get("/debug")
def debug(user: dict = Depends(get_current_user)):
    """Temporary debug endpoint to check user state."""
    club = user.get("_club")
    members_resp = supabase.table("club_members").select("*").execute()
    clubs_resp = supabase.table("clubs").select("*").execute()
    users_resp = supabase.table("users").select("*").execute()
    return {
        "user": {
            "id": user.get("id"),
            "telegram_id": user.get("telegram_id"),
            "first_name": user.get("first_name"),
        },
        "club": club,
        "all_users": users_resp.data or [],
        "all_clubs": clubs_resp.data or [],
        "all_members": members_resp.data or [],
    }