// Your OpenWeatherMap API Key
const API_KEY = 'YOUR_API_KEY_HERE';  // Replace with your actual API key
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM references
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherDisplay = document.getElementById('weather-display');

// Show loading UI
function showLoading() {
    const loadingHTML = `
        <div class="loading-container">
            <div class="spinner" aria-hidden="true"></div>
            <div class="loading">Loading...</div>
        </div>
    `;
    weatherDisplay.innerHTML = loadingHTML;
}

// Show error message
function showError(message) {
    const errorHTML = `
        <div class="error-message">
            <strong>❌ Error</strong>
            <div>${message}</div>
        </div>
    `;
    weatherDisplay.innerHTML = errorHTML;
}

// Fetch weather using async/await
async function getWeather(city) {
    showLoading();
    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.textContent = 'Searching...';
    }

    const url = `${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    try {
        const response = await axios.get(url);
        console.log('Weather Data:', response.data);
        displayWeather(response.data);
    } catch (error) {
        console.error('Error:', error);
        if (error.response && error.response.status === 404) {
            showError('City not found. Please check the spelling and try again.');
        } else {
            showError('Something went wrong. Please try again later.');
        }
    } finally {
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.textContent = '🔍 Search';
        }
    }
}

// Display weather data
function displayWeather(data) {
    const cityName = data.name;
    const temperature = Math.round(data.main.temp);
    const description = data.weather[0].description;
    const icon = data.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;

    const weatherHTML = `
        <div class="weather-info">
            <h2 class="city-name">${cityName}</h2>
            <img src="${iconUrl}" alt="${description}" class="weather-icon">
            <div class="temperature">${temperature}°C</div>
            <p class="description">${description}</p>
        </div>
    `;

    weatherDisplay.innerHTML = weatherHTML;

    // Return focus to input for quick follow-up searches
    if (cityInput) cityInput.focus();
}

// Search handler with validation
function handleSearch() {
    if (!cityInput) return;
    const city = cityInput.value.trim();

    if (!city) {
        showError('Please enter a city name.');
        return;
    }

    if (city.length < 2) {
        showError('City name too short. Please enter at least 2 characters.');
        return;
    }

    // Clear input for UX
    cityInput.value = '';
    getWeather(city);
}

// Event listeners
if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
}

if (cityInput) {
    cityInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
}

// Initial welcome message
weatherDisplay.innerHTML = `
    <div class="welcome-message">
        <p>Welcome! Enter a city name to get started.</p>
    </div>
`;
// Wire up clear history button
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
}

// Initial setup: load recent searches and last city
loadRecentSearches();
loadLastCity();

