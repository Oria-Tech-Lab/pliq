import { Payment, PaymentStatus, PaymentCategory } from '@/types/payment';
import { PaymentCard } from './PaymentCard';
import { EmptyState } from './EmptyState';
import { useMemo } from 'react';

interface PaymentListProps {
  payments: Payment[];
  searchQuery: string;
  statusFilter: PaymentStatus | 'all';
  categoryFilter: PaymentCategory | 'all';
  onMarkAsPaid: (id: string) => void;
  onMarkAsPending: (id: string) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
  onAddPayment: () => void;
}

export function PaymentList({
  payments,
  searchQuery,
  statusFilter,
  categoryFilter,
  onMarkAsPaid,
  onMarkAsPending,
  onEdit,
  onDelete,
  onAddPayment,
}: PaymentListProps) {
  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => {
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(query);
          const matchesPayTo = p.payTo.toLowerCase().includes(query);
          if (!matchesName && !matchesPayTo) return false;
        }

        // Status filter
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;

        return true;
      })
      .sort((a, b) => {
        // Sort: overdue first, then by due date
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        if (a.status === 'paid' && b.status !== 'paid') return 1;
        if (b.status === 'paid' && a.status !== 'paid') return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [payments, searchQuery, statusFilter, categoryFilter]);

  const hasFilters = !!(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all');

  if (payments.length === 0) {
    return <EmptyState onAddPayment={onAddPayment} />;
  }

  if (filteredPayments.length === 0) {
    return <EmptyState onAddPayment={onAddPayment} hasFilters={hasFilters} />;
  }

  return (
    <div className="space-y-3">
      {filteredPayments.map((payment) => (
        <PaymentCard
          key={payment.id}
          payment={payment}
          onMarkAsPaid={onMarkAsPaid}
          onMarkAsPending={onMarkAsPending}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
