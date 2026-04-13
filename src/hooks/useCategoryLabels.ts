import { useMemo } from 'react';
import { useCustomCategories } from '@/hooks/useCustomCategories';

export function useCategoryLabels(): Record<string, string> {
  const { categories } = useCustomCategories();
  return useMemo(() => 
    Object.fromEntries(categories.map(c => [c.id, c.name])),
  [categories]);
}
