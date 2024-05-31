// Gets the weather data through API
function populateAPIWidgets(apiKey) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {

            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            populateLocationWidget(apiKey, lat, lon);
            populateAirQualityWidget(apiKey, lat, lon);
            populateTemperatureWidget(apiKey, lat, lon);

        }, error => {
            console.error('Error getting location:', error);
        }
        );
    } else {
        console.error('Geolocation is not supported by this browser.');
    }
}

// Gets locationdata through API
function populateLocationWidget(apiKey, lat, lon) {
    const apiURL = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const widget = document.getElementById('locationCard');

    fetch(apiURL)
        .then(response => response.json())
        .then(locationData => {
            const cityName = locationData[0].name;
            const stateName = locationData[0].state;
            widget.querySelector(".indexCardTitle").textContent = cityName;
            widget.querySelector(".indexCardContent").textContent = stateName;
        })
        .catch(error => {
            console.error('Error fetching location data:', error);
        });
}

// Gets Air Quality data through API
function populateAirQualityWidget(apiKey, lat, lon) {
    const apiURL = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;
    const widget = document.getElementById('airQualityCard');

    fetch(apiURL)
        .then(response => response.json())
        .then(data => {
            const airQualityIndex = data.list[0].main.aqi;
            widget.querySelector(".indexCardTitle").textContent = "AQI " + airQualityIndex;
            widget.querySelector(".indexCardContent").textContent = "Quality: " + getAirQualityDescription(airQualityIndex);
        })
        .catch(error => {
            console.error('Error fetching air quality data:', error);
        });
}

// Pushes string to reflect air quality data
function getAirQualityDescription(aqi) {
    switch (aqi) {
        case 1:
            return "Good";
        case 2:
            return "Fair";
        case 3:
            return "Moderate";
        case 4:
            return "Poor";
        case 5:
            return "Very Poor";
        default:
            return "Invalid AQI";
    }
}

// Gets temperature data
function populateTemperatureWidget(apiKey, lat, lon) {
    const apiURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const widget = document.getElementById('outdoorTemperatureCard');

    fetch(apiURL)
        .then(response => response.json())
        .then(data => {
            const temperature = data.main.temp;
            widget.querySelector(".indexCardTitle").textContent = temperature + "°C";
        })
        .catch(error => {
            console.error('Error fetching temperature data:', error);
        });
}