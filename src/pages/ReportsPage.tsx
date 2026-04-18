import { AppLayout } from '@/components/layout/AppLayout';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { usePayees } from '@/hooks/usePayees';
import { useCategoryLabels } from '@/hooks/useCategoryLabels';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  subMonths, startOfDay, endOfDay, isWithinInterval,
} from 'date-fns';
import { useMemo, useState } from 'react';
import { DateFilterBar, DatePreset } from '@/components/reports/DateFilterBar';
import { SummaryReportCards } from '@/components/reports/SummaryReportCards';
import { MonthlyBarChart } from '@/components/reports/MonthlyBarChart';
import { CategoryReport } from '@/components/reports/CategoryReport';
import { PayeeReport } from '@/components/reports/PayeeReport';
import { RecurringSummary } from '@/components/reports/RecurringSummary';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency as fmt, getCurrencySymbol, convertCurrency } from '@/lib/currency';

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

type CurrencyFilter = 'primary' | 'secondary' | 'all';

const ReportsPage = () => {
  const { flattenedPayments: payments, plans } = usePaymentPlans();
  const { payees } = usePayees([], () => {});
  const allCategoryLabels = useCategoryLabels();
  const { primaryCurrency, secondaryCurrency, exchangeRate } = useCurrency();

  const [activePreset, setActivePreset] = useState<DatePreset>('month');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('all');

  // Display currency for aggregated totals
  const displayCurrency = currencyFilter === 'secondary' ? secondaryCurrency : primaryCurrency;

  const formatCurrency = (amount: number) => fmt(amount, displayCurrency);

  const dateRange = useMemo(() => getDateRange(activePreset, customFrom, customTo), [activePreset, customFrom, customTo]);

  // Apply date filter
  const dateFilteredPayments = useMemo(() => {
    if (!dateRange) return payments;
    return payments.filter(p => {
      const d = new Date(p.dueDate);
      return isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
    });
  }, [payments, dateRange]);

  // Apply currency filter + currency conversion. Returns payments with normalized amount in displayCurrency.
  const filteredPayments = useMemo(() => {
    return dateFilteredPayments
      .map(p => {
        const pCurrency = (p as any).currency || primaryCurrency;
        if (currencyFilter === 'primary') {
          if (pCurrency !== primaryCurrency) return null;
          return p;
        }
        if (currencyFilter === 'secondary') {
          if (pCurrency !== secondaryCurrency) return null;
          return p;
        }
        // all → convert everything to primary
        const converted = convertCurrency(p.amount, pCurrency, primaryCurrency, exchangeRate, primaryCurrency, secondaryCurrency);
        return { ...p, amount: converted, currency: primaryCurrency } as typeof p;
      })
      .filter(Boolean) as typeof dateFilteredPayments;
  }, [dateFilteredPayments, currencyFilter, primaryCurrency, secondaryCurrency, exchangeRate]);

  const stats = useMemo(() => {
    const paid = filteredPayments.filter(p => p.status === 'paid');
    const pending = filteredPayments.filter(p => p.status === 'pending');
    const overdue = filteredPayments.filter(p => p.status === 'overdue');

    const paidTotal = paid.reduce((s, p) => s + p.amount, 0);
    const pendingTotal = pending.reduce((s, p) => s + p.amount, 0);
    const overdueTotal = overdue.reduce((s, p) => s + p.amount, 0);

    const byCategory: Record<string, number> = {};
    filteredPayments.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + p.amount;
    });
    const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const categoryTotal = categoryEntries.reduce((s, [, v]) => s + v, 0);

    const byPayee: Record<string, { id: string; name: string; paid: number; pending: number }> = {};
    filteredPayments.forEach(p => {
      const payeeId = p.payeeId || 'no-payee';
      if (!byPayee[payeeId]) {
        const payee = p.payeeId ? payees.find(py => py.id === p.payeeId) : null;
        byPayee[payeeId] = { id: payeeId, name: payee?.name || p.payTo || 'Sin beneficiario', paid: 0, pending: 0 };
      }
      if (p.status === 'paid') byPayee[payeeId].paid += p.amount;
      else byPayee[payeeId].pending += p.amount;
    });
    const payeeEntries = Object.values(byPayee).sort((a, b) => (b.paid + b.pending) - (a.paid + a.pending));

    return {
      paidTotal, pendingTotal, overdueTotal,
      categoryEntries, categoryTotal, payeeEntries,
      paidCount: paid.length, pendingCount: pending.length, overdueCount: overdue.length,
    };
  }, [filteredPayments, payees]);

  // Total across all 3 cards (used to compute the equivalent helper text)
  const grandTotal = stats.paidTotal + stats.pendingTotal + stats.overdueTotal;
  const equivalentCurrency = currencyFilter === 'secondary' ? primaryCurrency : secondaryCurrency;
  const equivalentAmount = useMemo(() => {
    if (currencyFilter === 'all') return 0;
    return convertCurrency(grandTotal, displayCurrency, equivalentCurrency, exchangeRate, primaryCurrency, secondaryCurrency);
  }, [grandTotal, currencyFilter, displayCurrency, equivalentCurrency, exchangeRate, primaryCurrency, secondaryCurrency]);

  return (
    <AppLayout title="Reportes">
      <div className="container py-4 space-y-5">
        <DateFilterBar
          activePreset={activePreset}
          setActivePreset={setActivePreset}
          customFrom={customFrom}
          customTo={customTo}
          setCustomFrom={setCustomFrom}
          setCustomTo={setCustomTo}
          dateRange={dateRange}
        />

        {/* Currency filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Moneda:</span>
          <Select value={currencyFilter} onValueChange={(v) => setCurrencyFilter(v as CurrencyFilter)}>
            <SelectTrigger className="h-8 text-xs w-auto min-w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">{primaryCurrency} solamente</SelectItem>
              {secondaryCurrency !== primaryCurrency && (
                <SelectItem value="secondary">{secondaryCurrency} solamente</SelectItem>
              )}
              <SelectItem value="all">Todas las monedas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <SummaryReportCards
          paidTotal={stats.paidTotal}
          pendingTotal={stats.pendingTotal}
          overdueTotal={stats.overdueTotal}
          paidCount={stats.paidCount}
          pendingCount={stats.pendingCount}
          overdueCount={stats.overdueCount}
          formatCurrency={formatCurrency}
        />

        {/* Conversion / equivalent helper text */}
        {currencyFilter === 'all' && secondaryCurrency !== primaryCurrency && (
          <p className="text-[11px] text-muted-foreground -mt-2">
            Incluye conversión aproximada de {secondaryCurrency} a {primaryCurrency} al tipo de cambio {fmt(exchangeRate, primaryCurrency)}
          </p>
        )}
        {currencyFilter !== 'all' && grandTotal > 0 && exchangeRate > 0 && secondaryCurrency !== primaryCurrency && (
          <p className="text-[11px] text-muted-foreground -mt-2">
            ≈ {getCurrencySymbol(equivalentCurrency)} {equivalentAmount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} al tipo de cambio actual
          </p>
        )}

        <MonthlyBarChart payments={filteredPayments} formatCurrency={formatCurrency} />

        <CategoryReport
          categoryEntries={stats.categoryEntries}
          categoryTotal={stats.categoryTotal}
          allCategoryLabels={allCategoryLabels}
          formatCurrency={formatCurrency}
        />

        <PayeeReport payeeEntries={stats.payeeEntries} formatCurrency={formatCurrency} />

        <RecurringSummary plans={plans} formatCurrency={formatCurrency} />
      </div>
    </AppLayout>
  );
};

export default ReportsPage;
