import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/server/userContext';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const { data: logs, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(10);

  if (error || !logs || !logs.length) {
    return NextResponse.json({ unreviewedActivity: null });
  }

  const unreviewedLog = logs.find((log) => {
    const rawObj = (log.raw ?? {}) as Record<string, any>;
    return rawObj.coach_reviewed === false || rawObj.coach_reviewed === undefined;
  });

  if (!unreviewedLog) {
    return NextResponse.json({ unreviewedActivity: null });
  }

  const raw = (unreviewedLog.raw ?? {}) as Record<string, any>;
  const maxHr = (unreviewedLog.max_hr_bpm as number) ?? raw.maxHR ?? raw.maxHeartRateInBeatsPerMinute ?? null;
  const elevGain = (unreviewedLog.elevation_gain_m as number) ?? raw.elevationGain ?? raw.elevationGainInMeters ?? null;
  const elevLoss = (unreviewedLog.elevation_loss_m as number) ?? raw.elevationLoss ?? raw.elevationLossInMeters ?? null;
  const weather = unreviewedLog.weather_data ?? raw.weather_info ?? null;
  const avgCadence = raw.averageRunningCadenceInStepsPerMinute ?? raw.averageCadence ?? null;

  const { data: matchingWorkout } = await supabase
    .from('workouts')
    .select('id, title, type, description, structure, status')
    .eq('user_id', user.id)
    .eq('date', unreviewedLog.date)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    unreviewedActivity: {
      id: unreviewedLog.id,
      garminActivityId: unreviewedLog.garmin_activity_id,
      date: unreviewedLog.date,
      type: unreviewedLog.type,
      distanceM: unreviewedLog.distance_m,
      durationS: unreviewedLog.duration_s,
      avgHrBpm: unreviewedLog.avg_hr_bpm,
      maxHrBpm: maxHr,
      avgPaceMinPerKm: unreviewedLog.avg_pace_min_per_km,
      elevationGainM: elevGain,
      elevationLossM: elevLoss,
      avgCadence,
      weather,
      matchingWorkout: matchingWorkout ?? null,
    },
  });
}
