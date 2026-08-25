import type { SupabaseClient } from '@supabase/supabase-js';
import {
  loadMedicalProfile,
  loadRecentWorkouts,
  loadRecentGarminActivities,
  loadDecryptedAiSettings,
  mapWorkoutRow,
  sanitizeWorkoutStructure,
} from '@/lib/server/userContext';
import { buildAssistantSystemPrompt } from '@/lib/ai/systemPrompt';
import { callLlm, extractWorkoutJsonBlocks, stripJsonBlocks } from '@/lib/ai/providers';
import type { Workout } from '@/lib/types';

export interface CoachEvaluationResult {
  evaluated: boolean;
  planAdapted: boolean;
  summary: string;
  workoutId: string;
  workoutTitle: string;
}

export async function evaluateAndAdaptWorkoutExecution(
  supabase: SupabaseClient,
  userId: string,
  workoutId: string
): Promise<CoachEvaluationResult | null> {
  const { data: workoutRow } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!workoutRow) return null;

  const workout: Workout = mapWorkoutRow(workoutRow);
  const completed = workout.completedActivity;

  let aiSettings;
  try {
    aiSettings = await loadDecryptedAiSettings(supabase, userId);
  } catch {
    return null;
  }

  const [medicalProfile, recentWorkouts, garminActivities] = await Promise.all([
    loadMedicalProfile(supabase, userId),
    loadRecentWorkouts(supabase, userId, 30, 90),
    loadRecentGarminActivities(supabase, userId, 30),
  ]);

  const systemPrompt = buildAssistantSystemPrompt({
    medicalProfile,
    recentWorkouts,
    garminActivities,
  });

  const feedbackParts: string[] = [];
  if (workout.rpe != null) feedbackParts.push(`Sforzo percepito RPE: ${workout.rpe}/10`);
  if (workout.painScore != null) {
    feedbackParts.push(`Punteggio dolore: ${workout.painScore}/10${workout.painLocation ? ` (${workout.painLocation})` : ''}`);
  }
  if (workout.notes) feedbackParts.push(`Note aggiunte: ${workout.notes}`);

  const userFeedbackText = feedbackParts.length > 0
    ? feedbackParts.join(', ')
    : 'L\'utente non ha inserito alcun feedback esplicito (nessuna indicazione su dolore all\'anca, RPE o note).';

  const completedStatsText = completed
    ? `Dati registrati: Distanza ${(completed.distanceM ? completed.distanceM / 1000 : 0).toFixed(2)} km, Durata ${Math.round((completed.durationS ?? 0) / 60)} min, Frequenza cardiaca media ${completed.avgHrBpm ? Math.round(completed.avgHrBpm) + ' bpm' : 'N/D'}, Frequenza cardiaca massima ${completed.maxHrBpm ? Math.round(completed.maxHrBpm) + ' bpm' : 'N/D'}, Passo medio ${completed.avgPaceMinPerKm ? `${Math.floor(completed.avgPaceMinPerKm)}'${Math.round((completed.avgPaceMinPerKm % 1) * 60).toString().padStart(2, '0')}"/km` : 'N/D'}`
    : 'Dati attività registrati non disponibili in dettaglio.';

  const evaluationPrompt = `VALUTAZIONE AUTOMATICA E EVENTUALE ADATTAMENTO DEL PIANO DOPO NUOVI DATI DI CORSA.

L'allenamento in programma per la data ${workout.date} intitolato "${workout.title}" (${workout.type}) è appena stato completato e i relativi dati sono stati sincronizzati ed acquisiti.

DETTAGLI DELL'ALLENAMENTO IN PROGRAMMA:
- Descrizione: ${workout.description}
- Struttura teorica: ${JSON.stringify(workout.structure)}

DETTAGLI DELLA PRESTAZIONE REALE APPENA SCARICATA:
- ${completedStatsText}

FEEDBACK DELL'UTENTE:
- ${userFeedbackText}

ISTRUZIONI PER IL COACH:
1. Valuta attentamente la prestazione confrontandola sia con la struttura prevista, sia con il profilo medico dell'atleta e lo storico consolidato del carico.
2. Considera con massima priorità la prevenzione del dolore o del sovraccarico (ad esempio dolore all'anca, affaticamento o scostamenti dalla FC/passo). Prendi la decisione anche se l'utente NON ha inserito un feedback esplicito.
3. Se ritieni che il piano vada ADATTATO e MODIFICATO per i prossimi giorni o settimane, fornisci obbligatoriamente le sessioni modificate o inserite nel blocco \`\`\`workout_json ... \`\`\`.
4. Nel testo del tuo messaggio, fornisci all'atleta un'analisi sintetica e chiara di com'è andata la corsa e quali eventuali modifiche sono state apportate al piano.`;

  let result;
  try {
    result = await callLlm({
      provider: aiSettings.provider,
      apiKey: aiSettings.apiKey,
      model: aiSettings.model,
      baseUrl: aiSettings.baseUrl,
      systemPrompt,
      messages: [{ role: 'user', content: evaluationPrompt }],
    });
  } catch {
    return null;
  }

  const coachResponseText = result.text;
  const cleanSummary = stripJsonBlocks(coachResponseText);

  await supabase.from('chat_messages').insert({
    user_id: userId,
    role: 'assistant',
    content: coachResponseText,
  });

  const proposedWorkouts = extractWorkoutJsonBlocks(coachResponseText);
  let planAdapted = false;

  if (proposedWorkouts.length > 0) {
    const { data: activePlan } = await supabase
      .from('training_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let planId = activePlan?.id;
    if (!planId) {
      const { data: newPlan } = await supabase
        .from('training_plans')
        .insert({
          user_id: userId,
          goal: 'Piano adattato dal Coach AI',
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
        if (item.type === 'rest') {
          await supabase
            .from('workouts')
            .delete()
            .eq('user_id', userId)
            .eq('date', item.date)
            .eq('status', 'planned');
        } else if (item.type && item.title) {
          const { data: existingWorkout } = await supabase
            .from('workouts')
            .select('id')
            .eq('user_id', userId)
            .eq('date', item.date)
            .maybeSingle();

          const workoutPayload = {
            user_id: userId,
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

  return {
    evaluated: true,
    planAdapted,
    summary: cleanSummary,
    workoutId,
    workoutTitle: workout.title,
  };
}
