import { createClient } from '@supabase/supabase-js';
import pkg from 'garmin-connect';
const { GarminConnect } = pkg;
import crypto from 'crypto';
import fs from 'fs';

globalThis.WebSocket = class DummyWebSocket {};

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.substring(0, idx).trim(), l.substring(idx + 1).trim()];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function decryptSecret(payload) {
  const key = Buffer.from(env.APP_ENCRYPTION_KEY, 'hex');
  const [ivB64, authTagB64, dataB64] = payload.split('.');
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error('Formato del segreto cifrato non valido.');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

async function fetchAndSaveRealData() {
  const { data: garminTokens } = await supabase.from('garmin_tokens').select('*');
  if (!garminTokens || !garminTokens.length) return;

  const cred = garminTokens[0];
  const email = decryptSecret(cred.garmin_email_encrypted);
  const password = decryptSecret(cred.garmin_password_encrypted);

  const gc = new GarminConnect({ username: email, password });
  await gc.login();

  const activities = await gc.client.get(
    'https://connectapi.garmin.com/activitylist-service/activities/search/activities',
    { params: { start: 0, limit: 10, activityType: 'running' } }
  );

  console.log('Fetched', activities.length, 'running activities');

  const todayAct = activities.find((a) => String(a.activityId) === '24144101348') || activities[0];
  console.log('REAL Garmin Activity for 28 Aug:', JSON.stringify(todayAct, null, 2));

  for (const act of activities) {
    const activityId = String(act.activityId);
    const activityDate = act.startTimeLocal ? act.startTimeLocal.substring(0, 10) : new Date().toISOString().substring(0, 10);
    const distanceM = act.distance ?? null;
    const durationS = act.duration ?? act.elapsedDuration ?? null;
    const avgHr = act.averageHR ?? act.averageHeartRate ?? null;
    const maxHr = act.maxHR ?? act.maxHeartRate ?? null;
    const avgSpeedMS = act.averageSpeed ?? 0;
    const avgPaceMinKm = avgSpeedMS > 0 ? (1000 / avgSpeedMS) / 60 : null;
    const elevationGain = act.elevationGain ?? act.elevationGainInMeters ?? null;
    const elevationLoss = act.elevationLoss ?? act.elevationLossInMeters ?? null;

    const { data: existingLog } = await supabase
      .from('activity_log')
      .select('id, raw, coach_reviewed')
      .eq('user_id', cred.user_id)
      .eq('garmin_activity_id', activityId)
      .maybeSingle();

    const isAlreadyReviewed = existingLog ? Boolean(existingLog.coach_reviewed || existingLog.raw?.coach_reviewed) : false;

    const logPayload = {
      user_id: cred.user_id,
      garmin_activity_id: activityId,
      date: activityDate,
      type: 'running',
      distance_m: distanceM,
      duration_s: durationS,
      avg_hr_bpm: avgHr,
      avg_pace_min_per_km: avgPaceMinKm,
      elevation_gain_m: elevationGain,
      elevation_loss_m: elevationLoss,
      coach_reviewed: isAlreadyReviewed,
      raw: {
        ...act,
        maxHR: maxHr,
        coach_reviewed: isAlreadyReviewed,
      },
    };

    const { error } = await supabase
      .from('activity_log')
      .upsert(logPayload, { onConflict: 'user_id,garmin_activity_id' });

    if (error) console.error('Error saving', activityDate, error);
    else console.log(`SUCCESS: Saved real data for ${activityDate} (${act.activityName}): dist=${distanceM}m, dur=${durationS}s, avgHr=${avgHr}, maxHr=${maxHr}, pace=${avgPaceMinKm}`);
  }
}

fetchAndSaveRealData().catch(console.error);
