import { Link } from 'react-router-dom';

// ─── Data ───────────────────────────────────────────────────────────────────
const AUDIO_FEATURES = [
  { icon: '💃', name: 'Danceability', desc: 'How suitable a track is for dancing based on tempo, rhythm stability, beat strength, and overall regularity. Ranges from 0.0 to 1.0.' },
  { icon: '⚡', name: 'Energy',       desc: 'A perceptual measure of intensity and activity. Energetic tracks feel fast, loud, and noisy — like death metal vs. a Bach prelude.' },
  { icon: '🔊', name: 'Loudness',     desc: 'The overall loudness of a track in decibels (dB). Values typically range between −60 and 0 dB, averaged across the entire track.' },
  { icon: '🗣️', name: 'Speechiness',  desc: 'Detects the presence of spoken words. Higher values indicate more speech-like content (e.g., podcasts, rap, spoken word).' },
  { icon: '🎸', name: 'Acousticness', desc: 'A confidence measure of whether the track is acoustic. 1.0 represents high confidence the track is purely acoustic.' },
  { icon: '🎹', name: 'Instrumentalness', desc: 'Predicts whether a track contains no vocals. Values above 0.5 are intended to represent instrumental tracks.' },
  { icon: '🎤', name: 'Liveness',     desc: 'Detects the presence of an audience in the recording. Higher values represent an increased probability the track was performed live.' },
  { icon: '🎭', name: 'Valence',      desc: 'A measure from 0.0 to 1.0 describing the musical positiveness. High valence sounds happy and cheerful; low valence sounds sad or angry.' },
  { icon: '🥁', name: 'Tempo',        desc: 'The overall estimated tempo of a track in beats per minute (BPM). This is the speed or pace of a given piece of music.' },
];

const PIPELINE_STEPS = [
  { n: '1', title: 'User Searches', desc: 'The user types a song name or artist. The backend searches the 114K-track dataset for a match.' },
  { n: '2', title: 'Feature Extraction', desc: 'The 9 audio features of the selected song are extracted from the dataset.' },
  { n: '3', title: 'Standardization', desc: 'Features are scaled using the pre-fitted StandardScaler so that tempo (0–200+ BPM) doesn\'t outweigh acousticness (0–1).' },
  { n: '4', title: 'KNN Query', desc: 'The scaled features are fed into the NearestNeighbors model, which returns the 6 closest songs by cosine distance.' },
  { n: '5', title: 'Deduplication & Response', desc: 'Duplicate tracks are filtered out, and the top 5 unique recommendations are returned to the frontend.' },
];

const TECH_SPECS = [
  { label: 'Dataset Size',    value: '114,000+ tracks across 114 genres' },
  { label: 'Algorithm',       value: 'K-Nearest Neighbors (k=6)' },
  { label: 'Distance Metric', value: 'Cosine Similarity' },
  { label: 'Preprocessing',   value: 'StandardScaler (zero-mean, unit-variance)' },
  { label: 'Features',        value: '9 Spotify audio features' },
  { label: 'Serialization',   value: 'Pickle (model.pkl, scaler.pkl, df.pkl)' },
];

const TECH_STACK = [
  { icon: '🐍', name: 'Python' }, { icon: '🤖', name: 'Scikit-Learn' },
  { icon: '🐼', name: 'Pandas' }, { icon: '🔢', name: 'NumPy' },
  { icon: '⚡', name: 'FastAPI' }, { icon: '⚛️', name: 'React' },
  { icon: '⚡', name: 'Vite' },   { icon: '🔗', name: 'Axios' },
];

const STUDENTS = [
  {
    photo: '/kartikeya.png',
    gradient: 'linear-gradient(135deg, #f472b6, #fb923c)',
    name: 'Kartikeya Sharma',
    role: 'Grade 8 Student',
    school: 'Harris Road Middle School',
    location: 'Concord, NC, USA',
    bio: 'Passionate about the intersection of technology and creativity. Contributing to Melodizer as a hands-on exploration of how machine learning can transform the way we discover and experience music.',
    tags: ['Grade 8', 'Concord, NC', 'Future Engineer'],
  },
];

// ─── Subcomponents ───────────────────────────────────────────────────────────

function StudentCard({ student }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      backdropFilter: 'blur(10px)',
      transition: 'all var(--transition-normal)',
      position: 'relative',
      overflow: 'hidden',
    }}
      className="student-card"
    >
      {/* Decorative gradient orb behind card */}
      <div style={{
        position: 'absolute', top: -60, right: -60,
        width: 180, height: 180, borderRadius: '50%',
        background: student.gradient, opacity: 0.08, filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />

      {/* Avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          flexShrink: 0,
          boxShadow: `0 8px 24px rgba(0,0,0,0.4)`,
          overflow: 'hidden',
          border: `2px solid transparent`,
          backgroundImage: `${student.gradient}`,
          backgroundOrigin: 'border-box',
        }}>
          <img
            src={student.photo}
            alt={student.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem' }}>
            {student.name}
          </div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.15rem' }}>
            {student.role}
          </div>
          {student.school && (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '0.1rem' }}>
              📍 {student.school} · {student.location}
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      <p style={{
        color: 'var(--text-secondary)', lineHeight: 1.7,
        fontSize: '0.9rem', borderLeft: `3px solid transparent`,
        borderImage: `${student.gradient} 1`,
        paddingLeft: '0.875rem',
      }}>
        {student.bio}
      </p>

      {/* Tags */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {student.tags.map((tag) => (
          <span key={tag} style={{
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem', fontWeight: 600,
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)',
          }}>{tag}</span>
        ))}
      </div>
    </div>
  );
}

function PipelineStep({ step, index }) {
  return (
    <div style={{
      display: 'flex', gap: '1.25rem', alignItems: 'flex-start',
      animation: `fade-up var(--transition-slow) ${index * 80}ms ease both`,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'var(--gradient-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem',
        color: '#fff', flexShrink: 0,
        boxShadow: '0 4px 14px rgba(124,58,237,0.4)',
      }}>
        {step.n}
      </div>
      <div style={{ paddingTop: '0.3rem' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
          {step.title}
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.65 }}>
          {step.desc}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function About() {
  return (
    <div style={{ paddingBottom: '5rem' }}>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', overflow: 'hidden', padding: '5rem 0 4rem', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--gradient-hero)' }} />
        <div className="hero-orb hero-orb-1" style={{ opacity: 0.2 }} />
        <div className="hero-orb hero-orb-2" style={{ opacity: 0.15 }} />
        <div style={{ position: 'relative', zIndex: 1 }} className="container">
          <div className="hero-badge" style={{ marginBottom: '1.25rem' }}>📖 About Melodizer</div>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem',
          }}>
            The Story Behind the{' '}
            <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Music Recommendations
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 560, margin: '0 auto 2rem', lineHeight: 1.7 }}>
            Melodizer is a student-built ML project that discovers new music
            by finding mathematically similar songs in a 114K-track Spotify dataset.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/recommend" className="btn btn-primary btn-lg">Try Recommendations →</Link>
            <Link to="/predict"   className="btn btn-secondary btn-lg">Predict Genre</Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '4rem', paddingTop: '4rem' }}>

        {/* ── Student Profiles ── */}
        <section>
          <div className="section-header">
            <div className="section-label">👩‍💻 Meet the Creator</div>
            <h2 className="section-title">Built by a Student, Powered by Curiosity</h2>
            <p className="section-desc">
              A student who turned a love of music into a machine learning project.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {STUDENTS.map((s) => <StudentCard key={s.name} student={s} />)}
          </div>
        </section>

        {/* ── Algorithm ── */}
        <section>
          <div className="section-header">
            <div className="section-label">🧠 The Algorithm</div>
            <h2 className="section-title">How It Works</h2>
          </div>
          <div className="page-card">
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
              Melodizer uses a <strong style={{ color: 'var(--purple-400)' }}>K-Nearest Neighbors (KNN)</strong> algorithm
              to find songs that are mathematically similar to your target track.
              The model analyses <strong style={{ color: 'var(--cyan-400)' }}>9 distinct acoustic features</strong> extracted
              from the Spotify dataset to calculate the "distance" between songs in a multi-dimensional
              feature space using <strong style={{ color: 'var(--purple-400)' }}>cosine similarity</strong>.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem', marginTop: '1rem' }}>
              When you search for a song, the system scales its audio features using a pre-fitted
              <strong style={{ color: 'var(--cyan-400)' }}> StandardScaler</strong>, then queries the trained model
              to find the <strong style={{ color: 'var(--purple-400)' }}>5 closest neighbours</strong> — songs with the
              most similar acoustic profile.
            </p>
          </div>
        </section>

        {/* ── Audio Features ── */}
        <section>
          <div className="section-header">
            <div className="section-label">🎚️ Audio Features Used</div>
            <h2 className="section-title">9 Dimensions of Sound</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {AUDIO_FEATURES.map((f, i) => (
              <div key={f.name} className="page-card" style={{
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
                animation: `fade-up var(--transition-slow) ${i * 50}ms ease both`,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: 'var(--gradient-card)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.3rem', flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>{f.name}</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.65 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tech Specs ── */}
        <section>
          <div className="section-header">
            <div className="section-label">⚙️ Technical Details</div>
            <h2 className="section-title">The Model & Dataset</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Specs table */}
            <div className="page-card" style={{ padding: 0, overflow: 'hidden' }}>
              {TECH_SPECS.map((s, i) => (
                <div key={s.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.875rem 1.5rem',
                  borderBottom: i < TECH_SPECS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  gap: '1rem',
                }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>{s.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 500, textAlign: 'right' }}>{s.value}</span>
                </div>
              ))}
            </div>
            {/* Tech stack */}
            <div className="page-card">
              <div style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--purple-400)', fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Tech Stack
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {TECH_STACK.map((t) => (
                  <div key={t.name} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.6rem 0.875rem',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem', fontWeight: 500,
                  }}>
                    <span>{t.icon}</span> {t.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Pipeline ── */}
        <section>
          <div className="section-header">
            <div className="section-label">🔄 Recommendation Pipeline</div>
            <h2 className="section-title">How a Recommendation is Made</h2>
          </div>
          <div className="page-card" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {PIPELINE_STEPS.map((step, i) => (
              <PipelineStep key={step.n} step={step} index={i} />
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
            Ready to Discover New Music?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            Search for any song and let the algorithm find your next favourite track.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/recommend" className="btn btn-primary btn-lg">🔍 Find Similar Songs</Link>
            <Link to="/predict"   className="btn btn-outline btn-lg">🎯 Predict Genre</Link>
          </div>
        </section>

      </div>
    </div>
  );
}
