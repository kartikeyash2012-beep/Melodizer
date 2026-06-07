const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function getHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}

export async function getGenres() {
  const res = await fetch(`${API_BASE}/api/genres`);
  return res.json();
}

export async function searchTracks(q, limit = 8) {
  const res = await fetch(`${API_BASE}/api/tracks?q=${encodeURIComponent(q)}&limit=${limit}`);
  return res.json();
}

export async function getRecommendations(query, topN = 5) {
  const res = await fetch(`${API_BASE}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_n: topN }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'No track found. Try a different search.');
  }
  return res.json();
}

export async function predictGenre(payload) {
  const res = await fetch(`${API_BASE}/api/predict-genre`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Failed to predict genre');
  }
  return res.json();
}
