import { useState, useEffect, useCallback } from 'react';
import { PaymentPlan, PaymentInstance } from '@/types/paymentPlan';
import { addWeeks, addMonths, addYears, format, startOfDay, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { PaymentFrequency } from '@/types/payment';

const STORAGE_KEY = 'payment-plans-data';
const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

function generatePeriodLabel(date: Date, frequency: PaymentFrequency): string {
  switch (frequency) {
    case 'weekly':
      return `Semana ${format(date, 'w, yyyy', { locale: es })}`;
    case 'monthly':
      return format(date, 'MMMM yyyy', { locale: es });
    case 'yearly':
      return format(date, 'yyyy', { locale: es });
    default:
      return format(date, 'PPP', { locale: es });
  }
}

function getNextDate(date: Date, frequency: PaymentFrequency): Date {
  switch (frequency) {
    case 'weekly': return addWeeks(date, 1);
    case 'monthly': return addMonths(date, 1);
    case 'yearly': return addYears(date, 1);
    default: return date;
  }
}

function generateInstances(
  planId: string,
  startDate: string,
  frequency: PaymentFrequency,
  totalPayments: number | null,
  amount: number,
  existingInstances: PaymentInstance[] = []
): PaymentInstance[] {
  const count = totalPayments ?? 12; // generate up to 12 for indefinite
  const instances: PaymentInstance[] = [];
  let current = new Date(startDate);

  for (let i = 0; i < count; i++) {
    const existing = existingInstances.find(
      inst => inst.periodLabel === generatePeriodLabel(current, frequency)
    );
    if (existing) {
      instances.push(updateInstanceStatus(existing));
    } else {
      const instance: PaymentInstance = {
        id: generateId(),
        planId,
        periodLabel: generatePeriodLabel(current, frequency),
        dueDate: current.toISOString(),
        amount,
        status: 'pending',
      };
      instances.push(updateInstanceStatus(instance));
    }
    current = getNextDate(current, frequency);
  }
  return instances;
}

function updateInstanceStatus(instance: PaymentInstance): PaymentInstance {
  if (instance.status === 'paid') return instance;
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(instance.dueDate));
  return { ...instance, status: isBefore(due, today) ? 'overdue' : 'pending' };
}

function computePlanStatus(plan: PaymentPlan): PaymentPlan['status'] {
  if (plan.type === 'unique') {
    const inst = plan.instances[0];
    if (!inst) return 'pending';
    return inst.status === 'paid' ? 'completed' : 'active';
  }
  const allPaid = plan.instances.length > 0 && plan.instances.every(i => i.status === 'paid');
  if (allPaid && plan.totalPayments) return 'completed';
  return 'active';
}

export function usePaymentPlans() {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PaymentPlan[];
        const updated = parsed.map(p => {
          const instances = p.type === 'recurring' && p.startDate && p.frequency
            ? generateInstances(p.id, p.startDate, p.frequency, p.totalPayments ?? null, p.amount, p.instances)
            : p.instances.map(updateInstanceStatus);
          return { ...p, instances, status: computePlanStatus({ ...p, instances }) };
        });
        setPlans(updated);
      } catch { setPlans([]); }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }, [plans, isLoading]);

  const addPlan = useCallback((data: Omit<PaymentPlan, 'id' | 'instances' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const id = generateId();
    let instances: PaymentInstance[] = [];

    if (data.type === 'unique' && data.dueDate) {
      instances = [{
        id: generateId(),
        planId: id,
        periodLabel: format(new Date(data.dueDate), 'PPP', { locale: es }),
        dueDate: data.dueDate,
        amount: data.amount,
        status: 'pending',
      }];
      instances = instances.map(updateInstanceStatus);
    } else if (data.type === 'recurring' && data.startDate && data.frequency) {
      instances = generateInstances(id, data.startDate, data.frequency, data.totalPayments ?? null, data.amount);
    }

    const plan: PaymentPlan = {
      ...data,
      id,
      instances,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    plan.status = computePlanStatus(plan);
    setPlans(prev => [...prev, plan]);
    return plan;
  }, []);

  const deletePlan = useCallback((id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
  }, []);

  const markInstancePaid = useCallback((planId: string, instanceId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const instances = p.instances.map(i =>
        i.id === instanceId ? { ...i, status: 'paid' as const, paidDate: new Date().toISOString() } : i
      );
      const updated = { ...p, instances, updatedAt: new Date().toISOString() };
      updated.status = computePlanStatus(updated);
      return updated;
    }));
  }, []);

  const markInstancePending = useCallback((planId: string, instanceId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const instances = p.instances.map(i =>
        i.id === instanceId ? updateInstanceStatus({ ...i, status: 'pending', paidDate: undefined }) : i
      );
      const updated = { ...p, instances, updatedAt: new Date().toISOString() };
      updated.status = computePlanStatus(updated);
      return updated;
    }));
  }, []);

  return { plans, isLoading, addPlan, deletePlan, markInstancePaid, markInstancePending };
}
