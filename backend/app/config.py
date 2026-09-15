import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "")
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
ALLOWED_TELEGRAM_IDS = [
    int(uid.strip())
    for uid in os.getenv("ALLOWED_TELEGRAM_IDS", "").split(",")
    if uid.strip()
]
WEBAPP_URL = os.getenv("WEBAPP_URL", "")
