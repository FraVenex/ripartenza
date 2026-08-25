import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/server/userContext';
import { encryptSecret } from '@/lib/crypto';
import { loginGarminConnect, getGarminActivities, isRunningActivity } from '@/lib/garmin/client';
import { fetchWeatherForActivity } from '@/lib/weather/openMeteo';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const { data: tokenData } = await supabase
    .from('garmin_tokens')
    .select('garmin_email_encrypted, updated_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!tokenData || !tokenData.garmin_email_encrypted) {
    return NextResponse.json({ connected: false });
  }

  const { count, data: latestActivities } = await supabase
    .from('activity_log')
    .select('date, created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(1);

  const latestActivityDate = latestActivities?.[0]?.date ?? null;
  const lastSyncAt = latestActivities?.[0]?.created_at ?? tokenData.updated_at ?? null;

  return NextResponse.json({
    connected: true,
    updatedAt: tokenData.updated_at,
    totalActivities: count ?? 0,
    latestActivityDate,
    lastSyncAt,
  });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const body = await req.json().catch(() => null);
  const email = body?.email?.trim();
  const password = body?.password?.trim();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e password Garmin Connect obbligatorie.' }, { status: 400 });
  }

  try {
    await loginGarminConnect({ email, password });
  } catch (e) {
    return NextResponse.json({ error: `Verifica credenziali Garmin fallita: ${(e as Error).message}` }, { status: 401 });
  }

  const emailEncrypted = encryptSecret(email);
  const passwordEncrypted = encryptSecret(password);

  const { error } = await supabase.from('garmin_tokens').upsert(
    {
      user_id: user.id,
      garmin_email_encrypted: emailEncrypted,
      garmin_password_encrypted: passwordEncrypted,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    return NextResponse.json({ error: `Errore salvataggio credenziali: ${error.message}` }, { status: 500 });
  }

  let initialSyncedCount = 0;
  try {
    const activities = await getGarminActivities({ email, password }, 365);
    const runningActivities = activities.filter((act) => isRunningActivity(act.activityType?.typeKey));

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

      let weatherData = null;
      const lat = (act.startLatitude as number) ?? (act.latitude as number) ?? null;
      const lon = (act.startLongitude as number) ?? (act.longitude as number) ?? null;

      if (lat != null && lon != null && initialSyncedCount < 10) {
        weatherData = await fetchWeatherForActivity(lat, lon, activityDate, timeLocal);
      }

      await supabase.from('activity_log').upsert(
        {
          user_id: user.id,
          garmin_activity_id: activityId,
          date: activityDate,
          type: act.activityType?.typeKey ?? 'running',
          distance_m: distanceM,
          duration_s: durationS,
          avg_hr_bpm: avgHr,
          max_hr_bpm: maxHr,
          avg_pace_min_per_km: avgPaceMinKm,
          raw: {
            ...act,
            weather_info: weatherData,
            coach_reviewed: true,
          },
        },
        { onConflict: 'user_id,garmin_activity_id' }
      );
      initialSyncedCount += 1;
    }
  } catch {}

  return NextResponse.json({
    ok: true,
    message: `Credenziali Garmin salvate! Scaricate ${initialSyncedCount} sessioni di corsa storiche da Garmin Connect ✓`,
    syncedCount: initialSyncedCount,
  });
}

export async function DELETE(_req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  await supabase.from('garmin_tokens').delete().eq('user_id', user.id);
  return NextResponse.json({ ok: true, message: 'Credenziali Garmin rimosse.' });
}
