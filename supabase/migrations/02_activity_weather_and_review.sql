ALTER TABLE public.activity_log 
  ADD COLUMN IF NOT EXISTS elevation_gain_m numeric,
  ADD COLUMN IF NOT EXISTS elevation_loss_m numeric,
  ADD COLUMN IF NOT EXISTS weather_data jsonb,
  ADD COLUMN IF NOT EXISTS coach_reviewed boolean default false;

ALTER TABLE public.workouts
  ADD COLUMN IF NOT EXISTS week_number integer,
  ADD COLUMN IF NOT EXISTS session_order integer,
  ADD COLUMN IF NOT EXISTS coach_feedback text;
