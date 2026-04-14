import { useState, useEffect, useCallback } from 'react';
import { PaymentMethodEntry } from '@/types/payment';
import { supabase } from '@/integrations/supabase/client';

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethodEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('payment_methods').select('*').order('created_at');
      if (data) {
        setMethods(data.map(r => ({
          id: r.id, name: r.name, provider: r.provider, type: r.type as PaymentMethodEntry['type'],
          initialBalance: r.initial_balance, remainingBalance: r.remaining_balance,
          isDefault: r.is_default, createdAt: r.created_at,
        })));
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  const addMethod = useCallback(async (d: Omit<PaymentMethodEntry, 'id' | 'createdAt' | 'isDefault'>): Promise<PaymentMethodEntry> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('payment_methods').insert({
      name: d.name, provider: d.provider, type: d.type,
      initial_balance: d.initialBalance, remaining_balance: d.remainingBalance, user_id: user.id,
    }).select().single();
    if (error || !data) throw error;
    const entry: PaymentMethodEntry = {
      id: data.id, name: data.name, provider: data.provider, type: data.type as PaymentMethodEntry['type'],
      initialBalance: data.initial_balance, remainingBalance: data.remaining_balance,
      isDefault: data.is_default, createdAt: data.created_at,
    };
    setMethods(prev => [...prev, entry]);
    return entry;
  }, []);

  const deleteMethod = useCallback(async (id: string) => {
    await supabase.from('payment_methods').delete().eq('id', id);
    setMethods(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateBalance = useCallback(async (id: string, remaining: number) => {
    await supabase.from('payment_methods').update({ remaining_balance: remaining }).eq('id', id);
    setMethods(prev => prev.map(m => m.id === id ? { ...m, remainingBalance: remaining } : m));
  }, []);

  const setDefaultMethod = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', user.id);
    await supabase.from('payment_methods').update({ is_default: true }).eq('id', id);
    setMethods(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
  }, []);

  return { methods, isLoaded, addMethod, deleteMethod, updateBalance, setDefaultMethod };
}
