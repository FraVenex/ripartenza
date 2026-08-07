import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser, mapWorkoutRow } from '@/lib/server/userContext';
import { evaluateAndAdaptWorkoutExecution } from '@/lib/ai/coachAdapter';

export const runtime = 'nodejs';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const body = await req.json().catch(() => ({}));
  const allowedFields = ['status', 'rpe', 'pain_score', 'pain_location', 'notes', 'title', 'description', 'structure', 'date', 'type'];
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    if (allowedFields.includes(snake)) update[snake] = value;
  }

  const { data, error } = await supabase
    .from('workouts')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const workout = mapWorkoutRow(data);

  let coachEvaluation = null;
  if (workout.status === 'completed' && (body.rpe !== undefined || body.painScore !== undefined || body.painLocation !== undefined || body.status === 'completed')) {
    coachEvaluation = await evaluateAndAdaptWorkoutExecution(supabase, user.id, workout.id);
  }

  return NextResponse.json({ workout, coachEvaluation });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const { error } = await supabase.from('workouts').delete().eq('id', params.id).eq('user_id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
