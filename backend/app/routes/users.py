from fastapi import APIRouter, Depends, HTTPException
from ..database import supabase
from ..telegram_auth import get_club_members
from . import get_club_member

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("/{target_user_id}")
def get_user_profile(target_user_id: int, user: dict = Depends(get_club_member)):
    club = user["_club"]
    members = get_club_members(club["id"])
    member_map = {m["id"]: m for m in members}

    if target_user_id not in member_map:
        raise HTTPException(status_code=404, detail="User not found in club")

    target = member_map[target_user_id]

    # Get stats
    records = supabase.table("fishing_records").select(
        "id,total_fish_count,total_weight,water_body_name"
    ).eq("user_id", target_user_id).execute()
    records_data = records.data or []

    total_fish = sum(r["total_fish_count"] for r in records_data)
    total_weight = sum(r["total_weight"] for r in records_data if r["total_weight"])
    places = len(set(r["water_body_name"] for r in records_data))

    # Best trophy
    record_ids = [r["id"] for r in records_data]
    best_trophy = None
    if record_ids:
        catches = supabase.table("catch_items").select("fish_name,biggest_weight").in_(
            "fishing_record_id", record_ids
        ).execute()
        all_catches = catches.data or []
        if all_catches:
            best = max(all_catches, key=lambda c: c.get("biggest_weight") or 0)
            if best.get("biggest_weight"):
                best_trophy = {"fish_name": best["fish_name"], "weight": best["biggest_weight"]}

    return {
        "id": target["id"],
        "first_name": target["first_name"],
        "last_name": target.get("last_name", ""),
        "username": target.get("username", ""),
        "avatar_url": target.get("avatar_url"),
        "color": target.get("color", "#20D879"),
        "role": target.get("role", "member"),
        "stats": {
            "total_fishing_records": len(records_data),
            "total_fish_caught": total_fish,
            "total_weight": round(total_weight, 1) if total_weight else None,
            "places": places,
        },
        "best_trophy": best_trophy,
    }