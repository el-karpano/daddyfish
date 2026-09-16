from fastapi import APIRouter, Depends, Query
from ..database import supabase
from ..telegram_auth import get_club_members
from . import get_club_member

router = APIRouter(prefix="/api", tags=["statistics"])


def _calc_stats(records_data: list, all_catches: list) -> dict:
    total_records = len(records_data)
    total_fish = sum(r["total_fish_count"] for r in records_data)
    total_weight = sum(r["total_weight"] for r in records_data if r["total_weight"])
    avg_fish = round(total_fish / total_records, 1) if total_records else 0

    sorted_catches = sorted(all_catches, key=lambda c: c.get("biggest_weight") or 0, reverse=True)
    top_trophies = [{"fish_name": c["fish_name"], "weight": c["biggest_weight"]} for c in sorted_catches[:3]]

    wb_map: dict[str, dict] = {}
    for r in records_data:
        wb = r["water_body_name"]
        if wb not in wb_map:
            wb_map[wb] = {"trips": 0, "fish": 0}
        wb_map[wb]["trips"] += 1
        wb_map[wb]["fish"] += r["total_fish_count"]

    most_productive = None
    if wb_map:
        best_wb = max(wb_map, key=lambda k: wb_map[k]["fish"])
        most_productive = {"name": best_wb, "trips": wb_map[best_wb]["trips"], "fish": wb_map[best_wb]["fish"]}

    fish_map: dict[str, int] = {}
    for c in all_catches:
        fish_map[c["fish_name"]] = fish_map.get(c["fish_name"], 0) + c["quantity"]

    most_caught = None
    if fish_map:
        best_fish = max(fish_map, key=fish_map.get)
        most_caught = {"name": best_fish, "count": fish_map[best_fish]}

    return {
        "total_fishing_records": total_records,
        "total_fish_caught": total_fish,
        "total_weight": round(total_weight, 1) if total_weight else None,
        "avg_fish_per_trip": avg_fish,
        "top_trophies": top_trophies,
        "most_productive_water_body": most_productive,
        "most_caught_fish": most_caught,
    }


@router.get("/statistics")
def get_statistics(user: dict = Depends(get_club_member)):
    """Get personal statistics for the current user."""
    records = supabase.table("fishing_records").select(
        "id,total_fish_count,total_weight,water_body_name"
    ).eq("user_id", user["id"]).execute()
    records_data = records.data or []

    record_ids = [r["id"] for r in records_data]
    all_catches = []
    if record_ids:
        catches_resp = supabase.table("catch_items").select("*").in_(
            "fishing_record_id", record_ids
        ).execute()
        all_catches = catches_resp.data or []

    return _calc_stats(records_data, all_catches)


@router.get("/statistics/club")
def get_club_statistics(user: dict = Depends(get_club_member)):
    """Get statistics for the entire club."""
    club = user["_club"]
    members = get_club_members(club["id"])
    member_ids = [m["id"] for m in members]

    records = supabase.table("fishing_records").select(
        "id,total_fish_count,total_weight,water_body_name"
    ).in_("user_id", member_ids).execute()
    records_data = records.data or []

    record_ids = [r["id"] for r in records_data]
    all_catches = []
    if record_ids:
        catches_resp = supabase.table("catch_items").select("*").in_(
            "fishing_record_id", record_ids
        ).execute()
        all_catches = catches_resp.data or []

    stats = _calc_stats(records_data, all_catches)
    stats["member_count"] = len(members)
    return stats