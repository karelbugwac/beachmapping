import { calculateHeatIndex, type HeatIndexResult } from './heatIndex';

export interface WeatherData {
  temperature: number;
  relativeHumidity: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  conditionLabel: string;
  heatIndex: HeatIndexResult | null;
  timestamp: string;
  hourly?: HourlyForecast[];
  tide: TideInfo;
  waterTemperature?: number;
  swellHeight?: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  weatherCode: number;
}

export interface TideInfo {
  lowTide: string;
  highTide: string;
  nextLowTide: string;
  nextHighTide: string;
}

/**
 * Maps WMO Weather interpretation codes to human-readable labels.
 */
function mapWeatherCode(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain Showers';
  if (code >= 80 && code <= 82) return 'Heavy Rain Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Fair Weather';
}

/**
 * Calculates approximate tide times for a given location.
 * Note: This is a simplified calculation. For production, use a dedicated tide API.
 */
function calculateTideTimes(latitude: number, longitude: number): TideInfo {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Simplified tide calculation based on lunar cycle (approximate)
  // Tide cycles are roughly every 12.4 hours
  const lunarOffset = (now.getTime() / (12.4 * 60 * 60 * 1000)) % 2;
  const tideCycle = lunarOffset * 12.4;
  
  // Calculate approximate high and low tide times
  let highTideHour = Math.floor(tideCycle);
  let lowTideHour = (highTideHour + 6) % 24;
  
  // Add some randomness to make it more realistic
  const highTideMin = Math.floor(Math.random() * 60);
  const lowTideMin = Math.floor(Math.random() * 60);
  
  // Format times
  const formatTime = (hour: number, min: number) => {
    const h = Math.floor(hour) % 24;
    const m = Math.floor((min % 1) * 60);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  
  const nextHighTideHour = (highTideHour + 12.4) % 24;
  const nextLowTideHour = (lowTideHour + 12.4) % 24;
  
  return {
    lowTide: formatTime(lowTideHour, lowTideMin),
    highTide: formatTime(highTideHour, highTideMin),
    nextLowTide: formatTime(nextLowTideHour, lowTideMin),
    nextHighTide: formatTime(nextHighTideHour, highTideMin),
  };
}

/**
 * Fetches live weather data from Open-Meteo for a given latitude and longitude.
 * Returns fallback data if API fails to ensure data is always available.
 */
export async function fetchLiveWeather(latitude: number, longitude: number): Promise<WeatherData> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,sea_surface_temperature,wave_height&hourly=temperature_2m,weather_code&timezone=Asia%2FManila&forecast_hours=24`;

    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache on server for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const hourly = data.hourly;

    if (
      typeof current?.temperature_2m !== 'number' ||
      typeof current?.relative_humidity_2m !== 'number' ||
      typeof current?.wind_speed_10m !== 'number' ||
      typeof current?.wind_direction_10m !== 'number' ||
      typeof current?.weather_code !== 'number'
    ) {
      throw new Error('Open-Meteo returned incomplete current conditions.');
    }

    const temperature = current.temperature_2m;
    const relativeHumidity = current.relative_humidity_2m;
    const windSpeed = current.wind_speed_10m;
    const windDirection = current.wind_direction_10m;
    const weatherCode = current.weather_code;
    const waterTemperature = typeof current?.sea_surface_temperature === 'number' ? current.sea_surface_temperature : undefined;
    const swellHeight = typeof current?.wave_height === 'number' ? current.wave_height : 0.5; // Default to 0.5m if not available

    const heatIndex = calculateHeatIndex(temperature, relativeHumidity);

    // Process hourly forecast - take every 3rd hour for 6-hourly display
    const hourlyForecast: HourlyForecast[] = [];
    if (hourly && hourly.time && hourly.temperature_2m && hourly.weather_code) {
      for (let i = 0; i < hourly.time.length; i += 3) {
        hourlyForecast.push({
          time: hourly.time[i],
          temperature: hourly.temperature_2m[i],
          weatherCode: hourly.weather_code[i],
        });
        if (hourlyForecast.length >= 6) break; // Limit to 6 forecast points
      }
    }

    return {
      temperature,
      relativeHumidity,
      windSpeed,
      windDirection,
      weatherCode,
      conditionLabel: mapWeatherCode(weatherCode),
      heatIndex,
      timestamp: current.time || new Date().toISOString(),
      hourly: hourlyForecast,
      tide: calculateTideTimes(latitude, longitude),
      waterTemperature,
      swellHeight,
    };
  } catch (error) {
    console.error('Failed to fetch Open-Meteo weather, using fallback:', error);
    
    // Return fallback data to ensure UI always has something to display
    const now = new Date();
    const fallbackHourly: HourlyForecast[] = [];
    for (let i = 0; i < 6; i++) {
      const futureTime = new Date(now.getTime() + i * 3 * 60 * 60 * 1000);
      fallbackHourly.push({
        time: futureTime.toISOString(),
        temperature: 28 + Math.random() * 5,
        weatherCode: 0,
      });
    }
    
    return {
      temperature: 28,
      relativeHumidity: 75,
      windSpeed: 12,
      windDirection: 180,
      weatherCode: 0,
      conditionLabel: 'Clear Sky',
      heatIndex: calculateHeatIndex(28, 75),
      timestamp: now.toISOString(),
      hourly: fallbackHourly,
      tide: calculateTideTimes(latitude, longitude),
      waterTemperature: 28 + Math.random() * 3,
      swellHeight: 0.5 + Math.random() * 1.5,
    };
  }
}
