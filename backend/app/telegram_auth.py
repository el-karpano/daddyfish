import hashlib
import hmac
import json
import uuid
from urllib.parse import unquote, parse_qsl
from .database import supabase
import os


def validate_init_data(init_data: str) -> dict | None:
    """Validate Telegram Mini App initData and return user data."""
    try:
        parsed = dict(parse_qsl(unquote(init_data)))
    except Exception:
        return None

    if "hash" not in parsed:
        return None

    received_hash = parsed.pop("hash")
    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))

    bot_token = os.getenv("BOT_TOKEN", "")
    secret_key = hmac.new(
        "WebAppData".encode(), bot_token.encode(), hashlib.sha256
    ).digest()
    computed_hash = hmac.new(
        secret_key, data_check_string.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(computed_hash, received_hash):
        return None

    try:
        user_data = json.loads(parsed.get("user", "{}"))
    except Exception:
        return None

    return user_data


MEMBER_COLORS = [
    '#20D879',  # owner — green
    '#4A9EFF',  # blue
    '#FF8C42',  # orange
    '#A855F7',  # purple
    '#06B6D4',  # cyan
    '#F0C040',  # yellow
    '#F472B6',  # pink
    '#34D399',  # emerald
]


def get_or_create_user(telegram_data: dict) -> dict | None:
    """Find or create user in DB from validated Telegram data."""
    telegram_id = telegram_data.get("id")
    if not telegram_id:
        return None

    # Try to find existing user
    resp = supabase.table("users").select("*").eq("telegram_id", telegram_id).execute()
    if resp.data:
        # Update name/username if changed
        user = resp.data[0]
        updates = {}
        if telegram_data.get("first_name") and telegram_data["first_name"] != user["first_name"]:
            updates["first_name"] = telegram_data.get("first_name", "")
        if telegram_data.get("last_name") and telegram_data["last_name"] != user.get("last_name", ""):
            updates["last_name"] = telegram_data.get("last_name", "")
        if telegram_data.get("username") and telegram_data["username"] != user.get("username", ""):
            updates["username"] = telegram_data.get("username", "")
        if updates:
            supabase.table("users").update(updates).eq("id", user["id"]).execute()
            user.update(updates)
        return user

    # Count existing members to assign color
    existing = supabase.table("users").select("id").execute()
    color_idx = len(existing.data or []) % len(MEMBER_COLORS)

    # Create new user
    new_user = {
        "telegram_id": telegram_id,
        "first_name": telegram_data.get("first_name", ""),
        "last_name": telegram_data.get("last_name", ""),
        "username": telegram_data.get("username", ""),
        "avatar_url": telegram_data.get("photo_url"),
        "color": MEMBER_COLORS[color_idx],
    }
    resp = supabase.table("users").insert(new_user).execute()
    return resp.data[0] if resp.data else None


def get_user_club(user_id: int) -> dict | None:
    """Get the club this user belongs to."""
    resp = supabase.table("club_members").select("club_id, role, clubs(*)").eq(
        "user_id", user_id
    ).execute()
    if not resp.data:
        return None
    membership = resp.data[0]
    club = membership.get("clubs") or {}
    club["user_role"] = membership["role"]
    return club


def get_club_members(club_id: int) -> list:
    """Get all members of a club with user info."""
    resp = supabase.table("club_members").select(
        "user_id, role, joined_at, users(*)"
    ).eq("club_id", club_id).execute()
    members = []
    for m in (resp.data or []):
        user = m.get("users") or {}
        members.append({
            "id": user.get("id"),
            "telegram_id": user.get("telegram_id"),
            "first_name": user.get("first_name", ""),
            "last_name": user.get("last_name", ""),
            "username": user.get("username", ""),
            "avatar_url": user.get("avatar_url"),
            "color": user.get("color", "#20D879"),
            "role": m["role"],
            "joined_at": m["joined_at"],
        })
    return members


def create_or_reactivate_invite(club_id: int, created_by: int) -> str:
    """Get existing active invite or create new one. Returns token."""
    existing = supabase.table("club_invites").select("token").eq(
        "club_id", club_id
    ).eq("is_active", True).execute()
    if existing.data:
        return existing.data[0]["token"]

    token = uuid.uuid4().hex[:16]
    supabase.table("club_invites").insert({
        "club_id": club_id,
        "token": token,
        "created_by": created_by,
    }).execute()
    return token


def join_club_by_token(token: str, telegram_data: dict) -> dict | None:
    """Join club via invite token. Returns user dict or None."""
    invite = supabase.table("club_invites").select("*").eq(
        "token", token
    ).eq("is_active", True).execute()
    if not invite.data:
        return None

    invite_data = invite.data[0]
    club_id = invite_data["club_id"]

    # Get or create user
    user = get_or_create_user(telegram_data)
    if not user:
        return None

    # Check if already in club
    existing = supabase.table("club_members").select("id").eq(
        "club_id", club_id
    ).eq("user_id", user["id"]).execute()
    if existing.data:
        return user  # Already a member

    # Add to club
    supabase.table("club_members").insert({
        "club_id": club_id,
        "user_id": user["id"],
        "role": "member",
    }).execute()

    return user