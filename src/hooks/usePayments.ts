import { useState, useEffect, useCallback } from 'react';
import { Payment, PaymentStatus } from '@/types/payment';
import { isAfter, isBefore, startOfDay, addDays, addWeeks, addMonths, addYears } from 'date-fns';

const STORAGE_KEY = 'payments-app-data';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const getNextDueDate = (currentDueDate: string, frequency: Payment['frequency']): string => {
  const date = new Date(currentDueDate);
  switch (frequency) {
    case 'weekly':
      return addWeeks(date, 1).toISOString();
    case 'monthly':
      return addMonths(date, 1).toISOString();
    case 'yearly':
      return addYears(date, 1).toISOString();
    default:
      return currentDueDate;
  }
};

const updatePaymentStatus = (payment: Payment): Payment => {
  if (payment.status === 'paid') return payment;
  
  const today = startOfDay(new Date());
  const dueDate = startOfDay(new Date(payment.dueDate));
  
  if (isBefore(dueDate, today)) {
    return { ...payment, status: 'overdue' };
  }
  
  return { ...payment, status: 'pending' };
};

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load payments from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Payment[];
        // Update statuses based on current date
        const updated = parsed.map(updatePaymentStatus);
        setPayments(updated);
      } catch (e) {
        console.error('Error parsing payments:', e);
        setPayments([]);
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever payments change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payments));
    }
  }, [payments, isLoading]);

  const addPayment = useCallback((paymentData: Omit<Payment, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newPayment: Payment = {
      ...paymentData,
      id: generateId(),
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    
    const updatedPayment = updatePaymentStatus(newPayment);
    setPayments(prev => [...prev, updatedPayment]);
    return updatedPayment;
  }, []);

  const updatePayment = useCallback((id: string, updates: Partial<Payment>) => {
    setPayments(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates, updatedAt: new Date().toISOString() };
      return updatePaymentStatus(updated);
    }));
  }, []);

  const deletePayment = useCallback((id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
  }, []);

  const markAsPaid = useCallback((id: string) => {
    setPayments(prev => {
      const result: Payment[] = [];
      
      for (const p of prev) {
        if (p.id !== id) {
          result.push(p);
          continue;
        }
        
        const paidPayment: Payment = {
          ...p,
          status: 'paid',
          paidDate: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        result.push(paidPayment);
        
        // If recurring, create next payment
        if (p.frequency !== 'once') {
          const nextPayment: Payment = {
            ...p,
            id: generateId(),
            dueDate: getNextDueDate(p.dueDate, p.frequency),
            status: 'pending',
            paidDate: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          result.push(updatePaymentStatus(nextPayment));
        }
      }
      
      return result;
    });
  }, []);

  const markAsPending = useCallback((id: string) => {
    setPayments(prev => prev.map(p => {
      if (p.id !== id) return p;
      const updated: Payment = {
        ...p,
        status: 'pending',
        paidDate: undefined,
        updatedAt: new Date().toISOString(),
      };
      return updatePaymentStatus(updated);
    }));
  }, []);

  return {
    payments,
    isLoading,
    addPayment,
    updatePayment,
    deletePayment,
    markAsPaid,
    markAsPending,
  };
}
