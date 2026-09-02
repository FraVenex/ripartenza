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

async function testUnreviewed() {
  const userId = 'd65d0433-996c-4efa-8503-265f2229f3fe';

  const [{ data: logs, error }, { data: workouts }] = await Promise.all([
    supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'running')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('workouts')
      .select('id, title, type, date, description, structure, status')
      .eq('user_id', userId)
      .in('status', ['planned', 'completed'])
      .order('date', { ascending: true })
      .limit(20),
  ]);

  const unreviewedRunningLogs = (logs ?? []).filter((log) => {
    const rawObj = (log.raw ?? {});
    const type = (log.type || rawObj.activityType?.typeKey || '').toLowerCase();
    const isRunning = type === 'running' || type === 'trail_running' || type === 'treadmill_running';
    const isReviewed = log.coach_reviewed === true || rawObj.coach_reviewed === true;
    const hasDistance = (log.distance_m ?? 0) > 0;
    return isRunning && hasDistance && !isReviewed;
  });

  console.log('Unreviewed running activities count:', unreviewedRunningLogs.length);
  console.log('Single latest unreviewed run returned:', {
    date: unreviewedRunningLogs[0]?.date,
    name: unreviewedRunningLogs[0]?.raw?.activityName,
    distanceM: unreviewedRunningLogs[0]?.distance_m,
    avgHr: unreviewedRunningLogs[0]?.avg_hr_bpm,
    maxHr: unreviewedRunningLogs[0]?.raw?.maxHR,
    avgPace: unreviewedRunningLogs[0]?.avg_pace_min_per_km,
  });
}

testUnreviewed().catch(console.error);
