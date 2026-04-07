import { RefreshCw } from 'lucide-react';
import { PaymentPlan } from '@/types/paymentPlan';

interface Props {
  plans: PaymentPlan[];
  formatCurrency: (n: number) => string;
}

export const RecurringSummary = ({ plans, formatCurrency }: Props) => {
  const recurringPlans = plans.filter(p => p.type === 'recurring');

  if (recurringPlans.length === 0) return null;

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <RefreshCw className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm text-foreground">Pagos recurrentes</h3>
      </div>

      <div className="space-y-3">
        {recurringPlans.map(plan => {
          const totalAmount = plan.instances.reduce((s, i) => s + i.amount, 0);
          const paidAmount = plan.instances.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
          const pendingAmount = totalAmount - paidAmount;
          const paidPct = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
          const paidCount = plan.instances.filter(i => i.status === 'paid').length;
          const totalCount = plan.instances.length;

          return (
            <div key={plan.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-foreground truncate block">{plan.name}</span>
                  <span className="text-[10px] text-muted-foreground">{paidCount}/{totalCount} cuotas</span>
                </div>
                <span className="text-sm tabular-nums text-foreground font-medium shrink-0">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                {paidPct > 0 && <div className="h-full bg-paid transition-all" style={{ width: `${paidPct}%` }} />}
                {paidPct < 100 && <div className="h-full bg-pending transition-all" style={{ width: `${100 - paidPct}%` }} />}
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-paid inline-block" />
                  {formatCurrency(paidAmount)}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-pending inline-block" />
                  {formatCurrency(pendingAmount)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
