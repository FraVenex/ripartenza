import { createClient } from '@supabase/supabase-js';
import { loadMedicalProfile, loadRecentWorkouts, loadRecentGarminActivities } from './src/lib/server/userContext.js';
import { buildAssistantSystemPrompt } from './src/lib/ai/systemPrompt.js';
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

async function testPrompt() {
  const userId = 'd65d0433-996c-4efa-8503-265f2229f3fe';
  const [medicalProfile, recentWorkouts, garminActivities] = await Promise.all([
    loadMedicalProfile(supabase, userId),
    loadRecentWorkouts(supabase, userId, 60, 120),
    loadRecentGarminActivities(supabase, userId, 30),
  ]);

  const prompt = buildAssistantSystemPrompt({ medicalProfile, recentWorkouts, garminActivities });
  console.log('--- SYSTEM PROMPT SNIPPET (Garmin Activities) ---');
  const startIdx = prompt.indexOf('Nessuna attività') !== -1 ? prompt.indexOf('Nessuna attività') : prompt.indexOf('Attività Garmin') !== -1 ? prompt.indexOf('Attività Garmin') - 50 : prompt.indexOf('2026-08-28');
  console.log(prompt.substring(Math.max(0, startIdx - 100), startIdx + 800));
}

testPrompt().catch(console.error);
