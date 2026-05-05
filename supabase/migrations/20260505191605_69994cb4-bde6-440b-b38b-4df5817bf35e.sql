ALTER TABLE public.notification_settings
  ADD COLUMN IF NOT EXISTS email_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reminder_days_array integer[] NOT NULL DEFAULT ARRAY[3,1,0]::integer[];