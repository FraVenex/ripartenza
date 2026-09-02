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
  const { data: users, error: errU } = await supabase.auth.admin.listUsers();
  console.log('Auth users count:', users?.users?.length, errU);
  users?.users?.forEach(u => console.log('User:', u.id, u.email));

  const { data: garminTokens } = await supabase.from('garmin_tokens').select('user_id, updated_at');
  console.log('garmin_tokens user_ids:', garminTokens);

  const { data: logs } = await supabase.from('activity_log').select('user_id').limit(1);
  console.log('activity_log user_id sample:', logs?.[0]?.user_id);
}

check().catch(console.error);
