#!/usr/bin/env python
# coding: utf-8

"""
backend/main.py — Melodizer FastAPI REST API.

Endpoints:
  GET  /api/health          → health check
  GET  /api/genres          → list all genres
  GET  /api/tracks?q=...    → autocomplete search
  POST /api/recommend       → KNN song recommendations
  POST /api/predict-genre   → genre prediction (text search fallback)

Algorithm:
  - NearestNeighbors (k=6, cosine metric) for recommendations
  - StandardScaler for feature normalisation
  - Loads model.pkl, scaler.pkl, df.pkl at startup
"""

from __future__ import annotations

import os
import pickle
import sys
from pathlib import Path
from typing import Any, Optional

import numpy as np
import pandas as pd
# pyrefly: ignore [missing-import]
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field


# ─────────────────────────── paths ────────────────────────────────────────────

REPO_ROOT  = Path(__file__).resolve().parent.parent
PICKLE_DIR = REPO_ROOT / "pickles"
DATA_PATH  = REPO_ROOT / "music.csv"
FRONTEND_DIST = REPO_ROOT / "frontend" / "dist"

AUDIO_FEATURES = [
    "danceability", "energy", "loudness", "speechiness",
    "acousticness", "instrumentalness", "liveness", "valence", "tempo",
]


# ─────────────────────────── app setup ────────────────────────────────────────

app = FastAPI(
    title="🎵 Melodizer API",
    description="KNN-powered music recommendations using Spotify audio features.",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_state: dict[str, Any] = {}


# ─────────────────────────── startup ──────────────────────────────────────────

def _load_pickles() -> bool:
    paths = {
        "model":  PICKLE_DIR / "model.pkl",
        "scaler": PICKLE_DIR / "scaler.pkl",
        "df":     PICKLE_DIR / "df.pkl",
        "genres": PICKLE_DIR / "genres.pkl",
    }
    if not all(p.exists() for p in paths.values()):
        return False

    print("[startup] Loading pickles …")
    for key, path in paths.items():
        with open(path, "rb") as f:
            _state[key] = pickle.load(f)

    df = _state["df"]
    print(f"[startup] {len(df):,} tracks · {len(_state['genres'])} genres loaded successfully")
    return True


def _build_in_memory() -> None:
    sys.path.insert(0, str(REPO_ROOT))
    from build_pickle import load_data, train_knn

    print("[startup] Building in-memory from music.csv …")
    df = load_data(DATA_PATH)
    scaler, model = train_knn(df)

    _state["model"]  = model
    _state["scaler"] = scaler
    _state["df"]     = df
    _state["genres"] = sorted(df["track_genre"].unique().tolist())
    print("[startup] Done")


@app.on_event("startup")
def startup_event() -> None:
    if not _load_pickles():
        _build_in_memory()


# ─────────────────────────── models ────────────────────────────────────────────

class RecommendRequest(BaseModel):
    query:  str = Field(..., min_length=1, max_length=300, example="Shape of You")
    top_n:  int = Field(default=5, ge=1, le=20)


class TrackResult(BaseModel):
    track_name:       str
    artists:          str
    album_name:       str
    track_genre:      str
    popularity:       float
    danceability:     float
    energy:           float
    valence:          float
    tempo:            float
    loudness:         float
    acousticness:     float
    instrumentalness: float
    liveness:         float
    speechiness:      float
    similarity_score: float


class RecommendResponse(BaseModel):
    query:      str
    seed_track: Optional[TrackResult]
    results:    list[TrackResult]


class PredictRequest(BaseModel):
    danceability:     float = Field(default=0.6,  ge=0.0, le=1.0)
    energy:           float = Field(default=0.7,  ge=0.0, le=1.0)
    loudness:         float = Field(default=-7.0, ge=-60.0, le=0.0)
    speechiness:      float = Field(default=0.05, ge=0.0, le=1.0)
    acousticness:     float = Field(default=0.1,  ge=0.0, le=1.0)
    instrumentalness: float = Field(default=0.0,  ge=0.0, le=1.0)
    liveness:         float = Field(default=0.12, ge=0.0, le=1.0)
    valence:          float = Field(default=0.55, ge=0.0, le=1.0)
    tempo:            float = Field(default=120.0,ge=0.0, le=300.0)
    top_n:            int   = Field(default=5,    ge=1,   le=20)


class GenrePrediction(BaseModel):
    genre:      str
    count:      int
    percentage: float


class PredictResponse(BaseModel):
    predicted_genre:  str
    top_predictions:  list[GenrePrediction]
    similar_tracks:   list[TrackResult]


# ─────────────────────────── helpers ──────────────────────────────────────────

def _row_to_track(row: pd.Series, sim: float) -> TrackResult:
    return TrackResult(
        track_name=str(row.get("track_name", "")),
        artists=str(row.get("artists", "")),
        album_name=str(row.get("album_name", "")),
        track_genre=str(row.get("track_genre", "")),
        popularity=float(row.get("popularity", 0)),
        danceability=float(row.get("danceability", 0)),
        energy=float(row.get("energy", 0)),
        valence=float(row.get("valence", 0)),
        tempo=float(row.get("tempo", 0)),
        loudness=float(row.get("loudness", 0)),
        acousticness=float(row.get("acousticness", 0)),
        instrumentalness=float(row.get("instrumentalness", 0)),
        liveness=float(row.get("liveness", 0)),
        speechiness=float(row.get("speechiness", 0)),
        similarity_score=round(max(0.0, 1.0 - sim), 4),  # cosine distance → similarity
    )


def _knn_recommend(features: np.ndarray, top_n: int, exclude_idx: Optional[int] = None) -> list[tuple[int, float]]:
    """Run KNN query and return (index, distance) pairs, excluding the seed."""
    scaler: Any = _state["scaler"]
    model:  Any = _state["model"]

    X_scaled = scaler.transform(features.reshape(1, -1))
    k = top_n + (2 if exclude_idx is not None else 1)
    distances, indices = model.kneighbors(X_scaled, n_neighbors=min(k, len(_state["df"])))

    results = []
    seen_indices = set()
    if exclude_idx is not None:
        seen_indices.add(exclude_idx)

    for idx, dist in zip(indices[0], distances[0]):
        if idx not in seen_indices:
            results.append((int(idx), float(dist)))
            seen_indices.add(idx)
        if len(results) >= top_n:
            break

    return results


# ─────────────────────────── endpoints ────────────────────────────────────────

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "tracks": len(_state.get("df", [])),
        "genres": len(_state.get("genres", [])),
        "algorithm": "KNN (k=6, cosine)",
    }


@app.get("/api/genres")
def get_genres() -> list[str]:
    return _state.get("genres", [])


@app.get("/api/tracks")
def search_tracks(
    q: str = Query(default="", min_length=1, max_length=200),
    limit: int = Query(default=8, ge=1, le=20),
) -> list[dict]:
    df: pd.DataFrame = _state["df"]
    q_lower = q.lower().strip()
    name_mask   = df["track_name"].str.lower().str.contains(q_lower, na=False, regex=False)
    artist_mask = df["artists"].str.lower().str.contains(q_lower, na=False, regex=False)
    cols = ["track_name", "artists", "album_name", "track_genre", "popularity"]
    cols = [c for c in cols if c in df.columns]
    matches = (
        df[name_mask | artist_mask][cols]
        .drop_duplicates(subset=["track_name", "artists"])
        .sort_values("popularity", ascending=False)
        .head(limit)
    )
    return matches.to_dict(orient="records")


@app.post("/api/recommend", response_model=RecommendResponse)
def recommend(req: RecommendRequest) -> RecommendResponse:
    df: pd.DataFrame = _state["df"]
    q = req.query.strip()

    # Find seed track
    name_lower = df["track_name"].str.lower()
    exact = df[name_lower == q.lower()]
    if exact.empty:
        exact = df[name_lower.str.contains(q.lower(), na=False, regex=False)]

    if exact.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No track found matching '{q}'. Try the autocomplete search."
        )

    # Use the most popular match as seed
    seed_row = exact.sort_values("popularity", ascending=False).iloc[0]
    seed_idx  = seed_row.name

    features  = seed_row[AUDIO_FEATURES].values.astype(float)
    neighbors = _knn_recommend(features, top_n=req.top_n, exclude_idx=seed_idx)

    seed_track = _row_to_track(seed_row, 0.0)
    seed_track.similarity_score = 1.0  # seed is 100% similar to itself

    results = [_row_to_track(df.iloc[idx], dist) for idx, dist in neighbors]

    return RecommendResponse(query=q, seed_track=seed_track, results=results)


@app.post("/api/predict-genre", response_model=PredictResponse)
def predict_genre(req: PredictRequest) -> PredictResponse:
    df: pd.DataFrame = _state["df"]

    features  = np.array([getattr(req, f) for f in AUDIO_FEATURES], dtype=float)
    neighbors = _knn_recommend(features, top_n=req.top_n)

    neighbor_rows = [df.iloc[idx] for idx, _ in neighbors]
    genres = [str(r.get("track_genre", "")) for r in neighbor_rows]

    # Majority vote for genre prediction
    from collections import Counter
    counts = Counter(genres)
    predicted = counts.most_common(1)[0][0]

    top_preds = [
        GenrePrediction(
            genre=g,
            count=c,
            percentage=round(c / len(genres) * 100, 1),
        )
        for g, c in counts.most_common()
    ]

    similar = [_row_to_track(row, dist) for row, (_, dist) in zip(neighbor_rows, neighbors)]

    return PredictResponse(
        predicted_genre=predicted,
        top_predictions=top_preds,
        similar_tracks=similar,
    )


# ─────────────────────────── static frontend ──────────────────────────────────

# Serve the pre-built React app.
# In production (Render) the build command runs `npm run build` so FRONTEND_DIST exists.
if FRONTEND_DIST.exists():
    # Serve bundled JS/CSS assets
    if (FRONTEND_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    # Catch-all: serve real static files from dist root (favicon, icons, images, etc.)
    # Fall back to index.html for all React Router paths.
    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = FRONTEND_DIST / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIST / "index.html"))

