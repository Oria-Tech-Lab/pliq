import { useState, useEffect, useCallback } from 'react';
import { CustomCategory } from '@/types/payment';

const STORAGE_KEY = 'custom-categories-data';
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export function useCustomCategories() {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setCategories(JSON.parse(stored)); } catch { setCategories([]); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  }, [categories, isLoaded]);

  const addCategory = useCallback((name: string, extra?: { icon?: string; color?: string; description?: string }): CustomCategory => {
    const entry: CustomCategory = { id: generateId(), name: name.trim(), ...extra, createdAt: new Date().toISOString() };
    setCategories(prev => [...prev, entry]);
    return entry;
  }, []);

  const addCategoryWithId = useCallback((id: string, name: string, extra?: { icon?: string; color?: string; description?: string }): CustomCategory => {
    const entry: CustomCategory = { id, name: name.trim(), ...extra, createdAt: new Date().toISOString() };
    setCategories(prev => [...prev, entry]);
    return entry;
  }, []);

  const updateCategory = useCallback((id: string, data: Partial<Pick<CustomCategory, 'name' | 'icon' | 'color' | 'description'>>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  return { categories, isLoaded, addCategory, updateCategory, deleteCategory };
}
