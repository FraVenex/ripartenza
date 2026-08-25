import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser, loadMedicalProfile, loadRecentWorkouts, loadRecentGarminActivities, loadDecryptedAiSettings, sanitizeWorkoutStructure } from '@/lib/server/userContext';
import { buildAssistantSystemPrompt } from '@/lib/ai/systemPrompt';
import {
  callLlm,
  extractWorkoutJsonBlocks,
  extractPlanActionJsonBlocks,
  extractProfileUpdateJsonBlocks,
  stripJsonBlocks,
  type ChatTurn,
  type PlanAction,
} from '@/lib/ai/providers';

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
    loadRecentWorkouts(supabase, user.id, 60, 120),
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

  const planActions = extractPlanActionJsonBlocks(result.text);
  const proposedWorkouts = extractWorkoutJsonBlocks(result.text);
  const profileUpdates = extractProfileUpdateJsonBlocks(result.text);

  let actionsExecuted = false;
  let planDeleted = false;

  for (const act of planActions) {
    if (act.type === 'delete_plan' || act.type === 'delete_all_planned') {
      await Promise.all([
        supabase
          .from('training_plans')
          .update({ status: 'archived' })
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('workouts')
          .delete()
          .eq('user_id', user.id)
          .eq('status', 'planned'),
      ]);
      planDeleted = true;
      actionsExecuted = true;
    } else if (act.type === 'delete_workout') {
      if (act.workoutId) {
        await supabase
          .from('workouts')
          .delete()
          .eq('user_id', user.id)
          .eq('id', act.workoutId);
        actionsExecuted = true;
      } else if (act.date) {
        await supabase
          .from('workouts')
          .delete()
          .eq('user_id', user.id)
          .eq('date', act.date)
          .eq('status', 'planned');
        actionsExecuted = true;
      }
    } else if (act.type === 'set_workout_status') {
      const targetStatus = act.status || 'planned';
      const shouldClear = act.clearCompletedActivity || targetStatus === 'planned';
      const updateData: Record<string, unknown> = {
        status: targetStatus,
      };
      if (shouldClear) {
        updateData.completed_activity = null;
        updateData.rpe = null;
        updateData.pain_score = null;
        updateData.pain_location = null;
        updateData.notes = null;
        updateData.coach_feedback = null;
      }

      let q = supabase.from('workouts').update(updateData).eq('user_id', user.id);
      if (act.workoutId) {
        await q.eq('id', act.workoutId);
        actionsExecuted = true;
      } else if (act.date) {
        await q.eq('date', act.date);
        actionsExecuted = true;
      }
    } else if (act.type === 'update_workout') {
      if (act.updates) {
        const updateData: Record<string, unknown> = { ...act.updates };
        if (updateData.structure) {
          updateData.structure = sanitizeWorkoutStructure(updateData.structure as any);
        }
        let q = supabase.from('workouts').update(updateData).eq('user_id', user.id);
        if (act.workoutId) {
          await q.eq('id', act.workoutId);
          actionsExecuted = true;
        } else if (act.date) {
          await q.eq('date', act.date);
          actionsExecuted = true;
        }
      }
    } else if (act.type === 'add_workout' && act.workout) {
      proposedWorkouts.push(act.workout);
    } else if (act.type === 'set_plan' && Array.isArray(act.workouts)) {
      proposedWorkouts.push(...act.workouts);
    }
  }

  let workoutsAutoSaved = false;
  if (proposedWorkouts.length > 0) {
    const isSingleTest = proposedWorkouts.length === 1 && (proposedWorkouts[0] as any)?.type === 'test';

    if (isSingleTest && !planDeleted) {
      await Promise.all([
        supabase
          .from('training_plans')
          .update({ status: 'archived' })
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('workouts')
          .delete()
          .eq('user_id', user.id)
          .eq('status', 'planned'),
      ]);
      planDeleted = true;
    }

    let planId: string | null = null;
    if (!planDeleted) {
      const { data: activePlan } = await supabase
        .from('training_plans')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      planId = activePlan?.id ?? null;
    }

    if (!planId) {
      const planGoal = isSingleTest ? 'Test di Valutazione Iniziale' : (goal || 'Piano 6 Settimane dal Coach AI');
      const { data: newPlan } = await supabase
        .from('training_plans')
        .insert({
          user_id: user.id,
          goal: planGoal,
          start_date: new Date().toISOString().slice(0, 10),
          status: 'active',
          generated_by: 'ai',
        })
        .select('id')
        .single();
      planId = newPlan?.id ?? null;
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
        if (item.type === 'rest' || item.action === 'delete') {
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
            structure: sanitizeWorkoutStructure(item.structure ?? { steps: [] }),
            source: 'ai',
            status: 'planned',
          };

          if (existingWorkout?.id) {
            const { error: updErr } = await supabase.from('workouts').update(workoutPayload).eq('id', existingWorkout.id);
            if (updErr && item.type === 'test') {
              const fallbackPayload = { ...workoutPayload, type: 'easy' };
              await supabase.from('workouts').update(fallbackPayload).eq('id', existingWorkout.id);
            }
          } else {
            const { error: insErr } = await supabase.from('workouts').insert(workoutPayload);
            if (insErr && item.type === 'test') {
              const fallbackPayload = { ...workoutPayload, type: 'easy' };
              await supabase.from('workouts').insert(fallbackPayload);
            }
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

  return NextResponse.json({
    reply: result.text,
    proposedWorkouts,
    workoutsAutoSaved,
    profileUpdated,
    actionsExecuted,
  });
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
