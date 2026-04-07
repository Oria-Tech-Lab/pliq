import { AppLayout } from '@/components/layout/AppLayout';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { usePayees } from '@/hooks/usePayees';
import { useCategoryLabels } from '@/hooks/useCategoryLabels';
import { CATEGORY_LABELS, PaymentCategory } from '@/types/payment';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  subMonths, startOfDay, endOfDay, isWithinInterval, format
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, CalendarIcon, Users, Tag } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type DatePreset = 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'all' | 'custom';

const PRESET_LABELS: Record<DatePreset, string> = {
  week: 'Esta semana',
  month: 'Este mes',
  quarter: 'Último trimestre',
  semester: 'Último semestre',
  year: 'Este año',
  all: 'Todo',
  custom: 'Personalizado',
};

const PIE_COLORS = [
  'hsl(217, 91%, 60%)',   // primary
  'hsl(160, 68%, 44%)',   // success/paid
  'hsl(43, 96%, 56%)',    // pending/warning
  'hsl(0, 84%, 60%)',     // overdue/destructive
  'hsl(280, 60%, 55%)',   // purple
  'hsl(190, 70%, 50%)',   // teal
  'hsl(25, 85%, 55%)',    // orange
  'hsl(330, 65%, 50%)',   // pink
];

function getDateRange(preset: DatePreset, customFrom?: Date, customTo?: Date): { from: Date; to: Date } | null {
  const now = new Date();
  switch (preset) {
    case 'week': return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case 'month': return { from: startOfMonth(now), to: endOfMonth(now) };
    case 'quarter': return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
    case 'semester': return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) };
    case 'year': return { from: startOfYear(now), to: endOfYear(now) };
    case 'all': return null;
    case 'custom':
      if (customFrom && customTo) return { from: startOfDay(customFrom), to: endOfDay(customTo) };
      return null;
  }
}

const ReportsPage = () => {
  const { flattenedPayments: payments } = usePaymentPlans();
  const { payees } = usePayees([], () => {});
  const allCategoryLabels = useCategoryLabels();

  const [activePreset, setActivePreset] = useState<DatePreset>('month');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const dateRange = useMemo(() => getDateRange(activePreset, customFrom, customTo), [activePreset, customFrom, customTo]);

  const filteredPayments = useMemo(() => {
    if (!dateRange) return payments;
    return payments.filter(p => {
      const d = new Date(p.dueDate);
      return isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
    });
  }, [payments, dateRange]);

  const stats = useMemo(() => {
    const paid = filteredPayments.filter(p => p.status === 'paid');
    const pending = filteredPayments.filter(p => p.status !== 'paid');

    const paidTotal = paid.reduce((s, p) => s + p.amount, 0);
    const pendingTotal = pending.reduce((s, p) => s + p.amount, 0);

    // By category
    const byCategory: Record<string, number> = {};
    filteredPayments.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + p.amount;
    });
    const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const categoryTotal = categoryEntries.reduce((s, [, v]) => s + v, 0);

    // By payee
    const byPayee: Record<string, { name: string; paid: number; pending: number }> = {};
    filteredPayments.forEach(p => {
      const payeeId = p.payeeId || p.payTo || 'Sin beneficiario';
      if (!byPayee[payeeId]) {
        const payee = p.payeeId ? payees.find(py => py.id === p.payeeId) : null;
        byPayee[payeeId] = { name: payee?.name || p.payTo || 'Sin beneficiario', paid: 0, pending: 0 };
      }
      if (p.status === 'paid') byPayee[payeeId].paid += p.amount;
      else byPayee[payeeId].pending += p.amount;
    });
    const payeeEntries = Object.values(byPayee).sort((a, b) => (b.paid + b.pending) - (a.paid + a.pending));

    return { paidTotal, pendingTotal, categoryEntries, categoryTotal, payeeEntries, paidCount: paid.length, pendingCount: pending.length };
  }, [filteredPayments, payees]);

  const pieData = stats.categoryEntries.map(([cat, amount]) => ({
    name: allCategoryLabels[cat] || cat,
    value: amount,
  }));

  const presets: DatePreset[] = ['week', 'month', 'quarter', 'semester', 'year', 'all'];

  return (
    <AppLayout title="Reportes">
      <div className="container py-4 space-y-5">
        {/* Date filter pills */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {presets.map(preset => (
              <button
                key={preset}
                onClick={() => setActivePreset(preset)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all border',
                  activePreset === preset
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                )}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
            {/* Custom date range */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all border inline-flex items-center gap-1.5',
                    activePreset === 'custom'
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                  )}
                >
                  <CalendarIcon className="w-3 h-3" />
                  {activePreset === 'custom' && customFrom && customTo
                    ? `${format(customFrom, 'dd/MM', { locale: es })} - ${format(customTo, 'dd/MM', { locale: es })}`
                    : 'Rango'}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 flex flex-col gap-2" align="start">
                <div className="p-3 pb-0">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Selecciona el rango</p>
                </div>
                <Calendar
                  mode="range"
                  selected={customFrom && customTo ? { from: customFrom, to: customTo } : undefined}
                  onSelect={(range) => {
                    if (range?.from) setCustomFrom(range.from);
                    if (range?.to) setCustomTo(range.to);
                    if (range?.from && range?.to) setActivePreset('custom');
                  }}
                  numberOfMonths={1}
                  locale={es}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
          {dateRange && (
            <p className="text-[11px] text-muted-foreground">
              {format(dateRange.from, "d 'de' MMMM yyyy", { locale: es })} — {format(dateRange.to, "d 'de' MMMM yyyy", { locale: es })}
            </p>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-paid/10 flex items-center justify-center mb-2">
              <TrendingUp className="w-4 h-4 text-paid" />
            </div>
            <p className="text-xl font-bold font-display tracking-tight text-foreground">{formatCurrency(stats.paidTotal)}</p>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Pagado</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">{stats.paidCount} pagos</p>
          </div>
          <div className="bg-card rounded-2xl border border-border/60 p-4 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-pending/10 flex items-center justify-center mb-2">
              <TrendingDown className="w-4 h-4 text-pending" />
            </div>
            <p className="text-xl font-bold font-display tracking-tight text-foreground">{formatCurrency(stats.pendingTotal)}</p>
            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Pendiente</p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">{stats.pendingCount} pagos</p>
          </div>
        </div>

        {/* Pie chart + category list */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-sm text-foreground">Gastos por categoría</h3>
          </div>

          {pieData.length > 0 ? (
            <>
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--card))',
                        fontSize: '12px',
                        padding: '8px 12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category list */}
              <div className="space-y-2.5">
                {stats.categoryEntries.map(([cat, amount], i) => {
                  const pct = stats.categoryTotal > 0 ? ((amount / stats.categoryTotal) * 100).toFixed(1) : '0';
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground truncate">{allCategoryLabels[cat] || cat}</span>
                          <span className="text-sm tabular-nums text-foreground font-medium">{formatCurrency(amount)}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No hay pagos en este período</p>
          )}
        </div>

        {/* Beneficiaries report */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-display font-semibold text-sm text-foreground">Pagos por beneficiario</h3>
          </div>

          {stats.payeeEntries.length > 0 ? (
            <div className="space-y-3">
              {stats.payeeEntries.map((entry) => {
                const total = entry.paid + entry.pending;
                const paidPct = total > 0 ? (entry.paid / total) * 100 : 0;
                return (
                  <div key={entry.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{entry.name}</span>
                      <span className="text-sm tabular-nums text-foreground font-medium">{formatCurrency(total)}</span>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                      {paidPct > 0 && (
                        <div className="h-full bg-paid transition-all" style={{ width: `${paidPct}%` }} />
                      )}
                      {paidPct < 100 && (
                        <div className="h-full bg-pending transition-all" style={{ width: `${100 - paidPct}%` }} />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-paid inline-block" />
                        Pagado: {formatCurrency(entry.paid)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-pending inline-block" />
                        Pendiente: {formatCurrency(entry.pending)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No hay datos en este período</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
