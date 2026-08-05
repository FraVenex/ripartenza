import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { isRunningActivity } from '@/lib/garmin/client';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (process.env.GARMIN_WEBHOOK_SECRET) {
    const provided = req.headers.get('x-garmin-webhook-secret');
    if (provided !== process.env.GARMIN_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const supabase = createServiceRoleClient();
  const payload = await req.json().catch(() => null);
  if (!payload) return NextResponse.json({ error: 'invalid payload' }, { status: 400 });

  const activities: Array<Record<string, unknown>> = payload.activities ?? payload.activityDetails ?? [];
  if (!Array.isArray(activities) || !activities.length) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  let processed = 0;

  for (const activityItem of activities) {
    const activity = activityItem as Record<string, any>;
    const actType = String(activity.activityType?.typeKey ?? activity.activityType ?? 'running');
    if (!isRunningActivity(actType)) continue;

    const garminUserId = (activity.userId ?? activity.userAccessToken) as string | undefined;
    if (!garminUserId) continue;

    const { data: tokenRow } = await supabase
      .from('garmin_tokens')
      .select('user_id')
      .eq('garmin_user_id', garminUserId)
      .maybeSingle();

    if (!tokenRow) continue;

    const startTimeS = (activity.startTimeInSeconds ?? activity.summary?.startTimeInSeconds) as number | undefined;
    const date = startTimeS ? new Date(startTimeS * 1000).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

    const distanceM = (activity.distanceInMeters ?? activity.summary?.distanceInMeters) as number | undefined;
    const durationS = (activity.durationInSeconds ?? activity.summary?.durationInSeconds) as number | undefined;
    const avgHr = (activity.averageHeartRateInBeatsPerMinute ?? activity.summary?.averageHeartRateInBeatsPerMinute) as
      | number
      | undefined;
    const activityId = String(activity.activityId ?? activity.summaryId ?? `${garminUserId}-${startTimeS}`);

    await supabase.from('activity_log').upsert(
      {
        user_id: tokenRow.user_id,
        garmin_activity_id: activityId,
        date,
        type: actType,
        distance_m: distanceM ?? null,
        duration_s: durationS ?? null,
        avg_hr_bpm: avgHr ?? null,
        avg_pace_min_per_km: distanceM && durationS ? durationS / 60 / (distanceM / 1000) : null,
        raw: activity,
      },
      { onConflict: 'user_id,garmin_activity_id' }
    );

    const { data: matchingWorkout } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', tokenRow.user_id)
      .eq('date', date)
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
            avgPaceMinPerKm: distanceM && durationS ? durationS / 60 / (distanceM / 1000) : null,
          },
        })
        .eq('id', matchingWorkout.id);
    }

    processed += 1;
  }

  return NextResponse.json({ ok: true, processed });
}
