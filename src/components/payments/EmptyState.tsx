import { Receipt, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onAddPayment: () => void;
  hasFilters?: boolean;
}

export function EmptyState({ onAddPayment, hasFilters }: EmptyStateProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
          <Receipt className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg text-foreground mb-2">
          No se encontraron pagos
        </h3>
        <p className="text-muted-foreground max-w-sm text-sm">
          Intenta ajustar los filtros de búsqueda para encontrar lo que buscas.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Receipt className="w-10 h-10 text-primary" />
      </div>
      <h3 className="font-display font-bold text-xl text-foreground mb-2">
        Comienza a organizar tus pagos
      </h3>
      <p className="text-muted-foreground max-w-md mb-6 text-sm">
        Añade tus pagos recurrentes, suscripciones y deudas para nunca más olvidar una fecha de vencimiento.
      </p>
      <Button onClick={onAddPayment} size="lg" className="gap-2 rounded-xl shadow-sm">
        <Plus className="w-5 h-5" />
        Añadir primer pago
      </Button>
    </div>
  );
}
