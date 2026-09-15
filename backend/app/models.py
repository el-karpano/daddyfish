from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class CatchItemCreate(BaseModel):
    fish_name: str
    quantity: int
    biggest_weight: Optional[float] = None


class CatchItem(CatchItemCreate):
    id: int
    fishing_record_id: int


class FishingRecordCreate(BaseModel):
    date: date
    water_body_name: str
    latitude: float
    longitude: float
    place_description: Optional[str] = None
    total_weight: Optional[float] = None
    comment: Optional[str] = None
    catch_items: list[CatchItemCreate] = []


class FishingRecordUpdate(BaseModel):
    date: Optional[date] = None
    water_body_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_description: Optional[str] = None
    total_weight: Optional[float] = None
    comment: Optional[str] = None
    catch_items: Optional[list[CatchItemCreate]] = None


class FishingRecord(BaseModel):
    id: int
    telegram_user_id: int
    date: date
    water_body_name: str
    latitude: float
    longitude: float
    place_description: Optional[str] = None
    total_fish_count: int = 0
    total_weight: Optional[float] = None
    comment: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    catch_items: list[CatchItem] = []
    photos: list["FishingPhoto"] = []


class FishingPhoto(BaseModel):
    id: int
    fishing_record_id: int
    storage_path: str
    photo_url: str
    created_at: datetime


class Statistics(BaseModel):
    total_fishing_records: int
    total_fish_caught: int
    total_weight: Optional[float]
    avg_fish_per_trip: float
    top_trophies: list[dict]
    most_productive_water_body: Optional[dict]
    most_caught_fish: Optional[dict]


class Achievement(BaseModel):
    id: str
    title: str
    description: str
    icon: str
    unlocked: bool
    progress: int
    target: int
    newly_unlocked: bool = False
