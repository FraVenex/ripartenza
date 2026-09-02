import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser, loadDecryptedGarminCredentials } from '@/lib/server/userContext';
import { getGarminActivities, isRunningActivity } from '@/lib/garmin/client';
import { fetchWeatherForActivity } from '@/lib/weather/openMeteo';

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

  let limitToFetch = Math.max(1, Math.min(Number(body?.days) || 15, 20));

  if (body?.auto) {
    limitToFetch = 15;
  }

  try {
    const activities = await getGarminActivities(creds, limitToFetch);
    const runningActivities = activities.filter((act) => isRunningActivity(act));

    let savedCount = 0;
    let newlyDownloadedCount = 0;
    let weatherLookupsCount = 0;

    for (const act of runningActivities) {
      const activityId = String(act.activityId);
      const activityDate = act.startTimeLocal ? act.startTimeLocal.substring(0, 10) : new Date().toISOString().substring(0, 10);
      const timeLocal = act.startTimeLocal ? act.startTimeLocal.substring(11, 19) : undefined;
      const distanceM = act.distance ?? null;
      const durationS = act.duration ?? null;
      const avgHr = act.averageHR ?? null;
      const maxHr = act.maxHR ?? null;
      const avgSpeedMS = act.averageSpeed ?? 0;
      const avgPaceMinKm = avgSpeedMS > 0 ? (1000 / avgSpeedMS) / 60 : null;
      const elevationGain = (act.elevationGain as number) ?? (act.elevationGainInMeters as number) ?? null;
      const elevationLoss = (act.elevationLoss as number) ?? (act.elevationLossInMeters as number) ?? null;
      const avgCadence = (act.averageRunningCadenceInStepsPerMinute as number) ?? (act.averageCadence as number) ?? null;
      const maxCadence = (act.maxRunningCadenceInStepsPerMinute as number) ?? (act.maxCadence as number) ?? null;
      const calories = (act.calories as number) ?? null;

      const { data: existingLog } = await supabase
        .from('activity_log')
        .select('id, raw, coach_reviewed')
        .eq('user_id', user.id)
        .eq('garmin_activity_id', activityId)
        .maybeSingle();

      let weatherData = existingLog?.raw?.weather_info ?? null;
      const lat = (act.startLatitude as number) ?? (act.latitude as number) ?? null;
      const lon = (act.startLongitude as number) ?? (act.longitude as number) ?? null;

      if (!weatherData && lat != null && lon != null && weatherLookupsCount < 3) {
        try {
          weatherLookupsCount += 1;
          const weatherPromise = fetchWeatherForActivity(lat, lon, activityDate, timeLocal);
          const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
          weatherData = await Promise.race([weatherPromise, timeoutPromise]);
        } catch {
          weatherData = null;
        }
      }

      const isAlreadyReviewed = existingLog
        ? Boolean(existingLog.coach_reviewed || existingLog.raw?.coach_reviewed)
        : false;

      const rawWithEnrichment = {
        ...act,
        weather_info: weatherData,
        coach_reviewed: isAlreadyReviewed,
      };

      const logPayload: Record<string, unknown> = {
        user_id: user.id,
        garmin_activity_id: activityId,
        date: activityDate,
        type: act.activityType?.typeKey ?? 'running',
        distance_m: distanceM,
        duration_s: durationS,
        avg_hr_bpm: avgHr,
        avg_pace_min_per_km: avgPaceMinKm,
        elevation_gain_m: elevationGain,
        elevation_loss_m: elevationLoss,
        weather_data: weatherData,
        coach_reviewed: isAlreadyReviewed,
        raw: rawWithEnrichment,
      };

      const { error: upsertErr } = await supabase.from('activity_log').upsert(logPayload, { onConflict: 'user_id,garmin_activity_id' });
      if (upsertErr) {
        delete logPayload.elevation_gain_m;
        delete logPayload.elevation_loss_m;
        delete logPayload.weather_data;
        delete logPayload.coach_reviewed;
        await supabase.from('activity_log').upsert(logPayload, { onConflict: 'user_id,garmin_activity_id' });
      }

      if (!existingLog) {
        newlyDownloadedCount += 1;
      }

      let { data: matchingWorkout } = await supabase
        .from('workouts')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('date', activityDate)
        .eq('status', 'planned')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!matchingWorkout) {
        const { data: nextPlanned } = await supabase
          .from('workouts')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'planned')
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle();
        if (nextPlanned) {
          matchingWorkout = nextPlanned;
        }
      }

      if (matchingWorkout?.id) {
        await supabase
          .from('workouts')
          .update({
            date: activityDate,
            status: 'completed',
            completed_activity: {
              garminActivityId: activityId,
              durationS,
              distanceM,
              avgHrBpm: avgHr,
              maxHrBpm: maxHr,
              avgPaceMinPerKm: avgPaceMinKm,
              elevationGainM: elevationGain,
              elevationLossM: elevationLoss,
              avgCadence,
              maxCadence,
              calories,
              weather: weatherData,
            },
          })
          .eq('id', matchingWorkout.id);
      }

      savedCount += 1;
    }

    return NextResponse.json({
      ok: true,
      message: `Sincronizzate ${savedCount} sessioni di corsa da Garmin Connect ✓`,
      syncedCount: savedCount,
      newlyDownloadedCount,
      totalFetchedFromGarmin: activities.length,
    });
  } catch (e) {
    return NextResponse.json({ error: `Sincronizzazione Garmin fallita: ${(e as Error).message}` }, { status: 502 });
  }
}
