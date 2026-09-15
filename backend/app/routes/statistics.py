from fastapi import APIRouter, Depends
from ..database import supabase
from . import get_current_user

router = APIRouter(prefix="/api", tags=["statistics"])


@router.get("/statistics")
def get_statistics(user_id: int = Depends(get_current_user)):
    records = supabase.table("fishing_records").select("id,total_fish_count,total_weight,water_body_name").eq(
        "telegram_user_id", user_id
    ).execute()
    records_data = records.data or []

    total_records = len(records_data)
    total_fish = sum(r["total_fish_count"] for r in records_data)
    total_weight = sum(r["total_weight"] for r in records_data if r["total_weight"])
    avg_fish = round(total_fish / total_records, 1) if total_records else 0

    # All catch items for this user
    record_ids = [r["id"] for r in records_data]
    all_catches = []
    if record_ids:
        catches_resp = supabase.table("catch_items").select("*").in_(
            "fishing_record_id", record_ids
        ).execute()
        all_catches = catches_resp.data or []

    # Top 3 trophies
    sorted_catches = sorted(all_catches, key=lambda c: c.get("biggest_weight") or 0, reverse=True)
    top_trophies = []
    for c in sorted_catches[:3]:
        top_trophies.append({
            "fish_name": c["fish_name"],
            "weight": c["biggest_weight"],
        })

    # Most productive water body
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
        most_productive = {
            "name": best_wb,
            "trips": wb_map[best_wb]["trips"],
            "fish": wb_map[best_wb]["fish"],
        }

    # Most caught fish
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
        "total_weight": total_weight or None,
        "avg_fish_per_trip": avg_fish,
        "top_trophies": top_trophies,
        "most_productive_water_body": most_productive,
        "most_caught_fish": most_caught,
    }
