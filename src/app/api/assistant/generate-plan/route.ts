import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser, loadMedicalProfile, loadDecryptedAiSettings } from '@/lib/server/userContext';
import { buildAssistantSystemPrompt } from '@/lib/ai/systemPrompt';
import { callLlm, extractWorkoutJsonBlocks } from '@/lib/ai/providers';
import type { WorkoutType } from '@/lib/types';

export const runtime = 'nodejs';

const VALID_TYPES: WorkoutType[] = ['easy', 'long', 'tempo', 'intervals', 'walk_run', 'strength', 'mobility', 'rest'];

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();

  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const body = await req.json().catch(() => null);
  const goal: string | undefined = body?.goal;
  const startDate: string | undefined = body?.startDate;
  const weeks: number = Math.min(Math.max(Number(body?.weeks) || 4, 1), 12);
  const daysPerWeek: number = Math.min(Math.max(Number(body?.daysPerWeek) || 3, 2), 7);

  if (!goal || !startDate) {
    return NextResponse.json({ error: 'Campi "goal" e "startDate" obbligatori.' }, { status: 400 });
  }

  let aiSettings;
  try {
    aiSettings = await loadDecryptedAiSettings(supabase, user.id);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const medicalProfile = await loadMedicalProfile(supabase, user.id);
  const systemPrompt = buildAssistantSystemPrompt({ medicalProfile, recentWorkouts: [], goal });

  const instruction = `Crea un piano di allenamento di ${weeks} settimane, a partire dal ${startDate}, con circa ${daysPerWeek} sessioni a settimana (le altre giornate sono riposo attivo o completo). Rispetta rigorosamente il protocollo graduato pertinente al profilo medico dell'utente riportato sopra: se l'utente ha una condizione o un rientro da pausa lunga, NON iniziare direttamente con corsa continua se il protocollo prevede prima una fase di cammina-corri o di rinforzo. Restituisci l'intero piano come un array JSON nel blocco \`\`\`workout_json, seguendo lo schema descritto, con una voce per ogni sessione di allenamento (comprese le giornate di rinforzo/mobilità se previste dal protocollo). Prima del blocco JSON, scrivi una brevissima introduzione (3-4 frasi) che spiega la logica del piano e perché rispetta il protocollo di rientro.`;

  let result;
  try {
    result = await callLlm({
      provider: aiSettings.provider,
      apiKey: aiSettings.apiKey,
      model: aiSettings.model,
      baseUrl: aiSettings.baseUrl,
      systemPrompt,
      messages: [{ role: 'user', content: instruction }],
      temperature: 0.3,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  const proposed = extractWorkoutJsonBlocks(result.text) as Array<Record<string, unknown>>;
  if (!proposed.length) {
    return NextResponse.json(
      { error: "L'assistente non ha restituito un piano in formato valido. Riprova, eventualmente con un modello più capace.", raw: result.text },
      { status: 502 }
    );
  }

  const { data: plan, error: planError } = await supabase
    .from('training_plans')
    .insert({ user_id: user.id, goal, start_date: startDate, status: 'active', generated_by: 'ai' })
    .select()
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: planError?.message ?? 'Creazione piano fallita.' }, { status: 500 });
  }

  const rows = proposed
    .filter((w) => VALID_TYPES.includes(w.type as WorkoutType) && typeof w.date === 'string')
    .map((w) => ({
      plan_id: plan.id,
      user_id: user.id,
      date: w.date,
      type: w.type,
      title: w.title ?? 'Allenamento',
      description: w.description ?? '',
      structure: w.structure ?? { steps: [] },
      source: 'ai',
      status: 'planned',
    }));

  if (rows.length) {
    const { error: workoutsError } = await supabase.from('workouts').insert(rows);
    if (workoutsError) {
      return NextResponse.json({ error: workoutsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ plan, workoutsCreated: rows.length, intro: result.text.split('```')[0].trim() });
}
