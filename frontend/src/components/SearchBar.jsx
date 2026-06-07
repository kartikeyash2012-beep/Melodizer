import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchTracks } from '../api';

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * @param {{ placeholder?: string, onSearch?: (q: string) => void, large?: boolean }} props
 */
export default function SearchBar({ placeholder = 'Search song, artist, genre, or mood…', onSearch, large }) {
  const [query, setQuery]           = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);
  const navigate                    = useNavigate();
  const wrapperRef                  = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchSuggestions = useCallback(
    debounce(async (q) => {
      if (q.trim().length < 2) { setSuggestions([]); return; }
      setLoading(true);
      try {
        const data = await searchTracks(q);
        setSuggestions(data || []);
        setOpen(true);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  function handleChange(e) {
    const val = e.target.value;
    setQuery(val);
    if (val.trim().length >= 2) fetchSuggestions(val);
    else { setSuggestions([]); setOpen(false); }
  }

  function doSearch(q = query) {
    const trimmed = (q || '').trim();
    if (!trimmed) return;
    setOpen(false);
    if (onSearch) {
      onSearch(trimmed);
    } else {
      navigate(`/recommend?q=${encodeURIComponent(trimmed)}`);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') doSearch();
    if (e.key === 'Escape') setOpen(false);
  }

  function pickSuggestion(track) {
    setQuery(track.track_name);
    setOpen(false);
    doSearch(track.track_name);
  }

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className={`search-bar${large ? ' search-bar-lg' : ''}`}>
        <span className="search-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          aria-label="Search music"
          id="search-input"
          autoComplete="off"
        />
        <button
          className="search-btn"
          onClick={() => doSearch()}
          disabled={!query.trim()}
          id="search-submit-btn"
        >
          {loading ? <span className="loading-spinner" /> : 'Find Music'}
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <div className="search-dropdown" role="listbox">
          {suggestions.map((track, i) => (
            <div
              key={i}
              className="dropdown-item"
              role="option"
              tabIndex={0}
              onClick={() => pickSuggestion(track)}
              onKeyDown={(e) => e.key === 'Enter' && pickSuggestion(track)}
            >
              <div className="dropdown-item-icon">🎵</div>
              <div className="dropdown-item-info">
                <div className="dropdown-item-name">{track.track_name}</div>
                <div className="dropdown-item-artist">{track.artists}</div>
              </div>
              <span className="dropdown-item-genre">{track.track_genre}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
