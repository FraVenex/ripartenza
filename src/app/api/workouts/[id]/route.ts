import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser, mapWorkoutRow } from '@/lib/server/userContext';

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
  const allowedFields = [
    'status',
    'rpe',
    'pain_score',
    'pain_location',
    'notes',
    'title',
    'description',
    'structure',
    'date',
    'type',
    'completed_activity',
    'coach_feedback',
  ];

  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    const snake = key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`);
    if (allowedFields.includes(snake)) update[snake] = value;
  }

  let { data, error } = await supabase
    .from('workouts')
    .update(update)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error && 'coach_feedback' in update) {
    const fallbackUpdate = { ...update };
    delete fallbackUpdate.coach_feedback;
    const retry = await supabase
      .from('workouts')
      .update(fallbackUpdate)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const workout = mapWorkoutRow(data);

  return NextResponse.json({ workout });
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
