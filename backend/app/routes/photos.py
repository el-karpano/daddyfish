import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from ..database import supabase
from . import get_current_user

router = APIRouter(prefix="/api/fishing-records/{record_id}/photos", tags=["photos"])

MAX_PHOTOS = 10
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.get("")
def list_photos(record_id: int, user_id: int = Depends(get_current_user)):
    resp = supabase.table("fishing_records").select("id").eq(
        "id", record_id
    ).eq("telegram_user_id", user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Record not found")

    photos = supabase.table("fishing_photos").select("*").eq(
        "fishing_record_id", record_id
    ).execute()
    return photos.data or []


@router.post("")
async def upload_photo(record_id: int, file: UploadFile = File(...), user_id: int = Depends(get_current_user)):
    resp = supabase.table("fishing_records").select("id").eq(
        "id", record_id
    ).eq("telegram_user_id", user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Record not found")

    existing = supabase.table("fishing_photos").select("id").eq(
        "fishing_record_id", record_id
    ).execute()
    if len(existing.data or []) >= MAX_PHOTOS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_PHOTOS} photos allowed")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "jpg"
    storage_path = f"fishing-records/{record_id}/{uuid.uuid4().hex}.{ext}"

    content_type = file.content_type or "image/jpeg"
    supabase.storage.from_("fishing-photos").upload(
        storage_path, content, {"content-type": content_type}
    )

    public_url = supabase.storage.from_("fishing-photos").get_public_url(storage_path)

    photo_resp = supabase.table("fishing_photos").insert({
        "fishing_record_id": record_id,
        "storage_path": storage_path,
        "photo_url": public_url,
    }).execute()

    return photo_resp.data[0]


@router.delete("/{photo_id}")
def delete_photo(record_id: int, photo_id: int, user_id: int = Depends(get_current_user)):
    resp = supabase.table("fishing_records").select("id").eq(
        "id", record_id
    ).eq("telegram_user_id", user_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Record not found")

    photo = supabase.table("fishing_photos").select("*").eq(
        "id", photo_id
    ).eq("fishing_record_id", record_id).execute()
    if not photo.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    try:
        supabase.storage.from_("fishing-photos").remove([photo.data[0]["storage_path"]])
    except Exception:
        pass

    supabase.table("fishing_photos").delete().eq("id", photo_id).execute()
    return {"ok": True}
