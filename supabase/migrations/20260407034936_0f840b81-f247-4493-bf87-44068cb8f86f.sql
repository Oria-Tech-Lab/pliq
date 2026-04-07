
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to providers" ON public.providers FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.payees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'otro',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to payees" ON public.payees FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payee_id UUID NOT NULL REFERENCES public.payees(id) ON DELETE CASCADE,
  bank TEXT NOT NULL DEFAULT '',
  account_holder TEXT NOT NULL DEFAULT '',
  account_number TEXT NOT NULL DEFAULT '',
  interbank_code TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to bank_accounts" ON public.bank_accounts FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.custom_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.custom_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to custom_categories" ON public.custom_categories FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'bank_account',
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  remaining_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to payment_methods" ON public.payment_methods FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.payment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'unique',
  category TEXT NOT NULL DEFAULT 'other',
  amount NUMERIC NOT NULL DEFAULT 0,
  pay_to TEXT NOT NULL DEFAULT '',
  payee_id UUID REFERENCES public.payees(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank',
  notes TEXT,
  due_date TEXT,
  start_date TEXT,
  frequency TEXT,
  total_payments INTEGER,
  notifications_enabled BOOLEAN DEFAULT true,
  notification_days_before INTEGER DEFAULT 1,
  notification_time TEXT DEFAULT '09:00',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to payment_plans" ON public.payment_plans FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_payment_plans_updated_at BEFORE UPDATE ON public.payment_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.payment_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
  period_label TEXT NOT NULL DEFAULT '',
  due_date TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_date TEXT,
  notes TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to payment_instances" ON public.payment_instances FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  default_time TEXT NOT NULL DEFAULT '09:00',
  default_days_before INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to notification_settings" ON public.notification_settings FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER update_notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.notification_settings (default_time, default_days_before) VALUES ('09:00', 1);
