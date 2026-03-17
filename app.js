// Part 3: OOP with prototypes and 5-day forecast
function WeatherApp(apiKey) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';

    // DOM references
    this.searchBtn = document.getElementById('search-btn');
    this.cityInput = document.getElementById('city-input');
    this.weatherDisplay = document.getElementById('weather-display');

    this.init();
}

WeatherApp.prototype.init = function() {
    if (!this.searchBtn || !this.cityInput || !this.weatherDisplay) return;

    this.searchBtn.addEventListener('click', this.handleSearch.bind(this));

    this.cityInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            this.handleSearch();
        }
    }.bind(this));

    this.showWelcome();
};

WeatherApp.prototype.showWelcome = function() {
    const welcomeHTML = `
        <div class="welcome-message">
            <div class="welcome-emoji">☀️</div>
            <h2>Welcome to Skyfetch</h2>
            <p>Enter a city above and press <strong>Search</strong> or <strong>Enter</strong> to view current weather and a 5-day forecast.</p>
        </div>
    `;
    this.weatherDisplay.innerHTML = welcomeHTML;
};

WeatherApp.prototype.handleSearch = function() {
    const city = this.cityInput.value.trim();
    if (!city) { this.showError('Please enter a city name.'); return; }
    if (city.length < 2) { this.showError('Please enter at least 2 characters.'); return; }

    this.getWeather(city);
    this.cityInput.value = '';
};

WeatherApp.prototype.showLoading = function() {
    const loadingHTML = `
        <div class="loading-container">
            <div class="spinner" aria-hidden="true"></div>
            <p>Loading weather...</p>
        </div>
    `;
    this.weatherDisplay.innerHTML = loadingHTML;
};

WeatherApp.prototype.showError = function(message) {
    const errorHTML = `
        <div class="error-message">
            <div class="error-emoji">⚠️</div>
            <h3>Error</h3>
            <p>${message}</p>
        </div>
    `;
    this.weatherDisplay.innerHTML = errorHTML;
};

WeatherApp.prototype.getForecast = async function(city) {
    const url = `${this.forecastUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw res;
        const data = await res.json();
        return data;
    } catch (error) {
        console.error('Error fetching forecast:', error);
        throw error;
    }
};

WeatherApp.prototype.processForecastData = function(data) {
    if (!data || !data.list) return [];
    const daily = data.list.filter(function(item) {
        return item.dt_txt && item.dt_txt.includes('12:00:00');
    }).slice(0, 5);

    // Fallback: if less than 5 items, pick one item per day
    if (daily.length < 5) {
        const byDate = {};
        data.list.forEach(function(item) {
            const date = item.dt_txt.split(' ')[0];
            if (!byDate[date]) byDate[date] = item;
        });
        return Object.keys(byDate).slice(0, 5).map(d => byDate[d]);
    }

    return daily;
};

WeatherApp.prototype.displayWeather = function(data) {
    if (!data) return;
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const weatherHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <div class="current-row">
                <img class="weather-icon" src="${iconUrl}" alt="${description}" />
                <div class="temp-desc">
                    <div class="temp">${temperature}°C</div>
                    <div class="desc">${description}</div>
                </div>
            </div>
        </div>
    `;

    this.weatherDisplay.innerHTML = weatherHTML;
    this.cityInput.focus();
};

WeatherApp.prototype.displayForecast = function(data) {
    const dailyForecasts = this.processForecastData(data);
    if (!dailyForecasts || dailyForecasts.length === 0) return;

    const forecastHTML = dailyForecasts.map(function(day) {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(day.main.temp);
        const description = day.weather[0].description;
        const icon = day.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

        return `
            <div class="forecast-card">
                <h4 class="forecast-day">${dayName}</h4>
                <img src="${iconUrl}" alt="${description}" class="forecast-icon" />
                <div class="forecast-temp">${temp}°C</div>
                <div class="forecast-desc">${description}</div>
            </div>
        `;
    }).join('');

    const forecastSection = `
        <div class="forecast-section">
            <h3 class="forecast-title">5-Day Forecast</h3>
            <div class="forecast-container">
                ${forecastHTML}
            </div>
        </div>
    `;

    this.weatherDisplay.innerHTML += forecastSection;
};

WeatherApp.prototype.getWeather = async function(city) {
    this.showLoading();
    this.searchBtn.disabled = true;
    this.searchBtn.textContent = 'Searching...';

    const currentUrl = `${this.apiUrl}?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;

    try {
        const [currentRes, forecastData] = await Promise.all([
            fetch(currentUrl).then(r => { if (!r.ok) throw r; return r.json(); }),
            this.getForecast(city)
        ]);

        this.displayWeather(currentRes);
        this.displayForecast(forecastData);
    } catch (error) {
        console.error('Error:', error);
        if (error && error.status === 404) {
            this.showError('City not found. Please check spelling.');
        } else if (error && error instanceof Response && error.status === 404) {
            this.showError('City not found. Please check spelling.');
        } else {
            this.showError('Something went wrong. Please try again.');
        }
    } finally {
        this.searchBtn.disabled = false;
        this.searchBtn.textContent = 'Search';
    }
};

// Create app instance (replace YOUR_API_KEY below with your OpenWeatherMap key)
const app = new WeatherApp('YOUR_API_KEY');

// Expose for console debugging
window.app = app;
