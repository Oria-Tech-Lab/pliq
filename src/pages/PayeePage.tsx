import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { usePayees } from '@/hooks/usePayees';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Clock, AlertTriangle, Calendar, Repeat, FileText, Wallet } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FREQUENCY_LABELS, METHOD_LABELS, CATEGORY_LABELS } from '@/types/payment';
import { CategoryBadge } from '@/components/payments/CategoryBadge';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PayeePage = () => {
  const { id } = useParams<{ id: string }>();
  const { plans } = usePaymentPlans();
  const { payees, getPayeeById } = usePayees([], () => {});
  const { categories } = useCustomCategories();

  const payee = id ? getPayeeById(id) : undefined;

  const payeePlans = useMemo(() => {
    return plans.filter(p => p.payeeId === id);
  }, [plans, id]);

  const stats = useMemo(() => {
    const allInstances = payeePlans.flatMap(p => p.instances);
    const paid = allInstances.filter(i => i.status === 'paid');
    const pending = allInstances.filter(i => i.status === 'pending');
    const overdue = allInstances.filter(i => i.status === 'overdue');
    const totalPaid = paid.reduce((s, i) => s + i.amount, 0);
    const totalPending = [...pending, ...overdue].reduce((s, i) => s + i.amount, 0);
    return { totalPaid, totalPending, paidCount: paid.length, pendingCount: pending.length, overdueCount: overdue.length };
  }, [payeePlans]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

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

        <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-display font-semibold text-lg text-foreground">
            Planes de pago ({payeePlans.length})
          </h3>
          {payeePlans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No hay pagos registrados para este beneficiario
            </div>
          ) : (
            payeePlans.map((plan) => {
              const paidCount = plan.instances.filter(i => i.status === 'paid').length;
              const paidAmount = plan.instances.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
              const totalInstances = plan.instances.length;
              const progress = totalInstances > 0 ? (paidCount / totalInstances) * 100 : 0;

              return (
                <Link to="/planes" key={plan.id} className="block">
                  <div className="payment-row animate-fade-in hover:border-primary/20 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          plan.type === 'recurring' ? 'bg-primary/10' : 'bg-muted'
                        )}>
                          {plan.type === 'recurring' ? (
                            <Repeat className="w-4.5 h-4.5 text-primary" />
                          ) : (
                            <FileText className="w-4.5 h-4.5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-[15px] text-foreground truncate">{plan.name}</h4>
                            <CategoryBadge category={plan.category} />
                          </div>
                          <div className="flex items-center gap-3 mt-1.5 text-[13px] text-muted-foreground flex-wrap">
                            {plan.type === 'recurring' && plan.frequency && (
                              <span className="inline-flex items-center gap-1">
                                <Repeat className="w-3.5 h-3.5" />
                                {FREQUENCY_LABELS[plan.frequency]}
                              </span>
                            )}
                            {plan.type === 'unique' && plan.dueDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(plan.dueDate), "d 'de' MMMM yyyy", { locale: es })}
                              </span>
                            )}
                            {plan.type === 'recurring' && plan.startDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Desde {format(new Date(plan.startDate), "MMM yyyy", { locale: es })}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Wallet className="w-3.5 h-3.5" />
                              {METHOD_LABELS[plan.paymentMethod]}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg tracking-tight text-foreground">
                          {formatCurrency(plan.amount)}
                        </p>
                        {plan.type === 'recurring' && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {paidCount}/{totalInstances} pagos · {formatCurrency(paidAmount)} pagado
                          </p>
                        )}
                      </div>
                    </div>

                    {plan.type === 'recurring' && totalInstances > 0 && (
                      <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-paid rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default PayeePage;
