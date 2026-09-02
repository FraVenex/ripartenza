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

async function resetToday() {
  const userId = 'd65d0433-996c-4efa-8503-265f2229f3fe';

  const { data: act } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', userId)
    .eq('garmin_activity_id', '24144101348')
    .maybeSingle();

  if (act) {
    const rawObj = act.raw ?? {};
    delete rawObj.coach_reviewed;
    const { error: actErr } = await supabase
      .from('activity_log')
      .update({
        coach_reviewed: false,
        raw: {
          ...rawObj,
          coach_reviewed: false,
        },
      })
      .eq('id', act.id);

    console.log('activity_log reset for 2026-08-28:', actErr ? actErr : 'SUCCESS');
  }

  const { data: workouts } = await supabase
    .from('workouts')
    .select('id, date, title, status')
    .eq('user_id', userId)
    .eq('date', '2026-08-28');

  for (const w of workouts ?? []) {
    await supabase
      .from('workouts')
      .update({
        coach_feedback: null,
        rpe: null,
        pain_score: null,
        pain_location: null,
        notes: null,
      })
      .eq('id', w.id);
  }
  console.log('Workouts reset on 2026-08-28:', workouts?.length);

  const { data: msgs } = await supabase
    .from('chat_messages')
    .select('id, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(4);

  console.log('Recent chat messages to inspect:', msgs);

  if (msgs && msgs.length > 0) {
    const idsToDelete = msgs.map(m => m.id);
    const { error: delErr } = await supabase
      .from('chat_messages')
      .delete()
      .in('id', idsToDelete);
    console.log('Deleted recent test chat messages:', idsToDelete, delErr ? delErr : 'SUCCESS');
  }
}

resetToday().catch(console.error);
