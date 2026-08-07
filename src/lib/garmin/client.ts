import { GarminConnect } from 'garmin-connect';
import type { Workout, WorkoutStep, WorkoutRepeatGroup, WorkoutStepOrGroup } from '@/lib/types';

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
  maxHR?: number;
  elevationGain?: number;
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

  const timeColonMatch = text.match(/(\d+)\s*[:']\s*(\d+)/);
  const explicitSecMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:sec|secondi|s)\b/i);
  const explicitMeterMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:metri|meter|meters)\b/i);
  const explicitKmMatch = text.match(/(\d+(?:[\.,]\d+)?)\s*(?:km|chilometri|kilometer)\b/i);
  const explicitMinMatch = text.match(/(\d+(?:[\.,]\d+)?)\s*(?:min|minuti|minute|minutes)\b/i);

  if (timeColonMatch) {
    const mins = parseInt(timeColonMatch[1], 10);
    const secs = parseInt(timeColonMatch[2], 10);
    durationMin = mins + secs / 60;
  } else if (explicitKmMatch) {
    distanceKm = parseFloat(explicitKmMatch[1].replace(',', '.'));
  } else if (explicitMeterMatch) {
    distanceKm = parseFloat(explicitMeterMatch[1]) / 1000;
  } else if (explicitSecMatch) {
    durationMin = parseFloat(explicitSecMatch[1]) / 60;
  } else if (explicitMinMatch) {
    durationMin = parseFloat(explicitMinMatch[1].replace(',', '.'));
  } else {
    const numberMatches = Array.from(text.matchAll(/(\d+(?:[\.,]\d+)?)\s*([a-zA-Z']*)/g));
    for (const match of numberMatches) {
      const val = parseFloat(match[1].replace(',', '.'));
      const unit = (match[2] || '').toLowerCase();

      if (unit === 'm' || unit === '\'') {
        durationMin = val;
        break;
      } else if (unit === 'k' || unit === 'km') {
        distanceKm = val;
        break;
      } else if (!unit) {
        if (val <= 60) {
          durationMin = val;
        } else {
          distanceKm = val / 1000;
        }
        break;
      }
    }
  }

  const lower = text.toLowerCase();
  let label = 'Fase';
  if (lower.includes('corsa') || lower.includes('run') || lower.includes('scatto') || lower.includes('ritmo') || lower.includes('allungo')) {
    label = 'Corsa';
  } else if (lower.includes('cammina') || lower.includes('walk') || lower.includes('recupero') || lower.includes('riposo') || lower.includes('pausa') || lower.includes('passo')) {
    label = 'Recupero';
  } else if (lower.includes('riscaldamento') || lower.includes('warmup')) {
    label = 'Riscaldamento';
  } else if (lower.includes('defaticamento') || lower.includes('cooldown')) {
    label = 'Defaticamento';
  } else {
    label = text.replace(/(\d+(?:[\.,]\d+)?)\s*(?:min|minuti|sec|secondi|m|km|'|")/gi, '').trim() || text;
  }

  return {
    label,
    durationMin,
    distanceKm,
    notes: text,
  };
}

function parseRepeatGroupFromText(step: WorkoutStep): WorkoutRepeatGroup | null {
  const combinedText = `${step.label || ''} ${step.notes || ''}`.trim();
  const repeatMatch = combinedText.match(/(\d+)\s*x\s*[\(\[]?([^\)\]]+)[\)\]]?/i);

  if (!repeatMatch) return null;

  const count = parseInt(repeatMatch[1], 10);
  const rawParts = repeatMatch[2].split(/\+|\/|;|,/);
  const subSteps = rawParts.map((p) => parseSubstepString(p)).filter((s) => s.durationMin || s.distanceKm || s.label);

  if (subSteps.length > 0 && count > 0) {
    return {
      type: 'repeat',
      repeatCount: count,
      steps: subSteps,
    };
  }

  return null;
}

function buildGarminStepDTO(step: WorkoutStep, stepOrder: number) {
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

  let description = step.label || `Fase ${stepOrder}`;
  if (stepTypeId === 4) {
    description = 'Recupero';
  } else if (stepTypeId === 3 && (description.toLowerCase().includes('camminat') || description.toLowerCase().includes('recupero'))) {
    description = 'Corsa';
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

  let workoutTargetTypeId = 1;
  let workoutTargetTypeKey = 'no.target';
  let targetValueOne: number | null = null;
  let targetValueTwo: number | null = null;

  if (step.targetHrZone != null && String(step.targetHrZone).trim() !== '') {
    const hrStr = String(step.targetHrZone).trim();
    const zoneMatch = hrStr.match(/(?:z|zona)?\s*([1-5])/i);
    const rangeMatch = hrStr.match(/(\d{2,3})\s*[-–]\s*(\d{2,3})/);

    if (zoneMatch && !rangeMatch) {
      workoutTargetTypeId = 4;
      workoutTargetTypeKey = 'heart.rate.zone';
      targetValueOne = parseInt(zoneMatch[1], 10);
      targetValueTwo = targetValueOne;
    } else if (rangeMatch) {
      workoutTargetTypeId = 4;
      workoutTargetTypeKey = 'heart.rate.zone';
      targetValueOne = parseInt(rangeMatch[1], 10);
      targetValueTwo = parseInt(rangeMatch[2], 10);
    }
  } else if (step.targetPace != null && String(step.targetPace).trim() !== '') {
    const paceStr = String(step.targetPace).trim();
    const paceMatches = Array.from(paceStr.matchAll(/(\d{1,2})\s*:\s*(\d{2})/g));

    if (paceMatches.length >= 2) {
      const sec1 = parseInt(paceMatches[0][1], 10) * 60 + parseInt(paceMatches[0][2], 10);
      const sec2 = parseInt(paceMatches[1][1], 10) * 60 + parseInt(paceMatches[1][2], 10);
      const fastSec = Math.min(sec1, sec2);
      const slowSec = Math.max(sec1, sec2);
      if (fastSec > 0 && slowSec > 0) {
        workoutTargetTypeId = 6;
        workoutTargetTypeKey = 'pace.zone';
        targetValueOne = Number((1000 / slowSec).toFixed(3));
        targetValueTwo = Number((1000 / fastSec).toFixed(3));
      }
    } else if (paceMatches.length === 1) {
      const sec = parseInt(paceMatches[0][1], 10) * 60 + parseInt(paceMatches[0][2], 10);
      if (sec > 0) {
        const fastSec = sec - 10;
        const slowSec = sec + 10;
        workoutTargetTypeId = 6;
        workoutTargetTypeKey = 'pace.zone';
        targetValueOne = Number((1000 / slowSec).toFixed(3));
        targetValueTwo = Number((1000 / fastSec).toFixed(3));
      }
    }
  } else if (step.targetCadence != null && String(step.targetCadence).trim() !== '') {
    const cadStr = String(step.targetCadence).trim();
    const rangeMatch = cadStr.match(/(\d{2,3})\s*[-–]\s*(\d{2,3})/);
    const singleMatch = cadStr.match(/(\d{2,3})/);

    if (rangeMatch) {
      workoutTargetTypeId = 3;
      workoutTargetTypeKey = 'cadence';
      targetValueOne = parseInt(rangeMatch[1], 10);
      targetValueTwo = parseInt(rangeMatch[2], 10);
    } else if (singleMatch) {
      const val = parseInt(singleMatch[1], 10);
      workoutTargetTypeId = 3;
      workoutTargetTypeKey = 'cadence';
      targetValueOne = val - 5;
      targetValueTwo = val + 5;
    }
  }

  return {
    type: 'ExecutableStepDTO',
    stepId: null,
    stepOrder,
    childStepId: null,
    description,
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
      workoutTargetTypeId,
      workoutTargetTypeKey,
    },
    targetValueOne,
    targetValueTwo,
  };
}

export async function pushWorkoutToGarmin(creds: GarminCredentials, workout: Workout): Promise<{ garminWorkoutId: string }> {
  const gc = await loginGarminConnect(creds);
  const rawItems: WorkoutStepOrGroup[] = workout.structure?.steps ?? [];
  const garminSteps: unknown[] = [];
  let orderIndex = 1;

  for (const item of rawItems) {
    const isExplicitRepeat = (item as WorkoutRepeatGroup).type === 'repeat' || Boolean((item as WorkoutRepeatGroup).repeatCount && (item as WorkoutRepeatGroup).steps);

    if (isExplicitRepeat) {
      const repeatGroup = item as WorkoutRepeatGroup;
      const innerSteps = (repeatGroup.steps || []).map((subStep, subIdx) => {
        const parsedSub = subStep.durationMin || subStep.distanceKm ? subStep : parseSubstepString(subStep.label || subStep.notes || '');
        return buildGarminStepDTO(parsedSub, subIdx + 1);
      });

      garminSteps.push({
        type: 'RepeatGroupDTO',
        stepId: null,
        stepOrder: orderIndex++,
        childStepId: null,
        numberOfIterations: repeatGroup.repeatCount || 1,
        stepType: {
          stepTypeId: 6,
          stepTypeKey: 'repeat',
        },
        workoutSteps: innerSteps,
        smartRepeat: false,
      });
      continue;
    }

    const stepItem = item as WorkoutStep;
    const parsedRepeat = parseRepeatGroupFromText(stepItem);

    if (parsedRepeat) {
      const innerSteps = parsedRepeat.steps.map((subStep, subIdx) => buildGarminStepDTO(subStep, subIdx + 1));

      garminSteps.push({
        type: 'RepeatGroupDTO',
        stepId: null,
        stepOrder: orderIndex++,
        childStepId: null,
        numberOfIterations: parsedRepeat.repeatCount || 1,
        stepType: {
          stepTypeId: 6,
          stepTypeKey: 'repeat',
        },
        workoutSteps: innerSteps,
        smartRepeat: false,
      });
      continue;
    }

    const singleStep = stepItem.durationMin || stepItem.distanceKm ? stepItem : parseSubstepString(stepItem.label || stepItem.notes || '');
    garminSteps.push(buildGarminStepDTO(singleStep, orderIndex++));
  }

  if (garminSteps.length === 0) {
    garminSteps.push(
      buildGarminStepDTO(
        {
          label: workout.title || 'Corsa',
        },
        1
      )
    );
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
        workoutSteps: garminSteps,
      },
    ],
  };

  const created = await (gc as unknown as { addWorkout: (w: unknown) => Promise<unknown> }).addWorkout(payload);
  const garminWorkoutId: string = String((created as Record<string, unknown>).workoutId ?? (created as Record<string, unknown>).id ?? Date.now());

  return { garminWorkoutId };
}
