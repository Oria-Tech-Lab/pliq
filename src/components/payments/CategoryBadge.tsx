import { PaymentCategory, CATEGORY_LABELS } from '@/types/payment';
import { cn } from '@/lib/utils';
import { Zap, CreditCard, RefreshCw, User, MoreHorizontal } from 'lucide-react';

interface CategoryBadgeProps {
  category: PaymentCategory;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const icons = {
    services: Zap,
    debts: CreditCard,
    subscriptions: RefreshCw,
    personal: User,
    other: MoreHorizontal,
  };

  const Icon = icons[category];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground',
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {CATEGORY_LABELS[category]}
    </span>
  );
}
