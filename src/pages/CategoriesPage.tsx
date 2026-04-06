import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePayments } from '@/hooks/usePayments';
import { PaymentCategory, CATEGORY_LABELS } from '@/types/payment';
import { CategoryBadge } from '@/components/payments/CategoryBadge';
import { Zap, CreditCard, RefreshCw, User, MoreHorizontal } from 'lucide-react';

const CATEGORY_ICONS: Record<PaymentCategory, typeof Zap> = {
  services: Zap,
  debts: CreditCard,
  subscriptions: RefreshCw,
  personal: User,
  other: MoreHorizontal,
};

const CategoriesPage = () => {
  const { payments } = usePayments();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const categoryStats = useMemo(() => {
    const categories = Object.keys(CATEGORY_LABELS) as PaymentCategory[];
    return categories.map(cat => {
      const catPayments = payments.filter(p => p.category === cat);
      const total = catPayments.reduce((s, p) => s + p.amount, 0);
      const pending = catPayments.filter(p => p.status !== 'paid').length;
      const paid = catPayments.filter(p => p.status === 'paid').length;
      return { category: cat, label: CATEGORY_LABELS[cat], count: catPayments.length, total, pending, paid };
    }).filter(c => c.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [payments]);

  const totalAmount = categoryStats.reduce((s, c) => s + c.total, 0);

  return (
    <AppLayout title="Categorías">
      <div className="container py-6 space-y-4">
        <span className="text-sm text-muted-foreground">
          {categoryStats.length} {categoryStats.length === 1 ? 'categoría' : 'categorías'} con pagos
        </span>

        {categoryStats.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/60 p-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Las categorías aparecerán aquí cuando crees pagos</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {categoryStats.map(({ category, label, count, total, pending, paid }) => {
              const Icon = CATEGORY_ICONS[category];
              const percentage = totalAmount > 0 ? (total / totalAmount) * 100 : 0;
              return (
                <div
                  key={category}
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

export default CategoriesPage;
