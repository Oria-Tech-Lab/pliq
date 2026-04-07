import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Provider {
  id: string;
  name: string;
  createdAt: string;
}

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('providers').select('*').order('created_at');
      if (data) {
        setProviders(data.map(r => ({ id: r.id, name: r.name, createdAt: r.created_at })));
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  const addProvider = useCallback(async (name: string): Promise<Provider> => {
    const { data, error } = await supabase.from('providers').insert({ name: name.trim() }).select().single();
    if (error || !data) throw error;
    const entry: Provider = { id: data.id, name: data.name, createdAt: data.created_at };
    setProviders(prev => [...prev, entry]);
    return entry;
  }, []);

  const deleteProvider = useCallback(async (id: string) => {
    await supabase.from('providers').delete().eq('id', id);
    setProviders(prev => prev.filter(p => p.id !== id));
  }, []);

  return { providers, isLoaded, addProvider, deleteProvider };
}
