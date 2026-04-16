import { Payment, Payee, FREQUENCY_LABELS, METHOD_LABELS } from '@/types/payment';
import { getCurrencySymbol } from '@/hooks/useUserPreferences';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { Button } from '@/components/ui/button';
import { IconTooltip } from '@/components/ui/icon-tooltip';
import { format, differenceInDays, startOfDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, RotateCcw, Pencil, Trash2, Calendar, User, Wallet, Repeat, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PaymentCardProps {
  payment: Payment;
  payees?: Payee[];
  onMarkAsPaid: (id: string) => void;
  onMarkAsPending: (id: string) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
}

function getDueAlert(payment: Payment): { label: string; variant: 'today' | 'soon' } | null {
  if (payment.status === 'paid') return null;
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(payment.dueDate));
  const diff = differenceInDays(due, today);
  if (diff < 0) return null; // overdue handled by status
  if (diff === 0) return { label: 'Vence hoy', variant: 'today' };
  if (diff <= 5) return { label: `Vence en ${diff} día${diff > 1 ? 's' : ''}`, variant: 'soon' };
  return null;
}

export function PaymentCard({ payment, payees = [], onMarkAsPaid, onMarkAsPending, onEdit, onDelete }: PaymentCardProps) {
  const formattedDate = format(new Date(payment.dueDate), "d 'de' MMMM", { locale: es });
  const formattedAmount = (() => {
    const sym = getCurrencySymbol(payment.currency || 'PEN');
    return `${sym} ${payment.amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  })();

  const payee = payees.find(p => p.id === payment.payeeId);
  const payeeName = payee?.name || payment.payTo;
  const isPaid = payment.status === 'paid';
  const isOverdue = payment.status === 'overdue';
  const dueAlert = getDueAlert(payment);

  return (
    <div className={cn(
      'bg-card rounded-2xl border border-border/60 p-4 shadow-sm group relative overflow-hidden transition-all',
      isOverdue && 'border-l-[3px] border-l-overdue',
      isPaid && 'border-l-[3px] border-l-paid',
      !isPaid && !isOverdue && 'border-l-[3px] border-l-primary/30',
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={cn(
              "font-semibold text-sm text-foreground",
              isPaid && 'line-through text-muted-foreground'
            )}>
              {payment.name}
            </h3>
            <CategoryBadge category={payment.category} />
            <StatusBadge status={payment.status} />
          </div>

          {/* Due alert badge */}
          {dueAlert && (
            <div className={cn(
              'inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-md text-[10px] font-semibold',
              dueAlert.variant === 'today'
                ? 'bg-overdue/10 text-overdue'
                : 'bg-warning/10 text-warning-foreground'
            )}>
              {dueAlert.variant === 'today'
                ? <AlertTriangle className="w-3 h-3" />
                : <Clock className="w-3 h-3" />}
              {dueAlert.label}
            </div>
          )}

          <div className="flex items-center gap-3 mt-2 text-[12px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3 text-muted-foreground/70" />
              {formattedDate}
            </span>
            {payee ? (
              <Link
                to={`/payee/${payee.id}`}
                className="inline-flex items-center gap-1 hover:text-primary transition-colors underline-offset-2 hover:underline"
              >
                <User className="w-3 h-3 text-muted-foreground/70" />
                {payeeName}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3 text-muted-foreground/70" />
                {payeeName}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Wallet className="w-3 h-3 text-muted-foreground/70" />
              {METHOD_LABELS[payment.paymentMethod]}
            </span>
          </div>

          {payment.frequency !== 'once' && (
            <span className="inline-flex items-center gap-1 mt-2 text-[10px] text-primary bg-primary/8 px-2 py-0.5 rounded-md font-medium">
              <Repeat className="w-3 h-3" />
              {FREQUENCY_LABELS[payment.frequency]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right">
            <p className={cn(
              "font-bold text-base tracking-tight tabular-nums",
              isPaid ? 'text-muted-foreground' : isOverdue ? 'text-overdue' : 'text-foreground'
            )}>
              {formattedAmount}
            </p>
          </div>

          <div className="flex items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
            {!isPaid ? (
              <IconTooltip label="Marcar como pagado">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-paid hover:text-paid hover:bg-paid/10"
                  onClick={() => onMarkAsPaid(payment.id)}
                >
                  <Check className="w-4 h-4" />
                </Button>
              </IconTooltip>
            ) : (
              <IconTooltip label="Marcar como pendiente">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => onMarkAsPending(payment.id)}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </IconTooltip>
            )}
            <IconTooltip label="Editar">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(payment)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
            </IconTooltip>
            <IconTooltip label="Eliminar">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(payment.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </IconTooltip>
          </div>
        </div>
      </div>

      {payment.notes && (
        <p className="mt-3 text-[11px] text-muted-foreground border-t border-border/40 pt-2 italic">
          {payment.notes}
        </p>
      )}
    </div>
  );
}
