import crypto from 'node:crypto';

// Cifra i segreti dell'utente (chiave API dell'assistente, token Garmin)
// prima di scriverli su Supabase, così che chi ha accesso al DB (o a un
// backup) non veda i segreti in chiaro. La chiave di cifratura vive solo
// nell'ambiente del server (APP_ENCRYPTION_KEY) e non è mai esposta al client.
//
// Genera la chiave con:  openssl rand -hex 32

const ALGO = 'aes-256-gcm';

function getKey(): Buffer {
  const hex = process.env.APP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'APP_ENCRYPTION_KEY mancante o non valida: deve essere una stringa esadecimale a 32 byte (64 caratteri). Generala con "openssl rand -hex 32".'
    );
  }
  return Buffer.from(hex, 'hex');
}

export function encryptSecret(plainText: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Formato: iv.authTag.ciphertext, tutto base64
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  const [ivB64, authTagB64, dataB64] = payload.split('.');
  if (!ivB64 || !authTagB64 || !dataB64) {
    throw new Error('Formato del segreto cifrato non valido.');
  }
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

export function lastFour(secret: string): string {
  return secret.slice(-4);
}
