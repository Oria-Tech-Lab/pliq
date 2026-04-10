import { useState, useEffect, useCallback, useMemo } from 'react';
import { PaymentPlan, PaymentInstance } from '@/types/paymentPlan';
import { addWeeks, addMonths, addYears, format, startOfDay, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Payment, PaymentFrequency } from '@/types/payment';
import { supabase } from '@/integrations/supabase/client';

function generatePeriodLabel(date: Date, frequency: PaymentFrequency): string {
  switch (frequency) {
    case 'weekly': return `Semana ${format(date, 'w, yyyy', { locale: es })}`;
    case 'monthly': return format(date, 'MMMM yyyy', { locale: es });
    case 'yearly': return format(date, 'yyyy', { locale: es });
    default: return format(date, 'PPP', { locale: es });
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
  planId: string, startDate: string, frequency: PaymentFrequency,
  totalPayments: number | null, amount: number, existingInstances: PaymentInstance[] = []
): PaymentInstance[] {
  const count = totalPayments ?? 12;
  const instances: PaymentInstance[] = [];
  let current = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const label = generatePeriodLabel(current, frequency);
    const existing = existingInstances.find(inst => inst.periodLabel === label);
    if (existing) {
      instances.push(updateInstanceStatus(existing));
    } else {
      instances.push(updateInstanceStatus({
        id: crypto.randomUUID(), planId, periodLabel: label,
        dueDate: current.toISOString(), amount, status: 'pending',
      }));
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

// Map DB row to PaymentPlan (without instances)
function mapPlanRow(r: any): Omit<PaymentPlan, 'instances'> {
  return {
    id: r.id, name: r.name, type: r.type as any, category: r.category, amount: Number(r.amount),
    payTo: r.pay_to, payeeId: r.payee_id ?? undefined, paymentMethod: r.payment_method as any,
    notes: r.notes ?? undefined, dueDate: r.due_date ?? undefined, startDate: r.start_date ?? undefined,
    frequency: r.frequency as any ?? undefined, totalPayments: r.total_payments ?? null,
    notificationsEnabled: r.notifications_enabled ?? undefined,
    notificationDaysBefore: r.notification_days_before ?? undefined,
    notificationTime: r.notification_time ?? undefined,
    status: r.status as any, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function mapInstanceRow(r: any): PaymentInstance {
  return {
    id: r.id, planId: r.plan_id, periodLabel: r.period_label, dueDate: r.due_date,
    amount: Number(r.amount), status: r.status as any, paidDate: r.paid_date ?? undefined,
    notes: r.notes ?? undefined, paymentMethod: r.payment_method ?? undefined,
  };
}

export function usePaymentPlans() {
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from Supabase
  useEffect(() => {
    const load = async () => {
      const { data: planRows } = await supabase.from('payment_plans').select('*').order('created_at');
      const { data: instRows } = await supabase.from('payment_instances').select('*');
      if (!planRows) { setIsLoading(false); return; }

      const allInstances = (instRows || []).map(mapInstanceRow);
      const loaded: PaymentPlan[] = planRows.map(r => {
        const base = mapPlanRow(r);
        const existingInsts = allInstances.filter(i => i.planId === r.id);
        let instances: PaymentInstance[];
        if (base.type === 'recurring' && base.startDate && base.frequency) {
          instances = generateInstances(base.id, base.startDate, base.frequency, base.totalPayments ?? null, base.amount, existingInsts);
        } else {
          instances = existingInsts.map(updateInstanceStatus);
        }
        const plan: PaymentPlan = { ...base, instances };
        plan.status = computePlanStatus(plan);
        return plan;
      });
      setPlans(loaded);

      // Sync generated instances back to DB
      for (const plan of loaded) {
        const existingIds = new Set(allInstances.filter(i => i.planId === plan.id).map(i => i.id));
        const newInstances = plan.instances.filter(i => !existingIds.has(i.id));
        if (newInstances.length > 0) {
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          await supabase.from('payment_instances').insert(
            newInstances.map(i => ({ id: i.id, plan_id: i.planId, period_label: i.periodLabel, due_date: i.dueDate, amount: i.amount, status: i.status, user_id: currentUser?.id }))
          );
        }
        // Update statuses of existing instances
        for (const inst of plan.instances) {
          if (existingIds.has(inst.id)) {
            const orig = allInstances.find(i => i.id === inst.id);
            if (orig && orig.status !== inst.status) {
              await supabase.from('payment_instances').update({ status: inst.status }).eq('id', inst.id);
            }
          }
        }
      }

      setIsLoading(false);
    };
    load();
  }, []);

  const addPlan = useCallback(async (data: Omit<PaymentPlan, 'id' | 'instances' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data: row, error } = await supabase.from('payment_plans').insert({
      name: data.name, type: data.type, category: data.category, amount: data.amount,
      pay_to: data.payTo, payee_id: data.payeeId || null, payment_method: data.paymentMethod,
      notes: data.notes || null, due_date: data.dueDate || null, start_date: data.startDate || null,
      frequency: data.frequency || null, total_payments: data.totalPayments ?? null,
      notifications_enabled: data.notificationsEnabled ?? true,
      notification_days_before: data.notificationDaysBefore ?? 1,
      notification_time: data.notificationTime ?? '09:00',
      status: 'active', user_id: user.id,
    }).select().single();
    if (error || !row) throw error;

    const base = mapPlanRow(row);
    let instances: PaymentInstance[] = [];
    if (data.type === 'unique' && data.dueDate) {
      instances = [updateInstanceStatus({
        id: crypto.randomUUID(), planId: base.id,
        periodLabel: format(new Date(data.dueDate), 'PPP', { locale: es }),
        dueDate: data.dueDate, amount: data.amount, status: 'pending',
      })];
    } else if (data.type === 'recurring' && data.startDate && data.frequency) {
      instances = generateInstances(base.id, data.startDate, data.frequency, data.totalPayments ?? null, data.amount);
    }

    // Save instances to DB
    if (instances.length > 0) {
      await supabase.from('payment_instances').insert(
        instances.map(i => ({ id: i.id, plan_id: i.planId, period_label: i.periodLabel, due_date: i.dueDate, amount: i.amount, status: i.status, user_id: user.id }))
      );
    }

    const plan: PaymentPlan = { ...base, instances };
    plan.status = computePlanStatus(plan);
    await supabase.from('payment_plans').update({ status: plan.status }).eq('id', plan.id);
    setPlans(prev => [...prev, plan]);
    return plan;
  }, []);

  const deletePlan = useCallback(async (id: string) => {
    await supabase.from('payment_plans').delete().eq('id', id);
    setPlans(prev => prev.filter(p => p.id !== id));
  }, []);

  const markInstancePaid = useCallback(async (planId: string, instanceId: string) => {
    const paidDate = new Date().toISOString();
    await supabase.from('payment_instances').update({ status: 'paid', paid_date: paidDate }).eq('id', instanceId);
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const instances = p.instances.map(i => i.id === instanceId ? { ...i, status: 'paid' as const, paidDate } : i);
      const updated = { ...p, instances, updatedAt: new Date().toISOString() };
      updated.status = computePlanStatus(updated);
      supabase.from('payment_plans').update({ status: updated.status }).eq('id', planId);
      return updated;
    }));
  }, []);

  const markInstancePending = useCallback(async (planId: string, instanceId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const instances = p.instances.map(i =>
        i.id === instanceId ? updateInstanceStatus({ ...i, status: 'pending', paidDate: undefined }) : i
      );
      const updated = { ...p, instances, updatedAt: new Date().toISOString() };
      updated.status = computePlanStatus(updated);
      supabase.from('payment_plans').update({ status: updated.status }).eq('id', planId);
      supabase.from('payment_instances').update({ status: instances.find(i => i.id === instanceId)!.status, paid_date: null }).eq('id', instanceId);
      return updated;
    }));
  }, []);

  const updateInstance = useCallback(async (planId: string, instanceId: string, data: { amount?: number; paymentMethod?: string }) => {
    await supabase.from('payment_instances').update({
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.paymentMethod !== undefined && { payment_method: data.paymentMethod }),
    }).eq('id', instanceId);
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const instances = p.instances.map(i => i.id === instanceId ? { ...i, ...data } : i);
      return { ...p, instances, updatedAt: new Date().toISOString() };
    }));
  }, []);

  const updatePlan = useCallback(async (planId: string, data: Partial<Pick<PaymentPlan, 'name' | 'category' | 'amount' | 'payTo' | 'payeeId' | 'paymentMethod' | 'notes' | 'dueDate' | 'startDate' | 'frequency' | 'totalPayments' | 'notificationsEnabled' | 'notificationDaysBefore' | 'notificationTime'>>) => {
    const { data: { user: cu } } = await supabase.auth.getUser();
    await supabase.from('payment_plans').update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.payTo !== undefined && { pay_to: data.payTo }),
      ...(data.payeeId !== undefined && { payee_id: data.payeeId }),
      ...(data.paymentMethod !== undefined && { payment_method: data.paymentMethod }),
      ...(data.notes !== undefined && { notes: data.notes }),
      ...(data.dueDate !== undefined && { due_date: data.dueDate }),
      ...(data.startDate !== undefined && { start_date: data.startDate }),
      ...(data.frequency !== undefined && { frequency: data.frequency }),
      ...(data.totalPayments !== undefined && { total_payments: data.totalPayments }),
      ...(data.notificationsEnabled !== undefined && { notifications_enabled: data.notificationsEnabled }),
      ...(data.notificationDaysBefore !== undefined && { notification_days_before: data.notificationDaysBefore }),
      ...(data.notificationTime !== undefined && { notification_time: data.notificationTime }),
    }).eq('id', planId);

    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const updated = { ...p, ...data, updatedAt: new Date().toISOString() };
      if (updated.type === 'recurring' && updated.startDate && updated.frequency) {
        const newInstances = generateInstances(updated.id, updated.startDate, updated.frequency, updated.totalPayments ?? null, updated.amount, p.instances);
        // Sync new instances to DB
        const existingIds = new Set(p.instances.map(i => i.id));
        const toInsert = newInstances.filter(i => !existingIds.has(i.id));
        if (toInsert.length > 0) {
          const { data: { user: cu } } = await supabase.auth.getUser();
          supabase.from('payment_instances').insert(
            toInsert.map(i => ({ id: i.id, plan_id: i.planId, period_label: i.periodLabel, due_date: i.dueDate, amount: i.amount, status: i.status, user_id: cu?.id }))
          );
        }
        updated.instances = newInstances;
      } else if (updated.type === 'unique' && updated.dueDate) {
        updated.instances = p.instances.map(i => ({
          ...i, dueDate: updated.dueDate!, amount: updated.amount,
          periodLabel: format(new Date(updated.dueDate!), 'PPP', { locale: es }),
        })).map(updateInstanceStatus);
        // Update in DB
        for (const inst of updated.instances) {
          supabase.from('payment_instances').update({ due_date: inst.dueDate, amount: inst.amount, period_label: inst.periodLabel, status: inst.status }).eq('id', inst.id);
        }
      }
      updated.status = computePlanStatus(updated);
      supabase.from('payment_plans').update({ status: updated.status }).eq('id', planId);
      return updated;
    }));
  }, []);

  const finalizePlan = useCallback(async (planId: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id !== planId) return p;
      const keptInstances = p.instances.filter(i => i.status === 'paid' || i.status === 'overdue');
      const removedIds = p.instances.filter(i => i.status === 'pending').map(i => i.id);
      if (removedIds.length > 0) {
        supabase.from('payment_instances').delete().in('id', removedIds);
      }
      const updated = {
        ...p,
        totalPayments: keptInstances.length || p.instances.length,
        instances: keptInstances.length > 0 ? keptInstances : p.instances,
        updatedAt: new Date().toISOString(),
      };
      updated.status = computePlanStatus(updated);
      supabase.from('payment_plans').update({ status: updated.status, total_payments: updated.totalPayments }).eq('id', planId);
      return updated;
    }));
  }, []);

  const flattenedPayments: Payment[] = useMemo(() => {
    return plans.flatMap(plan =>
      plan.instances.map(inst => ({
        id: inst.id, name: plan.name, category: plan.category, amount: inst.amount,
        frequency: plan.type === 'recurring' ? (plan.frequency || 'monthly' as PaymentFrequency) : 'once' as PaymentFrequency,
        dueDate: inst.dueDate, payTo: plan.payTo, payeeId: plan.payeeId,
        paymentMethod: plan.paymentMethod, reminderDays: 3,
        notes: inst.notes || plan.notes, status: inst.status,
        paidDate: inst.paidDate, createdAt: plan.createdAt, updatedAt: plan.updatedAt,
      }))
    );
  }, [plans]);

  const findPlanByInstanceId = useCallback((instanceId: string): string | undefined => {
    for (const plan of plans) {
      if (plan.instances.some(i => i.id === instanceId)) return plan.id;
    }
    return undefined;
  }, [plans]);

  const markPaidByInstanceId = useCallback((instanceId: string) => {
    const planId = plans.find(p => p.instances.some(i => i.id === instanceId))?.id;
    if (planId) markInstancePaid(planId, instanceId);
  }, [plans, markInstancePaid]);

  const markPendingByInstanceId = useCallback((instanceId: string) => {
    const planId = plans.find(p => p.instances.some(i => i.id === instanceId))?.id;
    if (planId) markInstancePending(planId, instanceId);
  }, [plans, markInstancePending]);

  return {
    plans, isLoading, addPlan, deletePlan, updatePlan, finalizePlan,
    markInstancePaid, markInstancePending, updateInstance,
    flattenedPayments, findPlanByInstanceId,
    markPaidByInstanceId, markPendingByInstanceId,
  };
}
