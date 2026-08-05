import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser, loadDecryptedGarminCredentials, mapWorkoutRow } from '@/lib/server/userContext';
import { pushWorkoutToGarmin } from '@/lib/garmin/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const body = await req.json().catch(() => null);
  const workoutId: string | undefined = body?.workoutId;
  if (!workoutId) return NextResponse.json({ error: 'Campo "workoutId" obbligatorio.' }, { status: 400 });

  const { data: workoutRow, error: workoutError } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .eq('user_id', user.id)
    .single();

  if (workoutError || !workoutRow) {
    return NextResponse.json({ error: 'Allenamento non trovato.' }, { status: 404 });
  }

  const creds = await loadDecryptedGarminCredentials(supabase, user.id);
  if (!creds) {
    return NextResponse.json({ error: 'Nessun account Garmin collegato. Vai su Impostazioni per inserire email e password.' }, { status: 400 });
  }

  const workout = mapWorkoutRow(workoutRow);

  try {
    const { garminWorkoutId } = await pushWorkoutToGarmin(creds, workout);
    await supabase.from('workouts').update({ garmin_workout_id: garminWorkoutId, source: workout.source === 'ai' ? 'ai' : 'garmin' }).eq('id', workoutId);
    return NextResponse.json({ ok: true, garminWorkoutId });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
