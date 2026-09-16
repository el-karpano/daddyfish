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


@router.get("/setup-owner/{telegram_id}")
def setup_owner(telegram_id: int):
    """Transfer club ownership to a new Telegram user."""
    from ..telegram_auth import MEMBER_COLORS

    # Find existing club
    clubs = supabase.table("clubs").select("*").execute()
    if not clubs.data:
        return {"error": "No club found. Run /api/setup first."}

    club = clubs.data[0]

    # Create or find the new owner user
    existing = supabase.table("users").select("*").eq("telegram_id", telegram_id).execute()
    if existing.data:
        new_owner = existing.data[0]
    else:
        user_resp = supabase.table("users").insert({
            "telegram_id": telegram_id,
            "first_name": "Папа",
            "color": MEMBER_COLORS[0],
        }).execute()
        new_owner = user_resp.data[0]

    # Update club owner
    supabase.table("clubs").update({
        "owner_user_id": new_owner["id"]
    }).eq("id", club["id"]).execute()

    # Add new owner to club_members (or update role)
    existing_member = supabase.table("club_members").select("*").eq(
        "club_id", club["id"]
    ).eq("user_id", new_owner["id"]).execute()
    if existing_member.data:
        supabase.table("club_members").update({
            "role": "owner"
        }).eq("id", existing_member.data[0]["id"]).execute()
    else:
        supabase.table("club_members").insert({
            "club_id": club["id"],
            "user_id": new_owner["id"],
            "role": "owner",
        }).execute()

    # Demote all other members to "member"
    supabase.table("club_members").update({
        "role": "member"
    }).eq("club_id", club["id"]).neq("user_id", new_owner["id"]).execute()

    # Migrate any orphan records to new owner
    supabase.table("fishing_records").update({
        "user_id": new_owner["id"]
    }).is_("user_id", "null").execute()

    supabase.table("user_achievements").update({
        "user_id": new_owner["id"]
    }).is_("user_id", "null").execute()

    return {
        "status": "ok",
        "new_owner_user_id": new_owner["id"],
        "telegram_id": telegram_id,
        "club_id": club["id"],
    }