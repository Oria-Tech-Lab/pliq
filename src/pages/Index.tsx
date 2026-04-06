import { useState } from 'react';
import { Payment, PaymentStatus, PaymentCategory } from '@/types/payment';
import { usePayments } from '@/hooks/usePayments';
import { usePayees } from '@/hooks/usePayees';
import { Header } from '@/components/layout/Header';
import { SummaryCards } from '@/components/payments/SummaryCards';
import { PaymentFilters } from '@/components/payments/PaymentFilters';
import { PaymentList } from '@/components/payments/PaymentList';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

const Index = () => {
  const { payments, isLoading, addPayment, updatePayment, updatePaymentPayeeId, deletePayment, markAsPaid, markAsPending } = usePayments();
  const { payees, addPayee } = usePayees(payments, updatePaymentPayeeId);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<PaymentCategory | 'all'>('all');

  const handleAddPayment = () => {
    setEditingPayment(null);
    setFormOpen(true);
  };

  const handleEditPayment = (payment: Payment) => {
    setEditingPayment(payment);
    setFormOpen(true);
  };

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
      action: {
        label: 'Deshacer',
        onClick: () => markAsPending(id),
      },
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onAddPayment={handleAddPayment} />
      
      <main className="container py-6 space-y-6">
        <section className="animate-slide-up">
          <SummaryCards payments={payments} />
        </section>

        <section className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-xl text-foreground">
              Todos los pagos
            </h2>
            <span className="text-sm text-muted-foreground">
              {payments.length} {payments.length === 1 ? 'pago' : 'pagos'}
            </span>
          </div>

          <PaymentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
          />

          <PaymentList
            payments={payments}
            payees={payees}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            onMarkAsPaid={handleMarkAsPaid}
            onMarkAsPending={markAsPending}
            onEdit={handleEditPayment}
            onDelete={(id) => setDeletingPaymentId(id)}
            onAddPayment={handleAddPayment}
          />
        </section>
      </main>

      <PaymentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        payment={editingPayment}
        payees={payees}
        onAddPayee={addPayee}
        onSubmit={handleFormSubmit}
      />

      <AlertDialog open={!!deletingPaymentId} onOpenChange={(open) => !open && setDeletingPaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este pago?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pago será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster position="bottom-right" />
    </div>
  );
};

export default Index;
