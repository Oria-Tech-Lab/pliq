
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''));

  -- Create default preferences
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);

  -- Seed default categories
  INSERT INTO public.custom_categories (user_id, name, icon, color) VALUES
    (NEW.id, 'Servicios', 'Wrench', '#3b82f6'),
    (NEW.id, 'Préstamos', 'Landmark', '#f59e0b'),
    (NEW.id, 'Personal', 'User', '#8b5cf6'),
    (NEW.id, 'Suscripciones', 'RefreshCw', '#10b981'),
    (NEW.id, 'Otros', 'MoreHorizontal', '#6b7280');

  -- Seed default payment methods
  INSERT INTO public.payment_methods (user_id, name, type) VALUES
    (NEW.id, 'Cuenta bancaria', 'bank_account'),
    (NEW.id, 'Tarjeta de crédito', 'card'),
    (NEW.id, 'Efectivo', 'cash');

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
