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

  const addCategory = useCallback((name: string): CustomCategory => {
    const entry: CustomCategory = { id: generateId(), name: name.trim(), createdAt: new Date().toISOString() };
    setCategories(prev => [...prev, entry]);
    return entry;
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  return { categories, isLoaded, addCategory, deleteCategory };
}
