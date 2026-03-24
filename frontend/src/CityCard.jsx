import { useState, useEffect } from 'react';

function CityCard({ city, timezone, weatherData, loading, dimmed, solarData, onRemove }) {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTimeStr(new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(now));
      setDateStr(new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(now));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timezone]);

  if (loading) {
    return (
      <div className="city-card loading">
        <div className="skeleton wide" />
        <div className="skeleton tall" />
        <div className="skeleton narrow" />
        <div className="skeleton wide" />
      </div>
    );
  }

  return (
    <div className={`city-card${dimmed ? ' dimmed' : ''}`}>
      {onRemove && (
        <button
          className="city-card-remove"
          onClick={onRemove}
          aria-label="Remove city"
        >×</button>
      )}
      <div className="city-greeting">Hello, {city}!</div>
      <div className="city-time">{timeStr}</div>
      <div className="city-date">{dateStr}</div>

      {weatherData?.error ? (
        <div className="weather-error">Weather unavailable</div>
      ) : (
        <div className="city-weather">
          {weatherData?.iconCode && (
            <img
              src={`https://openweathermap.org/img/wn/${weatherData.iconCode}@2x.png`}
              alt={weatherData.condition}
            />
          )}
          <div className="weather-info">
            <span className="weather-temp">{weatherData?.temp ?? '--'}°F</span>
            <span className="weather-condition">{weatherData?.condition ?? 'Loading...'}</span>
          </div>
        </div>
      )}

      {solarData && (
        <div className="city-solar">
          <div className="solar-daynight">
            <span className="solar-icon">{solarData.isDay ? '☀️' : '🌙'}</span>
            <span className="solar-label">{solarData.isDay ? 'Day' : 'Night'}</span>
          </div>
          <div className="solar-times">
            <span>↑ {solarData.sunrise}</span>
            <span>↓ {solarData.sunset}</span>
          </div>
          <div className="solar-countdown">{solarData.countdown}</div>

          {solarData.moon && (
            <div className="solar-moon">
              <div className="moon-phase-row">
                <span className="moon-emoji">{solarData.moon.phaseEmoji}</span>
                <span className="moon-name">{solarData.moon.phaseName}</span>
                <span className="moon-illumination">{solarData.moon.illumination}%</span>
              </div>
              <div className="moon-watch">
                <span>Last full moon: {solarData.moon.daysSinceFullMoon} days ago</span>
              </div>
              <div className="moon-watch">
                <span>
                  Next full moon: {solarData.moon.nextFullMoonLabel}
                  &nbsp;(in {solarData.moon.daysToNextFullMoon} days)
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CityCard;
