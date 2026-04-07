import { PaymentCategory } from '@/types/payment';
import { useCategoryLabels } from '@/hooks/useCategoryLabels';
import { cn } from '@/lib/utils';
import { Zap, CreditCard, RefreshCw, User, MoreHorizontal } from 'lucide-react';

interface CategoryBadgeProps {
  category: PaymentCategory | string;
  className?: string;
}

const icons: Record<string, typeof Zap> = {
  services: Zap,
  debts: CreditCard,
  subscriptions: RefreshCw,
  personal: User,
  other: MoreHorizontal,
};

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const allLabels = useCategoryLabels();
  const Icon = icons[category] || MoreHorizontal;
  const label = allLabels[category] || category;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-muted/70 text-muted-foreground',
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
