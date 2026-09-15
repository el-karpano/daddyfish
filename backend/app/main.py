from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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

app.include_router(me.router)
app.include_router(fishing_records.router)
app.include_router(photos.router)
app.include_router(map_data.router)
app.include_router(statistics.router)
app.include_router(achievements.router)

# Serve frontend static files
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
