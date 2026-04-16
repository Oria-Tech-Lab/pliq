
-- Add currency fields to user_preferences
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS primary_currency text NOT NULL DEFAULT 'PEN',
ADD COLUMN IF NOT EXISTS secondary_currency text NOT NULL DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS exchange_rate numeric NOT NULL DEFAULT 3.75;

-- Add currency field to payment_plans
ALTER TABLE public.payment_plans
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'PEN';

-- Add currency field to payment_methods
ALTER TABLE public.payment_methods
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'PEN';
