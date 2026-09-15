import hashlib
import hmac
import json
from urllib.parse import unquote, parse_qsl
from .config import ALLOWED_TELEGRAM_IDS


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

    import os
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


def is_allowed_user(user_id: int) -> bool:
    return user_id in ALLOWED_TELEGRAM_IDS
