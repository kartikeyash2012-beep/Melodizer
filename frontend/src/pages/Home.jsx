import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { getGenres } from '../api';

const EXAMPLE_QUERIES = [
  'sad acoustic', 'Shape of You', 'upbeat pop', 'jazz chill',
  'electronic dance', 'classical piano', 'hip hop beats', 'indie folk',
];

export default function Home() {
  const [genres, setGenres] = useState([]);

  useEffect(() => {
    getGenres().then(setGenres).catch(() => {});
  }, []);

  return (
    <>
      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        <div className="hero-content">
          <div className="hero-badge">✨ AI-Powered Music Discovery</div>

          <h1 style={{ marginBottom: '0.5rem' }}>
            Welcome to <br />
            <span>Melodizer</span>
          </h1>

          <p className="hero-subtitle">
            Powered by Spotify audio features and K-Nearest Neighbors — discover
            music by finding the mathematically closest songs to your favorites.
          </p>

          <SearchBar large placeholder="Search by song or artist…" />

          {/* Example queries */}
          <div style={{ marginTop: '1.25rem' }}>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              Try searching for:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {EXAMPLE_QUERIES.map((q) => (
                <Link
                  key={q}
                  to={`/recommend?q=${encodeURIComponent(q)}`}
                  className="genre-chip"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-value">114K+</div>
              <div className="stat-label">Spotify Tracks</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">114</div>
              <div className="stat-label">Music Genres</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">9</div>
              <div className="stat-label">Audio Features</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">KNN</div>
              <div className="stat-label">Algorithm</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features section ── */}
      <section className="section">
        <div className="container">
          <div className="section-header" style={{ textAlign: 'center' }}>
            <div className="section-label">⚙️ How It Works</div>
            <h2 className="section-title">Two Ways to Discover Music</h2>
            <p className="section-desc">
              Melodizer uses a K-Nearest Neighbors (KNN) algorithm to find songs that are 
              mathematically similar based on 9 distinct acoustic features using cosine similarity.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
            {[
              {
                icon: '🔍', title: 'Song Recommendation',
                desc: 'Enter a song title or artist. We find the 5 closest neighbors based on scaled audio features in our multi-dimensional space.',
                link: '/recommend', cta: 'Try Recommendations',
              },
              {
                icon: '🎯', title: 'Genre Prediction',
                desc: 'Dial in audio features like energy, danceability, and tempo. Our KNN classifier predicts the most likely genre via majority vote.',
                link: '/predict', cta: 'Predict Genre',
              },
            ].map((card) => (
              <div key={card.title} className="page-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '2.5rem' }}>{card.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700 }}>
                  {card.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9rem', flex: 1 }}>
                  {card.desc}
                </p>
                <Link to={card.link} className="btn btn-outline btn-sm">
                  {card.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse genres ── */}
      {genres.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-header">
              <div className="section-label">🎼 Browse by Genre</div>
              <h2 className="section-title">Explore All {genres.length} Genres</h2>
            </div>
            <div className="genre-chips">
              {genres.slice(0, 60).map((g) => (
                <Link
                  key={g}
                  to={`/recommend?q=${encodeURIComponent(g)}`}
                  className="genre-chip"
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
