import { useState } from 'react';
import { predictGenre } from '../api';
import SongCard from '../components/SongCard';

const DEFAULTS = {
  danceability: 0.6, energy: 0.7, loudness: -7,
  speechiness: 0.05, acousticness: 0.1,
  instrumentalness: 0.0, liveness: 0.12, valence: 0.55,
  tempo: 120, top_n: 5,
};

const SLIDERS = [
  { key: 'danceability', label: 'Danceability', min: 0, max: 1, step: 0.01, tip: 'How suitable for dancing (0–1)' },
  { key: 'energy',       label: 'Energy',       min: 0, max: 1, step: 0.01, tip: 'Intensity and activity (0–1)' },
  { key: 'valence',      label: 'Valence',      min: 0, max: 1, step: 0.01, tip: 'Musical positivity / happiness (0–1)' },
  { key: 'acousticness', label: 'Acousticness', min: 0, max: 1, step: 0.01, tip: 'Likelihood of being acoustic (0–1)' },
  { key: 'instrumentalness', label: 'Instrumentalness', min: 0, max: 1, step: 0.01, tip: 'Predicts no vocals (0–1)' },
  { key: 'liveness',    label: 'Liveness',     min: 0, max: 1, step: 0.01, tip: 'Presence of live audience (0–1)' },
  { key: 'speechiness', label: 'Speechiness',  min: 0, max: 1, step: 0.01, tip: 'Amount of spoken words (0–1)' },
  { key: 'tempo',       label: 'Tempo (BPM)',  min: 40, max: 220, step: 1, tip: 'Beats per minute' },
  { key: 'loudness',    label: 'Loudness (dB)', min: -60, max: 0, step: 0.5, tip: 'Overall loudness in dB' },
];

function formatVal(key, val) {
  if (key === 'tempo') return `${Math.round(val)} BPM`;
  if (key === 'loudness') return `${val} dB`;
  return parseFloat(val).toFixed(2);
}

export default function Predict() {
  const [form, setForm]   = useState({ ...DEFAULTS });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  function handleChange(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await predictGenre({ ...form });
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setForm({ ...DEFAULTS });
    setResult(null);
    setError(null);
  }

  return (
    <div className="section">
      <div className="container">
        <div className="section-header">
          <div className="section-label">🎯 Genre Prediction</div>
          <h1 className="section-title">Predict Your Song's Genre</h1>
          <p className="section-desc">
            Adjust the 9 audio features to get an AI-powered genre prediction with confidence scores across {' '}
            <strong>114 genre categories</strong> based on the closest KNN neighbours.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '2rem' }}>
          {/* Form */}
          <div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Audio features sliders */}
              <div className="page-card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--cyan-400)' }}>
                  🎛️ Audio Features
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {SLIDERS.map(({ key, label, min, max, step, tip }) => (
                    <div key={key} className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <label className="form-label" htmlFor={`slider-${key}`}>{label}</label>
                        <span title={tip} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'help' }}>ⓘ {tip}</span>
                      </div>
                      <div className="slider-row">
                        <input
                          id={`slider-${key}`}
                          className="form-slider"
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={form[key]}
                          onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                        />
                        <span className="slider-value">{formatVal(key, form[key])}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  id="predict-submit-btn"
                  style={{ flex: 1 }}
                >
                  {loading ? <><span className="loading-spinner" /> Predicting…</> : '🎯 Predict Genre'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleReset}
                  id="predict-reset-btn"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Result panel */}
          <div style={{ position: 'sticky', top: '6rem', alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {!result && !loading && !error && (
              <div className="page-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎸</div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Adjust the audio features and click <strong>"Predict Genre"</strong> to
                  see which genre your track belongs to based on its nearest neighbours.
                </p>
              </div>
            )}

            {loading && (
              <div className="page-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <div className="loading-spinner" style={{ width: 48, height: 48, borderWidth: 5 }} />
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>Running KNN classifier…</p>
              </div>
            )}

            {error && (
              <div className="page-card" style={{ textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                <p style={{ color: 'var(--pink-400)', fontSize: '0.9rem' }}>{error}</p>
              </div>
            )}

            {result && !loading && (
              <>
                <div className="predict-result">
                  <div className="predict-result-icon">🎉</div>
                  <div className="predict-result-genre">{result.predicted_genre}</div>
                  <p className="predict-result-label">Predicted Genre (Majority Vote)</p>

                  <div className="predict-bars">
                    <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                      Top predictions
                    </p>
                    {result.top_predictions.map((p, i) => (
                      <div key={p.genre} className="predict-bar-row">
                        <span className="predict-bar-genre">{p.genre} ({p.count})</span>
                        <div className="predict-bar-track">
                          <div
                            className="predict-bar-fill"
                            style={{
                              width: `${Math.round(p.percentage)}%`,
                              animationDelay: `${i * 100}ms`,
                            }}
                          />
                        </div>
                        <span className="predict-bar-pct">
                          {p.percentage.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {result.similar_tracks && result.similar_tracks.length > 0 && (
                  <div className="page-card">
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '1rem', color: 'var(--purple-400)' }}>
                      🎶 Nearest Neighbour Tracks
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {result.similar_tracks.slice(0, 3).map((track, i) => (
                        <div key={i} style={{ padding: '0.5rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{track.track_name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{track.artists} • <span style={{color: 'var(--cyan-400)'}}>{track.track_genre}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
