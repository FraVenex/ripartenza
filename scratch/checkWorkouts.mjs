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

async function checkWorkout() {
  const { data: w } = await supabase.from('workouts').select('*').eq('date', '2026-08-28');
  console.log('Workouts on 2026-08-28:', JSON.stringify(w, null, 2));

  const { data: allW } = await supabase.from('workouts').select('id, date, title, type, structure, completed_activity').order('date', { ascending: false });
  console.log('All workouts:', allW);
}

checkWorkout().catch(console.error);
