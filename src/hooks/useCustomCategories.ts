import { useState, useEffect, useCallback } from 'react';
import { CustomCategory } from '@/types/payment';
import { supabase } from '@/integrations/supabase/client';

export function useCustomCategories() {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('custom_categories').select('*').order('created_at');
      if (data) {
        setCategories(data.map(r => ({
          id: r.id, name: r.name, icon: r.icon ?? undefined, color: r.color ?? undefined,
          description: r.description ?? undefined, createdAt: r.created_at,
        })));
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  const addCategory = useCallback(async (name: string, extra?: { icon?: string; color?: string; description?: string }): Promise<CustomCategory> => {
    const { data, error } = await supabase.from('custom_categories').insert({
      name: name.trim(), icon: extra?.icon, color: extra?.color, description: extra?.description,
    }).select().single();
    if (error || !data) throw error;
    const entry: CustomCategory = { id: data.id, name: data.name, icon: data.icon ?? undefined, color: data.color ?? undefined, description: data.description ?? undefined, createdAt: data.created_at };
    setCategories(prev => [...prev, entry]);
    return entry;
  }, []);

  const addCategoryWithId = useCallback(async (id: string, name: string, extra?: { icon?: string; color?: string; description?: string }): Promise<CustomCategory> => {
    const { data, error } = await supabase.from('custom_categories').insert({
      id, name: name.trim(), icon: extra?.icon, color: extra?.color, description: extra?.description,
    }).select().single();
    if (error || !data) throw error;
    const entry: CustomCategory = { id: data.id, name: data.name, icon: data.icon ?? undefined, color: data.color ?? undefined, description: data.description ?? undefined, createdAt: data.created_at };
    setCategories(prev => [...prev, entry]);
    return entry;
  }, []);

  const updateCategory = useCallback(async (id: string, upd: Partial<Pick<CustomCategory, 'name' | 'icon' | 'color' | 'description'>>) => {
    await supabase.from('custom_categories').update(upd).eq('id', id);
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...upd } : c));
  }, []);

  const deleteCategory = useCallback(async (id: string) => {
    await supabase.from('custom_categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  return { categories, isLoaded, addCategory, addCategoryWithId, updateCategory, deleteCategory };
}
