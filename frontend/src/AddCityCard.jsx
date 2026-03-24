import { useState, useRef } from 'react';
import tzlookup from 'tz-lookup';
import './AddCityCard.css';

export default function AddCityCard({ onAdd }) {
  const [active, setActive]   = useState(false);
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef           = useRef(null);

  function handleInput(e) {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(val)}`);
        if (!res.ok) { setResults([]); return; }
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(result) {
    const timezone = tzlookup(result.lat, result.lon);
    const cc = result.country.toUpperCase();
    onAdd({
      name:      result.name,
      lat:       result.lat,
      lon:       result.lon,
      country:   result.country,
      timezone,
      owm_query: `${result.name},${cc}`,
    });
    setActive(false);
    setQuery('');
    setResults([]);
  }

  if (!active) {
    return (
      <div
        className="add-city-card"
        onClick={() => setActive(true)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && setActive(true)}
      >
        <span className="add-city-icon">+</span>
        <span className="add-city-label">Add city</span>
      </div>
    );
  }

  return (
    <div className="add-city-card add-city-card--active">
      <input
        className="add-city-input"
        placeholder="Search city…"
        value={query}
        onChange={handleInput}
        autoFocus
      />
      {loading && <div className="add-city-loading">Searching…</div>}
      {results.length > 0 && (
        <ul className="add-city-dropdown">
          {results.map((r, i) => (
            <li key={`${r.lat}-${r.lon}`} className="add-city-result" onClick={() => handleSelect(r)}>
              {r.name}{r.state ? `, ${r.state}` : ''}, {r.country}
            </li>
          ))}
        </ul>
      )}
      <button
        className="add-city-cancel"
        onClick={() => { setActive(false); setQuery(''); setResults([]); }}
      >
        Cancel
      </button>
    </div>
  );
}
