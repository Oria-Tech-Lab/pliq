import { useMemo } from 'react';
import { Payment } from '@/types/payment';
import { differenceInDays, isToday, startOfDay } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, Clock, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  payments: Payment[];
}

export function NotificationBar({ payments }: Props) {
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

  if (alerts.total === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.dueToday.length > 0 && (
        <div className="flex items-center gap-3 bg-overdue/10 border border-overdue/20 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-overdue/15 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-overdue" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-overdue">
              {alerts.dueToday.length === 1
                ? `"${alerts.dueToday[0].name}" vence hoy`
                : `${alerts.dueToday.length} pagos vencen hoy`}
            </p>
            {alerts.dueToday.length === 1 && (
              <p className="text-[10px] text-overdue/70 mt-0.5">
                {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(alerts.dueToday[0].amount)}
              </p>
            )}
          </div>
        </div>
      )}

      {alerts.dueSoon.length > 0 && (
        <div className="flex items-center gap-3 bg-warning/10 border border-warning/20 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-warning-foreground">
              {alerts.dueSoon.length === 1
                ? `"${alerts.dueSoon[0].name}" vence ${format(new Date(alerts.dueSoon[0].dueDate), "EEEE d", { locale: es })}`
                : `${alerts.dueSoon.length} pagos vencen en los próximos 5 días`}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Total: {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
                alerts.dueSoon.reduce((s, p) => s + p.amount, 0)
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
