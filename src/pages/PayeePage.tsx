import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePayments } from '@/hooks/usePayments';
import { usePayees } from '@/hooks/usePayees';
import { PaymentCard } from '@/components/payments/PaymentCard';
import { StatusBadge } from '@/components/payments/StatusBadge';
import { PaymentForm } from '@/components/payments/PaymentForm';
import { ArrowLeft, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
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
            <Button variant="outline" className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" /> Volver</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AppLayout title={payee.name}>
      <div className="container py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up">
          <div className="rounded-2xl bg-card p-5 space-y-2" style={{ boxShadow: '0 1px 3px 0 hsl(220 25% 14% / 0.04)' }}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-xl bg-paid/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-paid" />
              </div>
              Total pagado
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-xs text-muted-foreground">{stats.paidCount} pagos</p>
          </div>
          <div className="rounded-2xl bg-card p-5 space-y-2" style={{ boxShadow: '0 1px 3px 0 hsl(220 25% 14% / 0.04)' }}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-xl bg-pending/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-pending" />
              </div>
              Por pagar
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{formatCurrency(stats.totalPending)}</p>
            <p className="text-xs text-muted-foreground">{stats.pendingCount} pendientes</p>
          </div>
          <div className="rounded-2xl bg-card p-5 space-y-2" style={{ boxShadow: '0 1px 3px 0 hsl(220 25% 14% / 0.04)' }}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-xl bg-overdue/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-overdue" />
              </div>
              Vencidos
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{stats.overdueCount}</p>
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
              className="rounded-xl"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'all' ? 'Todos' : <StatusBadge status={status} />}
            </Button>
          ))}
        </div>

        {/* Payment list */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {payeePayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
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
      </div>

      <PaymentForm open={formOpen} onOpenChange={setFormOpen} payment={editingPayment} payees={payees} onAddPayee={addPayee} onSubmit={handleFormSubmit} />

      <AlertDialog open={!!deletingPaymentId} onOpenChange={(open) => !open && setDeletingPaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este pago?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
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

export default PayeePage;
