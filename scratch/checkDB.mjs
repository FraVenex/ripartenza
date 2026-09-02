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

async function check() {
  const { data: logs } = await supabase
    .from('activity_log')
    .select('id, date, garmin_activity_id, type, coach_reviewed, raw')
    .order('date', { ascending: false })
    .limit(10);

  console.log('Top 5 activities in DB:');
  logs?.slice(0, 5).forEach(l => {
    console.log(`- Date: ${l.date} | Name: ${l.raw?.activityName} | Distance: ${l.raw?.distance}m | Reviewed: ${l.coach_reviewed}`);
  });
}

check().catch(console.error);
