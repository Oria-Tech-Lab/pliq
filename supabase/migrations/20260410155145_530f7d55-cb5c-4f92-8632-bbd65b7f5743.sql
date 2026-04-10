
-- Add user_id to all data tables
ALTER TABLE public.payment_plans ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payment_instances ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payees ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.bank_accounts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.custom_categories ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payment_methods ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.providers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notification_settings ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop all permissive "Allow all" policies
DROP POLICY IF EXISTS "Allow all access to payment_plans" ON public.payment_plans;
DROP POLICY IF EXISTS "Allow all access to payment_instances" ON public.payment_instances;
DROP POLICY IF EXISTS "Allow all access to payees" ON public.payees;
DROP POLICY IF EXISTS "Allow all access to bank_accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Allow all access to custom_categories" ON public.custom_categories;
DROP POLICY IF EXISTS "Allow all access to payment_methods" ON public.payment_methods;
DROP POLICY IF EXISTS "Allow all access to providers" ON public.providers;
DROP POLICY IF EXISTS "Allow all access to notification_settings" ON public.notification_settings;

-- payment_plans policies
CREATE POLICY "Users can view own payment_plans" ON public.payment_plans FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payment_plans" ON public.payment_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment_plans" ON public.payment_plans FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment_plans" ON public.payment_plans FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- payment_instances policies
CREATE POLICY "Users can view own payment_instances" ON public.payment_instances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payment_instances" ON public.payment_instances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment_instances" ON public.payment_instances FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment_instances" ON public.payment_instances FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- payees policies
CREATE POLICY "Users can view own payees" ON public.payees FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payees" ON public.payees FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payees" ON public.payees FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payees" ON public.payees FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- bank_accounts policies
CREATE POLICY "Users can view own bank_accounts" ON public.bank_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own bank_accounts" ON public.bank_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own bank_accounts" ON public.bank_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own bank_accounts" ON public.bank_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- custom_categories policies
CREATE POLICY "Users can view own custom_categories" ON public.custom_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own custom_categories" ON public.custom_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own custom_categories" ON public.custom_categories FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own custom_categories" ON public.custom_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- payment_methods policies
CREATE POLICY "Users can view own payment_methods" ON public.payment_methods FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payment_methods" ON public.payment_methods FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment_methods" ON public.payment_methods FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payment_methods" ON public.payment_methods FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- providers policies
CREATE POLICY "Users can view own providers" ON public.providers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own providers" ON public.providers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own providers" ON public.providers FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own providers" ON public.providers FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- notification_settings policies
CREATE POLICY "Users can view own notification_settings" ON public.notification_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notification_settings" ON public.notification_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notification_settings" ON public.notification_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notification_settings" ON public.notification_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);
