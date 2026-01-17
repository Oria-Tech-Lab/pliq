import { PaymentStatus, STATUS_LABELS } from '@/types/payment';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const icons = {
    pending: Clock,
    paid: CheckCircle2,
    overdue: AlertCircle,
  };

  const Icon = icons[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        status === 'pending' && 'status-badge-pending',
        status === 'paid' && 'status-badge-paid',
        status === 'overdue' && 'status-badge-overdue',
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {STATUS_LABELS[status]}
    </span>
  );
}
