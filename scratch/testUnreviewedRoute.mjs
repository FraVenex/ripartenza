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

async function checkUnreviewed() {
  const userId = 'd65d0433-996c-4efa-8503-265f2229f3fe';

  const [{ data: logs }, { data: workouts }] = await Promise.all([
    supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('workouts')
      .select('id, title, type, date, description, structure, status')
      .eq('user_id', userId)
      .in('status', ['planned', 'completed'])
      .order('date', { ascending: true })
      .limit(20),
  ]);

  const unreviewedLogs = (logs ?? []).filter((log) => {
    const rawObj = (log.raw ?? {});
    return !(log.coach_reviewed === true || rawObj.coach_reviewed === true);
  });

  console.log('Unreviewed logs count:', unreviewedLogs.length);
  console.log('First unreviewed activity:', {
    date: unreviewedLogs[0]?.date,
    name: unreviewedLogs[0]?.raw?.activityName,
    distanceM: unreviewedLogs[0]?.distance_m,
    avgHr: unreviewedLogs[0]?.avg_hr_bpm,
    maxHr: unreviewedLogs[0]?.raw?.maxHR,
    avgPace: unreviewedLogs[0]?.avg_pace_min_per_km,
  });

  console.log('Workouts in DB count:', workouts?.length);
  if (workouts?.length) {
    console.log('Workouts:', workouts.map(w => ({ id: w.id, title: w.title, type: w.type, date: w.date, status: w.status })));
  }
}

checkUnreviewed().catch(console.error);
