import { useState, useEffect, useCallback } from 'react';

interface Provider {
  id: string;
  name: string;
  createdAt: string;
}

const STORAGE_KEY = 'providers-data';
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export function useProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setProviders(JSON.parse(stored)); } catch { setProviders([]); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(providers));
  }, [providers, isLoaded]);

  const addProvider = useCallback((name: string): Provider => {
    const entry: Provider = { id: generateId(), name: name.trim(), createdAt: new Date().toISOString() };
    setProviders(prev => [...prev, entry]);
    return entry;
  }, []);

  const deleteProvider = useCallback((id: string) => {
    setProviders(prev => prev.filter(p => p.id !== id));
  }, []);

  return { providers, isLoaded, addProvider, deleteProvider };
}
