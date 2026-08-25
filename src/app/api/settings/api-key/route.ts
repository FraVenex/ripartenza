import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/server/userContext';
import { encryptSecret, lastFour } from '@/lib/crypto';
import { DEFAULT_AI_MODEL } from '@/lib/ai/providers';
import type { UserSettings } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const { data } = await supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle();

  const settings: UserSettings = {
    userId: user.id,
    aiProvider: 'google',
    aiModel: DEFAULT_AI_MODEL,
    aiBaseUrl: null,
    hasApiKey: !!data?.ai_api_key_encrypted,
    apiKeyLastFour: data?.ai_api_key_last_four ?? null,
    updatedAt: data?.updated_at ?? new Date().toISOString(),
  };

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const body = await req.json().catch(() => null);
  const { apiKey } = body ?? {};

  const cleanApiKey = apiKey ? String(apiKey).trim() : null;

  const update: Record<string, unknown> = {
    user_id: user.id,
    ai_provider: 'google',
    ai_model: DEFAULT_AI_MODEL,
    ai_base_url: null,
    updated_at: new Date().toISOString(),
  };

  if (cleanApiKey) {
    update.ai_api_key_encrypted = encryptSecret(cleanApiKey);
    update.ai_api_key_last_four = lastFour(cleanApiKey);
  }

  const { error } = await supabase.from('user_settings').upsert(update);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const supabase = createServerSupabaseClient();
  let user;
  try {
    user = await requireUser(supabase);
  } catch (res) {
    return res as Response;
  }

  const { error } = await supabase
    .from('user_settings')
    .update({ ai_api_key_encrypted: null, ai_api_key_last_four: null })
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
