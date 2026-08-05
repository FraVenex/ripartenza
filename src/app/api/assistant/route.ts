import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser, loadMedicalProfile, loadRecentWorkouts, loadRecentGarminActivities, loadDecryptedAiSettings } from '@/lib/server/userContext';
import { buildAssistantSystemPrompt } from '@/lib/ai/systemPrompt';
import { callLlm, extractWorkoutJsonBlocks, extractProfileUpdateJsonBlocks, stripJsonBlocks, type ChatTurn } from '@/lib/ai/providers';

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
  const message: string | undefined = body?.message;
  const goal: string | undefined = body?.goal;
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Campo "message" mancante.' }, { status: 400 });
  }

  let aiSettings;
  try {
    aiSettings = await loadDecryptedAiSettings(supabase, user.id);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const [medicalProfile, recentWorkouts, garminActivities, historyRows] = await Promise.all([
    loadMedicalProfile(supabase, user.id),
    loadRecentWorkouts(supabase, user.id, 30, 90),
    loadRecentGarminActivities(supabase, user.id),
    supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(16)
      .then((r) => r.data ?? []),
  ]);

  const systemPrompt = buildAssistantSystemPrompt({ medicalProfile, recentWorkouts, garminActivities, goal });

  const history: ChatTurn[] = historyRows
    .slice()
    .reverse()
    .filter((r) => r.role === 'user' || r.role === 'assistant')
    .map((r) => ({
      role: r.role as 'user' | 'assistant',
      content: r.role === 'assistant' ? stripJsonBlocks(r.content) : r.content,
    }))
    .filter((r) => r.content.trim().length > 0);

  const messages: ChatTurn[] = [...history, { role: 'user', content: message }];

  await supabase.from('chat_messages').insert({ user_id: user.id, role: 'user', content: message });

  let result;
  try {
    result = await callLlm({
      provider: aiSettings.provider,
      apiKey: aiSettings.apiKey,
      model: aiSettings.model,
      baseUrl: aiSettings.baseUrl,
      systemPrompt,
      messages,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  await supabase.from('chat_messages').insert({ user_id: user.id, role: 'assistant', content: result.text });

  const proposedWorkouts = extractWorkoutJsonBlocks(result.text);
  const profileUpdates = extractProfileUpdateJsonBlocks(result.text);

  let workoutsAutoSaved = false;
  if (proposedWorkouts.length > 0) {
    const { data: activePlan } = await supabase
      .from('training_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let planId = activePlan?.id;
    if (!planId) {
      const { data: newPlan } = await supabase
        .from('training_plans')
        .insert({
          user_id: user.id,
          goal: goal || 'Piano 8 Settimane dal Coach AI',
          start_date: new Date().toISOString().slice(0, 10),
          status: 'active',
          generated_by: 'ai',
        })
        .select('id')
        .single();
      planId = newPlan?.id;
    }

    const todayIso = new Date().toISOString().slice(0, 10);

    if (proposedWorkouts.length >= 2) {
      await supabase
        .from('workouts')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'planned')
        .gte('date', todayIso);
    }

    for (const item of proposedWorkouts as Array<Record<string, any>>) {
      if (item.date) {
        if (item.type === 'rest') {
          await supabase
            .from('workouts')
            .delete()
            .eq('user_id', user.id)
            .eq('date', item.date)
            .eq('status', 'planned');
        } else if (item.type && item.title) {
          const { data: existingWorkout } = await supabase
            .from('workouts')
            .select('id')
            .eq('user_id', user.id)
            .eq('date', item.date)
            .maybeSingle();

          const workoutPayload = {
            user_id: user.id,
            plan_id: planId ?? null,
            date: item.date,
            type: item.type,
            title: item.title,
            description: item.description ?? '',
            structure: item.structure ?? { steps: [] },
            source: 'ai',
            status: 'planned',
          };

          if (existingWorkout?.id) {
            await supabase.from('workouts').update(workoutPayload).eq('id', existingWorkout.id);
          } else {
            await supabase.from('workouts').insert(workoutPayload);
          }
        }
      }
    }
    workoutsAutoSaved = true;
  }

  let profileUpdated = false;
  if (profileUpdates.length > 0) {
    const existing = medicalProfile ?? {
      userId: user.id,
      conditions: [],
      injuries: [],
      runningHistory: null,
      layoffWeeks: null,
      clinicianClearance: false,
      notes: null,
      updatedAt: new Date().toISOString(),
    };

    let updatedConditions = [...existing.conditions];
    let updatedInjuries = [...existing.injuries];
    let updatedHistory = existing.runningHistory;
    let updatedLayoff = existing.layoffWeeks;
    let updatedNotes = existing.notes;

    for (const update of profileUpdates) {
      if (update.runningHistory) updatedHistory = update.runningHistory;
      if (update.layoffWeeks !== undefined) updatedLayoff = update.layoffWeeks;
      if (update.notes) updatedNotes = update.notes;

      if (update.addCondition) {
        updatedConditions.push({
          knowledgeBaseId: null,
          label: update.addCondition.label,
          active: update.addCondition.active ?? true,
          side: (update.addCondition.side as 'left' | 'right' | 'bilateral') ?? null,
        });
      }

      if (update.addInjury) {
        updatedInjuries.push({
          knowledgeBaseId: null,
          label: update.addInjury.label,
          active: false,
          side: (update.addInjury.side as 'left' | 'right' | 'bilateral') ?? null,
        });
      }
    }

    await supabase.from('medical_profiles').upsert({
      user_id: user.id,
      conditions: updatedConditions,
      injuries: updatedInjuries,
      running_history: updatedHistory,
      layoff_weeks: updatedLayoff,
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    });

    profileUpdated = true;
  }

  return NextResponse.json({ reply: result.text, proposedWorkouts, workoutsAutoSaved, profileUpdated });
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const { data } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(200);

  return NextResponse.json({ messages: data ?? [] });
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  await Promise.all([
    supabase.from('chat_messages').delete().eq('user_id', user.id),
    supabase.from('workouts').delete().eq('user_id', user.id),
    supabase.from('training_plans').delete().eq('user_id', user.id),
  ]);

  return NextResponse.json({ success: true });
}
