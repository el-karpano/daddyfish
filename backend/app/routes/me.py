from fastapi import APIRouter, Depends
from . import get_current_user

router = APIRouter(prefix="/api", tags=["me"])


@router.get("/me")
def get_me(user_id: int = Depends(get_current_user)):
    return {"telegram_user_id": user_id}
