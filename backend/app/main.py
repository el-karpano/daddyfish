from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import Response
from pathlib import Path
import os

from .routes import fishing_records, photos, map_data, statistics, achievements, me

app = FastAPI(title="Папина рыбалка")

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
