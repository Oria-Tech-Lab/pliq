import { Button } from '@/components/ui/button';
import { Plus, Receipt, CalendarDays, List } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onAddPayment: () => void;
}

export function Header({ onAddPayment }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
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
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-9 w-9',
                location.pathname === '/' && 'bg-muted text-foreground'
              )}
              title="Lista"
            >
              <List className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/calendario">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-9 w-9',
                location.pathname === '/calendario' && 'bg-muted text-foreground'
              )}
              title="Calendario"
            >
              <CalendarDays className="w-4 h-4" />
            </Button>
          </Link>
          <Button onClick={onAddPayment} className="gap-2 ml-1">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo pago</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
