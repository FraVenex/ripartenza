import type { SupabaseClient } from '@supabase/supabase-js';
import { decryptSecret } from '@/lib/crypto';
import { DEFAULT_AI_MODEL } from '@/lib/ai/providers';
import type { MedicalProfile, Workout, WorkoutStructure, WorkoutStep, WorkoutRepeatGroup, AiProvider, ActivityWeatherSummary } from '@/lib/types';
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
  pastDays = 60,
  futureDays = 120
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
  maxHrBpm: number | null;
  avgPaceMinPerKm: number | null;
  elevationGainM: number | null;
  elevationLossM: number | null;
  weather?: ActivityWeatherSummary | null;
  coachReviewed?: boolean;
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
  return data.map((row) => {
    const rawObj = (row.raw ?? {}) as Record<string, any>;
    const maxHr = (row.max_hr_bpm as number) ?? rawObj.maxHR ?? rawObj.maxHeartRateInBeatsPerMinute ?? rawObj.summary?.maxHeartRateInBeatsPerMinute ?? null;
    const elevGain = (row.elevation_gain_m as number) ?? rawObj.elevationGain ?? rawObj.elevationGainInMeters ?? null;
    const elevLoss = (row.elevation_loss_m as number) ?? rawObj.elevationLoss ?? rawObj.elevationLossInMeters ?? null;
    const weather = (row.weather_data as ActivityWeatherSummary) ?? rawObj.weather_info ?? null;
    const coachReviewed = (row.coach_reviewed as boolean) ?? Boolean(rawObj.coach_reviewed);

    return {
      id: row.id as string,
      garminActivityId: row.garmin_activity_id as string,
      date: row.date as string,
      type: (row.type as string) ?? 'running',
      distanceM: (row.distance_m as number) ?? null,
      durationS: (row.duration_s as number) ?? null,
      avgHrBpm: (row.avg_hr_bpm as number) ?? null,
      maxHrBpm: maxHr,
      avgPaceMinPerKm: (row.avg_pace_min_per_km as number) ?? null,
      elevationGainM: elevGain,
      elevationLossM: elevLoss,
      weather,
      coachReviewed,
    };
  });
}

export function sanitizeWorkoutStructure(structure: WorkoutStructure): WorkoutStructure {
  if (!structure || !Array.isArray(structure.steps)) return structure;
  const cleanSteps = structure.steps.map((item) => {
    const isRepeat = (item as any).type === 'repeat' || Boolean((item as any).repeatCount && (item as any).steps);
    if (isRepeat) {
      const repeatGroup = item as WorkoutRepeatGroup;
      const sanitizedInner = (repeatGroup.steps || []).map((step) => {
        if (isRecoveryOrWalkStep(step)) {
          const { targetHrZone, targetPace, ...rest } = step;
          return rest;
        }
        return step;
      });
      return { ...repeatGroup, steps: sanitizedInner };
    } else {
      const step = item as WorkoutStep;
      if (isRecoveryOrWalkStep(step)) {
        const { targetHrZone, targetPace, ...rest } = step;
        return rest;
      }
      return step;
    }
  });
  return { ...structure, steps: cleanSteps };
}

function isRecoveryOrWalkStep(step: WorkoutStep): boolean {
  const fullText = `${step.label || ''} ${step.notes || ''}`.toLowerCase();
  return (
    fullText.includes('cammin') ||
    fullText.includes('walk') ||
    fullText.includes('recupero') ||
    fullText.includes('riposo') ||
    fullText.includes('pausa') ||
    fullText.includes('trotterell') ||
    fullText.includes('riscaldamento') ||
    fullText.includes('warmup') ||
    fullText.includes('warm-up') ||
    fullText.includes('defaticamento') ||
    fullText.includes('cooldown') ||
    fullText.includes('cool-down')
  );
}

export function mapWorkoutRow(row: Record<string, unknown>): Workout {
  const rawStructure = (row.structure as Workout['structure']) ?? { steps: [] };
  return {
    id: row.id as string,
    planId: (row.plan_id as string) ?? null,
    userId: row.user_id as string,
    date: row.date as string,
    weekNumber: (row.week_number as number) ?? null,
    sessionOrder: (row.session_order as number) ?? null,
    type: row.type as Workout['type'],
    title: row.title as string,
    description: (row.description as string) ?? '',
    structure: sanitizeWorkoutStructure(rawStructure),
    source: row.source as Workout['source'],
    garminWorkoutId: (row.garmin_workout_id as string) ?? null,
    status: row.status as Workout['status'],
    rpe: (row.rpe as number) ?? null,
    painScore: (row.pain_score as number) ?? null,
    painLocation: (row.pain_location as string) ?? null,
    notes: (row.notes as string) ?? null,
    coachFeedback: (row.coach_feedback as string) ?? null,
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
    provider: data.ai_provider || 'google',
    model: data.ai_model || DEFAULT_AI_MODEL,
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
