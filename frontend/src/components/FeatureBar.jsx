// Feature bar colors by label
const COLORS = {
  danceability: 'linear-gradient(90deg, #8b5cf6, #06b6d4)',
  energy:       'linear-gradient(90deg, #f472b6, #fb923c)',
  valence:      'linear-gradient(90deg, #4ade80, #22d3ee)',
  tempo:        'linear-gradient(90deg, #f59e0b, #ef4444)',
  acousticness: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
  liveness:     'linear-gradient(90deg, #fb923c, #f472b6)',
};

/**
 * @param {{ label: string, value: number, max?: number, delay?: number }} props
 */
export default function FeatureBar({ label, value, max = 1, delay = 0 }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = COLORS[label] || 'linear-gradient(90deg, #8b5cf6, #22d3ee)';

  const displayValue =
    label === 'tempo' ? `${Math.round(value)} bpm` : `${Math.round(pct)}%`;

  return (
    <div className="feature-bar">
      <span className="feature-bar-label">{label}</span>
      <div className="feature-bar-track">
        <div
          className="feature-bar-fill"
          style={{
            width: `${pct}%`,
            background: color,
            animationDelay: `${delay}ms`,
          }}
        />
      </div>
      <span className="feature-bar-value">{displayValue}</span>
    </div>
  );
}
