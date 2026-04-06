import { useRef } from 'react';
import { Payment, QuickFilter } from '@/types/payment';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { AlertTriangle, CalendarCheck, CalendarDays, Calendar, TrendingUp, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
      variant: 'week' as const,
      iconColor: 'text-pending',
      gradientFrom: 'from-pending/10',
      gradientTo: 'to-transparent',
    },
    {
      filterKey: 'paid_month' as QuickFilter,
      title: 'Pagado este mes',
      value: formatCurrency(paidThisMonth),
      subtitle: 'Total pagado',
      icon: CheckCircle,
      variant: 'today' as const,
      iconColor: 'text-paid',
      gradientFrom: 'from-paid/10',
      gradientTo: 'to-transparent',
    },
  ];

  const renderCard = (card: typeof sliderCards[0], compact = false) => {
    const isActive = activeFilter === card.filterKey;
    return (
      <div
        key={card.title}
        onClick={() => onCardClick?.(isActive ? null : card.filterKey)}
        className={`summary-card summary-card-${card.variant} cursor-pointer transition-all duration-200 select-none
          ${compact ? 'min-w-[140px] flex-shrink-0' : ''}
          ${isActive ? 'ring-2 ring-primary shadow-md scale-[1.02]' : ''}
          ${card.highlight && !isActive ? 'ring-1 ring-overdue/30' : ''}
          hover:shadow-md hover:scale-[1.01]
        `}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
            <card.icon className={`w-4 h-4 ${card.iconColor}`} />
          </div>
        </div>
        <p className={`text-2xl font-bold font-display tracking-tight ${
          card.variant === 'overdue' && card.highlight ? 'text-overdue' : 'text-foreground'
        }`}>
          {card.value}
        </p>
        <p className="text-xs font-medium text-muted-foreground mt-0.5">{card.title}</p>
        <p className="text-[11px] text-muted-foreground/70 mt-1 truncate">{card.subtitle}</p>
      </div>
    );
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' });
    }
  };

  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Full-width summary cards */}
        <div className="grid grid-cols-2 gap-3">
          {fullWidthCards.map((card) => {
            const isActive = activeFilter === card.filterKey;
            return (
              <div
                key={card.title}
                onClick={() => onCardClick?.(isActive ? null : card.filterKey)}
                className={`summary-card summary-card-${card.variant} cursor-pointer transition-all duration-200 select-none
                  ${isActive ? 'ring-2 ring-primary shadow-md scale-[1.02]' : ''}
                  hover:shadow-md hover:scale-[1.01]
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                    <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                  </div>
                </div>
                <p className="text-xl font-bold font-display tracking-tight text-foreground leading-tight">
                  {card.value}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-0.5">{card.title}</p>
                <p className="text-[11px] text-muted-foreground/70 mt-1">{card.subtitle}</p>
              </div>
            );
          })}
        </div>

        {/* Horizontal slider for quick filter cards */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {sliderCards.map((card) => renderCard(card, true))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop: grid layout as before
  const allCards = [...sliderCards, ...fullWidthCards.map(c => ({ ...c, highlight: false }))];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {allCards.map((card) => {
        const isActive = activeFilter === card.filterKey;
        return (
          <div
            key={card.title}
            onClick={() => onCardClick?.(isActive ? null : card.filterKey)}
            className={`summary-card summary-card-${card.variant} cursor-pointer transition-all duration-200 select-none
              ${isActive ? 'ring-2 ring-primary shadow-md scale-[1.02]' : ''}
              ${'highlight' in card && card.highlight && !isActive ? 'ring-1 ring-overdue/30' : ''}
              hover:shadow-md hover:scale-[1.01]
            `}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-muted/60 flex items-center justify-center">
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold font-display tracking-tight ${
              card.variant === 'overdue' && 'highlight' in card && card.highlight ? 'text-overdue' : 'text-foreground'
            }`}>
              {card.value}
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">{card.title}</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1 truncate">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
