import { useMemo } from 'react';
import { buildStripGradient, getUTCOffset } from './utils/solar';
import './DayNightStrip.css';

const TOTAL_HOURS = 26; // GMT-12 to GMT+14
const AXIS_LABELS = [-12, -8, -4, 0, 4, 8, 12];

function pctFromOffset(offset) {
  return ((offset + 12) / TOTAL_HOURS) * 100;
}

export default function DayNightStrip({ cities, solarMap }) {
  const gradient = useMemo(() => buildStripGradient(new Date()), []);
  const nowOffset = useMemo(() => getUTCOffset(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ), []);

  return (
    <div className="dns-wrapper" data-testid="day-night-strip">
      <div className="dns-axis">
        <span className="dns-gmt-label">GMT</span>
        {AXIS_LABELS.map(h => (
          <span
            key={h}
            className="dns-tick"
            style={{ left: `${pctFromOffset(h)}%` }}
          >
            {h >= 0 ? `+${h}` : h}
          </span>
        ))}
      </div>

      <div className="dns-bar" style={{ background: gradient }}>
        {cities.map(city => {
          const solar = solarMap[city.name];
          if (!solar) return null;
          return (
            <div
              key={city.name}
              className="dns-pin"
              style={{ left: `${pctFromOffset(solar.utcOffset)}%` }}
            >
              <span className="dns-pin-icon">{solar.isDay ? '☀️' : '🌙'}</span>
              <div className="dns-pin-line" />
              <span className="dns-pin-label">{city.name}</span>
            </div>
          );
        })}

        <div
          className="dns-now"
          style={{ left: `${pctFromOffset(nowOffset)}%` }}
        >
          <span className="dns-now-label">NOW</span>
          <div className="dns-now-line" />
        </div>
      </div>
    </div>
  );
}
