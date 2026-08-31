const WTTR_BASE_URL = "https://wttr.in";
const DEFAULT_LOCATION = "Bangkok";

const state = {
  weather: null,
  query: DEFAULT_LOCATION,
  coords: null,
  period: "today",
  condition: "all",
  units: "metric",
};

const elements = {
  dashboard: document.querySelector("#dashboard"),
  locationForm: document.querySelector("#location-form"),
  locationInput: document.querySelector("#location-input"),
  geoButton: document.querySelector("#geo-button"),
  systemLine: document.querySelector("#system-line"),
  systemMessage: document.querySelector("#system-message"),
  weatherArt: document.querySelector("#weather-art"),
  locationName: document.querySelector("#location-name"),
  condition: document.querySelector("#condition"),
  temperature: document.querySelector("#temperature"),
  feelsLike: document.querySelector("#feels-like"),
  metrics: document.querySelector("#metrics"),
  queryValue: document.querySelector("#query-value"),
  updatedValue: document.querySelector("#updated-value"),
  unitsValue: document.querySelector("#units-value"),
  coordinates: document.querySelector("#coordinates"),
  forecastTitle: document.querySelector("#forecast-title"),
  forecastGrid: document.querySelector("#forecast-grid"),
  resultCount: document.querySelector("#result-count"),
  emptyState: document.querySelector("#empty-state"),
  terminalClock: document.querySelector("#terminal-clock"),
  resetFilters: document.querySelector("#reset-filters"),
  clearCondition: document.querySelector("#clear-condition"),
  aboutTab: document.querySelector("#about-tab"),
  helpDialog: document.querySelector("#help-dialog"),
  closeHelp: document.querySelector("#close-help"),
};

const weatherArt = {
  clear: ["    \\   /    ", "     .-.     ", "  ― (   ) ―  ", "     `-’     ", "    /   \\    "].join("\n"),
  cloudy: ["             ", "     .--.    ", "  .-(    ).  ", " (___.__)__) "].join("\n"),
  rain: ["     .-.     ", "    (   ).   ", "   (___(__)  ", "   ‘ ‘ ‘ ‘   ", "  ‘ ‘ ‘ ‘    "].join("\n"),
  storm: ["     .-.     ", "    (   ).   ", "   (___(__)  ", "    ⚡‘ ‘⚡   ", "   ‘ ‘ ‘ ‘   "].join("\n"),
  snow: ["     .-.     ", "    (   ).   ", "   (___(__)  ", "   *  *  *   ", "  *  *  *    "].join("\n"),
  mist: ["             ", "  _ - _ - _  ", "   _ - _ -   ", "  _ - _ - _  ", "             "].join("\n"),
};

function setClock() {
  elements.terminalClock.textContent = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

function setSystemMessage(message, type = "loading") {
  const prefixes = { loading: "[··]", success: "[ok]", error: "[!!]" };
  elements.systemLine.className = `system-line is-${type}`;
  elements.systemLine.querySelector(".system-line__prefix").textContent = prefixes[type];
  elements.systemMessage.textContent = message;
}

function unwrapResponse(payload) {
  return payload?.data?.current_condition ? payload.data : payload;
}

async function requestWeather(query) {
  const encodedQuery = query
    .split(",")
    .map((part) => encodeURIComponent(part.trim()))
    .join(",");
  const requestUrl = `${WTTR_BASE_URL}/${encodedQuery}?format=j1&lang=en`;
  const response = await fetch(requestUrl, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const payload = unwrapResponse(await response.json());
  if (!payload?.current_condition?.length || !payload?.weather?.length) {
    throw new Error("Invalid response from wttr.in");
  }

  return payload;
}

async function loadWeather(query, coords = null) {
  elements.dashboard.classList.add("is-loading");
  setSystemMessage(`fetch https://wttr.in/${query} --format j1`, "loading");

  try {
    const weather = await requestWeather(query);
    state.weather = weather;
    state.query = query;
    state.coords = coords;
    render();
    setSystemMessage(`received ${weather.weather.length} forecast days · status 200`, "success");
  } catch (error) {
    console.error(error);
    setSystemMessage("wttr.in did not respond. Check your connection or try another city", "error");
  } finally {
    elements.dashboard.classList.remove("is-loading");
  }
}

function requestGeolocation() {
  if (!navigator.geolocation) {
    setSystemMessage("geolocation is not supported · loading Bangkok", "error");
    loadWeather(DEFAULT_LOCATION);
    return;
  }

  elements.dashboard.classList.add("is-loading");
  setSystemMessage("navigator.geolocation.getCurrentPosition()", "loading");

  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      const location = `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`;
      elements.locationInput.value = "";
      loadWeather(location, { latitude: coords.latitude, longitude: coords.longitude });
    },
    (error) => {
      const reason = error.code === 1 ? "geolocation permission denied" : "coordinates unavailable";
      setSystemMessage(`${reason} · fallback: ${DEFAULT_LOCATION}`, "error");
      loadWeather(DEFAULT_LOCATION);
    },
    { enableHighAccuracy: false, timeout: 9000, maximumAge: 600000 },
  );
}

function getDescription(item) {
  return item.weatherDesc?.[0]?.value ?? "No description";
}

function classifyWeather(code, description = "") {
  const numericCode = Number(code);
  const normalized = description.toLowerCase();

  if ([200, 386, 389, 392, 395].includes(numericCode) || /thunder/.test(normalized)) return "storm";
  if ([227, 230, 320, 323, 326, 329, 332, 335, 338, 350, 368, 371].includes(numericCode) || /snow|blizzard/.test(normalized)) return "snow";
  if ([143, 248, 260].includes(numericCode) || /mist|fog/.test(normalized)) return "mist";
  if (numericCode >= 176 && numericCode <= 359 && ![227, 230].includes(numericCode)) return "rain";
  if ([113].includes(numericCode) || /clear|sunny/.test(normalized)) return "clear";
  return "cloudy";
}

function formatTemperature(item, field = "temp") {
  const suffix = state.units === "metric" ? "C" : "F";
  const sourceField = field === "FeelsLike" ? `${field}${suffix}` : `${field}_${suffix}`;
  return `${item[sourceField] ?? "--"}°`;
}

function formatWind(item) {
  const value = state.units === "metric" ? item.windspeedKmph : item.windspeedMiles;
  const unit = state.units === "metric" ? "km/h" : "mph";
  return `${item.winddir16Point ?? "–"} ${value ?? "--"} ${unit}`;
}

function getLocationName(weather) {
  const area = weather.nearest_area?.[0];
  const areaName = area?.areaName?.[0]?.value;
  const region = area?.region?.[0]?.value;
  const country = area?.country?.[0]?.value;
  return [areaName, region || country].filter(Boolean).join(", ") || state.query;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCurrent() {
  const current = state.weather.current_condition[0];
  const description = getDescription(current);
  const type = classifyWeather(current.weatherCode, description);
  const name = getLocationName(state.weather);

  elements.weatherArt.textContent = weatherArt[type];
  elements.locationName.textContent = name;
  elements.condition.textContent = description;
  elements.temperature.textContent = formatTemperature(current);
  elements.feelsLike.textContent = `feels like ${formatTemperature(current, "FeelsLike")}`;
  const precipitation = state.units === "metric"
    ? `${current.precipMM ?? "--"} mm`
    : `${current.precipInches ?? "--"} in`;
  const pressure = state.units === "metric"
    ? `${current.pressure ?? "--"} hPa`
    : `${current.pressureInches ?? "--"} inHg`;
  elements.metrics.innerHTML = [
    ["Wind", formatWind(current)],
    ["Humidity", `${current.humidity ?? "--"}%`],
    ["Precipitation", precipitation],
    ["Pressure", pressure],
  ]
    .map(([label, value]) => `<div class="metric"><span class="metric__label">${escapeHtml(label)}</span><span class="metric__value">${escapeHtml(value)}</span></div>`)
    .join("");

  elements.queryValue.textContent = state.coords ? "geo:browser" : state.query;
  elements.updatedValue.textContent = current.localObsDateTime ?? current.observation_time ?? "now";
  elements.unitsValue.textContent = state.units;

  const area = state.weather.nearest_area?.[0];
  const latitude = state.coords?.latitude ?? area?.latitude;
  const longitude = state.coords?.longitude ?? area?.longitude;
  elements.coordinates.textContent = latitude != null && longitude != null
    ? `lat ${Number(latitude).toFixed(4)} · lon ${Number(longitude).toFixed(4)}`
    : "coordinates unavailable";
}

function parseHour(value) {
  return String(value ?? "0").padStart(4, "0").replace(/(\d{2})(\d{2})/, "$1:$2");
}

function dayLabel(dateString, index) {
  if (index === 0) return "today";
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(`${dateString}T12:00:00`));
}

function averageDay(day, index) {
  const middle = day.hourly?.find((hour) => Number(hour.time) === 1200) ?? day.hourly?.[4] ?? day.hourly?.[0] ?? {};
  return {
    ...middle,
    time: "12:00",
    date: day.date,
    dayLabel: dayLabel(day.date, index),
    temp_C: day.avgtempC ?? middle.tempC,
    temp_F: day.avgtempF ?? middle.tempF,
  };
}

function flattenForecast() {
  if (state.period === "3days") {
    return state.weather.weather.map(averageDay);
  }

  const days = state.period === "today" ? state.weather.weather.slice(0, 1) : state.weather.weather;
  return days.flatMap((day, dayIndex) =>
    (day.hourly ?? []).map((hour) => ({
      ...hour,
      time: parseHour(hour.time),
      date: day.date,
      dayLabel: dayLabel(day.date, dayIndex),
      temp_C: hour.tempC,
      temp_F: hour.tempF,
    })),
  );
}

function matchesCondition(item) {
  if (state.condition === "all") return true;
  const type = classifyWeather(item.weatherCode, getDescription(item));
  const wind = Number(state.units === "metric" ? item.windspeedKmph : item.windspeedMiles);
  if (state.condition === "rain") return ["rain", "storm", "snow"].includes(type) || Number(item.chanceofrain) >= 35;
  if (state.condition === "clear") return type === "clear";
  if (state.condition === "wind") return wind >= (state.units === "metric" ? 20 : 12);
  return true;
}

function renderForecast() {
  const items = flattenForecast().filter(matchesCondition);
  const titles = {
    today: "Today's forecast",
    "3days": "Three-day overview",
    hours: "Hourly forecast",
  };

  elements.forecastTitle.textContent = titles[state.period];
  elements.resultCount.textContent = `${items.length} ${items.length === 1 ? "record" : "records"}`;
  elements.emptyState.hidden = items.length > 0;
  elements.forecastGrid.hidden = items.length === 0;
  elements.forecastGrid.innerHTML = items
    .map((item) => {
      const description = getDescription(item);
      const type = classifyWeather(item.weatherCode, description);
      const rainChance = Number(item.chanceofrain ?? 0);
      return `
        <article class="forecast-card">
          <div class="forecast-card__top">
            <span class="forecast-card__time">${escapeHtml(item.time)}</span>
            <span class="forecast-card__day">${escapeHtml(item.dayLabel)}</span>
          </div>
          <pre class="forecast-card__art" aria-hidden="true">${weatherArt[type]}</pre>
          <p class="forecast-card__condition">${escapeHtml(description)}</p>
          <div class="forecast-card__bottom">
            <span class="forecast-card__temp">${escapeHtml(formatTemperature(item))}</span>
            <span class="forecast-card__rain ${rainChance > 20 ? "is-wet" : ""}">󰖗 ${rainChance}% · ${escapeHtml(formatWind(item))}</span>
          </div>
        </article>`;
    })
    .join("");
}

function render() {
  if (!state.weather) return;
  renderCurrent();
  renderForecast();
}

function setActiveFilter(container, key, value) {
  container.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset[key] === value);
  });
}

function resetFilters() {
  state.period = "today";
  state.condition = "all";
  state.units = "metric";
  setActiveFilter(document.querySelector("#period-filter"), "period", state.period);
  setActiveFilter(document.querySelector("#condition-filter"), "condition", state.condition);
  setActiveFilter(document.querySelector("#units-filter"), "units", state.units);
  render();
}

document.querySelector("#period-filter").addEventListener("click", (event) => {
  const button = event.target.closest("[data-period]");
  if (!button) return;
  state.period = button.dataset.period;
  setActiveFilter(event.currentTarget, "period", state.period);
  renderForecast();
});

document.querySelector("#condition-filter").addEventListener("click", (event) => {
  const button = event.target.closest("[data-condition]");
  if (!button) return;
  state.condition = button.dataset.condition;
  setActiveFilter(event.currentTarget, "condition", state.condition);
  renderForecast();
});

document.querySelector("#units-filter").addEventListener("click", (event) => {
  const button = event.target.closest("[data-units]");
  if (!button) return;
  state.units = button.dataset.units;
  setActiveFilter(event.currentTarget, "units", state.units);
  render();
});

elements.locationForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = elements.locationInput.value.trim();
  if (value) loadWeather(value);
});

elements.geoButton.addEventListener("click", requestGeolocation);
elements.resetFilters.addEventListener("click", resetFilters);
elements.clearCondition.addEventListener("click", () => {
  state.condition = "all";
  setActiveFilter(document.querySelector("#condition-filter"), "condition", state.condition);
  renderForecast();
});
elements.aboutTab.addEventListener("click", () => elements.helpDialog.showModal());
elements.closeHelp.addEventListener("click", () => elements.helpDialog.close());
elements.helpDialog.addEventListener("click", (event) => {
  if (event.target === elements.helpDialog) elements.helpDialog.close();
});

setClock();
setInterval(setClock, 1000);
requestGeolocation();
