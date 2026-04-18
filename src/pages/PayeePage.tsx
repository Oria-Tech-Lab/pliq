import { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { usePayees } from '@/hooks/usePayees';
import { Button } from '@/components/ui/button';
import { ArrowLeft, TrendingUp, Clock, AlertTriangle, Calendar, Repeat, FileText, Wallet, Copy, Building2, CreditCard, User, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FREQUENCY_LABELS, METHOD_LABELS, BENEFICIARY_TYPE_LABELS } from '@/types/payment';
import { CategoryBadge } from '@/components/payments/CategoryBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';

const PayeePage = () => {
  const { id } = useParams<{ id: string }>();
  const { plans } = usePaymentPlans();
  const { payees, getPayeeById } = usePayees([], () => {});
  const navigate = useNavigate();

  const payee = id ? getPayeeById(id) : undefined;

  const payeePlans = useMemo(() => {
    return plans.filter(p => p.payeeId === id);
  }, [plans, id]);

  const recurringPlans = useMemo(() => payeePlans.filter(p => p.type === 'recurring'), [payeePlans]);
  const uniquePlans = useMemo(() => payeePlans.filter(p => p.type === 'unique'), [payeePlans]);

  const { primaryCurrency } = useCurrency();

  const renderTotals = (map: Record<string, number>) => {
    const entries = Object.entries(map).filter(([, v]) => v > 0);
    if (entries.length === 0) return formatCurrency(0, primaryCurrency);
    return entries.map(([c, v]) => formatCurrency(v, c)).join(' · ');
  };

  const stats = useMemo(() => {
    const allInstances = payeePlans.flatMap(p =>
      p.instances.map(i => ({ ...i, currency: p.currency || primaryCurrency }))
    );
    const sumByCurrency = (list: typeof allInstances) =>
      list.reduce<Record<string, number>>((acc, i) => {
        acc[i.currency] = (acc[i.currency] || 0) + i.amount;
        return acc;
      }, {});
    const paid = allInstances.filter(i => i.status === 'paid');
    const pending = allInstances.filter(i => i.status === 'pending');
    const overdue = allInstances.filter(i => i.status === 'overdue');
    const totalPaidByCurrency = sumByCurrency(paid);
    const totalPendingByCurrency = sumByCurrency([...pending, ...overdue]);
    return {
      totalPaidByCurrency, totalPendingByCurrency,
      paidCount: paid.length, pendingCount: pending.length, overdueCount: overdue.length,
    };
  }, [payeePlans, primaryCurrency]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  if (!payee) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Receptor no encontrado</p>
          <Link to="/beneficiarios">
            <Button variant="outline" className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" /> Volver</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AppLayout title={payee.name} backTo="/beneficiarios">
      <div className="container py-6 space-y-6">
        {/* Payee header info */}
        {(payee.type || payee.bankAccounts?.length > 0) && (
          <div className="animate-slide-up">
            {payee.type && payee.type !== 'otro' && (
              <span className="text-xs bg-muted px-2 py-1 rounded-lg text-muted-foreground font-medium">
                {BENEFICIARY_TYPE_LABELS[payee.type]}
              </span>
            )}
          </div>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up">
          <div className="rounded-2xl bg-card border border-border/60 p-5 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-xl bg-paid/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-paid" />
              </div>
              Total pagado
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{renderTotals(stats.totalPaidByCurrency)}</p>
            <p className="text-xs text-muted-foreground">{stats.paidCount} pagos</p>
          </div>
          <div className="rounded-2xl bg-card border border-border/60 p-5 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-xl bg-pending/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-pending" />
              </div>
              Por pagar
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tight">{renderTotals(stats.totalPendingByCurrency)}</p>
            <p className="text-xs text-muted-foreground">{stats.pendingCount} pendientes</p>
          </div>
          <div className="rounded-2xl bg-card border border-border/60 p-5 space-y-2 shadow-sm">
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

        {/* Bank accounts */}
        {payee.bankAccounts && payee.bankAccounts.length > 0 && (
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <h3 className="font-display font-semibold text-lg text-foreground">
              Cuentas bancarias ({payee.bankAccounts.length})
            </h3>
            <div className="space-y-2">
              {payee.bankAccounts.map((account, idx) => (
                <div key={account.id} className="bg-card rounded-xl border border-border/60 p-4 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{account.bank || `Cuenta ${idx + 1}`}</p>
                      {account.accountHolder && (
                        <p className="text-[11px] text-muted-foreground">{account.accountHolder}</p>
                      )}
                    </div>
                  </div>

                  {account.accountNumber && (
                    <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Nº de cuenta</p>
                        <p className="text-sm font-mono text-foreground">{account.accountNumber}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => copyToClipboard(account.accountNumber, 'Número de cuenta')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  {account.interbankCode && (
                    <div className="flex items-center justify-between bg-muted/40 rounded-lg px-3 py-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">CCI</p>
                        <p className="text-sm font-mono text-foreground">{account.interbankCode}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => copyToClipboard(account.interbankCode, 'CCI')}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recurring plans */}
        {recurringPlans.length > 0 && (
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-display font-semibold text-lg text-foreground">
              Pagos recurrentes ({recurringPlans.length})
            </h3>
            <div className="space-y-2">
              {recurringPlans.map((plan) => {
                const paidCount = plan.instances.filter(i => i.status === 'paid').length;
                const paidAmount = plan.instances.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
                const totalInstances = plan.instances.length;
                const progress = totalInstances > 0 ? (paidCount / totalInstances) * 100 : 0;

                return (
                  <Link to="/planes" key={plan.id} className="block">
                    <div className="bg-card rounded-xl border border-border/60 p-4 shadow-sm hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Repeat className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-[15px] text-foreground truncate">{plan.name}</h4>
                            <CategoryBadge category={plan.category} />
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[13px] text-muted-foreground flex-wrap">
                            {plan.frequency && (
                              <span className="inline-flex items-center gap-1">
                                <Repeat className="w-3.5 h-3.5" />
                                {FREQUENCY_LABELS[plan.frequency]}
                              </span>
                            )}
                            {plan.startDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Desde {format(new Date(plan.startDate), "MMM yyyy", { locale: es })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-lg tracking-tight text-foreground">
                            {formatCurrency(plan.amount, plan.currency || primaryCurrency)}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {paidCount}/{totalInstances} · {formatCurrency(paidAmount, plan.currency || primaryCurrency)}
                          </p>
                        </div>
                      </div>
                      {totalInstances > 0 && (
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
              })}
            </div>
          </div>
        )}

        {/* Unique plans */}
        {uniquePlans.length > 0 && (
          <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <h3 className="font-display font-semibold text-lg text-foreground">
              Pagos únicos ({uniquePlans.length})
            </h3>
            <div className="space-y-2">
              {uniquePlans.map((plan) => {
                const instance = plan.instances[0];
                const isPaid = instance?.status === 'paid';
                return (
                  <Link to="/planes" key={plan.id} className="block">
                    <div className={cn(
                      'bg-card rounded-xl border border-border/60 p-4 shadow-sm hover:border-primary/20 transition-all',
                      isPaid && 'opacity-70',
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          isPaid ? 'bg-paid/10' : 'bg-muted'
                        )}>
                          <FileText className={cn('w-4.5 h-4.5', isPaid ? 'text-paid' : 'text-muted-foreground')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={cn('font-semibold text-[15px] truncate', isPaid ? 'text-muted-foreground line-through' : 'text-foreground')}>{plan.name}</h4>
                            <CategoryBadge category={plan.category} />
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[13px] text-muted-foreground">
                            {plan.dueDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {format(new Date(plan.dueDate), "d 'de' MMMM yyyy", { locale: es })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={cn('font-bold text-lg tracking-tight', isPaid ? 'text-muted-foreground' : 'text-foreground')}>
                            {formatCurrency(plan.amount, plan.currency || primaryCurrency)}
                          </p>
                          {isPaid && (
                            <span className="text-[10px] font-medium text-paid bg-paid/10 px-1.5 py-0.5 rounded-md">Pagado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {payeePlans.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm animate-slide-up">
            No hay pagos registrados para este beneficiario
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default PayeePage;
