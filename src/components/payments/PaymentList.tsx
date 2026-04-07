import { Payment, Payee, PaymentStatus, PaymentCategory } from '@/types/payment';
import { PaymentCard } from './PaymentCard';
import { EmptyState } from './EmptyState';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaymentListProps {
  payments: Payment[];
  payees?: Payee[];
  searchQuery: string;
  statusFilter: PaymentStatus | 'all';
  categoryFilter: PaymentCategory | 'all';
  onMarkAsPaid: (id: string) => void;
  onMarkAsPending: (id: string) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
  onAddPayment: () => void;
  pageSize?: number;
}

export function PaymentList({
  payments,
  payees = [],
  searchQuery,
  statusFilter,
  categoryFilter,
  onMarkAsPaid,
  onMarkAsPending,
  onEdit,
  onDelete,
  onAddPayment,
  pageSize = 10,
}: PaymentListProps) {
  const [page, setPage] = useState(0);

  const filteredPayments = useMemo(() => {
    return payments
      .filter(p => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(query);
          const matchesPayTo = p.payTo.toLowerCase().includes(query);
          const payee = payees.find(py => py.id === p.payeeId);
          const matchesPayee = payee?.name.toLowerCase().includes(query);
          if (!matchesName && !matchesPayTo && !matchesPayee) return false;
        }
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        if (a.status === 'paid' && b.status !== 'paid') return 1;
        if (b.status === 'paid' && a.status !== 'paid') return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [payments, payees, searchQuery, statusFilter, categoryFilter]);

  // Reset page when filters change
  useMemo(() => setPage(0), [searchQuery, statusFilter, categoryFilter, payments]);

  const totalPages = Math.ceil(filteredPayments.length / pageSize);
  const paginatedPayments = filteredPayments.slice(page * pageSize, (page + 1) * pageSize);

  const hasFilters = !!(searchQuery || statusFilter !== 'all' || categoryFilter !== 'all');

  if (payments.length === 0) {
    return <EmptyState onAddPayment={onAddPayment} />;
  }

  if (filteredPayments.length === 0) {
    return <EmptyState onAddPayment={onAddPayment} hasFilters={hasFilters} />;
  }

  return (
    <div className="space-y-3">
      {paginatedPayments.map((payment) => (
        <PaymentCard
          key={payment.id}
          payment={payment}
          payees={payees}
          onMarkAsPaid={onMarkAsPaid}
          onMarkAsPending={onMarkAsPending}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-muted-foreground">
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredPayments.length)} de {filteredPayments.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                  i === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
