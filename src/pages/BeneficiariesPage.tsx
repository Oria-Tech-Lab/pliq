import { AppLayout } from '@/components/layout/AppLayout';
import { usePayments } from '@/hooks/usePayments';
import { usePayees } from '@/hooks/usePayees';
import { useMemo } from 'react';
import { Users, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';

const BeneficiariesPage = () => {
  const { payments, updatePaymentPayeeId } = usePayments();
  const { payees } = usePayees(payments, updatePaymentPayeeId);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const payeeStats = useMemo(() => {
    return payees.map(payee => {
      const payeePayments = payments.filter(p => p.payeeId === payee.id);
      const total = payeePayments.reduce((s, p) => s + p.amount, 0);
      const pending = payeePayments.filter(p => p.status !== 'paid').length;
      return { ...payee, total, count: payeePayments.length, pending };
    }).sort((a, b) => b.total - a.total);
  }, [payees, payments]);

  return (
    <AppLayout title="Beneficiarios">
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {payees.length} {payees.length === 1 ? 'beneficiario' : 'beneficiarios'}
          </span>
        </div>

        {payeeStats.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/60 p-12 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Los beneficiarios aparecerán aquí cuando crees pagos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {payeeStats.map((payee) => (
              <Link
                key={payee.id}
                to={`/payee/${payee.id}`}
                className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:shadow-md transition-all hover:scale-[1.01] cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{payee.name.charAt(0).toUpperCase()}</span>
                  </div>
                  {payee.pending > 0 && (
                    <span className="text-[11px] font-medium text-pending bg-pending/10 px-2 py-0.5 rounded-full">
                      {payee.pending} pendiente{payee.pending > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <h3 className="font-display font-semibold text-foreground">{payee.name}</h3>
                <div className="flex items-center gap-1 mt-1">
                  <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {payee.count} pago{payee.count !== 1 ? 's' : ''} · {formatCurrency(payee.total)}
                  </span>
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
