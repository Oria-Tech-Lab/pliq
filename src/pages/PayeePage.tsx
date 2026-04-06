import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePayments } from '@/hooks/usePayments';
import { usePayees } from '@/hooks/usePayees';
import { PaymentCard } from '@/components/payments/PaymentCard';
import { StatusBadge } from '@/components/payments/StatusBadge';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { PaymentStatus } from '@/types/payment';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

const PayeePage = () => {
  const { id } = useParams<{ id: string }>();
  const { payments, addPayment, updatePayment, updatePaymentPayeeId, deletePayment, markAsPaid, markAsPending } = usePayments();
  const { payees, addPayee, getPayeeById } = usePayees(payments, updatePaymentPayeeId);

  const payee = id ? getPayeeById(id) : undefined;

  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  const payeePayments = useMemo(() => {
    return payments
      .filter(p => p.payeeId === id)
      .filter(p => statusFilter === 'all' || p.status === statusFilter)
      .sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (b.status === 'overdue' && a.status !== 'overdue') return 1;
        if (a.status === 'paid' && b.status !== 'paid') return 1;
        if (b.status === 'paid' && a.status !== 'paid') return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
  }, [payments, id, statusFilter]);

  const allPayeePayments = useMemo(() => payments.filter(p => p.payeeId === id), [payments, id]);

  const stats = useMemo(() => {
    const total = allPayeePayments.length;
    const paid = allPayeePayments.filter(p => p.status === 'paid');
    const pending = allPayeePayments.filter(p => p.status === 'pending');
    const overdue = allPayeePayments.filter(p => p.status === 'overdue');
    const totalPaid = paid.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = [...pending, ...overdue].reduce((sum, p) => sum + p.amount, 0);
    return { total, paidCount: paid.length, pendingCount: pending.length, overdueCount: overdue.length, totalPaid, totalPending };
  }, [allPayeePayments]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const handleMarkAsPaid = (paymentId: string) => {
    markAsPaid(paymentId);
    toast.success('Marcado como pagado');
  };

  const handleDeletePayment = () => {
    if (deletingPaymentId) {
      deletePayment(deletingPaymentId);
      toast.success('Pago eliminado');
      setDeletingPaymentId(null);
    }
  };

  const handleFormSubmit = (data: any) => {
    if (editingPayment) {
      updatePayment(editingPayment.id, data);
      toast.success('Pago actualizado');
    } else {
      addPayment(data);
      toast.success('Pago creado');
    }
  };

  if (!payee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Receptor no encontrado</p>
          <Link to="/">
            <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" /> Volver</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center gap-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground">{payee.name}</h1>
            <p className="text-sm text-muted-foreground">{stats.total} {stats.total === 1 ? 'pago' : 'pagos'} registrados</p>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
          <div className="rounded-xl border bg-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 text-paid" />
              Total pagado
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-xs text-muted-foreground">{stats.paidCount} pagos</p>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 text-pending" />
              Por pagar
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalPending)}</p>
            <p className="text-xs text-muted-foreground">{stats.pendingCount} pendientes</p>
          </div>
          <div className="rounded-xl border bg-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="w-4 h-4 text-overdue" />
              Vencidos
            </div>
            <p className="text-2xl font-bold text-foreground">{stats.overdueCount}</p>
            <p className="text-xs text-muted-foreground">pagos vencidos</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {(['all', 'pending', 'paid', 'overdue'] as const).map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'Todos' : <StatusBadge status={status} />}
            </Button>
          ))}
        </div>

        {/* Payment list */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {payeePayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No hay pagos {statusFilter !== 'all' ? 'con este filtro' : 'registrados'}
            </div>
          ) : (
            payeePayments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                payees={payees}
                onMarkAsPaid={handleMarkAsPaid}
                onMarkAsPending={markAsPending}
                onEdit={(p) => { setEditingPayment(p); setFormOpen(true); }}
                onDelete={(id) => setDeletingPaymentId(id)}
              />
            ))
          )}
        </div>
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
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
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

export default PayeePage;
