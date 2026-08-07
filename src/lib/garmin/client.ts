import { GarminConnect } from 'garmin-connect';
import type { Workout, WorkoutStep } from '@/lib/types';

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

function parseSubstepString(sub: string): WorkoutStep {
  const text = sub.trim();
  let durationMin: number | undefined;
  let distanceKm: number | undefined;

  const timeColonMatch = text.match(/(\d+)\s*:\s*(\d+)/);
  if (timeColonMatch) {
    const mins = parseInt(timeColonMatch[1], 10);
    const secs = parseInt(timeColonMatch[2], 10);
    durationMin = mins + secs / 60;
  } else {
    const minMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:min|m|')\b/i);
    const secMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:sec|s|")\b/i);
    const kmMatch = text.match(/(\d+(?:\.\d+)?)\s*km\b/i);
    const meterMatch = text.match(/(\d+(?:\.\d+)?)\s*m\b/i);

    if (minMatch && !meterMatch) {
      durationMin = parseFloat(minMatch[1]);
    } else if (secMatch) {
      durationMin = parseFloat(secMatch[1]) / 60;
    } else if (kmMatch) {
      distanceKm = parseFloat(kmMatch[1]);
    } else if (meterMatch) {
      distanceKm = parseFloat(meterMatch[1]) / 1000;
    }
  }

  const lower = text.toLowerCase();
  let label = 'Fase';
  if (lower.includes('corsa') || lower.includes('run') || lower.includes('scatto') || lower.includes('ritmo')) {
    label = 'Corsa';
  } else if (lower.includes('cammina') || lower.includes('walk') || lower.includes('recupero') || lower.includes('riposo') || lower.includes('pausa')) {
    label = 'Camminata';
  } else if (lower.includes('riscaldamento') || lower.includes('warmup')) {
    label = 'Riscaldamento';
  } else if (lower.includes('defaticamento') || lower.includes('cooldown')) {
    label = 'Defaticamento';
  } else {
    label = text.replace(/(\d+(?:\.\d+)?)\s*(?:min|m|sec|s|km|'|")/gi, '').trim() || text;
  }

  return {
    label,
    durationMin,
    distanceKm,
    notes: text,
  };
}

export function expandWorkoutSteps(steps: WorkoutStep[]): WorkoutStep[] {
  const expanded: WorkoutStep[] = [];

  for (const step of steps) {
    const combinedText = `${step.label || ''} ${step.notes || ''}`.trim();
    const repeatMatch = combinedText.match(/(\d+)\s*x\s*[\(\[]?([^\)\]]+)[\)\]]?/i);

    if (repeatMatch) {
      const count = parseInt(repeatMatch[1], 10);
      const rawParts = repeatMatch[2].split(/\+|\/|;|,/);
      const subSteps = rawParts.map((p) => parseSubstepString(p)).filter((s) => s.durationMin || s.distanceKm || s.label);

      if (subSteps.length > 0 && count > 0) {
        for (let r = 0; r < count; r++) {
          for (const sub of subSteps) {
            expanded.push({ ...sub });
          }
        }
        continue;
      }
    }

    expanded.push(step);
  }

  return expanded;
}

export async function pushWorkoutToGarmin(creds: GarminCredentials, workout: Workout): Promise<{ garminWorkoutId: string }> {
  const gc = await loginGarminConnect(creds);
  const rawSteps = workout.structure?.steps ?? [];
  const expandedSteps = expandWorkoutSteps(rawSteps);

  const steps = expandedSteps.map((step, i) => {
    let stepTypeId = 3;
    let stepTypeKey = 'interval';
    const labelLower = (step.label || '').toLowerCase();
    const notesLower = (step.notes || '').toLowerCase();
    const fullText = `${labelLower} ${notesLower}`;

    if (fullText.includes('riscaldamento') || fullText.includes('warmup') || fullText.includes('warm-up') || fullText.includes('attivazione')) {
      stepTypeId = 1;
      stepTypeKey = 'warmup';
    } else if (fullText.includes('defaticamento') || fullText.includes('cooldown') || fullText.includes('cool-down') || fullText.includes('stretching')) {
      stepTypeId = 2;
      stepTypeKey = 'cooldown';
    } else if (
      fullText.includes('recupero') ||
      fullText.includes('riposo') ||
      fullText.includes('camminat') ||
      fullText.includes('cammina') ||
      fullText.includes('walk') ||
      fullText.includes('trotterell') ||
      fullText.includes('pausa')
    ) {
      stepTypeId = 4;
      stepTypeKey = 'recovery';
    } else {
      stepTypeId = 3;
      stepTypeKey = 'interval';
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
