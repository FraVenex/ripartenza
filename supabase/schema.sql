-- Schema Supabase per Ripartenza.
-- Esegui questo file nell'SQL editor di Supabase (o via `supabase db push`).
-- Presuppone l'autenticazione nativa di Supabase (tabella auth.users già esistente).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: dati anagrafici essenziali, 1:1 con auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  date_of_birth date,
  sex text check (sex in ('female', 'male', 'other', 'prefer_not_to_say')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- medical_profiles: infortuni/condizioni + storia di corsa, alla base del
-- system prompt dell'assistente (vedi src/lib/ai/systemPrompt.ts)
-- ---------------------------------------------------------------------------
create table if not exists public.medical_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  conditions jsonb not null default '[]'::jsonb,   -- MedicalCondition[] attive
  injuries jsonb not null default '[]'::jsonb,      -- MedicalCondition[] pregresse
  running_history text,
  layoff_weeks integer,
  clinician_clearance boolean not null default false,
  notes text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_settings: provider/modello AI scelto e chiave API cifrata (BYOK)
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ai_provider text not null default 'openai' check (ai_provider in ('openai','anthropic','google','openrouter','custom')),
  ai_model text not null default 'gpt-4o-mini',
  ai_base_url text,
  ai_api_key_encrypted text,           -- mai la chiave in chiaro: vedi src/lib/crypto.ts
  ai_api_key_last_four text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- garmin_tokens: token OAuth2 PKCE, cifrati
-- ---------------------------------------------------------------------------
create table if not exists public.garmin_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  garmin_user_id text,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  scope text,
  expires_at timestamptz not null,
  refresh_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- training_plans
-- ---------------------------------------------------------------------------
create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null,
  start_date date not null,
  target_event_date date,
  status text not null default 'active' check (status in ('active','completed','archived')),
  generated_by text not null default 'ai' check (generated_by in ('ai','manual')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- workouts
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references public.training_plans(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('easy','long','tempo','intervals','walk_run','strength','mobility','rest')),
  title text not null,
  description text not null default '',
  structure jsonb not null default '{"steps":[]}'::jsonb,
  source text not null default 'manual' check (source in ('ai','manual','garmin')),
  garmin_workout_id text,
  status text not null default 'planned' check (status in ('planned','completed','skipped','modified')),
  rpe smallint check (rpe between 1 and 10),
  pain_score smallint check (pain_score between 0 and 10),
  pain_location text,
  notes text,
  completed_activity jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workouts_user_date_idx on public.workouts (user_id, date);

-- ---------------------------------------------------------------------------
-- activity_log: attività ricevute da Garmin (via webhook o backfill)
-- ---------------------------------------------------------------------------
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  garmin_activity_id text not null,
  date date not null,
  type text,
  distance_m numeric,
  duration_s numeric,
  avg_hr_bpm numeric,
  avg_pace_min_per_km numeric,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, garmin_activity_id)
);

-- ---------------------------------------------------------------------------
-- chat_messages: storico conversazione con il coach AI
-- ---------------------------------------------------------------------------
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_user_idx on public.chat_messages (user_id, created_at);

-- ---------------------------------------------------------------------------
-- Row Level Security: ogni utente vede/scrive solo le proprie righe.
-- Le route "service role" (es. webhook Garmin) bypassano RLS di proposito.
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.medical_profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.garmin_tokens enable row level security;
alter table public.training_plans enable row level security;
alter table public.workouts enable row level security;
alter table public.activity_log enable row level security;
alter table public.chat_messages enable row level security;

create policy "profiles: solo il proprietario" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "medical_profiles: solo il proprietario" on public.medical_profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_settings: solo il proprietario" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "garmin_tokens: solo il proprietario" on public.garmin_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "training_plans: solo il proprietario" on public.training_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workouts: solo il proprietario" on public.workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "activity_log: solo il proprietario" on public.activity_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "chat_messages: solo il proprietario" on public.chat_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Crea automaticamente una riga profiles + user_settings alla registrazione
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
