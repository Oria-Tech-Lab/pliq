import { Payment } from '@/types/payment';
import { isToday, isThisWeek, isThisMonth, startOfDay } from 'date-fns';
import { AlertTriangle, CalendarCheck, CalendarDays, Calendar, TrendingUp, CheckCircle } from 'lucide-react';

interface SummaryCardsProps {
  payments: Payment[];
}

export function SummaryCards({ payments }: SummaryCardsProps) {
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

  const cards = [
    {
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
      title: 'Esta semana',
      value: weekPayments.length,
      subtitle: formatCurrency(weekPayments.reduce((s, p) => s + p.amount, 0)),
      icon: CalendarDays,
      variant: 'week' as const,
      highlight: false,
      iconColor: 'text-pending',
    },
    {
      title: 'Este mes',
      value: monthPayments.length,
      subtitle: formatCurrency(totalDueThisMonth),
      icon: Calendar,
      variant: 'month' as const,
      highlight: false,
      iconColor: 'text-muted-foreground',
    },
    {
      title: 'Por pagar',
      value: formatCurrency(totalDueThisMonth),
      subtitle: `${monthPayments.length} pagos pendientes`,
      icon: TrendingUp,
      variant: 'month' as const,
      highlight: false,
      isAmount: true,
      iconColor: 'text-muted-foreground',
    },
    {
      title: 'Pagado este mes',
      value: formatCurrency(paidThisMonth),
      subtitle: 'Total pagado',
      icon: CheckCircle,
      variant: 'month' as const,
      highlight: false,
      isAmount: true,
      iconColor: 'text-paid',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`summary-card summary-card-${card.variant} ${card.highlight ? 'ring-1 ring-' + card.variant + '/30' : ''}`}
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
          <p className="text-[11px] text-muted-foreground/70 mt-1 truncate">
            {card.subtitle}
          </p>
        </div>
      ))}
    </div>
  );
}
