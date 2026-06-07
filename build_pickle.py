#!/usr/bin/env python
# coding: utf-8

"""
build_pickle.py — Pre-train and serialize Melodizer's KNN recommendation model.

Saves three artifacts:
  - pickles/model.pkl   : trained NearestNeighbors (k=6, cosine)
  - pickles/scaler.pkl  : fitted StandardScaler
  - pickles/df.pkl      : cleaned track metadata DataFrame

Usage:
    python build_pickle.py
    python build_pickle.py --data music.csv --out-dir ./pickles
"""

from __future__ import annotations

import argparse
import pickle
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import StandardScaler


# ─────────────────────────── constants ────────────────────────────────────────

RANDOM_STATE = 42

TEXT_FEATURES    = ["track_name", "artists", "album_name"]
AUDIO_FEATURES   = [
    "danceability", "energy", "loudness", "speechiness",
    "acousticness", "instrumentalness", "liveness", "valence", "tempo",
]

EXPORT_COLUMNS = [
    "track_id", "track_name", "artists", "album_name", "track_genre",
    "popularity", "duration_ms", "explicit",
] + AUDIO_FEATURES


# ─────────────────────────── data loading ─────────────────────────────────────

def load_data(path: Path) -> pd.DataFrame:
    """Load and clean the Spotify dataset."""
    print(f"[1/4] Loading data from {path} …")
    df = pd.read_csv(path)

    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])

    required = TEXT_FEATURES + AUDIO_FEATURES + ["track_genre"]
    missing = sorted(set(required) - set(df.columns))
    if missing:
        raise ValueError(f"Dataset missing columns: {missing}")

    df = df.dropna(subset=["track_name", "artists", "album_name", "track_genre"])
    df = df.drop_duplicates(subset=["track_name", "artists", "album_name", "track_genre"])
    df = df[df["popularity"] > 0]  # remove zero-popularity filler tracks
    df = df.reset_index(drop=True)

    for col in TEXT_FEATURES:
        df[col] = df[col].fillna("").astype(str)

    df["explicit"] = df["explicit"].astype(int)
    df[AUDIO_FEATURES] = df[AUDIO_FEATURES].fillna(df[AUDIO_FEATURES].median())

    print(f"    → {len(df):,} tracks after cleaning")
    print(f"    → {df['track_genre'].nunique()} unique genres")
    return df


# ─────────────────────────── KNN model ────────────────────────────────────────

def train_knn(df: pd.DataFrame) -> tuple[StandardScaler, NearestNeighbors]:
    """Fit a StandardScaler and KNN model on the 9 audio features."""
    print("[2/4] Fitting StandardScaler + KNN (k=6, cosine) …")
    t0 = time.time()

    X = df[AUDIO_FEATURES].values

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = NearestNeighbors(
        n_neighbors=6,         # k=6 (1 seed + 5 recommendations)
        metric="cosine",
        algorithm="brute",     # required for cosine metric
        n_jobs=-1,
    )
    model.fit(X_scaled)

    elapsed = time.time() - t0
    print(f"    → Trained on {len(df):,} tracks in {elapsed:.2f}s")
    return scaler, model


# ─────────────────────────── serialization ────────────────────────────────────

def save_pickles(
    out_dir: Path,
    scaler: StandardScaler,
    model: NearestNeighbors,
    df: pd.DataFrame,
) -> None:
    """Serialize all artifacts to disk."""
    out_dir.mkdir(parents=True, exist_ok=True)
    print("[3/4] Saving pickle files …")

    # Scaler
    scaler_path = out_dir / "scaler.pkl"
    with open(scaler_path, "wb") as f:
        pickle.dump(scaler, f, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"    → scaler.pkl  ({scaler_path.stat().st_size / 1e3:.1f} KB)")

    # KNN model
    model_path = out_dir / "model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model, f, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"    → model.pkl   ({model_path.stat().st_size / 1e6:.1f} MB)")

    # Track DataFrame (only needed columns)
    df_path = out_dir / "df.pkl"
    export_cols = [c for c in EXPORT_COLUMNS if c in df.columns]
    with open(df_path, "wb") as f:
        pickle.dump(df[export_cols].reset_index(drop=True), f, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"    → df.pkl      ({df_path.stat().st_size / 1e6:.1f} MB)")

    # Also save genre list
    genres = sorted(df["track_genre"].unique().tolist())
    genres_path = out_dir / "genres.pkl"
    with open(genres_path, "wb") as f:
        pickle.dump(genres, f, protocol=pickle.HIGHEST_PROTOCOL)
    print(f"    → genres.pkl  ({genres_path.stat().st_size / 1e3:.1f} KB)")

    print(f"[4/4] All artifacts saved to: {out_dir.resolve()}")


# ─────────────────────────── entry point ──────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="Build Melodizer pickle files.")
    parser.add_argument("--data",    type=Path, default=Path("music.csv"), help="Path to music.csv")
    parser.add_argument("--out-dir", type=Path, default=Path("pickles"),   help="Output directory")
    args = parser.parse_args()

    if not args.data.exists():
        print(f"ERROR: {args.data} not found.", file=sys.stderr)
        sys.exit(1)

    t_total = time.time()
    df = load_data(args.data)
    scaler, model = train_knn(df)
    save_pickles(args.out_dir, scaler, model, df)
    print(f"\n✅ Done in {time.time() - t_total:.1f}s")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    main()
