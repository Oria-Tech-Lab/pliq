import { useRef } from 'react';
import { Payment, QuickFilter } from '@/types/payment';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { AlertTriangle, CalendarCheck, CalendarDays, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SummaryCardsProps {
  payments: Payment[];
  activeFilter?: QuickFilter;
  onCardClick?: (filter: QuickFilter) => void;
}

export function SummaryCards({ payments, activeFilter, onCardClick }: SummaryCardsProps) {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const sliderCards = [
    {
      filterKey: 'overdue' as QuickFilter,
      title: 'Vencidos',
      value: overduePayments.length,
      subtitle: overduePayments.length > 0 
        ? formatCurrency(overduePayments.reduce((s, p) => s + p.amount, 0))
        : 'Todo al día',
      icon: AlertTriangle,
      variant: 'overdue' as const,
      highlight: overduePayments.length > 0,
      iconColor: 'text-overdue',
    },
    {
      filterKey: 'today' as QuickFilter,
      title: 'Hoy',
      value: todayPayments.length,
      subtitle: todayPayments.length > 0 
        ? formatCurrency(todayPayments.reduce((s, p) => s + p.amount, 0))
        : 'Sin pagos hoy',
      icon: CalendarCheck,
      variant: 'today' as const,
      highlight: todayPayments.length > 0,
      iconColor: 'text-primary',
    },
    {
      filterKey: 'week' as QuickFilter,
      title: 'Esta semana',
      value: weekPayments.length,
      subtitle: formatCurrency(weekPayments.reduce((s, p) => s + p.amount, 0)),
      icon: CalendarDays,
      variant: 'week' as const,
      highlight: false,
      iconColor: 'text-pending',
    },
    {
      filterKey: 'month' as QuickFilter,
      title: 'Este mes',
      value: monthPayments.length,
      subtitle: formatCurrency(totalDueThisMonth),
      icon: Calendar,
      variant: 'month' as const,
      highlight: false,
      iconColor: 'text-muted-foreground',
    },
  ];

  const fullWidthCards = [
    {
      filterKey: 'pending' as QuickFilter,
      title: 'Por pagar',
      value: formatCurrency(totalDueThisMonth),
      subtitle: `${monthPayments.length} pagos pendientes`,
      icon: TrendingUp,
      iconColor: 'text-pending',
    },
    {
      filterKey: 'paid_month' as QuickFilter,
      title: 'Pagado este mes',
      value: formatCurrency(paidThisMonth),
      subtitle: 'Total pagado',
      icon: CheckCircle,
      iconColor: 'text-paid',
    },
  ];

  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Hero amount cards — clean, minimal */}
        <div className="grid grid-cols-2 gap-3">
          {fullWidthCards.map((card) => {
            const isActive = activeFilter === card.filterKey;
            return (
              <div
                key={card.title}
                onClick={() => onCardClick?.(isActive ? null : card.filterKey)}
                className={`rounded-2xl bg-card p-4 cursor-pointer transition-all duration-200 select-none border border-border/50
                  ${isActive ? 'ring-2 ring-primary border-primary/30 shadow-md' : 'shadow-soft'}
                  active:scale-[0.98]
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
                  <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                <p className="text-lg font-bold font-display tracking-tight text-foreground leading-tight">
                  {card.value}
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">{card.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Horizontal slider for quick filter cards */}
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x snap-mandatory -mx-1 px-1"
        >
          {sliderCards.map((card) => {
            const isActive = activeFilter === card.filterKey;
            return (
              <div
                key={card.title}
                onClick={() => onCardClick?.(isActive ? null : card.filterKey)}
                className={`min-w-[120px] flex-shrink-0 snap-start rounded-xl bg-card px-3 py-2.5 cursor-pointer transition-all duration-200 select-none border border-border/50
                  ${isActive ? 'ring-2 ring-primary border-primary/30 shadow-md' : 'shadow-soft'}
                  ${card.highlight && !isActive ? 'border-overdue/30' : ''}
                  active:scale-[0.97]
                `}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <card.icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
                  <span className="text-[11px] font-medium text-muted-foreground">{card.title}</span>
                </div>
                <p className={`text-xl font-bold font-display tracking-tight ${
                  card.variant === 'overdue' && card.highlight ? 'text-overdue' : 'text-foreground'
                }`}>
                  {card.value}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">{card.subtitle}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop layout
  const allCards = [
    ...sliderCards.map(c => ({ ...c, isAmount: false })),
    ...fullWidthCards.map(c => ({ ...c, variant: 'month' as const, highlight: false, isAmount: true })),
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {allCards.map((card) => {
        const isActive = activeFilter === card.filterKey;
        return (
          <div
            key={card.title}
            onClick={() => onCardClick?.(isActive ? null : card.filterKey)}
            className={`rounded-2xl bg-card p-5 cursor-pointer transition-all duration-200 select-none border border-border/50
              ${isActive ? 'ring-2 ring-primary border-primary/30 shadow-md scale-[1.02]' : 'shadow-soft'}
              ${card.highlight && !isActive ? 'border-overdue/30' : ''}
              hover:shadow-card hover:scale-[1.01]
            `}
          >
            <div className="flex items-center gap-2 mb-3">
              <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
            </div>
            <p className={`text-2xl font-bold font-display tracking-tight ${
              card.variant === 'overdue' && card.highlight ? 'text-overdue' : 'text-foreground'
            }`}>
              {card.value}
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-1 truncate">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
