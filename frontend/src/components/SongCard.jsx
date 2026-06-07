import FeatureBar from './FeatureBar';

// Pick an emoji based on genre
function genreEmoji(genre) {
  const map = {
    acoustic: '🎸', pop: '🎤', rock: '🎸', jazz: '🎷',
    classical: '🎻', hip_hop: '🎧', 'hip-hop': '🎧',
    electronic: '🎛️', dance: '💃', country: '🤠',
    rnb: '🎶', 'r&b': '🎶', metal: '🤘', indie: '🎵',
    latin: '💃', blues: '🎺', folk: '🪕', soul: '🎙️',
    reggae: '🌴', punk: '⚡', ambient: '🌊',
  };
  for (const key of Object.keys(map)) {
    if (genre?.toLowerCase().includes(key)) return map[key];
  }
  return '🎵';
}

function matchBadge(type) {
  if (type === 'exact')  return <span className="match-badge match-exact">✓ Exact match</span>;
  if (type === 'fuzzy')  return <span className="match-badge match-fuzzy">≈ Fuzzy match</span>;
  return <span className="match-badge match-search">🔍 Text search</span>;
}

/**
 * @param {{ track: object, index: number, matchType?: string }} props
 */
export default function SongCard({ track, index, matchType }) {
  const features = [
    { label: 'danceability', value: track.danceability },
    { label: 'energy',       value: track.energy },
    { label: 'valence',      value: track.valence },
  ];

  return (
    <div className="song-card" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="song-card-header">
        <div className="song-card-art">{genreEmoji(track.track_genre)}</div>

        <div className="song-card-info">
          <div className="song-card-title" title={track.track_name}>
            {track.track_name}
          </div>
          <div className="song-card-artist" title={track.artists}>
            {track.artists}
          </div>
        </div>

        <div className="song-card-score">
          <span className="score-badge">
            {(track.similarity_score * 100).toFixed(0)}%
          </span>
          <span className="score-label">match</span>
        </div>
      </div>

      <div className="song-card-genre">
        {genreEmoji(track.track_genre)}&nbsp;{track.track_genre}
        {index === 0 && matchType && (
          <>&nbsp;&nbsp;{matchBadge(matchType)}</>
        )}
      </div>

      <div className="song-card-features">
        {features.map((f, i) => (
          <FeatureBar
            key={f.label}
            label={f.label}
            value={f.value}
            max={1}
            delay={index * 60 + i * 80}
          />
        ))}
        <FeatureBar
          label="tempo"
          value={track.tempo}
          max={220}
          delay={index * 60 + 240}
        />
      </div>

      <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {track.album_name}
        </span>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700,
          color: track.popularity > 60 ? 'var(--green-400)' : 'var(--text-muted)',
        }}>
          ★ {Math.round(track.popularity)}
        </span>
      </div>
    </div>
  );
}
