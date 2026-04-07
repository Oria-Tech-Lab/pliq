import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  paidTotal: number;
  pendingTotal: number;
  overdueTotal: number;
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  formatCurrency: (n: number) => string;
}

export const SummaryReportCards = ({ paidTotal, pendingTotal, overdueTotal, paidCount, pendingCount, overdueCount, formatCurrency }: Props) => {
  const navigate = useNavigate();

  const cards = [
    {
      icon: TrendingUp,
      iconBg: 'bg-paid/10',
      iconColor: 'text-paid',
      total: paidTotal,
      label: 'Pagado',
      count: paidCount,
      filter: 'paid_month',
    },
    {
      icon: TrendingDown,
      iconBg: 'bg-pending/10',
      iconColor: 'text-pending',
      total: pendingTotal,
      label: 'Pendiente',
      count: pendingCount,
      filter: 'pending',
    },
    {
      icon: AlertTriangle,
      iconBg: 'bg-overdue/10',
      iconColor: 'text-overdue',
      total: overdueTotal,
      label: 'Vencido',
      count: overdueCount,
      filter: 'overdue',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {cards.map(card => (
        <button
          key={card.filter}
          onClick={() => navigate(`/?filter=${card.filter}`)}
          className="bg-card rounded-2xl border border-border/60 p-3 shadow-sm text-left transition-all active:scale-[0.97] hover:border-primary/30"
        >
          <div className={`w-7 h-7 rounded-lg ${card.iconBg} flex items-center justify-center mb-1.5`}>
            <card.icon className={`w-3.5 h-3.5 ${card.iconColor}`} />
          </div>
          <p className="text-base font-bold font-display tracking-tight text-foreground leading-tight">{formatCurrency(card.total)}</p>
          <p className="text-[10px] font-medium text-muted-foreground mt-0.5">{card.label}</p>
          <p className="text-[9px] text-muted-foreground/70 mt-0.5">{card.count} pagos</p>
        </button>
      ))}
    </div>
  );
};
