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

async function cleanPlanned() {
  const userId = 'd65d0433-996c-4efa-8503-265f2229f3fe';
  const { data: del, error } = await supabase
    .from('workouts')
    .delete()
    .eq('user_id', userId)
    .gt('date', '2026-08-28')
    .eq('status', 'planned')
    .select();

  console.log('Cleaned future planned workouts generated during test:', del?.length, error);
}

cleanPlanned().catch(console.error);
