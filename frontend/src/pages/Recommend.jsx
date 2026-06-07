import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import SongCard from '../components/SongCard';
import { getRecommendations } from '../api';

export default function Recommend() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [topN, setTopN]         = useState(5);

  const query = searchParams.get('q') || '';

  useEffect(() => {
    if (query) fetchResults(query, topN);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function fetchResults(q, n) {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecommendations(q, n);
      setResults(data);
    } catch (e) {
      setError(e.message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(q) {
    setSearchParams({ q });
    fetchResults(q, topN);
  }

  function handleTopNChange(n) {
    setTopN(n);
    if (query) fetchResults(query, n);
  }

  return (
    <div className="section">
      <div className="container">
        {/* Search bar */}
        <div style={{ marginBottom: '2rem' }}>
          <SearchBar
            placeholder="Search by song or artist to find KNN neighbors…"
            onSearch={handleSearch}
          />
        </div>

        {/* Results area */}
        {!query && !results && (
          <div className="empty-state">
            <div className="empty-state-icon">🎵</div>
            <p className="empty-state-text">
              Search for a song or artist to get KNN-based recommendations.
            </p>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div className="loading-spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
            </div>
            <p className="empty-state-text">Finding similar songs with KNN…</p>
          </div>
        )}

        {error && (
          <div className="empty-state">
            <div className="empty-state-icon">⚠️</div>
            <p className="empty-state-text" style={{ color: 'var(--pink-400)' }}>
              {error}
            </p>
          </div>
        )}

        {results && !loading && (
          <>
            {/* Seed track info */}
            {results.seed_track && (
               <div style={{ marginBottom: '2rem' }}>
                 <div className="section-label">🎯 Target Song</div>
                 <h2 className="section-title" style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>
                   You searched for: {results.query}
                 </h2>
                 <div style={{ maxWidth: '400px' }}>
                    <SongCard track={results.seed_track} index={0} />
                 </div>
               </div>
            )}

            {/* Results header */}
            <div className="results-header">
              <div>
                <div className="section-label">🎶 KNN Recommendations</div>
                <h2 className="section-title" style={{ fontSize: '1.4rem', marginBottom: 0 }}>
                  Closest neighbors
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {results.results.length} songs found via Cosine Similarity
                  </span>
                </div>
              </div>

              {/* Top-N selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Show:</span>
                {[5, 10, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleTopNChange(n)}
                    className={`btn btn-sm ${topN === n ? 'btn-primary' : 'btn-secondary'}`}
                    id={`show-${n}-btn`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="song-grid">
              {results.results.map((track, i) => (
                <SongCard
                  key={i}
                  track={track}
                  index={i + 1}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
