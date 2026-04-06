import { useState, useEffect, useCallback } from 'react';
import { PaymentMethodEntry } from '@/types/payment';

const STORAGE_KEY = 'payment-methods-data';
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethodEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setMethods(JSON.parse(stored)); } catch { setMethods([]); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(methods));
  }, [methods, isLoaded]);

  const addMethod = useCallback((data: Omit<PaymentMethodEntry, 'id' | 'createdAt'>): PaymentMethodEntry => {
    const entry: PaymentMethodEntry = { ...data, id: generateId(), createdAt: new Date().toISOString() };
    setMethods(prev => [...prev, entry]);
    return entry;
  }, []);

  const deleteMethod = useCallback((id: string) => {
    setMethods(prev => prev.filter(m => m.id !== id));
  }, []);

  const updateBalance = useCallback((id: string, remaining: number) => {
    setMethods(prev => prev.map(m => m.id === id ? { ...m, remainingBalance: remaining } : m));
  }, []);

  return { methods, isLoaded, addMethod, deleteMethod, updateBalance };
}
