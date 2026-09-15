from fastapi import APIRouter, Depends
from ..database import supabase
from . import get_current_user

router = APIRouter(prefix="/api", tags=["map"])


@router.get("/map")
def get_map_data(user_id: int = Depends(get_current_user)):
    resp = supabase.table("fishing_records").select(
        "id,date,water_body_name,latitude,longitude,total_fish_count"
    ).eq("telegram_user_id", user_id).execute()

    markers = []
    for r in (resp.data or []):
        catches = supabase.table("catch_items").select("fish_name,quantity,biggest_weight").eq(
            "fishing_record_id", r["id"]
        ).execute()
        markers.append({
            "id": r["id"],
            "date": r["date"],
            "water_body_name": r["water_body_name"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "total_fish_count": r["total_fish_count"],
            "catch_items": catches.data or [],
        })

    return markers
