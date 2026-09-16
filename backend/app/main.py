from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
from contextlib import asynccontextmanager
from pathlib import Path
import asyncio
import os

from .routes import fishing_records, photos, map_data, statistics, achievements, me, club, users


async def run_bot():
    """Start Telegram bot polling in background."""
    from .bot import BOT_TOKEN
    if not BOT_TOKEN:
        return
    try:
        from aiogram import Bot, Dispatcher
        from .bot import router as bot_router
        bot = Bot(token=BOT_TOKEN)
        dp = Dispatcher()
        dp.include_router(bot_router)
        import logging
        logging.basicConfig(level=logging.INFO)
        await dp.start_polling(bot)
    except Exception as e:
        print(f"Bot error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(run_bot())
    yield
    task.cancel()


app = FastAPI(title="Папина рыбалка", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.middleware("http")
async def no_cache_html(request: Request, call_next):
    response: Response = await call_next(request)
    if request.url.path == "/" or request.url.path.endswith(".html"):
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

app.include_router(me.router)
app.include_router(club.router)
app.include_router(users.router)
app.include_router(fishing_records.router)
app.include_router(photos.router)
app.include_router(map_data.router)
app.include_router(statistics.router)
app.include_router(achievements.router)

# Serve frontend static files (backend/static for production, frontend/dist for dev)
static_dir = Path(__file__).parent.parent / "static"
if not static_dir.exists():
    static_dir = Path(__file__).parent.parent.parent / "frontend" / "dist"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="frontend")
