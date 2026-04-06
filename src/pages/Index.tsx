import { useState, useMemo } from 'react';
import { Payment, PaymentStatus, PaymentCategory, QuickFilter } from '@/types/payment';
import { usePayments } from '@/hooks/usePayments';
import { usePayees } from '@/hooks/usePayees';
import { AppLayout } from '@/components/layout/AppLayout';
import { SummaryCards } from '@/components/payments/SummaryCards';
import { PaymentFilters } from '@/components/payments/PaymentFilters';
import { PaymentList } from '@/components/payments/PaymentList';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const QUICK_FILTER_TITLES: Record<NonNullable<QuickFilter>, string> = {
  overdue: 'Pagos vencidos',
  today: 'Pagos de hoy',
  week: 'Pagos de esta semana',
  month: 'Pagos de este mes',
  pending: 'Por pagar este mes',
  paid_month: 'Pagados este mes',
};

const Index = () => {
  const { payments, isLoading, addPayment, updatePayment, updatePaymentPayeeId, deletePayment, markAsPaid, markAsPending } = usePayments();
  const { payees, addPayee } = usePayees(payments, updatePaymentPayeeId);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<PaymentCategory | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(null);

  const quickFilteredPayments = useMemo(() => {
    if (!quickFilter) return payments;
    switch (quickFilter) {
      case 'overdue': return payments.filter(p => p.status === 'overdue');
      case 'today': return payments.filter(p => p.status !== 'paid' && isToday(new Date(p.dueDate)));
      case 'week': return payments.filter(p => p.status !== 'paid' && isThisWeek(new Date(p.dueDate), { weekStartsOn: 1 }));
      case 'month': return payments.filter(p => p.status !== 'paid' && isThisMonth(new Date(p.dueDate)));
      case 'pending': return payments.filter(p => p.status !== 'paid' && isThisMonth(new Date(p.dueDate)));
      case 'paid_month': return payments.filter(p => p.status === 'paid' && p.paidDate && isThisMonth(new Date(p.paidDate)));
      default: return payments;
    }
  }, [payments, quickFilter]);

  const sectionTitle = quickFilter ? QUICK_FILTER_TITLES[quickFilter] : 'Todos los pagos';
  const displayCount = quickFilter ? quickFilteredPayments.length : payments.length;

  const handleAddPayment = () => { setEditingPayment(null); setFormOpen(true); };
  const handleEditPayment = (payment: Payment) => { setEditingPayment(payment); setFormOpen(true); };

  const handleFormSubmit = (data: Omit<Payment, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    if (editingPayment) {
      updatePayment(editingPayment.id, data);
      toast.success('Pago actualizado', { description: data.name });
    } else {
      addPayment(data);
      toast.success('Pago creado', { description: data.name });
    }
  };

  const handleMarkAsPaid = (id: string) => {
    markAsPaid(id);
    const payment = payments.find(p => p.id === id);
    toast.success('Marcado como pagado', { 
      description: payment?.name,
      action: { label: 'Deshacer', onClick: () => markAsPending(id) },
    });
  };

  const handleDeletePayment = () => {
    if (deletingPaymentId) {
      const payment = payments.find(p => p.id === deletingPaymentId);
      deletePayment(deletingPaymentId);
      toast.success('Pago eliminado', { description: payment?.name });
      setDeletingPaymentId(null);
    }
  };

  const handleQuickFilter = (filter: QuickFilter) => {
    setQuickFilter(filter);
    if (filter) { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); }
  };

  if (isLoading) {
    return (
      <AppLayout title="Inicio">
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout onAddPayment={handleAddPayment} title="Inicio">
      <div className="container py-6 space-y-6">
        <section className="animate-slide-up">
          <SummaryCards payments={payments} activeFilter={quickFilter} onCardClick={handleQuickFilter} />
        </section>

        <section className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-xl text-foreground">{sectionTitle}</h2>
              {quickFilter && (
                <Button variant="ghost" size="sm" onClick={() => setQuickFilter(null)} className="h-7 px-2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5 mr-1" /> Limpiar
                </Button>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {displayCount} {displayCount === 1 ? 'pago' : 'pagos'}
            </span>
          </div>

          <PaymentFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} statusFilter={statusFilter} onStatusChange={setStatusFilter} categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter} />

          <PaymentList payments={quickFilteredPayments} payees={payees} searchQuery={searchQuery} statusFilter={statusFilter} categoryFilter={categoryFilter} onMarkAsPaid={handleMarkAsPaid} onMarkAsPending={markAsPending} onEdit={handleEditPayment} onDelete={(id) => setDeletingPaymentId(id)} onAddPayment={handleAddPayment} />
        </section>
      </div>

      <PaymentForm open={formOpen} onOpenChange={setFormOpen} payment={editingPayment} payees={payees} onAddPayee={addPayee} onSubmit={handleFormSubmit} />

      <AlertDialog open={!!deletingPaymentId} onOpenChange={(open) => !open && setDeletingPaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este pago?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer. El pago será eliminado permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="bottom-right" />
    </AppLayout>
  );
};

export default Index;
