from fastapi import APIRouter, HTTPException, Depends
from ..database import supabase
from ..models import FishingRecordCreate, FishingRecordUpdate
from . import get_current_user

router = APIRouter(prefix="/api/fishing-records", tags=["fishing-records"])


def _enrich_record(record: dict, user_id: int) -> dict:
    """Add catch_items and photos to a record."""
    catches = supabase.table("catch_items").select("*").eq(
        "fishing_record_id", record["id"]
    ).execute()
    photos = supabase.table("fishing_photos").select("*").eq(
        "fishing_record_id", record["id"]
    ).execute()
    record["catch_items"] = catches.data or []
    record["photos"] = photos.data or []
    return record


@router.get("")
def list_records(user_id: int = Depends(get_current_user)):
    resp = supabase.table("fishing_records").select("*").eq(
        "telegram_user_id", user_id
    ).order("date", desc=True).order("created_at", desc=True).execute()
    records = resp.data or []
    for r in records:
        catches = supabase.table("catch_items").select("*").eq(
            "fishing_record_id", r["id"]
        ).execute()
        photos = supabase.table("fishing_photos").select("id,fishing_record_id,photo_url,created_at").eq(
            "fishing_record_id", r["id"]
        ).execute()
        r["catch_items"] = catches.data or []
        r["photos"] = photos.data or []
    return records


@router.get("/{record_id}")
def get_record(record_id: int, user_id: int = Depends(get_current_user)):
    resp = supabase.table("fishing_records").select("*").eq(
        "id", record_id
    ).eq("telegram_user_id", user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Record not found")
    return _enrich_record(resp.data[0], user_id)


@router.post("", status_code=201)
def create_record(data: FishingRecordCreate, user_id: int = Depends(get_current_user)):
    total_fish_count = sum(c.quantity for c in data.catch_items)
    record_data = {
        "telegram_user_id": user_id,
        "date": data.date.isoformat(),
        "water_body_name": data.water_body_name,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "place_description": data.place_description,
        "total_fish_count": total_fish_count,
        "total_weight": data.total_weight,
        "comment": data.comment,
    }
    resp = supabase.table("fishing_records").insert(record_data).execute()
    record = resp.data[0]

    for catch in data.catch_items:
        supabase.table("catch_items").insert({
            "fishing_record_id": record["id"],
            "fish_name": catch.fish_name,
            "quantity": catch.quantity,
            "biggest_weight": catch.biggest_weight,
        }).execute()

    return _enrich_record(record, user_id)


@router.put("/{record_id}")
def update_record(record_id: int, data: FishingRecordUpdate, user_id: int = Depends(get_current_user)):
    existing = supabase.table("fishing_records").select("*").eq(
        "id", record_id
    ).eq("telegram_user_id", user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Record not found")

    update_data = {}
    for field, value in data.model_dump(exclude_unset=True).items():
        if field == "catch_items":
            continue
        if field == "date" and value:
            update_data[field] = value.isoformat()
        else:
            update_data[field] = value

    if data.catch_items is not None:
        total_fish_count = sum(c.quantity for c in data.catch_items)
        update_data["total_fish_count"] = total_fish_count

    if update_data:
        supabase.table("fishing_records").update(update_data).eq("id", record_id).execute()

    if data.catch_items is not None:
        supabase.table("catch_items").delete().eq("fishing_record_id", record_id).execute()
        for catch in data.catch_items:
            supabase.table("catch_items").insert({
                "fishing_record_id": record_id,
                "fish_name": catch.fish_name,
                "quantity": catch.quantity,
                "biggest_weight": catch.biggest_weight,
            }).execute()

    return _enrich_record(existing.data[0], user_id)


@router.delete("/{record_id}")
def delete_record(record_id: int, user_id: int = Depends(get_current_user)):
    existing = supabase.table("fishing_records").select("*").eq(
        "id", record_id
    ).eq("telegram_user_id", user_id).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Record not found")

    # Delete photos from storage
    photos = supabase.table("fishing_photos").select("storage_path").eq(
        "fishing_record_id", record_id
    ).execute()
    for photo in (photos.data or []):
        try:
            supabase.storage.from_("fishing-photos").remove([photo["storage_path"]])
        except Exception:
            pass

    supabase.table("fishing_photos").delete().eq("fishing_record_id", record_id).execute()
    supabase.table("catch_items").delete().eq("fishing_record_id", record_id).execute()
    supabase.table("fishing_records").delete().eq("id", record_id).execute()

    return {"ok": True}
