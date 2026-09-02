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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
const encKey = env.APP_ENCRYPTION_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

function decryptSecret(payload) {
  const key = Buffer.from(encKey, 'hex');
  const [ivB64, authTagB64, dataB64] = payload.split('.');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

async function runSync() {
  const { data: garminTokens } = await supabase.from('garmin_tokens').select('*');
  if (!garminTokens || !garminTokens.length) return;

  const cred = garminTokens[0];
  const email = decryptSecret(cred.garmin_email_encrypted);
  const password = decryptSecret(cred.garmin_password_encrypted);

  const gc = new GarminConnect({ username: email, password });
  await gc.login();

  const activities = await gc.client.get('https://connectapi.garmin.com/activitylist-service/activities/search/activities', {
    params: { start: 0, limit: 20, activityType: 'running' }
  });

  console.log('Fetched', activities.length, 'running activities');

  for (const act of activities) {
    const activityId = String(act.activityId);
    const activityDate = act.startTimeLocal ? act.startTimeLocal.substring(0, 10) : new Date().toISOString().substring(0, 10);
    const timeLocal = act.startTimeLocal ? act.startTimeLocal.substring(11, 19) : undefined;
    const distanceM = act.distance ?? null;
    const durationS = act.duration ?? null;
    const avgHr = act.averageHR ?? null;
    const maxHr = act.maxHR ?? null;
    const avgSpeedMS = act.averageSpeed ?? 0;
    const avgPaceMinKm = avgSpeedMS > 0 ? (1000 / avgSpeedMS) / 60 : null;
    const elevationGain = act.elevationGain ?? act.elevationGainInMeters ?? null;
    const elevationLoss = act.elevationLoss ?? act.elevationLossInMeters ?? null;
    const avgCadence = act.averageRunningCadenceInStepsPerMinute ?? act.averageCadence ?? null;
    const maxCadence = act.maxRunningCadenceInStepsPerMinute ?? act.maxCadence ?? null;
    const calories = act.calories ?? null;

    const { data: existingLog } = await supabase
      .from('activity_log')
      .select('id, raw, coach_reviewed')
      .eq('user_id', cred.user_id)
      .eq('garmin_activity_id', activityId)
      .maybeSingle();

    const isAlreadyReviewed = existingLog ? Boolean(existingLog.coach_reviewed || existingLog.raw?.coach_reviewed) : false;

    const rawWithEnrichment = {
      ...act,
      coach_reviewed: isAlreadyReviewed,
    };

    const logPayload = {
      user_id: cred.user_id,
      garmin_activity_id: activityId,
      date: activityDate,
      type: 'running',
      distance_m: distanceM,
      duration_s: durationS,
      avg_hr_bpm: avgHr,
      max_hr_bpm: maxHr,
      avg_pace_min_per_km: avgPaceMinKm,
      elevation_gain_m: elevationGain,
      elevation_loss_m: elevationLoss,
      coach_reviewed: isAlreadyReviewed,
      raw: rawWithEnrichment,
    };

    const { error: upsertErr } = await supabase.from('activity_log').upsert(logPayload, { onConflict: 'user_id,garmin_activity_id' });
    if (upsertErr) {
      console.log('Upsert error:', upsertErr);
      delete logPayload.elevation_gain_m;
      delete logPayload.elevation_loss_m;
      delete logPayload.coach_reviewed;
      const { error: retryErr } = await supabase.from('activity_log').upsert(logPayload, { onConflict: 'user_id,garmin_activity_id' });
      if (retryErr) console.log('Retry upsert error:', retryErr);
      else console.log('Saved log on fallback:', activityDate, act.activityName);
    } else {
      console.log('Saved log:', activityDate, act.activityName, distanceM, 'm');
    }
  }

  await supabase
    .from('garmin_tokens')
    .update({ last_sync_at: new Date().toISOString() })
    .eq('user_id', cred.user_id);
}

runSync().catch(console.error);
