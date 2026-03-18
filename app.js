// API key: uses CONFIG.API_KEY if config.js is present, otherwise falls back to placeholder
const API_KEY = (typeof CONFIG !== 'undefined' && CONFIG.API_KEY) ? CONFIG.API_KEY : 'YOUR_API_KEY_HERE';
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

// DOM references
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const weatherDisplay = document.getElementById('weather-display');
const recentSearchesSection = document.getElementById('recent-searches-section');
const recentSearchesContainer = document.getElementById('recent-searches-container');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// Recent searches storage
let recentSearches = [];
const maxRecentSearches = 5;

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

// Recent searches: load from localStorage
function loadRecentSearches() {
    try {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            recentSearches = JSON.parse(saved);
        }
    } catch (e) {
        recentSearches = [];
    }
    displayRecentSearches();
}

function saveRecentSearch(city) {
    if (!city) return;
    const cityName = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
    const index = recentSearches.indexOf(cityName);
    if (index > -1) recentSearches.splice(index, 1);
    recentSearches.unshift(cityName);
    if (recentSearches.length > maxRecentSearches) recentSearches.pop();
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    displayRecentSearches();
}

function displayRecentSearches() {
    if (!recentSearchesContainer || !recentSearchesSection) return;
    recentSearchesContainer.innerHTML = '';
    if (!recentSearches || recentSearches.length === 0) {
        recentSearchesSection.style.display = 'none';
        return;
    }
    recentSearchesSection.style.display = 'block';
    recentSearches.forEach(function(city) {
        const btn = document.createElement('button');
        btn.className = 'recent-search-btn';
        btn.textContent = city;
        btn.addEventListener('click', function() {
            if (cityInput) cityInput.value = city;
            getWeather(city);
        });
        recentSearchesContainer.appendChild(btn);
    });
}

function clearHistory() {
    if (!confirm('Clear all recent searches?')) return;
    recentSearches = [];
    localStorage.removeItem('recentSearches');
    displayRecentSearches();
}

function loadLastCity() {
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
        getWeather(lastCity);
    } else {
        showWelcome();
    }
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
        // Save this successful search and remember as last city
        try {
            saveRecentSearch(city);
            localStorage.setItem('lastCity', city);
        } catch (e) {
            // ignore storage errors
        }
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
            searchBtn.textContent = 'Search';
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

// Wire up clear history button
if (clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', clearHistory);
}

// Initial setup: load recent searches and last city
loadRecentSearches();
loadLastCity();

