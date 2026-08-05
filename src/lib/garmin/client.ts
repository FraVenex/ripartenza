import { GarminConnect } from 'garmin-connect';
import type { Workout } from '@/lib/types';

export interface GarminCredentials {
  email: string;
  password: string;
}

export async function loginGarminConnect(creds: GarminCredentials): Promise<GarminConnect> {
  const gc = new GarminConnect({
    username: creds.email,
    password: creds.password,
  });
  await gc.login();
  return gc;
}

export interface GarminActivityItem {
  activityId: string;
  activityName: string;
  startTimeLocal: string;
  distance: number;
  duration: number;
  averageSpeed: number;
  averageHR: number;
  activityType: { typeKey: string };
}

export function isRunningActivity(typeKey?: string): boolean {
  if (!typeKey) return false;
  const key = typeKey.toLowerCase();
  return key.includes('running') || key.includes('run');
}

export async function getGarminActivities(creds: GarminCredentials, limit = 30): Promise<GarminActivityItem[]> {
  const gc = await loginGarminConnect(creds);
  const activities = await gc.getActivities(0, limit);
  return (activities as unknown as GarminActivityItem[]) ?? [];
}

export async function pushWorkoutToGarmin(creds: GarminCredentials, workout: Workout): Promise<{ garminWorkoutId: string }> {
  const gc = await loginGarminConnect(creds);

  const steps = (workout.structure?.steps ?? []).map((step, i) => {
    let stepTypeId = 3;
    let stepTypeKey = 'interval';
    const labelLower = (step.label || '').toLowerCase();
    if (labelLower.includes('riscaldamento') || labelLower.includes('warmup')) {
      stepTypeId = 1;
      stepTypeKey = 'warmup';
    } else if (labelLower.includes('defaticamento') || labelLower.includes('cooldown')) {
      stepTypeId = 2;
      stepTypeKey = 'cooldown';
    } else if (labelLower.includes('recupero') || labelLower.includes('riposo')) {
      stepTypeId = 4;
      stepTypeKey = 'recovery';
    }

    let conditionTypeId = 1;
    let conditionTypeKey = 'lap.button';
    let endConditionValue: number | null = null;

    if (step.durationMin && step.durationMin > 0) {
      conditionTypeId = 2;
      conditionTypeKey = 'time';
      endConditionValue = Math.round(step.durationMin * 60);
    } else if (step.distanceKm && step.distanceKm > 0) {
      conditionTypeId = 3;
      conditionTypeKey = 'distance';
      endConditionValue = Math.round(step.distanceKm * 1000);
    }

    return {
      type: 'ExecutableStepDTO',
      stepId: null,
      stepOrder: i + 1,
      childStepId: null,
      description: step.label || `Fase ${i + 1}`,
      stepType: {
        stepTypeId,
        stepTypeKey,
      },
      endCondition: {
        conditionTypeId,
        conditionTypeKey,
      },
      endConditionValue,
      targetType: {
        workoutTargetTypeId: 1,
        workoutTargetTypeKey: 'no.target',
      },
    };
  });

  if (steps.length === 0) {
    steps.push({
      type: 'ExecutableStepDTO',
      stepId: null,
      stepOrder: 1,
      childStepId: null,
      description: workout.title || 'Corsa',
      stepType: {
        stepTypeId: 3,
        stepTypeKey: 'interval',
      },
      endCondition: {
        conditionTypeId: 1,
        conditionTypeKey: 'lap.button',
      },
      endConditionValue: null,
      targetType: {
        workoutTargetTypeId: 1,
        workoutTargetTypeKey: 'no.target',
      },
    });
  }

  const payload = {
    workoutName: workout.title || 'Allenamento Ripartenza',
    description: workout.description || 'Allenamento generato da Ripartenza Coach',
    sportType: {
      sportTypeId: 1,
      sportTypeKey: 'running',
    },
    workoutSegments: [
      {
        segmentOrder: 1,
        sportType: {
          sportTypeId: 1,
          sportTypeKey: 'running',
        },
        workoutSteps: steps,
      },
    ],
  };

  const created = await (gc as unknown as { addWorkout: (w: unknown) => Promise<unknown> }).addWorkout(payload);
  const garminWorkoutId: string = String((created as Record<string, unknown>).workoutId ?? (created as Record<string, unknown>).id ?? Date.now());

  return { garminWorkoutId };
}
