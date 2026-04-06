import { Header } from '@/components/layout/Header';
import { usePayments } from '@/hooks/usePayments';
import { CATEGORY_LABELS, PaymentCategory } from '@/types/payment';
import { isThisMonth, isThisWeek, format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo } from 'react';
import { TrendingUp, TrendingDown, PieChart, BarChart3 } from 'lucide-react';

const ReportsPage = () => {
  const { payments } = usePayments();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const stats = useMemo(() => {
    const paidPayments = payments.filter(p => p.status === 'paid' && p.paidDate);
    const pendingPayments = payments.filter(p => p.status !== 'paid');

    const paidThisMonth = paidPayments
      .filter(p => p.paidDate && isThisMonth(new Date(p.paidDate)))
      .reduce((s, p) => s + p.amount, 0);

    const paidLastMonth = paidPayments
      .filter(p => {
        if (!p.paidDate) return false;
        const d = new Date(p.paidDate);
        const lastMonth = subMonths(new Date(), 1);
        return d >= startOfMonth(lastMonth) && d <= endOfMonth(lastMonth);
      })
      .reduce((s, p) => s + p.amount, 0);

    const pendingTotal = pendingPayments.reduce((s, p) => s + p.amount, 0);

    // Category breakdown
    const byCategory: Record<string, number> = {};
    paidPayments.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + p.amount;
    });

    // Monthly trend (last 6 months)
    const sixMonthsAgo = subMonths(startOfMonth(new Date()), 5);
    const months = eachMonthOfInterval({ start: sixMonthsAgo, end: new Date() });
    const monthlyTrend = months.map(month => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const total = paidPayments
        .filter(p => {
          if (!p.paidDate) return false;
          const d = new Date(p.paidDate);
          return d >= start && d <= end;
        })
        .reduce((s, p) => s + p.amount, 0);
      return { month: format(month, 'MMM', { locale: es }), total };
    });

    const maxMonthly = Math.max(...monthlyTrend.map(m => m.total), 1);

    return { paidThisMonth, paidLastMonth, pendingTotal, byCategory, monthlyTrend, maxMonthly, totalPaid: paidPayments.reduce((s, p) => s + p.amount, 0) };
  }, [payments]);

  const categoryEntries = Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]);
  const maxCategory = categoryEntries.length > 0 ? categoryEntries[0][1] : 1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        <h2 className="font-display font-semibold text-xl text-foreground">Reportes</h2>

        {/* Summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="summary-card summary-card-today">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-paid" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display tracking-tight text-foreground">{formatCurrency(stats.paidThisMonth)}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Pagado este mes</p>
            {stats.paidLastMonth > 0 && (
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                Mes anterior: {formatCurrency(stats.paidLastMonth)}
              </p>
            )}
          </div>

          <div className="summary-card summary-card-week">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-pending" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display tracking-tight text-foreground">{formatCurrency(stats.pendingTotal)}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Pendiente total</p>
          </div>

          <div className="summary-card summary-card-month">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold font-display tracking-tight text-foreground">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Total pagado histórico</p>
          </div>
        </div>

        {/* Monthly trend */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <h3 className="font-display font-semibold text-sm text-foreground mb-4">Tendencia mensual</h3>
          {stats.monthlyTrend.some(m => m.total > 0) ? (
            <div className="flex items-end gap-2 h-40">
              {stats.monthlyTrend.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {m.total > 0 ? formatCurrency(m.total) : ''}
                  </span>
                  <div
                    className="w-full rounded-lg bg-primary/80 transition-all min-h-[4px]"
                    style={{ height: `${(m.total / stats.maxMonthly) * 100}%` }}
                  />
                  <span className="text-[11px] text-muted-foreground capitalize">{m.month}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No hay datos de pagos aún</p>
          )}
        </div>

        {/* By category */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <h3 className="font-display font-semibold text-sm text-foreground mb-4">Gastos por categoría</h3>
          {categoryEntries.length > 0 ? (
            <div className="space-y-3">
              {categoryEntries.map(([cat, amount]) => (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      {CATEGORY_LABELS[cat as PaymentCategory] || cat}
                    </span>
                    <span className="text-sm text-muted-foreground">{formatCurrency(amount)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(amount / maxCategory) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No hay pagos registrados aún</p>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportsPage;
