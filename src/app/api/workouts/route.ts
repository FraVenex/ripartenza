import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser, mapWorkoutRow } from '@/lib/server/userContext';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  let query = supabase.from('workouts').select('*').eq('user_id', user.id).order('date', { ascending: true });
  if (from) query = query.gte('date', from);
  if (to) query = query.lte('date', to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ workouts: (data ?? []).map(mapWorkoutRow) });
}

// Crea un allenamento manuale, oppure salva una proposta arrivata dall'assistente
// (l'utente conferma esplicitamente prima che finisca nel piano/su Garmin).
export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const body = await req.json().catch(() => null);
  if (!body?.date || !body?.type || !body?.title) {
    return NextResponse.json({ error: 'Campi "date", "type" e "title" obbligatori.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: user.id,
      plan_id: body.planId ?? null,
      date: body.date,
      type: body.type,
      title: body.title,
      description: body.description ?? '',
      structure: body.structure ?? { steps: [] },
      source: body.source ?? 'manual',
      status: body.status ?? 'planned',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ workout: mapWorkoutRow(data) });
}
