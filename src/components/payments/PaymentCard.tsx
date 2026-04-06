import { Payment, Payee, FREQUENCY_LABELS, METHOD_LABELS } from '@/types/payment';
import { StatusBadge } from './StatusBadge';
import { CategoryBadge } from './CategoryBadge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, RotateCcw, Pencil, Trash2, Calendar, User, Wallet } from 'lucide-react';
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

  return (
    <div className={cn(
      'payment-row group animate-fade-in',
      payment.status === 'overdue' && 'border-l-[3px] border-l-overdue',
      payment.status === 'paid' && 'border-l-[3px] border-l-paid opacity-70',
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={cn(
                  "font-semibold text-foreground truncate",
                  payment.status === 'paid' && 'line-through text-muted-foreground'
                )}>
                  {payment.name}
                </h3>
                <CategoryBadge category={payment.category} />
              </div>
              
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {formattedDate}
                </span>
                {payee ? (
                  <Link
                    to={`/payee/${payee.id}`}
                    className="inline-flex items-center gap-1.5 hover:text-primary transition-colors underline-offset-2 hover:underline"
                  >
                    <User className="w-3.5 h-3.5" />
                    {payeeName}
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {payeeName}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  {METHOD_LABELS[payment.paymentMethod]}
                </span>
              </div>

              {payment.frequency !== 'once' && (
                <span className="inline-block mt-2 text-[11px] text-muted-foreground bg-muted/70 px-2 py-0.5 rounded-md font-medium">
                  {FREQUENCY_LABELS[payment.frequency]}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <p className={cn(
              "font-bold text-lg tracking-tight",
              payment.status === 'paid' ? 'text-muted-foreground' : 'text-foreground'
            )}>
              {formattedAmount}
            </p>
            <StatusBadge status={payment.status} className="mt-1" />
          </div>

          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {payment.status !== 'paid' ? (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-paid hover:text-paid hover:bg-paid/10"
                onClick={() => onMarkAsPaid(payment.id)}
                title="Marcar como pagado"
              >
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => onMarkAsPending(payment.id)}
                title="Marcar como pendiente"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(payment)}
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(payment.id)}
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {payment.notes && (
        <p className="mt-3 text-sm text-muted-foreground border-t border-border/60 pt-3">
          {payment.notes}
        </p>
      )}
    </div>
  );
}
