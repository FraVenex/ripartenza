import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

globalThis.WebSocket = class DummyWebSocket {};

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.substring(0, idx).trim(), l.substring(idx + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function checkGarminActivitiesInPrompt() {
  const userId = 'd65d0433-996c-4efa-8503-265f2229f3fe';
  const { data: rows } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(5);

  for (const row of rows) {
    const rawObj = (row.raw ?? {});
    const title = rawObj.activityName ? `"${rawObj.activityName}"` : 'Corsa';
    const timeStr = rawObj.startTimeLocal ? ` ore ${rawObj.startTimeLocal.substring(11, 16)}` : '';
    const dist = row.distance_m ? `${(row.distance_m / 1000).toFixed(2)} km (${Math.round(row.distance_m)} m)` : 'distanza N/D';
    const durMin = row.duration_s ? Math.floor(row.duration_s / 60) : 0;
    const durSec = row.duration_s ? Math.round(row.duration_s % 60) : 0;
    const dur = row.duration_s ? `${durMin}m ${durSec}s (${Math.round(row.duration_s)}s totali)` : 'durata N/D';
    const pace = row.avg_pace_min_per_km
      ? `${Math.floor(row.avg_pace_min_per_km)}'${Math.round((row.avg_pace_min_per_km % 1) * 60)
          .toString()
          .padStart(2, '0')}"/km`
      : '';
    const hrAvg = row.avg_hr_bpm ? `FC media ${Math.round(row.avg_hr_bpm)} bpm` : '';
    const hrMax = (row.max_hr_bpm ?? rawObj.maxHR) ? `FC picco ${Math.round(row.max_hr_bpm ?? rawObj.maxHR)} bpm` : '';
    const hrText = [hrAvg, hrMax].filter(Boolean).join(', ');
    const cadAvg = rawObj.averageRunningCadenceInStepsPerMinute ? `Cadenza media ${Math.round(rawObj.averageRunningCadenceInStepsPerMinute)} spm` : '';
    const cadMax = rawObj.maxRunningCadenceInStepsPerMinute ? `Cadenza max ${Math.round(rawObj.maxRunningCadenceInStepsPerMinute)} spm` : '';
    const cadText = [cadAvg, cadMax].filter(Boolean).join(', ');
    const elevGain = row.elevation_gain_m != null ? `+${row.elevation_gain_m}m salita` : '';
    const elevLoss = row.elevation_loss_m != null ? `-${row.elevation_loss_m}m discesa` : '';
    const elevText = [elevGain, elevLoss].filter(Boolean).join(' / ');
    const calText = (row.calories ?? rawObj.calories) ? `${row.calories ?? rawObj.calories} kcal` : '';
    const weather = row.weather_data ?? rawObj.weather_info;
    const weatherText = weather
      ? `Meteo: ${weather.temperatureC}°C, ${weather.conditionDescription}${weather.humidityPercent ? `, umidità ${weather.humidityPercent}%` : ''}${weather.windSpeedKmh ? `, vento ${weather.windSpeedKmh} km/h` : ''}`
      : '';

    const allParams = [title, dist, dur, pace, hrText, cadText, elevText, calText, weatherText].filter(Boolean).join(' | ');
    console.log(`- ${row.date}${timeStr} · ${allParams} (ID Garmin: ${row.garmin_activity_id})`);
  }
}

checkGarminActivitiesInPrompt().catch(console.error);
