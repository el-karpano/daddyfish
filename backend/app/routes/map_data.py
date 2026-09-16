from fastapi import APIRouter, Depends
from ..database import supabase
from ..telegram_auth import get_club_members
from . import get_club_member

router = APIRouter(prefix="/api", tags=["map"])


@router.get("/map")
def get_map_data(user: dict = Depends(get_club_member)):
    club = user["_club"]
    members = get_club_members(club["id"])
    member_ids = [m["id"] for m in members]
    members_map = {m["id"]: m for m in members}

    resp = supabase.table("fishing_records").select(
        "id,date,water_body_name,latitude,longitude,total_fish_count,user_id"
    ).in_("user_id", member_ids).execute()

    # Group by approximate location (same water body + close coordinates)
    places: dict[str, dict] = {}
    for r in (resp.data or []):
        # Use water_body_name as grouping key
        key = r["water_body_name"].strip().lower()
        if key not in places:
            places[key] = {
                "water_body_name": r["water_body_name"],
                "latitude": r["latitude"],
                "longitude": r["longitude"],
                "records": [],
                "user_ids": set(),
            }
        places[key]["records"].append(r)
        places[key]["user_ids"].add(r["user_id"])

    markers = []
    for place in places.values():
        record_ids = [r["id"] for r in place["records"]]
        catches = supabase.table("catch_items").select(
            "fish_name,quantity,biggest_weight"
        ).in_("fishing_record_id", record_ids).execute()

        # Per-user breakdown
        user_breakdown = []
        for uid in place["user_ids"]:
            m = members_map.get(uid, {})
            user_records = [r for r in place["records"] if r["user_id"] == uid]
            user_breakdown.append({
                "id": m.get("id"),
                "first_name": m.get("first_name", ""),
                "color": m.get("color", "#20D879"),
                "role": m.get("role", "member"),
                "count": len(user_records),
            })

        total_fish = sum(r["total_fish_count"] for r in place["records"])
        all_catches = catches.data or []
        top_catch = max(all_catches, key=lambda c: c.get("biggest_weight") or 0, default=None)

        markers.append({
            "water_body_name": place["water_body_name"],
            "latitude": place["latitude"],
            "longitude": place["longitude"],
            "total_records": len(place["records"]),
            "total_fish_count": total_fish,
            "user_count": len(place["user_ids"]),
            "users": user_breakdown,
            "catch_items": all_catches[:10],
            "top_catch": {
                "fish_name": top_catch["fish_name"],
                "weight": top_catch.get("biggest_weight"),
            } if top_catch else None,
            "record_ids": record_ids,
        })

    return markers