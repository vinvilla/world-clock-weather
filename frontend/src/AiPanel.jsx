import { useState } from 'react';

function AiPanel({ weatherData, onSearchResult }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);

  const callClaude = async (feature, queryOverride) => {
    setLoading(true);
    setActiveFeature(feature);
    setResponse('');
    try {
      const res = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature,
          query: queryOverride ?? query,
          weatherData,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setResponse('Error: ' + data.detail);
        return;
      }
      if (feature === 'search') {
        onSearchResult(data.matching_cities);
        setResponse(`Showing: ${data.matching_cities.join(', ')}. ${data.explanation}`);
      } else {
        setResponse(data.text);
      }
    } catch {
      setResponse('Could not reach the backend. Is it running on port 5001?');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) callClaude('ask');
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-title">✦ Ask Claude about the weather</div>

      <div className="ai-input-row">
        <input
          className="ai-input"
          placeholder='Try "compare London and Singapore" or "show cities in Asia"'
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="ai-btn"
          onClick={() => callClaude('ask')}
          disabled={loading || !query.trim()}
        >
          Ask
        </button>
        <button
          className="ai-btn secondary"
          onClick={() => callClaude('search')}
          disabled={loading || !query.trim()}
        >
          Search Cities
        </button>
      </div>

      <div className="ai-actions">
        <button
          className="ai-btn secondary"
          onClick={() => callClaude('summarize', 'summarize')}
          disabled={loading}
        >
          ✦ Summarize All Weather
        </button>
        {activeFeature === 'search' && response && (
          <button
            className="ai-btn secondary"
            onClick={() => { onSearchResult(null); setResponse(''); setActiveFeature(null); }}
          >
            Show All Cities
          </button>
        )}
      </div>

      {(response || loading) && (
        <div className={`ai-response${loading ? ' loading' : ''}`}>
          {loading ? 'Claude is thinking...' : response}
        </div>
      )}
    </div>
  );
}

export default AiPanel;
