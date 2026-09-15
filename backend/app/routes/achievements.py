from fastapi import APIRouter, Depends
from ..database import supabase
from . import get_current_user

router = APIRouter(prefix="/api", tags=["achievements"])

ACHIEVEMENTS = [
    {"id": "first_trip", "title": "Первый выезд", "description": "Совершить первую рыбалку", "icon": "🎣"},
    {"id": "first_catch", "title": "Первая добыча", "description": "Поймать первую рыбу", "icon": "🐟"},
    {"id": "ten_trips", "title": "Десять рыбалок", "description": "Совершить 10 рыбалок", "icon": "🔥"},
    {"id": "experienced", "title": "Опытный рыбак", "description": "Совершить 25 рыбалок", "icon": "🏕"},
    {"id": "hundred_fish", "title": "Сотня", "description": "Поймать 100 рыб", "icon": "🎣"},
    {"id": "big_catch", "title": "Большой улов", "description": "Поймать 20 рыб за одну рыбалку", "icon": "🐟"},
    {"id": "first_trophy", "title": "Первый трофей", "description": "Поймать рыбу весом 5 кг или больше", "icon": "🏆"},
    {"id": "trophy_fisher", "title": "Трофейный рыбак", "description": "Поймать рыбу весом 10 кг или больше", "icon": "💪"},
    {"id": "explorer", "title": "Исследователь", "description": "Посетить 5 разных мест", "icon": "🗺"},
    {"id": "water_conqueror", "title": "Покоритель водоёмов", "description": "Посетить 10 разных мест", "icon": "🗺"},
    {"id": "pike_hunter", "title": "Щучий охотник", "description": "Поймать 25 щук", "icon": "🐊"},
    {"id": "perch_hunter", "title": "Окунёвая охота", "description": "Поймать 50 окуней", "icon": "🐠"},
    {"id": "sharpshooter", "title": "Меткий рыбак", "description": "Поймать 5 разных видов рыбы", "icon": "🎯"},
    {"id": "ichthyologist", "title": "Ихтиолог", "description": "Поймать 10 разных видов рыбы", "icon": "🐟"},
    {"id": "heavyweight", "title": "Тяжеловес", "description": "Общий вес улова больше 50 кг", "icon": "⚖️"},
    {"id": "big_water", "title": "Большая вода", "description": "Совершить 10 рыбалок на одном водоёме", "icon": "🌊"},
    {"id": "photo_memory", "title": "На память", "description": "Добавить фотографии минимум к 10 рыбалкам", "icon": "📸"},
    {"id": "chronicler", "title": "Летописец", "description": "Добавить 50 рыбалок", "icon": "📔"},
    {"id": "record_breaker", "title": "Рекордсмен", "description": "Побить собственный рекорд по весу рыбы", "icon": "🏆"},
    {"id": "true_fisher", "title": "Настоящий рыбак", "description": "Совершить 50 рыбалок", "icon": "🎣"},
]


def _calc_achievement(ach: dict, stats: dict, records_data: list, all_catches: list, photo_records: set) -> dict:
    aid = ach["id"]
    trips = stats["total_fishing_records"]
    total_fish = stats["total_fish_caught"]
    total_weight = stats["total_weight"] or 0
    fish_map = stats["fish_map"]
    wb_map = stats["wb_map"]
    record_ids = stats["record_ids"]
    max_single_catch = stats.get("max_single_catch", 0)
    max_weight_ever = stats.get("max_weight_ever", 0)

    target = 1
    progress = 0
    if aid == "first_trip":
        target, progress = 1, min(trips, 1)
    elif aid == "first_catch":
        target, progress = 1, min(total_fish, 1)
    elif aid == "ten_trips":
        target, progress = 10, trips
    elif aid == "experienced":
        target, progress = 25, trips
    elif aid == "hundred_fish":
        target, progress = 100, total_fish
    elif aid == "big_catch":
        target = 20
        progress = max_single_catch
    elif aid == "first_trophy":
        target, progress = 1, 1 if max_weight_ever >= 5 else 0
    elif aid == "trophy_fisher":
        target, progress = 1, 1 if max_weight_ever >= 10 else 0
    elif aid == "explorer":
        target, progress = 5, len(wb_map)
    elif aid == "water_conqueror":
        target, progress = 10, len(wb_map)
    elif aid == "pike_hunter":
        target, progress = 25, fish_map.get("Щука", 0)
    elif aid == "perch_hunter":
        target, progress = 50, fish_map.get("Окунь", 0)
    elif aid == "sharpshooter":
        target, progress = 5, len(fish_map)
    elif aid == "ichthyologist":
        target, progress = 10, len(fish_map)
    elif aid == "heavyweight":
        target, progress = 50, int(total_weight)
    elif aid == "big_water":
        target = 10
        progress = max(wb_map.values()) if wb_map else 0
    elif aid == "photo_memory":
        target, progress = 10, len(photo_records)
    elif aid == "chronicler":
        target, progress = 50, trips
    elif aid == "record_breaker":
        # Unlocked if there's more than 1 trophy and weight improved
        trophy_weights = sorted(
            [c.get("biggest_weight") or 0 for c in all_catches], reverse=True
        )
        target = 1
        progress = 1 if len(trophy_weights) >= 2 and trophy_weights[0] > trophy_weights[1] else 0
    elif aid == "true_fisher":
        target, progress = 50, trips

    unlocked = progress >= target
    return {**ach, "progress": progress, "target": target, "unlocked": unlocked, "newly_unlocked": False}


@router.get("/achievements")
def get_achievements(user_id: int = Depends(get_current_user)):
    records = supabase.table("fishing_records").select(
        "id,total_fish_count,total_weight,water_body_name"
    ).eq("telegram_user_id", user_id).execute()
    records_data = records.data or []
    record_ids = [r["id"] for r in records_data]

    all_catches = []
    if record_ids:
        catches_resp = supabase.table("catch_items").select("*").in_(
            "fishing_record_id", record_ids
        ).execute()
        all_catches = catches_resp.data or []

    # Count photos per record
    photo_records = set()
    if record_ids:
        photos_resp = supabase.table("fishing_photos").select("fishing_record_id").in_(
            "fishing_record_id", record_ids
        ).execute()
        for p in (photos_resp.data or []):
            photo_records.add(p["fishing_record_id"])

    fish_map: dict[str, int] = {}
    for c in all_catches:
        fish_map[c["fish_name"]] = fish_map.get(c["fish_name"], 0) + c["quantity"]

    wb_map: dict[str, int] = {}
    for r in records_data:
        wb_map[r["water_body_name"]] = wb_map.get(r["water_body_name"], 0) + 1

    max_single_catch = max((r["total_fish_count"] for r in records_data), default=0)
    max_weight_ever = max((c.get("biggest_weight") or 0 for c in all_catches), default=0)

    stats = {
        "total_fishing_records": len(records_data),
        "total_fish_caught": sum(r["total_fish_count"] for r in records_data),
        "total_weight": sum(r["total_weight"] for r in records_data if r["total_weight"]),
        "fish_map": fish_map,
        "wb_map": wb_map,
        "record_ids": record_ids,
        "max_single_catch": max_single_catch,
        "max_weight_ever": max_weight_ever,
    }

    # Check for newly unlocked achievements
    stored = supabase.table("user_achievements").select("achievement_id").eq(
        "telegram_user_id", user_id
    ).execute()
    unlocked_ids = {a["achievement_id"] for a in (stored.data or [])}

    results = []
    for ach in ACHIEVEMENTS:
        calc = _calc_achievement(ach, stats, records_data, all_catches, photo_records)
        newly = calc["unlocked"] and ach["id"] not in unlocked_ids
        calc["newly_unlocked"] = newly
        if newly:
            supabase.table("user_achievements").upsert({
                "telegram_user_id": user_id,
                "achievement_id": ach["id"],
            }).execute()
        results.append(calc)

    return results
