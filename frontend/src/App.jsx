import { useState, useEffect, useRef } from 'react';
import CityCard from './CityCard';
import AiPanel from './AiPanel';
import DayNightStrip from './DayNightStrip';
import AuthOverlay from './AuthOverlay';
import AddCityCard from './AddCityCard';
import { getSolarData, getMoonData } from './utils/solar';
import { supabase } from './supabase';
import './App.css';

const DEFAULT_CITIES = [
  { name: 'New York',    timezone: 'America/New_York',    owm_query: 'New York,US',    lat: 40.71, lon: -74.01  },
  { name: 'Los Angeles', timezone: 'America/Los_Angeles', owm_query: 'Los Angeles,US', lat: 34.05, lon: -118.24 },
  { name: 'London',      timezone: 'Europe/London',       owm_query: 'London,GB',      lat: 51.51, lon: -0.13   },
  { name: 'Chennai',     timezone: 'Asia/Kolkata',        owm_query: 'Chennai,IN',     lat: 13.08, lon: 80.27   },
  { name: 'Singapore',   timezone: 'Asia/Singapore',      owm_query: 'Singapore,SG',   lat: 1.35,  lon: 103.82  },
];

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

async function fetchWeather(query) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=imperial`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return { temp: Math.round(data.main.temp), condition: data.weather[0].description, iconCode: data.weather[0].icon, error: false };
}

function buildSolarMap(cities, date) {
  return Object.fromEntries(
    cities.map(city => [
      city.name,
      { ...getSolarData(city, date), moon: getMoonData(date, city.timezone) },
    ])
  );
}

async function loadUserCities(userId) {
  const { data, error } = await supabase
    .from('user_cities')
    .select('*')
    .eq('user_id', userId)
    .order('position');
  if (error) throw error;
  if (data.length === 0) {
    const rows = DEFAULT_CITIES.map((c, i) => ({ ...c, user_id: userId, position: i + 1 }));
    const { data: inserted } = await supabase.from('user_cities').insert(rows).select();
    return inserted || DEFAULT_CITIES.map((c, i) => ({ ...c, id: String(i), user_id: userId, position: i + 1 }));
  }
  return data;
}

function App() {
  const [session, setSession]                     = useState(undefined); // undefined=loading, null=logged out
  const [cities, setCities]                       = useState([]);
  const [weatherMap, setWeatherMap]               = useState({});
  const [weatherLoading, setWeatherLoading]       = useState(false);
  const [highlightedCities, setHighlightedCities] = useState(null);
  const [solarMap, setSolarMap]                   = useState({});
  const citiesRef                                 = useRef([]);

  useEffect(() => { citiesRef.current = cities; }, [cities]);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load cities + weather when session available
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    async function init() {
      const loaded = await loadUserCities(session.user.id);
      if (cancelled) return;
      setCities(loaded);
      setSolarMap(buildSolarMap(loaded, new Date()));
      setWeatherLoading(true);
      const results = await Promise.allSettled(loaded.map(c => fetchWeather(c.owm_query)));
      if (cancelled) return;
      const map = {};
      results.forEach((r, i) => {
        map[loaded[i].name] = r.status === 'fulfilled' ? r.value : { error: true };
      });
      setWeatherMap(map);
      setWeatherLoading(false);
    }
    init().catch(err => console.error('Failed to load cities:', err));

    const solarInterval = setInterval(() => {
      setSolarMap(buildSolarMap(citiesRef.current, new Date()));
    }, 60_000);

    return () => { cancelled = true; clearInterval(solarInterval); };
  }, [session]);

  async function handleAddCity(cityData) {
    if (cities.length >= 6) return;
    const newCity = { ...cityData, user_id: session.user.id, position: cities.length + 1 };
    const { data } = await supabase.from('user_cities').insert([newCity]).select();
    const saved = data?.[0] ?? { ...newCity, id: Date.now().toString() };
    const next = [...cities, saved];
    setCities(next);
    setSolarMap(buildSolarMap(next, new Date()));
    try {
      const w = await fetchWeather(saved.owm_query);
      setWeatherMap(m => ({ ...m, [saved.name]: w }));
    } catch {
      setWeatherMap(m => ({ ...m, [saved.name]: { error: true } }));
    }
  }

  async function handleRemoveCity(cityId) {
    await supabase.from('user_cities').delete().eq('id', cityId);
    const next = cities.filter(c => c.id !== cityId);
    setCities(next);
    setSolarMap(buildSolarMap(next, new Date()));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setCities([]);
    setWeatherMap({});
    setSolarMap({});
  }

  if (session === undefined) return null;

  if (session === null) {
    return <AuthOverlay onLogin={() => {}} />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>World Clock & Weather</h1>
        <p>Live time and weather across your cities</p>
        <button className="auth-signout-btn" onClick={handleSignOut}>Sign out</button>
      </header>

      <DayNightStrip cities={cities} solarMap={solarMap} />

      <div className="city-grid">
        {cities.map(city => (
          <CityCard
            key={city.id || city.name}
            city={city.name}
            timezone={city.timezone}
            weatherData={weatherMap[city.name]}
            loading={weatherLoading}
            dimmed={highlightedCities !== null && !highlightedCities.includes(city.name)}
            solarData={solarMap[city.name]}
            onRemove={() => handleRemoveCity(city.id)}
          />
        ))}
        {cities.length < 6 && <AddCityCard onAdd={handleAddCity} />}
      </div>

      <AiPanel
        weatherData={weatherMap}
        onSearchResult={setHighlightedCities}
      />
    </div>
  );
}

export default App;
