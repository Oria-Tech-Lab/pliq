import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePayments } from '@/hooks/usePayments';
import { usePayees } from '@/hooks/usePayees';
import { PaymentFilters } from '@/components/payments/PaymentFilters';
import { useMemo } from 'react';
import { Users, CreditCard, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PaymentStatus, PaymentCategory } from '@/types/payment';

const BeneficiariesPage = () => {
  const { payments, updatePaymentPayeeId } = usePayments();
  const { payees } = usePayees(payments, updatePaymentPayeeId);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<PaymentCategory | 'all'>('all');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const payeeStats = useMemo(() => {
    return payees.map(payee => {
      let payeePayments = payments.filter(p => p.payeeId === payee.id);
      
      if (statusFilter !== 'all') {
        payeePayments = payeePayments.filter(p => p.status === statusFilter);
      }
      if (categoryFilter !== 'all') {
        payeePayments = payeePayments.filter(p => p.category === categoryFilter);
      }

      const total = payeePayments.reduce((s, p) => s + p.amount, 0);
      const pending = payeePayments.filter(p => p.status !== 'paid').length;
      return { ...payee, total, count: payeePayments.length, pending };
    })
    .filter(payee => {
      if (searchQuery) {
        return payee.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .filter(payee => {
      if (statusFilter !== 'all' || categoryFilter !== 'all') {
        return payee.count > 0;
      }
      return true;
    })
    .sort((a, b) => b.total - a.total);
  }, [payees, payments, searchQuery, statusFilter, categoryFilter]);

  return (
    <AppLayout title="Beneficiarios">
      <div className="container py-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {payeeStats.length} {payeeStats.length === 1 ? 'beneficiario' : 'beneficiarios'}
          </span>
        </div>

        <PaymentFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
        />

        {payeeStats.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/60 p-12 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Los beneficiarios aparecerán aquí cuando crees pagos</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {payeeStats.map((payee) => (
              <Link
                key={payee.id}
                to={`/payee/${payee.id}`}
                className="flex items-center gap-3 bg-card rounded-xl border border-border/40 px-4 py-3 hover:border-primary/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{payee.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-foreground truncate">{payee.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CreditCard className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {payee.count} pago{payee.count !== 1 ? 's' : ''} · {formatCurrency(payee.total)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {payee.pending > 0 && (
                    <span className="text-[10px] font-medium text-pending bg-pending/10 px-1.5 py-0.5 rounded-full">
                      {payee.pending}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default BeneficiariesPage;
