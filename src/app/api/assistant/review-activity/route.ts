import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  requireUser,
  loadMedicalProfile,
  loadRecentWorkouts,
  loadRecentGarminActivities,
  loadDecryptedAiSettings,
  sanitizeWorkoutStructure,
} from '@/lib/server/userContext';
import { buildAssistantSystemPrompt } from '@/lib/ai/systemPrompt';
import {
  callLlm,
  extractWorkoutJsonBlocks,
  extractPlanActionJsonBlocks,
  stripJsonBlocks,
  type ChatTurn,
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
  const activityId: string | undefined = body?.activityId;
  const workoutId: string | undefined = body?.workoutId;
  const rpe: number | null = body?.rpe != null && body?.rpe !== '' ? Number(body.rpe) : null;
  const painScore: number | null = body?.painScore != null && body?.painScore !== '' ? Number(body.painScore) : null;
  const painLocation: string | null = body?.painLocation?.trim() || null;
  const notes: string | null = body?.notes?.trim() || null;

  if (!activityId) {
    return NextResponse.json({ error: 'Campo "activityId" mancante.' }, { status: 400 });
  }

  let aiSettings;
  try {
    aiSettings = await loadDecryptedAiSettings(supabase, user.id);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }

  const { data: activityRow } = await supabase
    .from('activity_log')
    .select('*')
    .eq('id', activityId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!activityRow) {
    return NextResponse.json({ error: 'Attività non trovata.' }, { status: 404 });
  }

  const raw = (activityRow.raw ?? {}) as Record<string, any>;
  const distKm = activityRow.distance_m ? (activityRow.distance_m / 1000).toFixed(2) : 'N/D';
  const durMin = activityRow.duration_s ? Math.round(activityRow.duration_s / 60) : 'N/D';
  const pace = activityRow.avg_pace_min_per_km
    ? `${Math.floor(activityRow.avg_pace_min_per_km)}'${Math.round((activityRow.avg_pace_min_per_km % 1) * 60).toString().padStart(2, '0')}"/km`
    : 'N/D';
  const avgHr = activityRow.avg_hr_bpm ? `${Math.round(activityRow.avg_hr_bpm)} bpm` : 'N/D';
  const maxHr = (activityRow.max_hr_bpm ?? raw.maxHR) ? `${Math.round(activityRow.max_hr_bpm ?? raw.maxHR)} bpm` : 'N/D';
  const elevGain = (activityRow.elevation_gain_m ?? raw.elevationGain ?? raw.elevationGainInMeters) ? `+${activityRow.elevation_gain_m ?? raw.elevationGain ?? raw.elevationGainInMeters} m` : 'N/D';
  const elevLoss = (activityRow.elevation_loss_m ?? raw.elevationLoss ?? raw.elevationLossInMeters) ? `-${activityRow.elevation_loss_m ?? raw.elevationLoss ?? raw.elevationLossInMeters} m` : 'N/D';
  const avgCad = (raw.averageRunningCadenceInStepsPerMinute ?? raw.averageCadence) ? `${raw.averageRunningCadenceInStepsPerMinute ?? raw.averageCadence} spm` : 'N/D';
  const weather = activityRow.weather_data ?? raw.weather_info;
  const weatherText = weather
    ? `${weather.temperatureC}°C, ${weather.conditionDescription}${weather.humidityPercent ? `, umidità ${weather.humidityPercent}%` : ''}${weather.windSpeedKmh ? `, vento ${weather.windSpeedKmh} km/h` : ''}`
    : 'Dati meteo non disponibili';

  const feedbackItems: string[] = [];
  if (rpe != null) feedbackItems.push(`Sforzo percepito (RPE): ${rpe}/10`);
  if (painScore != null) {
    feedbackItems.push(`Livello di dolore/fastidio: ${painScore}/10${painLocation ? ` (${painLocation})` : ''}`);
  }
  if (notes) feedbackItems.push(`Note e sensazioni: "${notes}"`);
  const feedbackSummary = feedbackItems.length ? feedbackItems.join(' | ') : 'Nessun commento soggettivo inserito.';

  const userChatMessage = `Ho completato la sessione di corsa del ${activityRow.date}. Ecco i miei dati e il mio feedback:\n- Dati Corsa: ${distKm} km in ${durMin} min (Passo: ${pace}, FC media: ${avgHr}, FC max: ${maxHr}, Dislivello: ${elevGain} / ${elevLoss}, Cadenza: ${avgCad}, Meteo: ${weatherText})\n- Il mio Feedback: ${feedbackSummary}\n\nCome valuti questa sessione e come dobbiamo proseguire o adattare il piano di allenamento da 6 settimane?`;

  const [medicalProfile, recentWorkouts, garminActivities, historyRows] = await Promise.all([
    loadMedicalProfile(supabase, user.id),
    loadRecentWorkouts(supabase, user.id, 60, 120),
    loadRecentGarminActivities(supabase, user.id, 30),
    supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(14)
      .then((r) => r.data ?? []),
  ]);

  const systemPrompt = buildAssistantSystemPrompt({ medicalProfile, recentWorkouts, garminActivities });

  const history: ChatTurn[] = historyRows
    .slice()
    .reverse()
    .filter((r) => r.role === 'user' || r.role === 'assistant')
    .map((r) => ({
      role: r.role as 'user' | 'assistant',
      content: r.role === 'assistant' ? stripJsonBlocks(r.content) : r.content,
    }))
    .filter((r) => r.content.trim().length > 0);

  const messages: ChatTurn[] = [...history, { role: 'user', content: userChatMessage }];

  await supabase.from('chat_messages').insert({ user_id: user.id, role: 'user', content: userChatMessage });

  let result;
  try {
    result = await callLlm({
      provider: aiSettings.provider,
      apiKey: aiSettings.apiKey,
      model: aiSettings.model,
      baseUrl: aiSettings.baseUrl,
      systemPrompt,
      messages,
      temperature: 0.4,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }

  await supabase.from('chat_messages').insert({ user_id: user.id, role: 'assistant', content: result.text });

  const cleanSummary = stripJsonBlocks(result.text);

  await supabase
    .from('activity_log')
    .update({
      raw: {
        ...raw,
        coach_reviewed: true,
      },
    })
    .eq('id', activityId);

  let targetWorkoutId = workoutId;
  if (!targetWorkoutId) {
    const { data: matchingW } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', activityRow.date)
      .limit(1)
      .maybeSingle();
    targetWorkoutId = matchingW?.id;
  }

  if (targetWorkoutId) {
    const updatePayload: Record<string, unknown> = {
      status: 'completed',
      rpe,
      pain_score: painScore,
      pain_location: painLocation,
      notes,
    };
    const { error: updateErr } = await supabase
      .from('workouts')
      .update({ ...updatePayload, coach_feedback: cleanSummary })
      .eq('id', targetWorkoutId);

    if (updateErr) {
      await supabase
        .from('workouts')
        .update(updatePayload)
        .eq('id', targetWorkoutId);
    }
  }

  const planActions = extractPlanActionJsonBlocks(result.text);
  const proposedWorkouts = extractWorkoutJsonBlocks(result.text);
  let planAdapted = false;

  for (const act of planActions) {
    if (act.type === 'delete_plan' || act.type === 'delete_all_planned') {
      await supabase
        .from('workouts')
        .delete()
        .eq('user_id', user.id)
        .eq('status', 'planned');
      planAdapted = true;
    } else if (act.type === 'delete_workout') {
      if (act.workoutId) {
        await supabase.from('workouts').delete().eq('user_id', user.id).eq('id', act.workoutId);
        planAdapted = true;
      } else if (act.date) {
        await supabase.from('workouts').delete().eq('user_id', user.id).eq('date', act.date).eq('status', 'planned');
        planAdapted = true;
      }
    } else if (act.type === 'set_workout_status') {
      const targetStatus = act.status || 'planned';
      const shouldClear = act.clearCompletedActivity || targetStatus === 'planned';
      const updateData: Record<string, unknown> = { status: targetStatus };
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
        planAdapted = true;
      } else if (act.date) {
        await q.eq('date', act.date);
        planAdapted = true;
      }
    } else if (act.type === 'add_workout' && act.workout) {
      proposedWorkouts.push(act.workout);
    } else if (act.type === 'set_plan' && Array.isArray(act.workouts)) {
      proposedWorkouts.push(...act.workouts);
    }
  }

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
          goal: 'Piano 6 Settimane dal Coach AI',
          start_date: new Date().toISOString().slice(0, 10),
          status: 'active',
          generated_by: 'ai',
        })
        .select('id')
        .single();
      planId = newPlan?.id;
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
    planAdapted = true;
  }

  return NextResponse.json({
    success: true,
    reply: result.text,
    proposedWorkouts,
    planAdapted,
  });
}
