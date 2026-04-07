import { useRef } from 'react';
import { Payment, QuickFilter } from '@/types/payment';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { AlertTriangle, CalendarCheck, CalendarDays, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  payments: Payment[];
  activeFilter?: QuickFilter;
  onCardClick?: (filter: QuickFilter) => void;
}

export function SummaryCards({ payments, activeFilter, onCardClick }: SummaryCardsProps) {
  const overduePayments = payments.filter(p => p.status === 'overdue');
  const todayPayments = payments.filter(p => p.status !== 'paid' && isToday(new Date(p.dueDate)));
  const weekPayments = payments.filter(p => p.status !== 'paid' && isThisWeek(new Date(p.dueDate), { weekStartsOn: 1 }));
  const monthPayments = payments.filter(p => p.status !== 'paid' && isThisMonth(new Date(p.dueDate)));

  const totalDueThisMonth = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidThisMonth = payments
    .filter(p => p.status === 'paid' && p.paidDate && isThisMonth(new Date(p.paidDate)))
    .reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const heroCards = [
    {
      filterKey: 'pending' as QuickFilter,
      title: 'Por pagar',
      value: formatCurrency(totalDueThisMonth),
      subtitle: `${monthPayments.length} pagos pendientes`,
      icon: TrendingUp,
      iconBg: 'bg-pending/10',
      iconColor: 'text-pending',
    },
    {
      filterKey: 'paid_month' as QuickFilter,
      title: 'Pagado este mes',
      value: formatCurrency(paidThisMonth),
      subtitle: 'Total pagado',
      icon: CheckCircle,
      iconBg: 'bg-paid/10',
      iconColor: 'text-paid',
    },
  ];

  const quickCards = [
    {
      filterKey: 'overdue' as QuickFilter,
      title: 'Vencidos',
      value: overduePayments.length,
      subtitle: overduePayments.length > 0
        ? formatCurrency(overduePayments.reduce((s, p) => s + p.amount, 0))
        : 'Todo al día',
      icon: AlertTriangle,
      iconColor: 'text-overdue',
      highlight: overduePayments.length > 0,
    },
    {
      filterKey: 'today' as QuickFilter,
      title: 'Hoy',
      value: todayPayments.length,
      subtitle: todayPayments.length > 0
        ? formatCurrency(todayPayments.reduce((s, p) => s + p.amount, 0))
        : 'Sin pagos hoy',
      icon: CalendarCheck,
      iconColor: 'text-primary',
      highlight: todayPayments.length > 0,
    },
    {
      filterKey: 'week' as QuickFilter,
      title: 'Semana',
      value: weekPayments.length,
      subtitle: formatCurrency(weekPayments.reduce((s, p) => s + p.amount, 0)),
      icon: CalendarDays,
      iconColor: 'text-pending',
      highlight: false,
    },
    {
      filterKey: 'month' as QuickFilter,
      title: 'Mes',
      value: monthPayments.length,
      subtitle: formatCurrency(totalDueThisMonth),
      icon: Calendar,
      iconColor: 'text-muted-foreground',
      highlight: false,
    },
  ];

  const renderCard = (card: typeof heroCards[0], isHero: boolean) => {
    const isActive = activeFilter === card.filterKey;
    return (
      <button
        key={card.filterKey}
        onClick={() => onCardClick?.(isActive ? null : card.filterKey)}
        className={cn(
          'bg-card rounded-2xl border p-4 text-left transition-all active:scale-[0.98]',
          isActive
            ? 'border-primary/40 bg-primary/[0.03] shadow-sm'
            : 'border-border/60 hover:border-primary/20 shadow-sm',
        )}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-muted-foreground">{card.title}</span>
          <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', 'iconBg' in card ? (card as any).iconBg : 'bg-muted')}>
            <card.icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
          </div>
        </div>
        <p className={cn(
          'font-bold font-display tracking-tight text-foreground leading-tight',
          isHero ? 'text-lg' : 'text-base',
        )}>
          {card.value}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{card.subtitle}</p>
      </button>
    );
  };

  const renderQuickCard = (card: typeof quickCards[0]) => {
    const isActive = activeFilter === card.filterKey;
    return (
      <button
        key={card.filterKey}
        onClick={() => onCardClick?.(isActive ? null : card.filterKey)}
        className={cn(
          'min-w-[100px] flex-shrink-0 bg-card rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98] snap-start',
          isActive
            ? 'border-primary/40 bg-primary/[0.03]'
            : 'border-border/60 hover:border-primary/20',
          card.highlight && !isActive ? 'border-overdue/25' : '',
          'shadow-sm',
        )}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <card.icon className={`w-3 h-3 ${card.iconColor}`} />
          <span className="text-[10px] font-medium text-muted-foreground">{card.title}</span>
        </div>
        <p className={cn(
          'text-lg font-bold font-display tracking-tight',
          card.filterKey === 'overdue' && card.highlight ? 'text-overdue' : 'text-foreground',
        )}>
          {card.value}
        </p>
        <p className="text-[9px] text-muted-foreground/60 mt-0.5 truncate">{card.subtitle}</p>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {heroCards.map(c => renderCard(c, true))}
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-1 px-1 pb-1">
        {quickCards.map(renderQuickCard)}
      </div>
    </div>
  );
}
