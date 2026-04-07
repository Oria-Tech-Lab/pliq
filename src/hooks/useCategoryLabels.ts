import { useMemo } from 'react';
import { CATEGORY_LABELS } from '@/types/payment';
import { useCustomCategories } from '@/hooks/useCustomCategories';

export function useCategoryLabels(): Record<string, string> {
  const { categories } = useCustomCategories();
  return useMemo(() => ({
    ...CATEGORY_LABELS,
    ...Object.fromEntries(categories.map(c => [c.id, c.name])),
  }), [categories]);
}
