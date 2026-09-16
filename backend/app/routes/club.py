from fastapi import APIRouter, Depends, HTTPException, Query
from ..database import supabase
from ..telegram_auth import get_club_members, create_or_reactivate_invite
from . import get_club_member

router = APIRouter(prefix="/api/club", tags=["club"])


@router.get("")
def get_club(user: dict = Depends(get_club_member)):
    club = user["_club"]
    members = get_club_members(club["id"])
    return {
        "id": club["id"],
        "name": club.get("name", "Наш рыбацкий клуб"),
        "role": club.get("user_role", "member"),
        "members": members,
        "member_count": len(members),
    }


@router.get("/members")
def list_members(user: dict = Depends(get_club_member)):
    club = user["_club"]
    members = get_club_members(club["id"])

    # Attach record count for each member
    for m in members:
        resp = supabase.table("fishing_records").select("id", count="exact").eq(
            "user_id", m["id"]
        ).execute()
        m["record_count"] = resp.count or 0

    return members


@router.post("/invite")
def create_invite(user: dict = Depends(get_club_member)):
    club = user["_club"]
    if club.get("user_role") != "owner":
        raise HTTPException(status_code=403, detail="Only owner can create invites")

    token = create_or_reactivate_invite(club["id"], user["id"])
    from ..config import BOT_USERNAME
    link = f"https://t.me/{BOT_USERNAME}?start=invite_{token}" if BOT_USERNAME else f"invite_{token}"
    return {"token": token, "link": link}


@router.delete("/members/{member_id}")
def remove_member(member_id: int, user: dict = Depends(get_club_member)):
    club = user["_club"]
    if club.get("user_role") != "owner":
        raise HTTPException(status_code=403, detail="Only owner can remove members")

    if member_id == user["id"]:
        raise HTTPException(status_code=400, detail="Cannot remove yourself")

    # Verify target is in the same club
    membership = supabase.table("club_members").select("*").eq(
        "club_id", club["id"]
    ).eq("user_id", member_id).execute()
    if not membership.data:
        raise HTTPException(status_code=404, detail="Member not found in club")

    # Delete all member's data
    records = supabase.table("fishing_records").select("id").eq(
        "user_id", member_id
    ).execute()
    record_ids = [r["id"] for r in (records.data or [])]

    if record_ids:
        # Delete photos from storage
        photos = supabase.table("fishing_photos").select("storage_path").in_(
            "fishing_record_id", record_ids
        ).execute()
        for photo in (photos.data or []):
            try:
                supabase.storage.from_("fishing-photos").remove([photo["storage_path"]])
            except Exception:
                pass

        # Delete related data
        supabase.table("fishing_photos").delete().in_("fishing_record_id", record_ids).execute()
        supabase.table("catch_items").delete().in_("fishing_record_id", record_ids).execute()
        supabase.table("fishing_records").delete().in_("id", record_ids).execute()

    # Delete achievements
    supabase.table("user_achievements").delete().eq("user_id", member_id).execute()

    # Remove from club
    supabase.table("club_members").delete().eq("club_id", club["id"]).eq("user_id", member_id).execute()

    return {"ok": True}