// -------------------------
// CONFIG: Replace with your OpenWeatherMap API key
// -------------------------
const API_KEY = '49f8da99d61ce2a5bdb1717f51f6a588';

// API endpoints
const geocodeBase = 'https://api.openweathermap.org/geo/1.0/direct';
const forecastBase = 'https://api.openweathermap.org/data/2.5/forecast';
const weatherBase = 'https://api.openweathermap.org/data/2.5/weather';

// UI elements
const input = document.getElementById('city');
const btn = document.getElementById('searchBtn');
const currentTemp = document.getElementById('currentTemp');
const currentDesc = document.getElementById('currentDesc');
const currentIcon = document.getElementById('currentIcon');
const currentMeta = document.getElementById('currentMeta');
const forecastEl = document.getElementById('forecast');
const extrasEl = document.getElementById('extras');

// Search handlers
btn.addEventListener('click', () => {
  const q = input.value.trim();
  if (!q) { alert('Please type a city name (e.g. Lagos)'); return; }
  fetchWeatherForCity(q);
});
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') btn.click();
});

// Fetch weather
async function fetchWeatherForCity(city) {
  try {
    setLoadingState(true);
    // 1) Geocode city
    const geoUrl = `${geocodeBase}?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
    const geoResp = await fetch(geoUrl);
    if (!geoResp.ok) throw new Error('Geocoding failed');
    const geoData = await geoResp.json();
    if (!geoData || geoData.length === 0) throw new Error('City not found');
    const { lat, lon, name, country, state } = geoData[0];
    const displayName = `${name}${state ? ', ' + state : ''}, ${country}`;

    // 2) Current weather
    const wUrl = `${weatherBase}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const wResp = await fetch(wUrl);
    if (!wResp.ok) throw new Error('Weather fetch failed');
    const w = await wResp.json();

    // 3) Forecast
    const fUrl = `${forecastBase}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const fResp = await fetch(fUrl);
    if (!fResp.ok) throw new Error('Forecast fetch failed');
    const f = await fResp.json();

    renderCurrent(w, displayName);
    renderForecast(f);
  } catch (err) {
    console.error(err);
    alert('Error: ' + (err.message || err));
  } finally {
    setLoadingState(false);
  }
}

// Render current weather
function renderCurrent(w, locationName){
  const temp = Math.round(w.main.temp);
  const desc = w.weather && w.weather[0] ? w.weather[0].description : '—';
  const iconCode = w.weather && w.weather[0] ? w.weather[0].icon : '01d';
  currentTemp.textContent = `${temp} °C`;
  currentDesc.textContent = desc;
  currentIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  currentIcon.alt = desc;
  currentMeta.textContent = `${locationName} • Feels like ${Math.round(w.main.feels_like)}°C`;

  const sunrise = new Date((w.sys.sunrise || 0) * 1000);
  const sunset = new Date((w.sys.sunset || 0) * 1000);
  extrasEl.innerHTML = '';
  extrasEl.appendChild(createInfoItem(`Humidity: ${w.main.humidity}%`));
  extrasEl.appendChild(createInfoItem(`Wind: ${Math.round(w.wind.speed)} m/s`));
  extrasEl.appendChild(createInfoItem(`Sunrise: ${padTime(sunrise)}`));
  extrasEl.appendChild(createInfoItem(`Sunset: ${padTime(sunset)}`));
}

function createInfoItem(text){
  const d = document.createElement('div');
  d.className = 'info-item';
  d.textContent = text;
  return d;
}
function padTime(date){
  if (!date || isNaN(date)) return '—';
  return date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
}

// Render forecast
function renderForecast(forecastData){
  const list = forecastData.list || [];
  const byDate = {};
  list.forEach(item => {
    const dtTxt = item.dt_txt;
    const date = dtTxt.split(' ')[0];
    if (!byDate[date]) byDate[date] = item;
    if (dtTxt.endsWith('12:00:00')) byDate[date] = item;
  });
  const dates = Object.keys(byDate).slice(0,6);
  const dayItems = dates.map(d => ({ date:d, item:byDate[d] })).slice(0,5);

  forecastEl.innerHTML = '';
  dayItems.forEach(d => {
    const item = d.item;
    const date = new Date(item.dt * 1000);
    const weekday = date.toLocaleDateString(undefined,{weekday:'short'});
    const icon = item.weather[0].icon;
    const desc = item.weather[0].description;
    const tempMin = Math.round(item.main.temp_min);
    const tempMax = Math.round(item.main.temp_max);

    const card = document.createElement('div');
    card.className = 'day-card';
    card.innerHTML = `
      <small>${weekday}<br>${date.toLocaleDateString()}</small>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}" />
      <div class="day-temp">${tempMax}° / ${tempMin}°</div>
      <div class="day-desc">${desc}</div>
    `;
    forecastEl.appendChild(card);
  });
  if (dayItems.length === 0) {
    forecastEl.innerHTML = '<p style="color:var(--muted)">No forecast available.</p>';
  }
}

function setLoadingState(loading){
  btn.disabled = loading;
  btn.textContent = loading ? 'Loading…' : 'Search';
}

// Default city
(function init(){
  const defaultCity = 'Lagos';
  input.value = defaultCity;
  fetchWeatherForCity(defaultCity);
})();
