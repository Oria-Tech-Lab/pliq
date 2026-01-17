import { Button } from '@/components/ui/button';
import { Plus, Receipt } from 'lucide-react';

interface HeaderProps {
  onAddPayment: () => void;
}

export function Header({ onAddPayment }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-foreground leading-none">
              MisPagos
            </h1>
            <p className="text-xs text-muted-foreground">
              Organiza tu vida financiera
            </p>
          </div>
        </div>

        <Button onClick={onAddPayment} className="gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo pago</span>
        </Button>
      </div>
    </header>
  );
}
