// In dev:  VITE_API_URL=http://localhost:8000  (set in .env)
// In prod: VITE_API_URL=''  (set in .env.production) → relative calls to same origin
const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

async function handleResponse(res) {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  
  if (!res.ok) {
    if (isJson) {
      const err = await res.json();
      throw new Error(err.detail || `Server error: ${res.status}`);
    } else {
      const text = await res.text();
      // If we get a plain text "Not Found" from a CDN, it means the API is missing
      if (res.status === 404 && text.includes('Not Found')) {
        throw new Error("Backend API not found. If deployed as a Static Site, make sure VITE_API_URL is set in the Render Dashboard.");
      }
      throw new Error(`Server error (${res.status}): ${text.substring(0, 50)}`);
    }
  }
  
  if (!isJson) {
    throw new Error("Received non-JSON response from server.");
  }
  
  return res.json();
}

export async function getHealth() {
  const res = await fetch(`${API_BASE}/api/health`);
  return handleResponse(res);
}

export async function getGenres() {
  const res = await fetch(`${API_BASE}/api/genres`);
  return handleResponse(res);
}

export async function searchTracks(q, limit = 8) {
  const res = await fetch(`${API_BASE}/api/tracks?q=${encodeURIComponent(q)}&limit=${limit}`);
  return handleResponse(res);
}

export async function getRecommendations(query, topN = 5) {
  const res = await fetch(`${API_BASE}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, top_n: topN }),
  });
  return handleResponse(res);
}

export async function predictGenre(payload) {
  const res = await fetch(`${API_BASE}/api/predict-genre`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}
