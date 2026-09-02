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
  realtime: { timeout: 0, params: { eventsPerSecond: 0 } },
});

function decryptSecret(payload) {
  const key = Buffer.from(encKey, 'hex');
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

async function run() {
  const { data: garminTokens, error: errTokens } = await supabase.from('garmin_tokens').select('*');
  console.log('Garmin tokens rows:', garminTokens?.length, errTokens);

  if (garminTokens && garminTokens.length > 0) {
    const cred = garminTokens[0];
    const email = decryptSecret(cred.garmin_email_encrypted);
    const password = decryptSecret(cred.garmin_password_encrypted);
    console.log('Connecting to Garmin with email:', email);
    const gc = new GarminConnect({ username: email, password });
    await gc.login();
    console.log('Garmin login success!');

    try {
      console.log('Testing connect.garmin.com/modern/proxy/activitylist-service...');
      const actModern = await gc.client.get('https://connect.garmin.com/modern/proxy/activitylist-service/activities/search/activities', {
        params: { start: 0, limit: 10 }
      });
      console.log('Modern proxy returned:', actModern?.length, 'activities');
      if (actModern?.length) {
        console.log('First 3 from modern proxy:', actModern.slice(0, 3).map(a => ({ id: a.activityId, name: a.activityName, start: a.startTimeLocal })));
      }
    } catch (e) {
      console.log('Modern proxy error:', e.message);
    }

    try {
      console.log('Testing connectapi.garmin.com/activitylist-service with activityType=running...');
      const actRunning = await gc.client.get('https://connectapi.garmin.com/activitylist-service/activities/search/activities', {
        params: { start: 0, limit: 10, activityType: 'running' }
      });
      console.log('ConnectAPI running returned:', actRunning?.length);
      if (actRunning?.length) {
        console.log('First 3 running:', actRunning.slice(0, 3).map(a => ({ id: a.activityId, name: a.activityName, start: a.startTimeLocal })));
      }
    } catch (e) {
      console.log('ConnectAPI running error:', e.message);
    }
  }
}

run().catch(console.error);
