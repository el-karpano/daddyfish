from fastapi import APIRouter, HTTPException, Depends, Query
from ..database import supabase
from ..models import FishingRecordCreate, FishingRecordUpdate
from . import get_club_member

router = APIRouter(prefix="/api/fishing-records", tags=["fishing-records"])


def _enrich_record(record: dict) -> dict:
    catches = supabase.table("catch_items").select("*").eq(
        "fishing_record_id", record["id"]
    ).execute()
    photos = supabase.table("fishing_photos").select("*").eq(
        "fishing_record_id", record["id"]
    ).execute()
    record["catch_items"] = catches.data or []
    record["photos"] = photos.data or []
    return record


def _attach_owner(record: dict, members_map: dict) -> dict:
    uid = record.get("user_id")
    if uid and uid in members_map:
        m = members_map[uid]
        record["owner"] = {
            "id": m["id"],
            "first_name": m["first_name"],
            "last_name": m.get("last_name", ""),
            "color": m.get("color", "#20D879"),
            "role": m.get("role", "member"),
        }
    return record


@router.get("")
def list_records(
    user_id: int = Query(None, description="Filter by user (omit for all club)"),
    user: dict = Depends(get_club_member),
):
    club = user["_club"]
    from ..telegram_auth import get_club_members
    members = get_club_members(club["id"])
    member_ids = [m["id"] for m in members]
    members_map = {m["id"]: m for m in members}

    query = supabase.table("fishing_records").select("*").in_(
        "user_id", member_ids if not user_id else [user_id]
    ).order("date", desc=True).order("created_at", desc=True)

    resp = query.execute()
    records = resp.data or []
    for r in records:
        _enrich_record(r)
        _attach_owner(r, members_map)
    return records


@router.get("/{record_id}")
def get_record(record_id: int, user: dict = Depends(get_club_member)):
    resp = supabase.table("fishing_records").select("*").eq("id", record_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Record not found")

    record = resp.data[0]
    club = user["_club"]
    from ..telegram_auth import get_club_members
    members = get_club_members(club["id"])
    member_ids = [m["id"] for m in members]

    if record["user_id"] not in member_ids:
        raise HTTPException(status_code=404, detail="Record not found")

    members_map = {m["id"]: m for m in members}
    _enrich_record(record)
    _attach_owner(record, members_map)
    return record


@router.post("", status_code=201)
def create_record(data: FishingRecordCreate, user: dict = Depends(get_club_member)):
    total_fish_count = sum(c.quantity for c in data.catch_items)
    record_data = {
        "user_id": user["id"],
        "telegram_user_id": user["telegram_id"],
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

    return _enrich_record(record)


@router.put("/{record_id}")
def update_record(record_id: int, data: FishingRecordUpdate, user: dict = Depends(get_club_member)):
    existing = supabase.table("fishing_records").select("*").eq(
        "id", record_id
    ).eq("user_id", user["id"]).execute()
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

    return _enrich_record(existing.data[0])


@router.delete("/{record_id}")
def delete_record(record_id: int, user: dict = Depends(get_club_member)):
    existing = supabase.table("fishing_records").select("*").eq(
        "id", record_id
    ).eq("user_id", user["id"]).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Record not found")

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