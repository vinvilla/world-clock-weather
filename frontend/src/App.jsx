import { useState, useEffect } from 'react';
import CityCard from './CityCard';
import AiPanel from './AiPanel';
import DayNightStrip from './DayNightStrip';
import { getSolarData, getMoonData } from './utils/solar';
import './App.css';

const CITIES = [
  { name: 'New York',    timezone: 'America/New_York',    query: 'New York,US',    lat: 40.71,  lon: -74.01  },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', query: 'Los Angeles,US', lat: 34.05,  lon: -118.24 },
  { name: 'London',      timezone: 'Europe/London',       query: 'London,GB',      lat: 51.51,  lon: -0.13   },
  { name: 'Chennai',     timezone: 'Asia/Kolkata',        query: 'Chennai,IN',     lat: 13.08,  lon: 80.27   },
  { name: 'Singapore',   timezone: 'Asia/Singapore',      query: 'Singapore,SG',   lat: 1.35,   lon: 103.82  },
];

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

async function fetchWeather(query) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=imperial`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return {
    temp: Math.round(data.main.temp),
    condition: data.weather[0].description,
    iconCode: data.weather[0].icon,
    error: false,
  };
}

function buildSolarMap(date) {
  return Object.fromEntries(
    CITIES.map(city => [
      city.name,
      {
        ...getSolarData(city, date),
        moon: getMoonData(date, city.timezone),
      },
    ])
  );
}

function App() {
  const [weatherMap, setWeatherMap]               = useState({});
  const [loading, setLoading]                     = useState(true);
  const [highlightedCities, setHighlightedCities] = useState(null);
  const [solarMap, setSolarMap]                   = useState(() => buildSolarMap(new Date()));

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled(
        CITIES.map(c => fetchWeather(c.query))
      );
      const map = {};
      results.forEach((result, i) => {
        map[CITIES[i].name] = result.status === 'fulfilled'
          ? result.value
          : { error: true };
      });
      setWeatherMap(map);
      setLoading(false);
    };
    load();

    const solarInterval = setInterval(() => {
      setSolarMap(buildSolarMap(new Date()));
    }, 60_000);

    return () => clearInterval(solarInterval);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>World Clock & Weather</h1>
        <p>Live time and weather across your cities</p>
      </header>

      <DayNightStrip cities={CITIES} solarMap={solarMap} />

      <div className="city-grid">
        {CITIES.map(city => (
          <CityCard
            key={city.name}
            city={city.name}
            timezone={city.timezone}
            weatherData={weatherMap[city.name]}
            loading={loading}
            dimmed={highlightedCities !== null && !highlightedCities.includes(city.name)}
            solarData={solarMap[city.name]}
          />
        ))}
      </div>

      <AiPanel
        weatherData={weatherMap}
        onSearchResult={setHighlightedCities}
      />
    </div>
  );
}

export default App;
