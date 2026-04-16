export type PaymentStatus = 'pending' | 'paid' | 'overdue';

export type QuickFilter = 'overdue' | 'today' | 'week' | 'month' | 'pending' | 'paid_month' | null;

export type PaymentFrequency = 'once' | 'weekly' | 'monthly' | 'yearly';

export type PaymentCategory = 'services' | 'debts' | 'subscriptions' | 'personal' | 'other';

export type PaymentMethod = 'bank' | 'credit' | 'debit' | 'cash';

export type BeneficiaryType = 'persona' | 'empresa' | 'gobierno' | 'otro';

export interface BankAccount {
  id: string;
  bank: string;
  accountHolder: string;
  accountNumber: string;
  interbankCode: string;
}

export interface Payee {
  id: string;
  name: string;
  type: BeneficiaryType;
  bankAccounts: BankAccount[];
  createdAt: string;
}

export interface PaymentMethodEntry {
  id: string;
  name: string;
  provider: string;
  type: 'card' | 'bank_account' | 'cash';
  initialBalance: number;
  remainingBalance: number;
  isDefault: boolean;
  createdAt: string;
}

export interface CustomCategory {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  name: string;
  category: PaymentCategory | string;
  amount: number;
  currency?: string;
  frequency: PaymentFrequency;
  dueDate: string;
  payTo: string;
  payeeId?: string;
  paymentMethod: string;
  reminderDays: number;
  notes?: string;
  status: PaymentStatus;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const BENEFICIARY_TYPE_LABELS: Record<BeneficiaryType, string> = {
  persona: 'Persona',
  empresa: 'Empresa',
  gobierno: 'Gobierno',
  otro: 'Otro',
};

export const METHOD_TYPE_LABELS: Record<PaymentMethodEntry['type'], string> = {
  card: 'Tarjeta',
  bank_account: 'Cuenta bancaria',
  cash: 'Efectivo',
};

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
