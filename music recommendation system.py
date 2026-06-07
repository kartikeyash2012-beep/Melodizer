#!/usr/bin/env python
# coding: utf-8

"""
Music recommendation and genre prediction pipeline for music.csv.

Aligned with the Spotify-style dataset columns:
track_name, artists, album_name, track_genre, popularity, danceability, energy,
valence, tempo, and other audio features.

Improvements over v1:
- SGDClassifier loss="modified_huber" for probability calibration
- Larger TF-IDF (50k features, trigrams) for text encoding
- Richer recommendation enrichment tokens (mood, tempo bucket, key)
- Fuzzy-match cutoff lowered to 0.75 for better recall
- Dataset filtered to popularity > 0 to remove filler playlist duplicates
"""

from __future__ import annotations

import difflib
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import SGDClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


DATA_PATH = Path("music.csv")
RANDOM_STATE = 42

TEXT_FEATURES = ["track_name", "artists", "album_name"]
NUMERIC_FEATURES = [
    "popularity",
    "duration_ms",
    "explicit",
    "danceability",
    "energy",
    "key",
    "loudness",
    "mode",
    "speechiness",
    "acousticness",
    "instrumentalness",
    "liveness",
    "valence",
    "tempo",
    "time_signature",
]

# Mood labels for enrichment tokens
MOOD_BINS = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
MOOD_LABELS = ["very_sad", "sad", "neutral", "happy", "very_happy"]

TEMPO_BINS = [0, 60, 90, 120, 150, 300]
TEMPO_LABELS = ["very_slow", "slow", "medium", "fast", "very_fast"]


def load_music_data(path: Path = DATA_PATH) -> pd.DataFrame:
    """Load and clean the Spotify dataset.
    
    Filters popularity > 0 to remove low-quality playlist filler duplicates
    while retaining ~70k high-quality tracks, which reduces memory footprint
    and improves recommendation quality.
    """
    df = pd.read_csv(path)

    if "Unnamed: 0" in df.columns:
        df = df.drop(columns=["Unnamed: 0"])

    required_columns = TEXT_FEATURES + NUMERIC_FEATURES + ["track_genre"]
    missing = sorted(set(required_columns) - set(df.columns))
    if missing:
        raise ValueError(f"Dataset is missing required columns: {missing}")

    df = df.dropna(subset=["track_name", "artists", "album_name", "track_genre"])
    df = df.drop_duplicates(subset=["track_name", "artists", "album_name", "track_genre"])

    # Filter out zero-popularity tracks (filler / duplicate playlist entries)
    df = df[df["popularity"] > 0]

    df = df.reset_index(drop=True)

    for col in TEXT_FEATURES:
        df[col] = df[col].fillna("").astype(str)

    df["explicit"] = df["explicit"].astype(int)
    df[NUMERIC_FEATURES] = df[NUMERIC_FEATURES].fillna(df[NUMERIC_FEATURES].median())

    # Mood enrichment tokens
    df["mood_token"] = pd.cut(
        df["valence"], bins=MOOD_BINS, labels=MOOD_LABELS, include_lowest=True
    ).astype(str)
    df["tempo_token"] = pd.cut(
        df["tempo"], bins=TEMPO_BINS, labels=TEMPO_LABELS, include_lowest=True
    ).astype(str)
    df["energy_token"] = pd.cut(
        df["energy"], bins=5, labels=["very_calm", "calm", "moderate", "energetic", "very_energetic"],
        include_lowest=True,
    ).astype(str)
    df["dance_token"] = pd.cut(
        df["danceability"], bins=5, labels=["not_danceable", "low_dance", "moderate_dance", "danceable", "very_danceable"],
        include_lowest=True,
    ).astype(str)

    df["model_text"] = df["track_name"] + " " + df["artists"] + " " + df["album_name"]
    df["recommendation_text"] = (
        df["model_text"]
        + " "
        + df["track_genre"]
        + " "
        + df["mood_token"]
        + " "
        + df["tempo_token"]
        + " "
        + df["energy_token"]
        + " "
        + df["dance_token"]
    )
    return df


def train_genre_model(df: pd.DataFrame) -> tuple[Pipeline, pd.DataFrame, pd.Series]:
    """Train a genre classifier and print accuracy metrics.
    
    Uses SGDClassifier with modified_huber loss for probability calibration,
    combined with a richer TF-IDF (trigrams, 50k features) for text encoding.
    """
    x = df[["model_text"] + NUMERIC_FEATURES]
    y = df["track_genre"]

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "text",
                TfidfVectorizer(
                    stop_words="english",
                    lowercase=True,
                    max_features=50_000,
                    ngram_range=(1, 3),
                    min_df=2,
                    sublinear_tf=True,
                ),
                "model_text",
            ),
            ("audio", StandardScaler(), NUMERIC_FEATURES),
        ],
        sparse_threshold=0.3,
    )

    model = Pipeline(
        steps=[
            ("features", preprocessor),
            (
                "classifier",
                SGDClassifier(
                    loss="modified_huber",   # enables predict_proba
                    alpha=5e-6,              # slightly less regularization
                    max_iter=50,             # more iterations
                    tol=1e-4,
                    n_jobs=-1,
                    random_state=RANDOM_STATE,
                    class_weight="balanced", # handle genre imbalance
                ),
            ),
        ]
    )

    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    report = classification_report(y_test, predictions, output_dict=True, zero_division=0)
    weak_genres = (
        pd.DataFrame(report)
        .T.drop(index=["accuracy", "macro avg", "weighted avg"], errors="ignore")
        .sort_values("f1-score")
        .head(10)
    )

    print(f"Rows used: {len(df):,}")
    print(f"Genres: {y.nunique():,}")
    print(f"Genre prediction accuracy: {accuracy_score(y_test, predictions):.4f}")
    print(f"Macro F1: {report['macro avg']['f1-score']:.4f}")
    print(f"Weighted F1: {report['weighted avg']['f1-score']:.4f}")
    print("\nLowest-scoring genres to improve next:")
    print(weak_genres[["precision", "recall", "f1-score", "support"]].round(3).to_string())

    return model, x_test, y_test


def build_similarity_matrix(df: pd.DataFrame):
    """Build TF-IDF vectors for fast content-based recommendations.
    
    Uses enriched recommendation_text that includes mood, tempo, energy,
    and danceability tokens for more semantically-aware similarity.
    """
    vectorizer = TfidfVectorizer(
        stop_words="english",
        lowercase=True,
        max_features=80_000,
        ngram_range=(1, 2),
        min_df=2,
        sublinear_tf=True,
    )
    vectors = vectorizer.fit_transform(df["recommendation_text"])
    return vectorizer, vectors


def recommend_songs(
    query: str,
    df: pd.DataFrame,
    vectorizer: TfidfVectorizer,
    vectors,
    top_n: int = 10,
) -> pd.DataFrame:
    """Recommend songs from a song title or free-text query.
    
    Fuzzy cutoff lowered to 0.75 for better recall on partial track names.
    """
    query = query.strip()
    if not query:
        raise ValueError("Please provide a song title, artist, genre, or mood-like query.")

    lower_titles = df["track_name"].str.lower()
    close_match = difflib.get_close_matches(query.lower(), lower_titles, n=1, cutoff=0.75)

    if close_match:
        idx = lower_titles[lower_titles == close_match[0]].index[0]
        scores = cosine_similarity(vectors[idx], vectors).ravel()
        scores[idx] = -1
    else:
        query_vector = vectorizer.transform([query])
        scores = cosine_similarity(query_vector, vectors).ravel()

    best_indices = scores.argsort()[::-1][:top_n]
    columns = [
        "track_name",
        "artists",
        "album_name",
        "track_genre",
        "popularity",
        "danceability",
        "energy",
        "valence",
        "tempo",
    ]
    results = df.iloc[best_indices][columns].copy()
    results.insert(0, "similarity_score", scores[best_indices].round(4))
    return results.reset_index(drop=True)


def predict_genre(
    track_name: str,
    artists: str,
    album_name: str,
    audio_features: dict,
    model: Pipeline,
) -> str:
    """Predict a track genre for new song metadata and audio features."""
    row = {feature: audio_features.get(feature, 0) for feature in NUMERIC_FEATURES}
    row.update(
        {
            "model_text": f"{track_name} {artists} {album_name}",
        }
    )
    return model.predict(pd.DataFrame([row]))[0]


def predict_genre_proba(
    track_name: str,
    artists: str,
    album_name: str,
    audio_features: dict,
    model: Pipeline,
    top_n: int = 5,
) -> list[dict]:
    """Return top-N genre predictions with probabilities."""
    row = {feature: audio_features.get(feature, 0) for feature in NUMERIC_FEATURES}
    row["model_text"] = f"{track_name} {artists} {album_name}"
    proba = model.predict_proba(pd.DataFrame([row]))[0]
    classes = model.classes_
    top_idx = np.argsort(proba)[::-1][:top_n]
    return [{"genre": classes[i], "probability": round(float(proba[i]), 4)} for i in top_idx]


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    df = load_music_data()
    genre_model, x_test, y_test = train_genre_model(df)
    rec_vectorizer, rec_vectors = build_similarity_matrix(df)

    print("\nRecommendations for 'sad acoustic':")
    print(recommend_songs("sad acoustic", df, rec_vectorizer, rec_vectors, top_n=10).to_string(index=False))

    print("\nRecommendations for 'Shape of You':")
    print(recommend_songs("Shape of You", df, rec_vectorizer, rec_vectors, top_n=10).to_string(index=False))
