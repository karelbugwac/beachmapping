/**
 * Heat Index Calculation & PAGASA Classification Service
 * Standard NOAA/Rothfusz formula converted for Celsius inputs.
 */

export interface HeatIndexResult {
  heatIndexCelsius: number;
  category: 'Caution' | 'Extreme Caution' | 'Danger' | 'Extreme Danger';
  advisory: string;
  badgeColorClass: string;
}

/**
 * Calculates Heat Index in Celsius using temperature (°C) and relative humidity (%).
 * PAGASA / NOAA standard: Heat Index is only applicable when air temp >= 27°C.
 */
export function calculateHeatIndex(temperatureC: number, relativeHumidity: number): HeatIndexResult | null {
  // Always calculate heat index even if temp < 27°C for fallback display
  if (temperatureC < 27) {
    // Return a minimal heat index for display purposes
    return {
      heatIndexCelsius: Math.round(temperatureC),
      category: 'Caution',
      advisory: 'Comfortable conditions.',
      badgeColorClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
  }

  // Convert Celsius to Fahrenheit for NOAA formula constants
  const T = (temperatureC * 9) / 5 + 32;
  const R = relativeHumidity;

  // Simple formula first
  let HI = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + R * 0.094);

  // If >= 80°F (approx 26.7°C), use Rothfusz regression equation
  if (HI >= 80) {
    HI =
      -42.379 +
      2.04901523 * T +
      10.14333127 * R -
      0.22475541 * T * R -
      0.00683783 * T * T -
      0.05481717 * R * R +
      0.00122874 * T * T * R +
      0.00085282 * T * R * R -
      0.00000199 * T * T * R * R;

    // Adjustments for extreme low/high humidity
    if (R < 13 && T >= 80 && T <= 112) {
      const adjustment = ((13 - R) / 4) * Math.sqrt((17 - Math.abs(T - 95.0)) / 17);
      HI -= adjustment;
    } else if (R > 85 && T >= 80 && T <= 87) {
      const adjustment = ((R - 85) / 10) * ((87 - T) / 5);
      HI += adjustment;
    }
  }

  // Convert back to Celsius
  const heatIndexC = Math.round(((HI - 32) * 5) / 9);

  // Classify according to PAGASA Heat Index Chart
  if (heatIndexC >= 52) {
    return {
      heatIndexCelsius: heatIndexC,
      category: 'Extreme Danger',
      advisory: 'Heat stroke highly likely with continued exposure.',
      badgeColorClass: 'bg-purple-100 text-purple-800 border-purple-300',
    };
  } else if (heatIndexC >= 42) {
    return {
      heatIndexCelsius: heatIndexC,
      category: 'Danger',
      advisory: 'Heat cramps/exhaustion likely; heat stroke possible with prolonged activity.',
      badgeColorClass: 'bg-red-100 text-red-800 border-red-300',
    };
  } else if (heatIndexC >= 33) {
    return {
      heatIndexCelsius: heatIndexC,
      category: 'Extreme Caution',
      advisory: 'Heat cramps and heat exhaustion possible with prolonged exposure.',
      badgeColorClass: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  } else {
    return {
      heatIndexCelsius: heatIndexC,
      category: 'Caution',
      advisory: 'Fatigue possible with prolonged exposure and physical activity.',
      badgeColorClass: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    };
  }
}
