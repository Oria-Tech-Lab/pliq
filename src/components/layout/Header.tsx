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
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/60">
      <div className="container flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[hsl(232_80%_62%)] flex items-center justify-center shadow-sm">
              <Receipt className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg text-foreground leading-none tracking-tight">
                MisPagos
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Organiza tu vida financiera
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center bg-muted/60 rounded-xl p-1 mr-2">
            <Link to="/">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-lg transition-all',
                  location.pathname === '/' && 'bg-card shadow-sm text-foreground'
                )}
              >
                <List className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/calendario">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 rounded-lg transition-all',
                  location.pathname === '/calendario' && 'bg-card shadow-sm text-foreground'
                )}
              >
                <CalendarDays className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <Button onClick={onAddPayment} className="gap-2 rounded-xl shadow-sm bg-primary hover:bg-primary/90 h-9 px-4">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">Nuevo pago</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
