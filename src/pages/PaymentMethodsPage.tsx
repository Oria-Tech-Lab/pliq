import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePayments } from '@/hooks/usePayments';
import { PaymentMethod, METHOD_LABELS } from '@/types/payment';
import { Building2, CreditCard, Wallet, Banknote } from 'lucide-react';

const METHOD_ICONS: Record<PaymentMethod, typeof CreditCard> = {
  bank: Building2,
  credit: CreditCard,
  debit: Wallet,
  cash: Banknote,
};

const PaymentMethodsPage = () => {
  const { payments } = usePayments();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const methodStats = useMemo(() => {
    const methods = Object.keys(METHOD_LABELS) as PaymentMethod[];
    return methods.map(method => {
      const methodPayments = payments.filter(p => p.paymentMethod === method);
      const total = methodPayments.reduce((s, p) => s + p.amount, 0);
      const pending = methodPayments.filter(p => p.status !== 'paid').length;
      return { method, label: METHOD_LABELS[method], count: methodPayments.length, total, pending };
    }).filter(m => m.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [payments]);

  const totalAmount = methodStats.reduce((s, m) => s + m.total, 0);

  return (
    <AppLayout title="Métodos de pago">
      <div className="container py-6 space-y-4">
        <span className="text-sm text-muted-foreground">
          {methodStats.length} {methodStats.length === 1 ? 'método' : 'métodos'} utilizados
        </span>

        {methodStats.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/60 p-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Los métodos de pago aparecerán aquí cuando crees pagos</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {methodStats.map(({ method, label, count, total, pending }) => {
              const Icon = METHOD_ICONS[method];
              const percentage = totalAmount > 0 ? (total / totalAmount) * 100 : 0;
              return (
                <div
                  key={method}
                  className="bg-card rounded-xl border border-border/40 px-4 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm text-foreground">{label}</h3>
                        <span className="text-sm font-semibold text-foreground">{formatCurrency(total)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {count} pago{count !== 1 ? 's' : ''} · {pending} pendiente{pending !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{percentage.toFixed(0)}%</span>
                      </div>
                      <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PaymentMethodsPage;
