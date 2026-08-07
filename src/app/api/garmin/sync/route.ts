import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser, loadDecryptedGarminCredentials } from '@/lib/server/userContext';
import { getGarminActivities, isRunningActivity } from '@/lib/garmin/client';
import { evaluateAndAdaptWorkoutExecution, type CoachEvaluationResult } from '@/lib/ai/coachAdapter';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const body = await req.json().catch(() => ({}));
  const creds = await loadDecryptedGarminCredentials(supabase, user.id);
  if (!creds) {
    return NextResponse.json({ error: 'Nessun account Garmin salvato. Inserisci prima email e password nelle Impostazioni.' }, { status: 400 });
  }

  let daysToFetch = Math.min(Math.max(Number(body?.days) || 30, 1), 365);

  if (body?.auto) {
    const { data: latestRow } = await supabase
      .from('activity_log')
      .select('date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestRow?.date) {
      const daysDiff = Math.ceil((Date.now() - new Date(latestRow.date).getTime()) / (1000 * 60 * 60 * 24));
      daysToFetch = Math.min(365, Math.max(7, daysDiff + 2));
    } else {
      daysToFetch = 365;
    }
  }

  try {
    const activities = await getGarminActivities(creds, daysToFetch);
    const runningActivities = activities.filter((act) => isRunningActivity(act.activityType?.typeKey));

    let savedCount = 0;
    const completedWorkoutIds: string[] = [];

    for (const act of runningActivities) {
      const activityId = String(act.activityId);
      const activityDate = act.startTimeLocal ? act.startTimeLocal.substring(0, 10) : new Date().toISOString().substring(0, 10);
      const distanceM = act.distance ?? null;
      const durationS = act.duration ?? null;
      const avgHr = act.averageHR ?? null;
      const avgSpeedMS = act.averageSpeed ?? 0;
      const avgPaceMinKm = avgSpeedMS > 0 ? (1000 / avgSpeedMS) / 60 : null;

      await supabase.from('activity_log').upsert(
        {
          user_id: user.id,
          garmin_activity_id: activityId,
          date: activityDate,
          type: act.activityType?.typeKey ?? 'running',
          distance_m: distanceM,
          duration_s: durationS,
          avg_hr_bpm: avgHr,
          avg_pace_min_per_km: avgPaceMinKm,
          raw: act,
        },
        { onConflict: 'user_id,garmin_activity_id' }
      );

      const { data: matchingWorkout } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', activityDate)
        .eq('status', 'planned')
        .limit(1)
        .maybeSingle();

      if (matchingWorkout) {
        await supabase
          .from('workouts')
          .update({
            status: 'completed',
            completed_activity: {
              garminActivityId: activityId,
              durationS,
              distanceM,
              avgHrBpm: avgHr,
              avgPaceMinPerKm: avgPaceMinKm,
            },
          })
          .eq('id', matchingWorkout.id);

        completedWorkoutIds.push(matchingWorkout.id);
      }

      savedCount += 1;
    }

    const coachEvaluations: CoachEvaluationResult[] = [];
    for (const wId of completedWorkoutIds) {
      const evalRes = await evaluateAndAdaptWorkoutExecution(supabase, user.id, wId);
      if (evalRes) coachEvaluations.push(evalRes);
    }

    return NextResponse.json({
      ok: true,
      message: `Sincronizzate ${savedCount} sessioni di corsa da Garmin Connect ✓`,
      syncedCount: savedCount,
      daysFetched: daysToFetch,
      coachEvaluations,
    });
  } catch (e) {
    return NextResponse.json({ error: `Sincronizzazione Garmin fallita: ${(e as Error).message}` }, { status: 502 });
  }
}

