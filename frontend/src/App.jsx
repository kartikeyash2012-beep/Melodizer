import { BrowserRouter, Routes, Route, NavLink, Link } from 'react-router-dom';
import Home      from './pages/Home';
import Recommend from './pages/Recommend';
import Predict   from './pages/Predict';
import About     from './pages/About';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <div className="navbar-logo-icon">🎵</div>
          <span>Melodizer</span>
        </Link>

        <ul className="navbar-nav">
          <li><NavLink to="/"          end id="nav-home">🏠 Home</NavLink></li>
          <li><NavLink to="/recommend"     id="nav-recommend">🔍 Recommend</NavLink></li>
          <li><NavLink to="/predict"       id="nav-predict">🎯 Predict Genre</NavLink></li>
          <li><NavLink to="/about"         id="nav-about">📖 About</NavLink></li>
        </ul>

        <Link to="/about" className="btn btn-primary btn-sm" id="nav-cta">
          Our Story →
        </Link>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <p style={{ marginBottom: '0.4rem' }}>
          <strong style={{ color: 'var(--purple-400)' }}>Melodizer</strong>
          {' '}— KNN music discovery powered by Spotify audio features
        </p>
        <p>
          Built by <strong>Kartikeya Sharma</strong>
          {' '}·{' '}
          <a href="/api/docs" target="_blank" rel="noreferrer">API Docs</a>
        </p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/"          element={<Home />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/predict"   element={<Predict />} />
          <Route path="/about"     element={<About />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
