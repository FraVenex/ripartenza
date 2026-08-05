import type { SupabaseClient } from '@supabase/supabase-js';
import { decryptSecret } from '@/lib/crypto';
import type { MedicalProfile, Workout, AiProvider } from '@/lib/types';
import type { GarminCredentials } from '@/lib/garmin/client';

export async function requireUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Response(JSON.stringify({ error: 'Non autenticato.' }), { status: 401 });
  }
  return user;
}

export async function loadMedicalProfile(supabase: SupabaseClient, userId: string): Promise<MedicalProfile | null> {
  const { data, error } = await supabase.from('medical_profiles').select('*').eq('user_id', userId).maybeSingle();
  if (error || !data) return null;
  return {
    userId: data.user_id,
    conditions: data.conditions ?? [],
    injuries: data.injuries ?? [],
    runningHistory: data.running_history,
    layoffWeeks: data.layoff_weeks,
    clinicianClearance: data.clinician_clearance,
    notes: data.notes,
    updatedAt: data.updated_at,
  };
}

export async function loadRecentWorkouts(
  supabase: SupabaseClient,
  userId: string,
  pastDays = 30,
  futureDays = 90
): Promise<Workout[]> {
  const past = new Date();
  past.setDate(past.getDate() - pastDays);
  const future = new Date();
  future.setDate(future.getDate() + futureDays);
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .gte('date', past.toISOString().slice(0, 10))
    .lte('date', future.toISOString().slice(0, 10))
    .order('date', { ascending: true });
  if (error || !data) return [];
  return data.map(mapWorkoutRow);
}

export interface GarminActivityLogItem {
  id: string;
  garminActivityId: string;
  date: string;
  type: string;
  distanceM: number | null;
  durationS: number | null;
  avgHrBpm: number | null;
  avgPaceMinPerKm: number | null;
}

export async function loadRecentGarminActivities(
  supabase: SupabaseClient,
  userId: string,
  sinceDaysAgo?: number
): Promise<GarminActivityLogItem[]> {
  let query = supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (sinceDaysAgo !== undefined && sinceDaysAgo !== null) {
    const since = new Date();
    since.setDate(since.getDate() - sinceDaysAgo);
    query = query.gte('date', since.toISOString().slice(0, 10));
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id as string,
    garminActivityId: row.garmin_activity_id as string,
    date: row.date as string,
    type: (row.type as string) ?? 'running',
    distanceM: (row.distance_m as number) ?? null,
    durationS: (row.duration_s as number) ?? null,
    avgHrBpm: (row.avg_hr_bpm as number) ?? null,
    avgPaceMinPerKm: (row.avg_pace_min_per_km as number) ?? null,
  }));
}

export function mapWorkoutRow(row: Record<string, unknown>): Workout {
  return {
    id: row.id as string,
    planId: (row.plan_id as string) ?? null,
    userId: row.user_id as string,
    date: row.date as string,
    type: row.type as Workout['type'],
    title: row.title as string,
    description: (row.description as string) ?? '',
    structure: (row.structure as Workout['structure']) ?? { steps: [] },
    source: row.source as Workout['source'],
    garminWorkoutId: (row.garmin_workout_id as string) ?? null,
    status: row.status as Workout['status'],
    rpe: (row.rpe as number) ?? null,
    painScore: (row.pain_score as number) ?? null,
    painLocation: (row.pain_location as string) ?? null,
    notes: (row.notes as string) ?? null,
    completedActivity: (row.completed_activity as Workout['completedActivity']) ?? null,
    createdAt: row.created_at as string,
  };
}

export interface DecryptedAiSettings {
  provider: AiProvider;
  model: string;
  baseUrl: string | null;
  apiKey: string;
}

export async function loadDecryptedAiSettings(supabase: SupabaseClient, userId: string): Promise<DecryptedAiSettings> {
  const { data, error } = await supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle();
  if (error || !data || !data.ai_api_key_encrypted) {
    throw new Error(
      'Nessuna chiave API configurata. Vai su Impostazioni e inserisci la chiave del provider AI che vuoi usare.'
    );
  }
  return {
    provider: data.ai_provider,
    model: data.ai_model,
    baseUrl: data.ai_base_url,
    apiKey: decryptSecret(data.ai_api_key_encrypted),
  };
}

export async function loadDecryptedGarminCredentials(
  supabase: SupabaseClient,
  userId: string
): Promise<GarminCredentials | null> {
  const { data, error } = await supabase
    .from('garmin_tokens')
    .select('garmin_email_encrypted, garmin_password_encrypted')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data || !data.garmin_email_encrypted || !data.garmin_password_encrypted) return null;

  return {
    email: decryptSecret(data.garmin_email_encrypted),
    password: decryptSecret(data.garmin_password_encrypted),
  };
}
