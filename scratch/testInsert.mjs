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

async function insertTest() {
  const payload = {
    user_id: 'd65d0433-996c-4efa-8503-265f2229f3fe',
    garmin_activity_id: '24144101348',
    date: '2026-08-28',
    type: 'running',
    distance_m: 1998.19,
    duration_s: 672,
    avg_hr_bpm: 148,
    avg_pace_min_per_km: 5.6,
    coach_reviewed: false,
    raw: {
      activityId: 24144101348,
      activityName: 'Nettuno - Test Calibrazione RPE',
      startTimeLocal: '2026-08-28 06:38:11',
      distance: 1998.19,
      duration: 672,
      averageHR: 148,
      maxHR: 165,
      averageSpeed: 2.973,
      coach_reviewed: false,
    },
  };

  const { data, error } = await supabase.from('activity_log').upsert(payload, { onConflict: 'user_id,garmin_activity_id' }).select();
  console.log('Result:', data, error);
}

insertTest().catch(console.error);
