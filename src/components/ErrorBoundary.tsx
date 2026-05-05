import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App render error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 text-center space-y-4 shadow-sm">
            <div className="space-y-2">
              <h1 className="font-display text-xl font-bold">Hubo un problema al cargar Pliq</h1>
              <p className="text-sm text-muted-foreground">
                Recuperamos la app para evitar una pantalla en blanco. Puedes recargar para continuar.
              </p>
            </div>
            <Button onClick={this.handleReload} className="w-full">
              Recargar
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}