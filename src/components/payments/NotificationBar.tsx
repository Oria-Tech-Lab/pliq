import { useState, useMemo } from 'react';
import { Payment } from '@/types/payment';
import { differenceInDays, isToday, startOfDay } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';

interface Props {
  payments: Payment[];
}

export function NotificationBar({ payments }: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { primaryCurrency } = useCurrency();

  const alerts = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = payments.filter(p => {
      if (p.status === 'paid') return false;
      const due = startOfDay(new Date(p.dueDate));
      const diff = differenceInDays(due, today);
      return diff >= 0 && diff <= 5;
    });

    const dueToday = upcoming.filter(p => isToday(new Date(p.dueDate)));
    const dueSoon = upcoming.filter(p => !isToday(new Date(p.dueDate)));

    return { dueToday, dueSoon, total: upcoming.length };
  }, [payments]);

  const sumByCurrency = (list: Payment[]) =>
    list.reduce<Record<string, number>>((acc, p) => {
      const c = p.currency || primaryCurrency;
      acc[c] = (acc[c] || 0) + p.amount;
      return acc;
    }, {});

  const renderTotals = (map: Record<string, number>) => {
    const entries = Object.entries(map).filter(([, v]) => v > 0);
    if (entries.length === 0) return formatCurrency(0, primaryCurrency);
    return entries.map(([c, v]) => formatCurrency(v, c)).join(' · ');
  };

  const showToday = alerts.dueToday.length > 0 && !dismissed.has('today');
  const showSoon = alerts.dueSoon.length > 0 && !dismissed.has('soon');

  if (!showToday && !showSoon) return null;

  return (
    <div className="space-y-2">
      {showToday && (
        <div className="flex items-start gap-3 bg-overdue/10 border border-overdue/20 rounded-xl px-4 py-3 relative">
          <div className="w-8 h-8 rounded-lg bg-overdue/15 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-overdue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-overdue">
              {alerts.dueToday.length === 1
                ? `"${alerts.dueToday[0].name}" vence hoy`
                : `${alerts.dueToday.length} pagos vencen hoy`}
            </p>
            <p className="text-[11px] text-overdue/80 mt-0.5">
              Total: {renderTotals(sumByCurrency(alerts.dueToday))}
            </p>
            {alerts.dueToday.length <= 3 && alerts.dueToday.length > 1 && (
              <div className="mt-1.5 space-y-0.5">
                {alerts.dueToday.map(p => (
                  <p key={p.id} className="text-[10px] text-overdue/70">
                    • {p.name} — {formatCurrency(p.amount, p.currency || primaryCurrency)}
                  </p>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-overdue/50 hover:text-overdue hover:bg-overdue/10"
            onClick={() => setDismissed(prev => new Set(prev).add('today'))}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {showSoon && (
        <div className="flex items-start gap-3 bg-warning/10 border border-warning/20 rounded-xl px-4 py-3 relative">
          <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-warning-foreground">
              {alerts.dueSoon.length === 1
                ? `"${alerts.dueSoon[0].name}" vence ${format(new Date(alerts.dueSoon[0].dueDate), "EEEE d", { locale: es })}`
                : `${alerts.dueSoon.length} pagos vencen en los próximos 5 días`}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Total: {renderTotals(sumByCurrency(alerts.dueSoon))}
            </p>
            {alerts.dueSoon.length <= 3 && (
              <div className="mt-1.5 space-y-0.5">
                {alerts.dueSoon.map(p => {
                  const diff = differenceInDays(startOfDay(new Date(p.dueDate)), startOfDay(new Date()));
                  return (
                    <p key={p.id} className="text-[10px] text-muted-foreground">
                      • {p.name} — {formatCurrency(p.amount, p.currency || primaryCurrency)} · en {diff} día{diff > 1 ? 's' : ''}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 text-warning/50 hover:text-warning hover:bg-warning/10"
            onClick={() => setDismissed(prev => new Set(prev).add('soon'))}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
