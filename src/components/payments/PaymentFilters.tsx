import { PaymentStatus, PaymentCategory, STATUS_LABELS } from '@/types/payment';
import { useCategoryLabels } from '@/hooks/useCategoryLabels';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { IconTooltip } from '@/components/ui/icon-tooltip';

interface PaymentFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: PaymentStatus | 'all';
  onStatusChange: (status: PaymentStatus | 'all') => void;
  categoryFilter: PaymentCategory | 'all';
  onCategoryChange: (category: PaymentCategory | 'all') => void;
}

export function PaymentFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
}: PaymentFiltersProps) {
  const allCategoryLabels = useCategoryLabels();
  const hasFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all';

  const clearFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onCategoryChange('all');
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar pagos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as PaymentStatus | 'all')}>
          <SelectTrigger className="flex-1 h-9 text-xs">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={(v) => onCategoryChange(v as PaymentCategory | 'all')}>
          <SelectTrigger className="flex-1 h-9 text-xs">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {Object.entries(allCategoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <IconTooltip label="Limpiar filtros">
            <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 h-9 w-9">
              <X className="w-4 h-4" />
            </Button>
          </IconTooltip>
        )}
      </div>
    </div>
  );
}
