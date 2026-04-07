import { PaymentFrequency, PaymentMethod } from './payment';

export type PlanType = 'unique' | 'recurring';

export interface PaymentInstance {
  id: string;
  planId: string;
  periodLabel: string; // e.g. "Enero 2025", "Semana 14"
  dueDate: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
  notes?: string;
  paymentMethod?: string; // Override del método de pago del plan
}

export interface PaymentPlan {
  id: string;
  name: string;
  type: PlanType;
  category: string;
  amount: number;
  payTo: string;
  payeeId?: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  // Unique payment fields
  dueDate?: string;
  // Recurring fields
  startDate?: string;
  frequency?: PaymentFrequency;
  totalPayments?: number | null; // null = indefinite
  // Notifications
  notificationsEnabled?: boolean;
  notificationDaysBefore?: number;
  notificationTime?: string; // HH:mm format
  // Computed
  instances: PaymentInstance[];
  status: 'active' | 'completed' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  unique: 'Único',
  recurring: 'Recurrente',
};
