import { useState, useEffect, useCallback } from 'react';
import { Payee, Payment } from '@/types/payment';

const STORAGE_KEY = 'payees-app-data';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

export function usePayees(payments: Payment[], updatePaymentPayeeId?: (paymentId: string, payeeId: string) => void) {
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load payees from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPayees(JSON.parse(stored));
      } catch {
        setPayees([]);
      }
    }
    setIsLoaded(true);
  }, []);

  // Migrate: create payees from existing payTo strings that have no payeeId
  useEffect(() => {
    if (!isLoaded || payments.length === 0) return;

    const unmigrated = payments.filter(p => !p.payeeId && p.payTo);
    if (unmigrated.length === 0) return;

    const uniqueNames = [...new Set(unmigrated.map(p => p.payTo.trim()))];
    let currentPayees = [...payees];
    const nameToId: Record<string, string> = {};

    for (const name of uniqueNames) {
      const existing = currentPayees.find(py => py.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        nameToId[name] = existing.id;
      } else {
        const newPayee: Payee = { id: generateId(), name, type: 'otro', bankAccounts: [], createdAt: new Date().toISOString() };
        currentPayees.push(newPayee);
        nameToId[name] = newPayee.id;
      }
    }

    if (Object.keys(nameToId).length > 0) {
      setPayees(currentPayees);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentPayees));

      // Update payments with payeeId
      if (updatePaymentPayeeId) {
        for (const p of unmigrated) {
          const payeeId = nameToId[p.payTo.trim()];
          if (payeeId) updatePaymentPayeeId(p.id, payeeId);
        }
      }
    }
  }, [isLoaded, payments, payees, updatePaymentPayeeId]);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payees));
    }
  }, [payees, isLoaded]);

  const addPayee = useCallback((name: string): Payee => {
    const newPayee: Payee = {
      id: generateId(),
      name: name.trim(),
      type: 'otro',
      bankAccounts: [],
      createdAt: new Date().toISOString(),
    };
    setPayees(prev => [...prev, newPayee]);
    return newPayee;
  }, []);

  const deletePayee = useCallback((id: string) => {
    setPayees(prev => prev.filter(p => p.id !== id));
  }, []);

  const updatePayee = useCallback((id: string, data: Partial<Pick<Payee, 'name' | 'type' | 'bankAccounts'>>) => {
    setPayees(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const getPayeeById = useCallback((id: string): Payee | undefined => {
    return payees.find(p => p.id === id);
  }, [payees]);

  const getPayeeByName = useCallback((name: string): Payee | undefined => {
    return payees.find(p => p.name.toLowerCase() === name.toLowerCase().trim());
  }, [payees]);

  return {
    payees,
    isLoaded,
    addPayee,
    deletePayee,
    updatePayee,
    getPayeeById,
    getPayeeByName,
  };
}
