const CONFIG = {
    API_KEY: 'JW4Y277F9AQERBFM6RHGZ3AH4',
    WEATHER_API_BASE_URL: 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/',
    TIME_API_BASE_URL: 'http://worldtimeapi.org/api/timezone/',
    DEFAULT_CITY: 'Seoul'
};

const WEATHER_ICON_MAP = {
    "partly-cloudy-day": "icons/partly-cloudy-day.png",
    "partly-cloudy-night": "icons/partly-cloudy-night.png",
    "cloudy-day": "icons/cloudy-day.png",
    "cloudy-night": "icons/cloudy-night.png",
    "clear-day": "icons/clear-day.png",
    "clear-night": "icons/clear-night.png",
    "rain": "icons/rain.png",
    "snow": "icons/snow.png",
    "thunderstorm": "icons/thunderstorm.png",
    "smoke": "icons/smoke.png",
    "default": "icons/default.png"
};


const createElement = (tag, className, textContent = '') => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
};

const formatTime = (timeString) => {
    return timeString.slice(0, 5);
};


class WeatherService {
    static async getWeatherData(city) {
        const response = await fetch(`${CONFIG.WEATHER_API_BASE_URL}${city}?unitGroup=metric&key=${CONFIG.API_KEY}&contentType=json`);
        if (!response.ok) throw new Error("City not found or API error");
        return response.json();
    }

    static async getTimeData(timezone) {
        const response = await fetch(`${CONFIG.TIME_API_BASE_URL}${timezone}`);
        return response.json();
    }
}


class WeatherUI {
    static clearUI() {
        ['first', 'second'].forEach(columnClass => {
            document.querySelector(`.${columnClass}.column`).innerHTML = '';
        });
        document.querySelector('.week').innerHTML = '';
    }

    static showLoading(show) {
        document.getElementById('loading').classList.toggle('hidden', !show);
    }

    static showError(message) {
        const errorElement = createElement('p', 'err', message);
        document.querySelector('.first.column').appendChild(errorElement);
    }

    static buildFirstColumn(weatherData, timeData) {
        const column = document.querySelector('.first.column');
        const fragments = [
            this.buildDescription(weatherData.currentConditions.conditions),
            this.buildCity(weatherData.address),
            this.buildDateTime(timeData),
            this.buildTemp(weatherData.currentConditions.temp),
            this.buildIcon(weatherData.currentConditions.icon),
            this.buildSearch()
        ];
        column.append(...fragments);
    }

    static buildSecondColumn(weatherData) {
        const column = document.querySelector('.second.column');
        const blocks = [
            { text: "Feels Like", property: "feelslike", icon: "./images/feelslike.png", unit: "℃" },
            { text: "Humidity", property: "humidity", icon: "./images/humidity.png", unit: "%" },
            { text: "Chance of Precipitation", property: "precipprob", icon: "./images/rainn.png", unit: "%" },
            { text: "Wind Speed", property: "windspeed", icon: "./images/wind.png", unit: " km/h" }
        ];
        blocks.forEach(block => {
            column.appendChild(this.buildBlock(weatherData, block));
        });
    }

    static buildWeek(weatherData, startDayIndex) {
        const weekContainer = document.querySelector('.week');
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        weatherData.days.slice(1, 8).forEach((day, index) => {
            const dayName = daysOfWeek[(startDayIndex + index + 1) % 7];
            weekContainer.appendChild(this.buildCard(dayName, day));
        });
    }

    static buildDescription(desc) {
        return createElement('div', 'description', desc);
    }

    static buildCity(city) {
        return createElement('div', 'city', city);
    }

    static buildDateTime(timeData) {
        const dateTime = createElement('div', 'dateTime');
        dateTime.appendChild(createElement('p', '', formatDate(timeData.datetime)));
        dateTime.appendChild(createElement('p', '', formatTime(timeData.datetime)));
        return dateTime;
    }

    static buildTemp(temp) {
        return createElement('div', 'temp', `${temp}℃`);
    }

    static buildIcon(iconKey) {
        const img = createElement('img', 'icon');
        img.src = WEATHER_ICON_MAP[iconKey] || WEATHER_ICON_MAP.default;
        return img;
    }

    static buildSearch() {
        const search = createElement('div', 'search');
        const input = createElement('input');
        input.placeholder = "Search City...";
        const button = createElement('button');
        
        button.addEventListener('click', () => WeatherApp.getTemperature(input.value));
        input.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') WeatherApp.getTemperature(input.value);
        });

        search.append(input, button);
        return search;
    }

    static buildBlock(weatherData, { text, property, icon, unit }) {
        const block = createElement('div');
        const img = createElement('img');
        img.src = icon;
        const textContainer = createElement('div');
        textContainer.appendChild(createElement('p', '', text));
        textContainer.appendChild(createElement('p', '', `${weatherData.currentConditions[property]}${unit}`));
        block.append(img, textContainer);
        return block;
    }

    static buildCard(day, dayData) {
        const card = createElement('div', 'card');
        card.appendChild(createElement('p', '', day));
        const temp = createElement('div');
        temp.appendChild(createElement('p', '', `${dayData.tempmax}℃`));
        temp.appendChild(createElement('p', '', `${dayData.tempmin}℃`));
        card.appendChild(temp);
        card.appendChild(this.buildIcon(dayData.icon));
        return card;
    }
}


class WeatherApp {
    static lastValidData = null;
    static lastCity = null;

    static async getTemperature(city) {
        try {
            WeatherUI.clearUI();
            WeatherUI.showLoading(true);
            this.lastCity = city;

            const weatherData = await WeatherService.getWeatherData(city);
            this.lastValidData = weatherData;

            const timeData = await WeatherService.getTimeData(weatherData.timezone);
            
            WeatherUI.buildFirstColumn(weatherData, timeData);
            WeatherUI.buildSecondColumn(weatherData);
            WeatherUI.buildWeek(weatherData, timeData.day_of_week);

            WeatherUI.showLoading(false);
        } catch (error) {
            console.error(error);
            if (this.lastValidData) {
                WeatherUI.buildFirstColumn(this.lastValidData, await WeatherService.getTimeData(this.lastValidData.timezone));
                WeatherUI.buildSecondColumn(this.lastValidData);
                WeatherUI.buildWeek(this.lastValidData, (new Date()).getDay());
                document.querySelector("input").value = this.lastCity;
            }
            WeatherUI.showLoading(false);
            WeatherUI.showError("Enter a valid city");
        }
    }

    static init() {
        this.getTemperature(CONFIG.DEFAULT_CITY);
    }
}


WeatherApp.init();