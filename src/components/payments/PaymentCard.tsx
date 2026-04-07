import { Payment, Payee, FREQUENCY_LABELS, METHOD_LABELS } from '@/types/payment';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { Button } from '@/components/ui/button';
import { IconTooltip } from '@/components/ui/icon-tooltip';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, RotateCcw, Pencil, Trash2, Calendar, User, Wallet, Repeat } from 'lucide-react';
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

export function PaymentCard({ payment, payees = [], onMarkAsPaid, onMarkAsPending, onEdit, onDelete }: PaymentCardProps) {
  const formattedDate = format(new Date(payment.dueDate), "d 'de' MMMM", { locale: es });
  const formattedAmount = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(payment.amount);

  const payee = payees.find(p => p.id === payment.payeeId);
  const payeeName = payee?.name || payment.payTo;
  const isPaid = payment.status === 'paid';
  const isOverdue = payment.status === 'overdue';

  return (
    <div className={cn(
      'payment-row group animate-fade-in relative overflow-hidden',
      isOverdue && 'border-l-[3px] border-l-overdue',
      isPaid && 'border-l-[3px] border-l-paid',
    )}>
      <div className={cn(
        'absolute top-0 left-0 right-0 h-[2px]',
        isPaid && 'bg-paid/30',
        isOverdue && 'bg-overdue/30',
        !isPaid && !isOverdue && 'bg-primary/10',
      )} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className={cn(
              "font-semibold text-[15px] text-foreground",
              isPaid && 'line-through text-muted-foreground'
            )}>
              {payment.name}
            </h3>
            <CategoryBadge category={payment.category} />
            <StatusBadge status={payment.status} />
          </div>

          <div className="flex items-center gap-4 mt-2.5 text-[13px] text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
              {formattedDate}
            </span>
            {payee ? (
              <Link
                to={`/payee/${payee.id}`}
                className="inline-flex items-center gap-1.5 hover:text-primary transition-colors underline-offset-2 hover:underline"
              >
                <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                {payeeName}
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                {payeeName}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-muted-foreground/70" />
              {METHOD_LABELS[payment.paymentMethod]}
            </span>
          </div>

          {payment.frequency !== 'once' && (
            <span className="inline-flex items-center gap-1 mt-2.5 text-[11px] text-primary bg-primary/8 px-2.5 py-1 rounded-lg font-medium">
              <Repeat className="w-3 h-3" />
              {FREQUENCY_LABELS[payment.frequency]}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 sm:gap-5">
          <div className="text-right">
            <p className={cn(
              "font-bold text-lg tracking-tight tabular-nums",
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
        <p className="mt-3 text-[13px] text-muted-foreground border-t border-border/40 pt-3 italic">
          {payment.notes}
        </p>
      )}
    </div>
  );
}
