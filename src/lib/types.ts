export type WorkoutType =
  | 'easy'
  | 'long'
  | 'tempo'
  | 'intervals'
  | 'walk_run'
  | 'strength'
  | 'mobility'
  | 'rest'
  | 'test';

export const WORKOUT_TYPE_LABEL: Record<WorkoutType, string> = {
  easy: 'Facile',
  long: 'Lungo',
  tempo: 'Soglia',
  intervals: 'Ripetute',
  walk_run: 'Cammina-Corri',
  strength: 'Rinforzo',
  mobility: 'Mobilità',
  rest: 'Riposo',
  test: 'Test Valutazione',
};

export const WORKOUT_TYPE_COLOR: Record<WorkoutType, 'track' | 'recovery' | 'zone' | 'signal'> = {
  easy: 'zone',
  long: 'track',
  tempo: 'track',
  intervals: 'track',
  walk_run: 'recovery',
  strength: 'recovery',
  mobility: 'recovery',
  rest: 'zone',
  test: 'signal',
};

export type WorkoutStatus = 'planned' | 'completed' | 'skipped' | 'modified';

export interface WorkoutStep {
  type?: 'step';
  label: string;
  durationMin?: number;
  distanceKm?: number;
  targetPace?: string;
  targetHrZone?: string;
  targetCadence?: string;
  notes?: string;
}

export interface WorkoutRepeatGroup {
  type: 'repeat';
  repeatCount: number;
  steps: WorkoutStep[];
}

export type WorkoutStepOrGroup = WorkoutStep | WorkoutRepeatGroup;

export interface WorkoutStructure {
  steps: WorkoutStepOrGroup[];
  totalDurationMin?: number;
  totalDistanceKm?: number;
}

export interface ActivityWeatherSummary {
  temperatureC: number;
  apparentTemperatureC?: number;
  conditionDescription: string;
  humidityPercent?: number;
  windSpeedKmh?: number;
  precipitationMm?: number;
  weatherCode?: number;
}

export interface CompletedActivitySummary {
  garminActivityId?: string;
  durationS?: number;
  distanceM?: number;
  avgHrBpm?: number;
  maxHrBpm?: number;
  avgPaceMinPerKm?: number;
  elevationGainM?: number;
  elevationLossM?: number;
  avgCadence?: number;
  maxCadence?: number;
  calories?: number;
  weather?: ActivityWeatherSummary | null;
}

export interface Workout {
  id: string;
  planId: string | null;
  userId: string;
  date: string;
  weekNumber?: number | null;
  sessionOrder?: number | null;
  type: WorkoutType;
  title: string;
  description: string;
  structure: WorkoutStructure;
  source: 'ai' | 'manual' | 'garmin';
  garminWorkoutId?: string | null;
  status: WorkoutStatus;
  rpe?: number | null;
  painScore?: number | null;
  painLocation?: string | null;
  notes?: string | null;
  coachFeedback?: string | null;
  completedActivity?: CompletedActivitySummary | null;
  createdAt: string;
}

export interface TrainingPlan {
  id: string;
  userId: string;
  goal: string;
  startDate: string;
  targetEventDate: string | null;
  weeksCount?: number;
  currentWeek?: number;
  status: 'active' | 'completed' | 'archived';
  generatedBy: 'ai' | 'manual';
  createdAt: string;
}

export interface MedicalProfile {
  userId: string;
  conditions: MedicalCondition[];
  injuries: MedicalCondition[];
  runningHistory: string | null;
  layoffWeeks: number | null;
  clinicianClearance: boolean;
  notes: string | null;
  updatedAt: string;
}

export interface MedicalCondition {
  knowledgeBaseId: string | null;
  label: string;
  side?: 'left' | 'right' | 'bilateral' | null;
  diagnosedAt?: string | null;
  active: boolean;
}

export type AiProvider = 'openai' | 'anthropic' | 'google' | 'openrouter' | 'custom';

export interface UserSettings {
  userId: string;
  aiProvider: AiProvider;
  aiModel: string;
  aiBaseUrl: string | null;
  hasApiKey: boolean;
  apiKeyLastFour: string | null;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface GarminConnectionStatus {
  connected: boolean;
  garminUserId: string | null;
  scope: string | null;
  expiresAt: string | null;
}
