ALTER TABLE public.garmin_tokens 
  ADD COLUMN IF NOT EXISTS garmin_email_encrypted text,
  ADD COLUMN IF NOT EXISTS garmin_password_encrypted text;

ALTER TABLE public.garmin_tokens 
  ALTER COLUMN access_token_encrypted DROP NOT NULL,
  ALTER COLUMN refresh_token_encrypted DROP NOT NULL,
  ALTER COLUMN expires_at DROP NOT NULL;
