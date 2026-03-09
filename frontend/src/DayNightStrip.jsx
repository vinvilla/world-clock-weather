import { useState } from 'react';
import { buildStripGradient, getUTCOffset } from './utils/solar';
import './DayNightStrip.css';

const TOTAL_HOURS = 26; // GMT-12 to GMT+14
const AXIS_LABELS = [-12, -8, -4, 0, 4, 8, 12];
const SNAP_THRESHOLD = 1.5; // UTC hours

function pctFromOffset(offset) {
  return ((offset + 12) / TOTAL_HOURS) * 100;
}

function formatOffset(offset) {
  const sign = offset >= 0 ? '+' : '';
  const absH = Math.abs(offset);
  const h = Math.floor(absH);
  const m = Math.round((absH - h) * 60);
  const neg = offset < 0 ? '-' : '';
  return m > 0 ? `GMT ${neg}${h}:${String(m).padStart(2, '0')}` : `GMT ${sign}${offset}`;
}

function localTimeAtOffset(offset) {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utcMs + offset * 3600000);
  return local.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function DayNightStrip({ cities, solarMap }) {
  if (!cities || !solarMap) return null;

  const gradient = buildStripGradient(new Date());
  const nowOffset = getUTCOffset(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [tooltip, setTooltip] = useState(null);

  function handleMouseMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    const rawOffset = pct * TOTAL_HOURS - 12;
    const offset = Math.round(rawOffset * 2) / 2;

    const nearestCity = cities.find(c => {
      const solar = solarMap[c.name];
      return solar && Math.abs(solar.utcOffset - rawOffset) < SNAP_THRESHOLD;
    }) || null;

    const tooltipX = Math.min(Math.max(pct * 100, 5), 95);
    setTooltip({ x: tooltipX, offset, city: nearestCity });
  }

  function handleMouseLeave() {
    setTooltip(null);
  }

  return (
    <div className="dns-wrapper" data-testid="day-night-strip">
      <div className="dns-axis">
        <span className="dns-gmt-label">GMT</span>
        {AXIS_LABELS.map(h => (
          <span key={h} className="dns-tick" style={{ left: `${pctFromOffset(h)}%` }}>
            {h >= 0 ? `+${h}` : h}
          </span>
        ))}
      </div>

      <div
        className="dns-bar"
        style={{ background: gradient }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        data-testid="dns-bar"
      >
        {cities.map(city => {
          const solar = solarMap[city.name];
          if (!solar) return null;
          return (
            <div key={city.name} className="dns-pin" style={{ left: `${pctFromOffset(solar.utcOffset)}%` }}>
              <span className="dns-pin-icon">{solar.isDay ? '☀️' : '🌙'}</span>
              <div className="dns-pin-line" />
              <span className="dns-pin-label">{city.name}</span>
            </div>
          );
        })}

        <div className="dns-now" style={{ left: `${pctFromOffset(nowOffset)}%` }}>
          <span className="dns-now-label">NOW</span>
          <div className="dns-now-line" />
        </div>

        {tooltip && (
          <div
            className="dns-tooltip"
            style={{ left: `${tooltip.x}%` }}
            data-testid="dns-tooltip"
          >
            <div className="dns-tooltip-offset">{formatOffset(tooltip.offset)}</div>
            <div className="dns-tooltip-time">{localTimeAtOffset(tooltip.offset)}</div>
            {tooltip.city && (() => {
              const solar = solarMap[tooltip.city.name];
              return (
                <>
                  <div className="dns-tooltip-city">
                    {solar.isDay ? '☀️' : '🌙'} {tooltip.city.name}
                  </div>
                  <div className="dns-tooltip-sun">↑{solar.sunrise} ↓{solar.sunset}</div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
