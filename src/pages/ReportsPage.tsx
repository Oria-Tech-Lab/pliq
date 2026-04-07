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
  const { flattenedPayments: payments, plans } = usePaymentPlans();
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
    const pending = filteredPayments.filter(p => p.status === 'pending');
    const overdue = filteredPayments.filter(p => p.status === 'overdue');

    const paidTotal = paid.reduce((s, p) => s + p.amount, 0);
    const pendingTotal = pending.reduce((s, p) => s + p.amount, 0);
    const overdueTotal = overdue.reduce((s, p) => s + p.amount, 0);

    // By category
    const byCategory: Record<string, number> = {};
    filteredPayments.forEach(p => {
      byCategory[p.category] = (byCategory[p.category] || 0) + p.amount;
    });
    const categoryEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
    const categoryTotal = categoryEntries.reduce((s, [, v]) => s + v, 0);

    // By payee
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

        <SummaryReportCards
          paidTotal={stats.paidTotal}
          pendingTotal={stats.pendingTotal}
          overdueTotal={stats.overdueTotal}
          paidCount={stats.paidCount}
          pendingCount={stats.pendingCount}
          overdueCount={stats.overdueCount}
          formatCurrency={formatCurrency}
        />

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
