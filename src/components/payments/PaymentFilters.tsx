import { PaymentStatus, PaymentCategory, CATEGORY_LABELS, STATUS_LABELS } from '@/types/payment';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

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
  const hasFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all';

  const clearFilters = () => {
    onSearchChange('');
    onStatusChange('all');
    onCategoryChange('all');
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </div>

      <Select value={statusFilter} onValueChange={(v) => onStatusChange(v as PaymentStatus | 'all')}>
        <SelectTrigger className="w-[110px] h-9 text-xs shrink-0">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Estado</SelectItem>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={categoryFilter} onValueChange={(v) => onCategoryChange(v as PaymentCategory | 'all')}>
        <SelectTrigger className="w-[110px] h-9 text-xs shrink-0">
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Categoría</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 h-9 w-9">
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
