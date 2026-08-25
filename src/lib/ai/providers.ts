import type { AiProvider } from '@/lib/types';

export const DEFAULT_AI_MODEL = 'gemini-3.7-flash';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface CallLlmArgs {
  provider: AiProvider;
  apiKey: string;
  model: string;
  systemPrompt: string;
  messages: ChatTurn[];
  baseUrl?: string | null;
  temperature?: number;
}

export interface CallLlmResult {
  text: string;
  raw: unknown;
}

export async function callLlm(args: CallLlmArgs): Promise<CallLlmResult> {
  switch (args.provider) {
    case 'openai':
    case 'openrouter':
    case 'custom':
      return callOpenAiCompatible(args);
    case 'anthropic':
      return callAnthropic(args);
    case 'google':
    default:
      return callGoogle(args);
  }
}

async function callOpenAiCompatible(args: CallLlmArgs): Promise<CallLlmResult> {
  const cleanKey = args.apiKey.trim();
  const cleanModel = args.model.trim();
  let defaultBaseUrl = 'https://api.openai.com/v1';
  if (args.provider === 'openrouter') {
    defaultBaseUrl = 'https://openrouter.ai/api/v1';
  }
  const baseUrl = (args.baseUrl?.trim() || defaultBaseUrl).replace(/\/+$/, '');
  const url = `${baseUrl}/chat/completions`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${cleanKey}`,
  };

  if (args.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://ripartenza.app';
    headers['X-Title'] = 'Ripartenza';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: cleanModel,
      messages: [
        { role: 'system', content: args.systemPrompt },
        ...args.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: args.temperature ?? 0.4,
    }),
  });

  if (!res.ok) {
    throw new Error(`Errore dal provider AI ${args.provider} (${res.status}): ${await safeErrorText(res)}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content ?? '';
  return { text, raw: data };
}

async function callAnthropic(args: CallLlmArgs): Promise<CallLlmResult> {
  const cleanKey = args.apiKey.trim();
  const cleanModel = args.model.trim();
  const baseUrl = (args.baseUrl?.trim() || 'https://api.anthropic.com/v1').replace(/\/+$/, '');
  const url = `${baseUrl}/messages`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': cleanKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: cleanModel,
      system: args.systemPrompt,
      messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 4096,
      temperature: args.temperature ?? 0.4,
    }),
  });

  if (!res.ok) {
    throw new Error(`Errore dal provider AI Anthropic (${res.status}): ${await safeErrorText(res)}`);
  }

  const data = await res.json();
  const text = (data?.content ?? [])
    .filter((c: { type: string; text?: string }) => c.type === 'text')
    .map((c: { text: string }) => c.text)
    .join('\n');
  return { text, raw: data };
}

async function callGoogle(args: CallLlmArgs): Promise<CallLlmResult> {
  const cleanKey = args.apiKey.trim();
  const cleanModel = args.model?.trim() || DEFAULT_AI_MODEL;
  const baseUrl = (args.baseUrl?.trim() || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, '');
  const url = `${baseUrl}/models/${encodeURIComponent(cleanModel)}:generateContent?key=${encodeURIComponent(cleanKey)}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { role: 'system', parts: [{ text: args.systemPrompt }] },
      contents: args.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: args.temperature ?? 0.4 },
    }),
  });

  if (!res.ok) {
    throw new Error(`Errore dal provider AI Google (${res.status}): ${await safeErrorText(res)}`);
  }

  const data = await res.json();
  const text = (data?.candidates?.[0]?.content?.parts ?? []).map((p: { text: string }) => p.text).join('\n');
  return { text, raw: data };
}

async function safeErrorText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return res.statusText;
  }
}

export function stripJsonBlocks(text: string): string {
  return text
    .replace(/```(?:workout_json|workout|profile_update_json|profile_json|plan_action_json|plan_actions|json)?[\s\S]*?```/g, '')
    .trim();
}

export type PlanActionType =
  | 'delete_plan'
  | 'delete_all_planned'
  | 'delete_workout'
  | 'update_workout'
  | 'add_workout'
  | 'set_workout_status'
  | 'set_plan';

export interface PlanAction {
  type: PlanActionType;
  workoutId?: string;
  date?: string;
  status?: 'planned' | 'completed' | 'skipped' | 'modified';
  clearCompletedActivity?: boolean;
  updates?: Record<string, unknown>;
  workout?: Record<string, unknown>;
  workouts?: Array<Record<string, unknown>>;
}

export function extractPlanActionJsonBlocks(text: string): PlanAction[] {
  const actions: PlanAction[] = [];
  const regex = /```(?:plan_action_json|plan_actions|json)?\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const candidate = match[1].trim();
    if (!candidate) continue;

    const parsed = parseJsonSafe(candidate);
    if (!parsed || typeof parsed !== 'object') continue;

    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.actions)) {
      for (const a of obj.actions) {
        if (isValidPlanAction(a)) actions.push(normalizePlanAction(a));
      }
    } else if (Array.isArray(parsed)) {
      for (const a of parsed) {
        if (isValidPlanAction(a)) actions.push(normalizePlanAction(a));
      }
    } else if (isValidPlanAction(obj)) {
      actions.push(normalizePlanAction(obj));
    }
  }

  return actions;
}

function isValidPlanAction(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  const actionType = String(o.type || o.action || '').toLowerCase();
  return (
    actionType === 'delete_plan' ||
    actionType === 'delete_all_planned' ||
    actionType === 'delete_workout' ||
    actionType === 'update_workout' ||
    actionType === 'add_workout' ||
    actionType === 'set_workout_status' ||
    actionType === 'set_plan'
  );
}

function normalizePlanAction(obj: Record<string, unknown>): PlanAction {
  const rawType = String(obj.type || obj.action || '').toLowerCase();
  let type: PlanActionType = 'update_workout';

  if (rawType === 'delete_plan' || rawType === 'delete_all_planned') {
    type = 'delete_plan';
  } else if (rawType === 'delete_workout') {
    type = 'delete_workout';
  } else if (rawType === 'add_workout') {
    type = 'add_workout';
  } else if (rawType === 'set_workout_status') {
    type = 'set_workout_status';
  } else if (rawType === 'set_plan') {
    type = 'set_plan';
  }

  return {
    type,
    workoutId: typeof obj.workoutId === 'string' ? obj.workoutId : typeof obj.id === 'string' ? obj.id : undefined,
    date: typeof obj.date === 'string' ? obj.date : undefined,
    status: (obj.status as PlanAction['status']) ?? undefined,
    clearCompletedActivity: Boolean(obj.clearCompletedActivity ?? (obj.status === 'planned')),
    updates: (obj.updates as Record<string, unknown>) ?? undefined,
    workout: (obj.workout as Record<string, unknown>) ?? (isWorkoutObject(obj) ? obj : undefined),
    workouts: Array.isArray(obj.workouts) ? (obj.workouts as Array<Record<string, unknown>>) : undefined,
  };
}

export function extractWorkoutJsonBlocks(text: string): unknown[] {
  const blocks: unknown[] = [];
  const regex = /```(?:workout_json|workout|json)?\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const candidate = match[1].trim();
    if (!candidate) continue;

    const parsed = parseJsonSafe(candidate);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (isWorkoutObject(item)) blocks.push(item);
      }
    } else if (isWorkoutObject(parsed)) {
      blocks.push(parsed);
    }
  }

  if (blocks.length === 0) {
    const arrayMatch = text.match(/\[\s*\{\s*"date"[\s\S]*?\}\s*\]/g);
    if (arrayMatch) {
      for (const raw of arrayMatch) {
        const parsed = parseJsonSafe(raw);
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (isWorkoutObject(item)) blocks.push(item);
          }
        }
      }
    }
    const singleMatch = text.match(/\{\s*"date"[\s\S]*?\}/g);
    if (singleMatch) {
      for (const raw of singleMatch) {
        const parsed = parseJsonSafe(raw);
        if (isWorkoutObject(parsed)) blocks.push(parsed);
      }
    }
  }

  return blocks;
}

function parseJsonSafe(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    const cleaned = str
      .replace(/,\s*([\}\]])/g, '$1')
      .replace(/(['"])?([a-zA-Z0-9_]+)\1\s*:/g, '"$2":');
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

function isWorkoutObject(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return typeof o.date === 'string' && (typeof o.title === 'string' || typeof o.type === 'string');
}

export interface ProfileUpdatePayload {
  runningHistory?: string;
  layoffWeeks?: number;
  notes?: string;
  addCondition?: { label: string; active?: boolean; side?: string };
  addInjury?: { label: string; side?: string };
}

export function extractProfileUpdateJsonBlocks(text: string): ProfileUpdatePayload[] {
  const blocks: ProfileUpdatePayload[] = [];
  const regex = /```(?:profile_update_json|profile_json|json)?\s*([\s\S]*?)```/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const candidate = match[1].trim();
    if (!candidate) continue;

    try {
      const parsed = JSON.parse(candidate);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (isProfileObject(item)) blocks.push(item as ProfileUpdatePayload);
        }
      } else if (isProfileObject(parsed)) {
        blocks.push(parsed as ProfileUpdatePayload);
      }
    } catch {
    }
  }

  return blocks;
}

function isProfileObject(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    'addCondition' in o ||
    'addInjury' in o ||
    'runningHistory' in o ||
    'layoffWeeks' in o ||
    'notes' in o
  );
}
