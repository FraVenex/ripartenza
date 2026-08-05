import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser, loadMedicalProfile } from '@/lib/server/userContext';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const profile = await loadMedicalProfile(supabase, user.id);
  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const body = await req.json().catch(() => ({}));

  const { error } = await supabase.from('medical_profiles').upsert({
    user_id: user.id,
    conditions: body.conditions ?? [],
    injuries: body.injuries ?? [],
    running_history: body.runningHistory ?? null,
    layoff_weeks: body.layoffWeeks ?? null,
    clinician_clearance: !!body.clinicianClearance,
    notes: body.notes ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
