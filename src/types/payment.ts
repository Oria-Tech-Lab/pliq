export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export type PaymentFrequency = 'once' | 'weekly' | 'monthly' | 'yearly';

export type PaymentCategory = 'services' | 'debts' | 'subscriptions' | 'personal' | 'other';

export type PaymentMethod = 'bank' | 'credit' | 'debit' | 'cash';

export interface Payee {
  id: string;
  name: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  name: string;
  category: PaymentCategory;
  amount: number;
  frequency: PaymentFrequency;
  dueDate: string;
  payTo: string; // kept for backward compatibility
  payeeId?: string;
  paymentMethod: PaymentMethod;
  reminderDays: number;
  notes?: string;
  status: PaymentStatus;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_LABELS: Record<PaymentCategory, string> = {
  services: 'Servicios',
  debts: 'Deudas',
  subscriptions: 'Suscripciones',
  personal: 'Personal',
  other: 'Otros',
};

export const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  once: 'Único',
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
};

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  bank: 'Cuenta bancaria',
  credit: 'Tarjeta de crédito',
  debit: 'Débito',
  cash: 'Efectivo',
};

export const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  overdue: 'Vencido',
};
