import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
  onAddPayment?: () => void;
  title?: string;
  backTo?: string;
}

export function AppLayout({ children, onAddPayment, title, backTo }: AppLayoutProps) {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-40 h-14 flex items-center justify-between px-4 bg-card/80 backdrop-blur-xl border-b border-border/40">
            <div className="flex items-center gap-3">
              {backTo ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  onClick={() => navigate(backTo)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              ) : (
                <SidebarTrigger className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors [&_svg]:w-5 [&_svg]:h-5" />
              )}
              {title && (
                <h1 className="font-display font-bold text-lg text-foreground">{title}</h1>
              )}
            </div>

            {onAddPayment && (
              <Button
                onClick={onAddPayment}
                size="sm"
                className="gap-1.5 rounded-xl shadow-sm bg-primary hover:bg-primary/90 h-9 px-4"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Nuevo pago</span>
              </Button>
            )}
          </header>

          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
