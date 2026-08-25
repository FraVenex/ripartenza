export interface ActivityWeatherData {
  temperatureC: number;
  apparentTemperatureC?: number;
  humidityPercent?: number;
  windSpeedKmh?: number;
  precipitationMm?: number;
  weatherCode?: number;
  conditionDescription: string;
}

const WEATHER_CODE_DESCRIPTIONS: Record<number, string> = {
  0: 'Sereno',
  1: 'Prevalentemente sereno',
  2: 'Parzialmente nuvoloso',
  3: 'Coperto',
  45: 'Nebbia',
  48: 'Nebbia con brina',
  51: 'Pioggerella leggera',
  53: 'Pioggerella moderata',
  55: 'Pioggerella densa',
  56: 'Pioggerella gelata leggera',
  57: 'Pioggerella gelata densa',
  61: 'Pioggia debole',
  63: 'Pioggia moderata',
  65: 'Pioggia forte',
  66: 'Pioggia gelata leggera',
  67: 'Pioggia gelata intensa',
  71: 'Neve debole',
  73: 'Neve moderata',
  75: 'Neve forte',
  77: 'Granelli di neve',
  80: 'Rovescio di pioggia debole',
  81: 'Rovescio di pioggia moderato',
  82: 'Rovescio di pioggia violento',
  85: 'Rovescio di neve debole',
  86: 'Rovescio di neve forte',
  95: 'Temporale',
  96: 'Temporale con grandine leggera',
  99: 'Temporale con grandine forte',
};

export function getWeatherConditionDescription(code?: number): string {
  if (code === undefined || code === null) return 'N/D';
  return WEATHER_CODE_DESCRIPTIONS[code] ?? `Condizione (${code})`;
}

export async function fetchWeatherForActivity(
  latitude: number,
  longitude: number,
  dateIso: string,
  timeLocal?: string
): Promise<ActivityWeatherData | null> {
  try {
    const formattedDate = dateIso.slice(0, 10);
    const dateObj = new Date(formattedDate);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));

    let url = '';
    if (daysDiff > 80) {
      url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${formattedDate}&end_date=${formattedDate}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
    } else {
      url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&start_date=${formattedDate}&end_date=${formattedDate}&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&past_days=92&timezone=auto`;
    }

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;

    const data = await res.json();
    const hourly = data?.hourly;
    if (!hourly || !hourly.time || !hourly.time.length) return null;

    let hourIndex = 12;
    if (timeLocal) {
      const match = timeLocal.match(/(\d{1,2}):\d{2}/);
      if (match) {
        hourIndex = Math.min(23, Math.max(0, parseInt(match[1], 10)));
      }
    }

    const temp = hourly.temperature_2m?.[hourIndex] ?? hourly.temperature_2m?.[12] ?? null;
    if (temp === null) return null;

    const code = hourly.weather_code?.[hourIndex] ?? hourly.weather_code?.[12];
    const appTemp = hourly.apparent_temperature?.[hourIndex];
    const humidity = hourly.relative_humidity_2m?.[hourIndex];
    const wind = hourly.wind_speed_10m?.[hourIndex];
    const precip = hourly.precipitation?.[hourIndex];

    return {
      temperatureC: Math.round(temp * 10) / 10,
      apparentTemperatureC: appTemp !== undefined ? Math.round(appTemp * 10) / 10 : undefined,
      humidityPercent: humidity !== undefined ? Math.round(humidity) : undefined,
      windSpeedKmh: wind !== undefined ? Math.round(wind * 10) / 10 : undefined,
      precipitationMm: precip !== undefined ? Math.round(precip * 10) / 10 : undefined,
      weatherCode: code,
      conditionDescription: getWeatherConditionDescription(code),
    };
  } catch {
    return null;
  }
}
