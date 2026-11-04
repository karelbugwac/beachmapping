import { calculateHeatIndex, type HeatIndexResult } from './heatIndex';

export interface DailyForecast {
  date: string;
  weatherCode: number;
  conditionLabel: string;
  high: number;
  low: number;
  precipitationProbability: number | null;
  uvIndexMax: number | null;
}

export interface AirQuality {
  usAqi: number;
  pm25: number | null;
  pm10: number | null;
}

export interface WeatherData {
  temperature: number;
  relativeHumidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  conditionLabel: string;
  heatIndex: HeatIndexResult | null;
  timestamp: string;
  dailyForecast: DailyForecast[];
  uvIndex: number | null;
  sunrise: string | null;
  sunset: string | null;
  moonrise: string | null;
  moonset: string | null;
  airQuality: AirQuality | null;
  waterTemperature: number | null;
  waveHeight: number | null;
  swellHeight: number | null;
}

interface OpenMeteoForecast {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
  };
  hourly?: {
    time?: string[];
    uv_index?: number[];
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: (number | null)[];
    uv_index_max?: (number | null)[];
    sunrise?: string[];
    sunset?: string[];
  };
}

interface OpenMeteoAirQuality {
  current?: {
    us_aqi?: number;
    pm2_5?: number | null;
    pm10?: number | null;
  };
}

interface OpenMeteoMarine {
  hourly?: {
    time?: string[];
    wave_height?: (number | null)[];
    swell_wave_height?: (number | null)[];
  };
}

function mapWeatherCode(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Fog';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 56 && code <= 57) return 'Freezing drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 66 && code <= 67) return 'Freezing rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code >= 85 && code <= 86) return 'Snow showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Conditions unavailable';
}

function getMoonEvents(date: string, latitude: number, longitude: number) {
  const radians = Math.PI / 180;
  const start = new Date(`${date}T00:00:00+08:00`);
  const horizon = 0.133 * radians;
  const obliquity = 23.4397 * radians;

  const altitudeAt = (time: Date) => {
    const days = (time.getTime() - Date.UTC(2000, 0, 1, 12)) / 86_400_000;
    const longitudeMoon = radians * (218.316 + 13.176396 * days + 6.289 * Math.sin(radians * (134.963 + 13.064993 * days)));
    const latitudeMoon = radians * (5.128 * Math.sin(radians * (93.272 + 13.229350 * days)));
    const rightAscension = Math.atan2(
      Math.sin(longitudeMoon) * Math.cos(obliquity) - Math.tan(latitudeMoon) * Math.sin(obliquity),
      Math.cos(longitudeMoon),
    );
    const declination = Math.asin(
      Math.sin(latitudeMoon) * Math.cos(obliquity)
        + Math.cos(latitudeMoon) * Math.sin(obliquity) * Math.sin(longitudeMoon),
    );
    const hourAngle = radians * (280.16 + 360.9856235 * days + longitude) - rightAscension;
    const latitudeRadians = latitude * radians;
    const altitude = Math.asin(
      Math.sin(latitudeRadians) * Math.sin(declination)
        + Math.cos(latitudeRadians) * Math.cos(declination) * Math.cos(hourAngle),
    );
    const parallax = 0.9507 * radians / Math.sqrt(1 - Math.sin(altitude) ** 2);
    return altitude - parallax - horizon;
  };

  let moonrise: Date | null = null;
  let moonset: Date | null = null;
  let previousTime = start;
  let previousAltitude = altitudeAt(previousTime);

  for (let hour = 1; hour <= 24; hour += 1) {
    const currentTime = new Date(start.getTime() + hour * 3_600_000);
    const currentAltitude = altitudeAt(currentTime);
    if ((previousAltitude < 0 && currentAltitude >= 0) || (previousAltitude >= 0 && currentAltitude < 0)) {
      const fraction = previousAltitude / (previousAltitude - currentAltitude);
      const eventTime = new Date(previousTime.getTime() + fraction * 3_600_000);
      if (previousAltitude < 0) moonrise = eventTime;
      else moonset = eventTime;
    }
    previousTime = currentTime;
    previousAltitude = currentAltitude;
  }

  return {
    moonrise: moonrise?.toISOString() ?? null,
    moonset: moonset?.toISOString() ?? null,
  };
}

function closestHourlyIndex(times: string[] | undefined, targetTime: string): number {
  if (!times?.length) return -1;
  const target = new Date(targetTime).getTime();
  if (!Number.isFinite(target)) return -1;

  return times.reduce((closestIndex, time, index) => {
    const closestTime = new Date(times[closestIndex]).getTime();
    return Math.abs(new Date(time).getTime() - target) < Math.abs(closestTime - target)
      ? index
      : closestIndex;
  }, 0);
}

export async function fetchLiveWeather(latitude: number, longitude: number): Promise<WeatherData> {
  const coordinates = `latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`;
  const forecastUrl = `https://api.open-meteo.com/v1/forecast?${coordinates}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&hourly=uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max,sunrise,sunset&timezone=Asia%2FManila&forecast_days=5`;
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?${coordinates}&hourly=wave_height,swell_wave_height&timezone=Asia%2FManila&forecast_days=2`;
  const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?${coordinates}&current=us_aqi,pm2_5,pm10&timezone=Asia%2FManila`;

  const [forecastResult, marineResult, airQualityResult] = await Promise.allSettled([
    fetch(forecastUrl, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) })
      .then((response) => {
        if (!response.ok) throw new Error(`Open-Meteo forecast request failed (${response.status}).`);
        return response.json() as Promise<OpenMeteoForecast>;
      }),
    fetch(marineUrl, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) })
      .then((response) => {
        if (!response.ok) throw new Error(`Open-Meteo marine request failed (${response.status}).`);
        return response.json() as Promise<OpenMeteoMarine>;
      }),
    fetch(airQualityUrl, { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) })
      .then((response) => {
        if (!response.ok) throw new Error(`Open-Meteo air-quality request failed (${response.status}).`);
        return response.json() as Promise<OpenMeteoAirQuality>;
      }),
  ]);
  if (forecastResult.status === 'rejected') throw forecastResult.reason;
  const forecast = forecastResult.value;
  const current = forecast.current;
  if (
    typeof current?.temperature_2m !== 'number' ||
    typeof current.relative_humidity_2m !== 'number' ||
    typeof current.weather_code !== 'number' ||
    typeof current.wind_speed_10m !== 'number' ||
    typeof current.wind_direction_10m !== 'number' ||
    !current.time
  ) {
    throw new Error('Open-Meteo returned incomplete current conditions.');
  }

  if (marineResult.status === 'rejected') {
    console.warn('Marine conditions are currently unavailable:', marineResult.reason);
  }
  if (airQualityResult.status === 'rejected') {
    console.warn('Air quality is currently unavailable:', airQualityResult.reason);
  }
  const marine = marineResult.status === 'fulfilled' ? marineResult.value : null;
  const airQualityCurrent = airQualityResult.status === 'fulfilled' ? airQualityResult.value.current : null;
  const airQuality = typeof airQualityCurrent?.us_aqi === 'number'
    ? {
        usAqi: airQualityCurrent.us_aqi,
        pm25: airQualityCurrent.pm2_5 ?? null,
        pm10: airQualityCurrent.pm10 ?? null,
      }
    : null;

  const marineIndex = closestHourlyIndex(marine?.hourly?.time, current.time);
  const daily = forecast.daily;
  const dailyForecast: DailyForecast[] = (daily?.time || []).slice(1, 5).flatMap((date, offset) => {
    const index = offset + 1;
    const code = daily?.weather_code?.[index];
    const high = daily?.temperature_2m_max?.[index];
    const low = daily?.temperature_2m_min?.[index];
    if (typeof code !== 'number' || typeof high !== 'number' || typeof low !== 'number') return [];
    return [{
      date,
      weatherCode: code,
      conditionLabel: mapWeatherCode(code),
      high,
      low,
      precipitationProbability: daily?.precipitation_probability_max?.[index] ?? null,
      uvIndexMax: daily?.uv_index_max?.[index] ?? null,
    }];
  });
  const uvIndex = closestHourlyIndex(forecast.hourly?.time, current.time);
  const today = daily?.time?.[0];
  const moonEvents = today ? getMoonEvents(today, latitude, longitude) : { moonrise: null, moonset: null };

  return {
    temperature: current.temperature_2m,
    relativeHumidity: current.relative_humidity_2m,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    weatherCode: current.weather_code,
    conditionLabel: mapWeatherCode(current.weather_code),
    heatIndex: calculateHeatIndex(current.temperature_2m, current.relative_humidity_2m),
    timestamp: current.time,
    dailyForecast,
    uvIndex: uvIndex >= 0 ? forecast.hourly?.uv_index?.[uvIndex] ?? null : null,
    sunrise: daily?.sunrise?.[0] ?? null,
    sunset: daily?.sunset?.[0] ?? null,
    ...moonEvents,
    airQuality,
    waterTemperature: null,
    waveHeight: marineIndex >= 0 ? marine?.hourly?.wave_height?.[marineIndex] ?? null : null,
    swellHeight: marineIndex >= 0 ? marine?.hourly?.swell_wave_height?.[marineIndex] ?? null : null,
  };
}
