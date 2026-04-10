import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserPreferences {
  currency: string;
  language: string;
  reminderDays: number;
  reminderTime: string;
}

const DEFAULTS: UserPreferences = {
  currency: 'PEN',
  language: 'es',
  reminderDays: 1,
  reminderTime: '09:00',
};

export const CURRENCIES = [
  { code: 'PEN', label: 'Sol peruano', symbol: 'S/' },
  { code: 'USD', label: 'Dólar estadounidense', symbol: '$' },
  { code: 'ARS', label: 'Peso argentino', symbol: '$' },
  { code: 'CLP', label: 'Peso chileno', symbol: '$' },
  { code: 'COP', label: 'Peso colombiano', symbol: '$' },
  { code: 'MXN', label: 'Peso mexicano', symbol: '$' },
  { code: 'BRL', label: 'Real brasileño', symbol: 'R$' },
  { code: 'BOB', label: 'Boliviano', symbol: 'Bs' },
  { code: 'PYG', label: 'Guaraní paraguayo', symbol: '₲' },
  { code: 'UYU', label: 'Peso uruguayo', symbol: '$U' },
  { code: 'VES', label: 'Bolívar venezolano', symbol: 'Bs.S' },
  { code: 'GTQ', label: 'Quetzal guatemalteco', symbol: 'Q' },
  { code: 'HNL', label: 'Lempira hondureño', symbol: 'L' },
  { code: 'NIO', label: 'Córdoba nicaragüense', symbol: 'C$' },
  { code: 'CRC', label: 'Colón costarricense', symbol: '₡' },
  { code: 'DOP', label: 'Peso dominicano', symbol: 'RD$' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'GBP', label: 'Libra esterlina', symbol: '£' },
] as const;

export const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
] as const;

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code;
}

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setPrefs({
          currency: data.currency,
          language: data.language,
          reminderDays: data.reminder_days,
          reminderTime: data.reminder_time,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const updatePrefs = useCallback(async (partial: Partial<UserPreferences>) => {
    const next = { ...prefs, ...partial };
    setPrefs(next);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_preferences').update({
      currency: next.currency,
      language: next.language,
      reminder_days: next.reminderDays,
      reminder_time: next.reminderTime,
    }).eq('user_id', user.id);
  }, [prefs]);

  return { prefs, loading, updatePrefs };
}
