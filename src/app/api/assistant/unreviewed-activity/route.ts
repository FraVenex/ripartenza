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

  const [{ data: logs, error }, { data: workouts }] = await Promise.all([
    supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'running')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('workouts')
      .select('id, title, type, date, description, structure, status')
      .eq('user_id', user.id)
      .in('status', ['planned', 'completed'])
      .order('date', { ascending: true })
      .limit(20),
  ]);

  if (error || !logs || !logs.length) {
    return NextResponse.json({ unreviewedActivity: null });
  }

  const unreviewedRunningLogs = logs.filter((log) => {
    const rawObj = (log.raw ?? {}) as Record<string, any>;
    const type = (log.type || rawObj.activityType?.typeKey || '').toLowerCase();
    const isRunning = type === 'running' || type === 'trail_running' || type === 'treadmill_running';
    const isReviewed = log.coach_reviewed === true || rawObj.coach_reviewed === true;
    const hasDistance = (log.distance_m ?? 0) > 0;
    return isRunning && hasDistance && !isReviewed;
  });

  if (!unreviewedRunningLogs.length) {
    return NextResponse.json({ unreviewedActivity: null });
  }

  const log = unreviewedRunningLogs[0];
  const raw = (log.raw ?? {}) as Record<string, any>;
  const maxHr = (log.max_hr_bpm as number) ?? raw.maxHR ?? raw.maxHeartRateInBeatsPerMinute ?? null;
  const elevGain = (log.elevation_gain_m as number) ?? raw.elevationGain ?? raw.elevationGainInMeters ?? null;
  const elevLoss = (log.elevation_loss_m as number) ?? raw.elevationLoss ?? raw.elevationLossInMeters ?? null;
  const weather = log.weather_data ?? raw.weather_info ?? null;
  const avgCadence = raw.averageRunningCadenceInStepsPerMinute ?? raw.averageCadence ?? null;
  const activityName = raw.activityName ?? raw.name ?? 'Corsa';
  const startTimeLocal = raw.startTimeLocal ?? null;

  let matchingWorkout = (workouts ?? []).find((w) => w.date === log.date && w.status === 'planned');

  if (!matchingWorkout) {
    matchingWorkout = (workouts ?? []).find(
      (w) => (w as any).completed_activity?.garminActivityId === log.garmin_activity_id
    );
  }

  if (!matchingWorkout) {
    matchingWorkout = (workouts ?? []).find((w) => w.type === 'test' && w.status === 'planned');
  }

  if (!matchingWorkout) {
    matchingWorkout = (workouts ?? []).find((w) => w.status === 'planned');
  }

  const mappedActivity = {
    id: log.id,
    garminActivityId: log.garmin_activity_id,
    activityName,
    date: log.date,
    startTimeLocal,
    type: log.type,
    distanceM: log.distance_m,
    durationS: log.duration_s,
    avgHrBpm: log.avg_hr_bpm,
    maxHrBpm: maxHr,
    avgPaceMinPerKm: log.avg_pace_min_per_km,
    elevationGainM: elevGain,
    elevationLossM: elevLoss,
    avgCadence,
    weather,
    matchingWorkout: matchingWorkout
      ? {
          id: matchingWorkout.id,
          title: matchingWorkout.title,
          type: matchingWorkout.type,
          date: matchingWorkout.date,
        }
      : null,
  };

  return NextResponse.json({
    unreviewedActivity: mappedActivity,
  });
}
