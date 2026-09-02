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

async function updateRealLog() {
  const { data: w } = await supabase
    .from('workouts')
    .select('completed_activity')
    .eq('date', '2026-08-28')
    .single();

  const c = w?.completed_activity;
  console.log('Real completed activity:', c);

  if (c) {
    const rawPayload = {
      activityId: 24144101348,
      activityName: 'Nettuno - Test Calibrazione RPE',
      startTimeLocal: '2026-08-28 06:38:11',
      distance: c.distanceM,
      duration: c.durationS,
      averageHR: c.avgHrBpm,
      maxHR: c.maxHrBpm,
      averageRunningCadenceInStepsPerMinute: c.avgCadence,
      maxRunningCadenceInStepsPerMinute: c.maxCadence,
      elevationGain: c.elevationGainM,
      elevationLoss: c.elevationLossM,
      calories: c.calories,
      coach_reviewed: false,
    };

    const updatePayload = {
      user_id: 'd65d0433-996c-4efa-8503-265f2229f3fe',
      garmin_activity_id: '24144101348',
      date: '2026-08-28',
      type: 'running',
      distance_m: c.distanceM,
      duration_s: c.durationS,
      avg_hr_bpm: c.avgHrBpm,
      avg_pace_min_per_km: c.avgPaceMinPerKm,
      elevation_gain_m: c.elevationGainM,
      elevation_loss_m: c.elevationLossM,
      coach_reviewed: false,
      raw: rawPayload,
    };

    const { data, error } = await supabase
      .from('activity_log')
      .upsert(updatePayload, { onConflict: 'user_id,garmin_activity_id' })
      .select();

    console.log('activity_log successfully updated with real Garmin data:', data, error);
  }
}

updateRealLog().catch(console.error);
