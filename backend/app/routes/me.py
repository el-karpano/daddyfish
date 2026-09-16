from fastapi import APIRouter, Depends
from ..database import supabase
from . import get_current_user

router = APIRouter(prefix="/api", tags=["me"])


@router.get("/me")
def get_me(user: dict = Depends(get_current_user)):
    club = user.get("_club")
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


@router.get("/setup/{telegram_id}")
def setup_club(telegram_id: int):
    """One-time setup: create user, club, and migrate existing data. No auth required."""
    from ..telegram_auth import MEMBER_COLORS

    # 1. Create or find user
    existing = supabase.table("users").select("*").eq("telegram_id", telegram_id).execute()
    if existing.data:
        user = existing.data[0]
    else:
        user_resp = supabase.table("users").insert({
            "telegram_id": telegram_id,
            "first_name": "Папа",
            "color": MEMBER_COLORS[0],
        }).execute()
        user = user_resp.data[0]

    # 2. Create or find club
    existing_club = supabase.table("clubs").select("*").eq("owner_user_id", user["id"]).execute()
    if existing_club.data:
        club = existing_club.data[0]
    else:
        club_resp = supabase.table("clubs").insert({
            "name": "Наш рыбацкий клуб",
            "owner_user_id": user["id"],
        }).execute()
        club = club_resp.data[0]

    # 3. Add to club_members as owner
    existing_member = supabase.table("club_members").select("*").eq(
        "club_id", club["id"]
    ).eq("user_id", user["id"]).execute()
    if not existing_member.data:
        supabase.table("club_members").insert({
            "club_id": club["id"],
            "user_id": user["id"],
            "role": "owner",
        }).execute()

    # 4. Migrate old records
    supabase.table("fishing_records").update({
        "user_id": user["id"]
    }).is_("user_id", "null").execute()

    # 5. Migrate old achievements
    supabase.table("user_achievements").update({
        "user_id": user["id"]
    }).is_("user_id", "null").execute()

    return {
        "status": "ok",
        "user_id": user["id"],
        "telegram_id": telegram_id,
        "club_id": club["id"],
        "role": "owner",
    }