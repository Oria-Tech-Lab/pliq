import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { usePayees } from '@/hooks/usePayees';
import { useCategoryLabels } from '@/hooks/useCategoryLabels';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useIsMobile } from '@/hooks/use-mobile';
import { PaymentPlan, PaymentInstance, PLAN_TYPE_LABELS } from '@/types/paymentPlan';
import { FREQUENCY_LABELS, METHOD_LABELS, METHOD_TYPE_LABELS } from '@/types/payment';
import { IconTooltip } from '@/components/ui/icon-tooltip';
import { SwipeableRow } from '@/components/payments/SwipeableRow';
import { PaymentPlanForm } from '@/components/payments/PaymentPlanForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/payments/StatusBadge';
import { CategoryBadge } from '@/components/payments/CategoryBadge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Trash2, ChevronDown, ChevronRight, Check, RotateCcw, Repeat, FileText, Calendar, Infinity, Pencil, Wallet, User, Ban, MoreVertical } from 'lucide-react';
import { format, differenceInCalendarDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PaymentPlansPage() {
  const { plans, isLoading, addPlan, deletePlan, updatePlan, finalizePlan, markInstancePaid, markInstancePending, updateInstance } = usePaymentPlans();
  const { payees, addPayee } = usePayees([], () => {});
  const { methods: paymentMethods, addMethod: addPaymentMethod } = usePaymentMethods();
  const { categories: customCategories, addCategory } = useCustomCategories();
  const allCategoryLabels = useCategoryLabels();
  const isMobile = useIsMobile();
  const [formOpen, setFormOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());
  const [editingPlan, setEditingPlan] = useState<PaymentPlan | null>(null);
  const [finalizingId, setFinalizingId] = useState<string | null>(null);

  // Edit plan form state
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPayeeId, setEditPayeeId] = useState('');
  const [editAmount, setEditAmount] = useState(0);
  const [editFrequency, setEditFrequency] = useState<string>('monthly');
  const [editTotalPayments, setEditTotalPayments] = useState<number | null>(null);
  const [editDueDate, setEditDueDate] = useState('');
  const [editPaymentMethodId, setEditPaymentMethodId] = useState('');

  const uniquePlans = plans.filter(p => p.type === 'unique');
  const recurringPlans = plans.filter(p => p.type === 'recurring');

  const INITIAL_VISIBLE = 3;

  const toggleExpand = (id: string) => {
    setExpandedPlans(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleHistoryExpand = (planId: string) => {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      if (next.has(planId)) next.delete(planId); else next.add(planId);
      return next;
    });
  };

  const handleDelete = () => {
    if (deletingId) {
      const plan = plans.find(p => p.id === deletingId);
      deletePlan(deletingId);
      toast.success('Plan eliminado', { description: plan?.name });
      setDeletingId(null);
    }
  };

  const openEditPlan = (plan: PaymentPlan) => {
    setEditingPlan(plan);
    setEditName(plan.name);
    setEditCategory(plan.category);
    setEditPayeeId(plan.payeeId || '');
    setEditAmount(plan.amount);
    setEditFrequency(plan.frequency || 'monthly');
    setEditTotalPayments(plan.totalPayments ?? null);
    setEditDueDate(plan.dueDate || '');
    // Find matching method from paymentMethods list, or fall back to legacy key
    const matchedMethod = paymentMethods.find(m => m.id === plan.paymentMethod);
    setEditPaymentMethodId(matchedMethod ? plan.paymentMethod : (plan.paymentMethod || ''));
  };

  const handleSaveEditPlan = () => {
    if (!editingPlan) return;
    const payee = payees.find(p => p.id === editPayeeId);
    updatePlan(editingPlan.id, {
      name: editName,
      category: editCategory,
      payeeId: editPayeeId || undefined,
      payTo: payee?.name || editingPlan.payTo,
      amount: editAmount,
      paymentMethod: editPaymentMethodId as any || editingPlan.paymentMethod,
      ...(editingPlan.type === 'recurring' ? {
        frequency: editFrequency as any,
        totalPayments: editTotalPayments,
      } : {
        dueDate: editDueDate,
      }),
    });
    setEditingPlan(null);
    toast.success('Plan actualizado');
  };

  const handleFinalize = () => {
    if (finalizingId) {
      finalizePlan(finalizingId);
      toast.success('Plan finalizado', { description: 'No se generarán más pagos' });
      setFinalizingId(null);
    }
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);

  const getPaidCount = (plan: PaymentPlan) => plan.instances.filter(i => i.status === 'paid').length;
  const getPaidAmount = (plan: PaymentPlan) => plan.instances.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);

  const getPlanStatusInfo = (plan: PaymentPlan) => {
    const hasOverdue = plan.instances.some(i => i.status === 'overdue');
    const allPaid = plan.instances.length > 0 && plan.instances.every(i => i.status === 'paid');
    if (allPaid) return { label: 'Completado', className: 'bg-paid/12 text-paid border-paid/25' };
    if (hasOverdue) return { label: 'Vencido', className: 'bg-overdue/12 text-overdue border-overdue/25' };

    // Check if any pending instance is within 5 days of due date
    const today = new Date();
    const nearDue = plan.instances.find(i => {
      if (i.status !== 'pending') return false;
      const daysLeft = differenceInCalendarDays(new Date(i.dueDate), today);
      return daysLeft >= 0 && daysLeft <= 5;
    });
    if (nearDue) {
      const daysLeft = differenceInCalendarDays(new Date(nearDue.dueDate), today);
      const label = daysLeft === 0 ? 'Vence hoy' : daysLeft === 1 ? 'Vence mañana' : `${daysLeft} días`;
      return { label, className: 'bg-pending/12 text-pending border-pending/25' };
    }

    return { label: 'Al día', className: 'bg-paid/12 text-paid border-paid/25' };
  };

  const getPayeeName = (plan: PaymentPlan) => {
    const payee = payees.find(p => p.id === plan.payeeId);
    return payee?.name || plan.payTo;
  };

  const renderPlanCard = (plan: PaymentPlan) => {
    const isExpanded = expandedPlans.has(plan.id);
    const paidCount = getPaidCount(plan);
    const totalInstances = plan.instances.length;
    const progress = totalInstances > 0 ? (paidCount / totalInstances) * 100 : 0;
    const statusInfo = getPlanStatusInfo(plan);
    const beneficiaryName = getPayeeName(plan);
    const isHistoryExpanded = expandedHistory.has(plan.id);
    const visibleInstances = isHistoryExpanded ? plan.instances : plan.instances.slice(0, INITIAL_VISIBLE);
    const hasMore = plan.instances.length > INITIAL_VISIBLE;

    return (
      <div key={plan.id} className="payment-row animate-fade-in">
        <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(plan.id)}>
          {/* Card header */}
          <div className="flex items-start gap-2">
            {/* Main content area */}
            <CollapsibleTrigger asChild>
              <button className="flex-1 min-w-0 text-left">
                {/* Top row: name + amount */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {plan.type === 'recurring' ? (
                        isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      )}
                      <h3 className="font-semibold text-foreground text-[15px] truncate">{plan.name}</h3>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <CategoryBadge category={plan.category} />
                      <span className={cn('inline-flex items-center text-[10px] font-medium px-1.5 py-0.5 rounded-md border', statusInfo.className)}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-lg tracking-tight text-foreground leading-tight">
                      {formatCurrency(plan.amount)}
                    </p>
                    {plan.type === 'recurring' && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {formatCurrency(getPaidAmount(plan))} pagado
                      </p>
                    )}
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-2 sm:gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span className="truncate max-w-[120px] sm:max-w-none">{beneficiaryName}</span>
                  </span>
                  {plan.type === 'unique' && plan.dueDate && (
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(plan.dueDate), "d MMM yyyy", { locale: es })}
                    </span>
                  )}
                  {plan.type === 'recurring' && (
                    <>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(plan.startDate!), "MMM yyyy", { locale: es })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {plan.totalPayments ? `${paidCount}/${plan.totalPayments}` : (
                          <><Infinity className="w-3 h-3" /> {paidCount}</>
                        )}
                      </span>
                    </>
                  )}
                </div>
              </button>
            </CollapsibleTrigger>

            {/* Mobile: options menu on the right */}
            {isMobile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 mt-0.5 text-muted-foreground">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => openEditPlan(plan)} className="gap-2">
                    <Pencil className="w-3.5 h-3.5" /> Editar plan
                  </DropdownMenuItem>
                  {plan.type === 'recurring' && (
                    <DropdownMenuItem onClick={() => setFinalizingId(plan.id)} className="gap-2 text-amber-600">
                      <Ban className="w-3.5 h-3.5" /> Finalizar plan
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setDeletingId(plan.id)} className="gap-2 text-destructive">
                    <Trash2 className="w-3.5 h-3.5" /> Eliminar plan
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Desktop action buttons */}
            {!isMobile && (
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                <IconTooltip label="Editar plan">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditPlan(plan)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </IconTooltip>
                {plan.type === 'recurring' && (
                  <IconTooltip label="Finalizar plan">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-amber-500" onClick={() => setFinalizingId(plan.id)}>
                      <Ban className="w-4 h-4" />
                    </Button>
                  </IconTooltip>
                )}
                <IconTooltip label="Eliminar plan">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeletingId(plan.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </IconTooltip>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {plan.type === 'recurring' && plan.totalPayments && (
            <div className="mt-3">
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-paid rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* History */}
          <CollapsibleContent>
            <div className="mt-4 border-t border-border/60 pt-4 space-y-1.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Historial de pagos
                </span>
                {isMobile && (
                  <span className="text-[10px] text-muted-foreground/60">Desliza para marcar</span>
                )}
              </div>
              {visibleInstances.map((instance) => (
                <InstanceRow
                  key={instance.id}
                  instance={instance}
                  planId={plan.id}
                  planPaymentMethod={plan.paymentMethod}
                  paymentMethods={paymentMethods}
                  isMobile={isMobile}
                  onMarkPaid={markInstancePaid}
                  onMarkPending={markInstancePending}
                  onUpdateInstance={updateInstance}
                />
              ))}
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground hover:text-foreground mt-1"
                  onClick={(e) => { e.stopPropagation(); toggleHistoryExpand(plan.id); }}
                >
                  {isHistoryExpanded
                    ? 'Ver menos'
                    : `Ver ${plan.instances.length - INITIAL_VISIBLE} más`}
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  if (isLoading) {
    return (
      <AppLayout title="Lista de pagos">
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Lista de pagos">
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-2xl text-foreground">Lista de pagos</h2>
            <p className="text-sm text-muted-foreground mt-1">Gestiona tus pagos únicos y recurrentes</p>
          </div>
          <Button onClick={() => setFormOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Nuevo Pago
          </Button>
        </div>

        <Tabs defaultValue="recurring" className="space-y-4">
          <TabsList className="grid w-full max-w-sm grid-cols-2">
            <TabsTrigger value="recurring" className="gap-2">
              <Repeat className="w-4 h-4" /> Recurrentes ({recurringPlans.length})
            </TabsTrigger>
            <TabsTrigger value="unique" className="gap-2">
              <FileText className="w-4 h-4" /> Únicos ({uniquePlans.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="recurring" className="space-y-3">
            {recurringPlans.length === 0 ? (
              <div className="payment-row text-center py-12">
                <Repeat className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No hay pagos recurrentes</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Crea un plan recurrente para dar seguimiento a tus pagos periódicos</p>
              </div>
            ) : recurringPlans.map(renderPlanCard)}
          </TabsContent>

          <TabsContent value="unique" className="space-y-3">
            {uniquePlans.length === 0 ? (
              <div className="payment-row text-center py-12">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No hay pagos únicos</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Crea un pago único para registrar pagos puntuales</p>
              </div>
            ) : uniquePlans.map(renderPlanCard)}
          </TabsContent>
        </Tabs>
      </div>

      <PaymentPlanForm
        open={formOpen}
        onOpenChange={setFormOpen}
        payees={payees}
        onAddPayee={addPayee}
        onSubmit={(data) => {
          addPlan(data);
          toast.success('Plan creado', { description: data.name });
        }}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este plan?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminarán el plan y todos sus pagos asociados. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!finalizingId} onOpenChange={(open) => !open && setFinalizingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Finalizar este plan recurrente?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminarán los pagos pendientes futuros y no se generarán más cuotas. Los pagos ya realizados se mantendrán.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize}>Finalizar plan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar plan de pago</DialogTitle>
            <DialogDescription>Modifica los datos generales del plan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(allCategoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Beneficiario</Label>
              <Select value={editPayeeId} onValueChange={setEditPayeeId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar beneficiario" /></SelectTrigger>
                <SelectContent>
                  {payees.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monto (S/)</Label>
                <Input type="number" step="0.01" min="0" value={editAmount || ''} onChange={e => setEditAmount(parseFloat(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Método de pago</Label>
                <Select value={editPaymentMethodId} onValueChange={setEditPaymentMethodId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar método" /></SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} <span className="text-muted-foreground ml-1">({METHOD_TYPE_LABELS[m.type]})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editingPlan?.type === 'recurring' && (
              <>
                <div className="space-y-2">
                  <Label>Recurrencia</Label>
                  <Select value={editFrequency} onValueChange={setEditFrequency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(FREQUENCY_LABELS).filter(([k]) => k !== 'once').map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Total de pagos</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="number" min="1" max="360"
                      value={editTotalPayments ?? ''}
                      onChange={e => setEditTotalPayments(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="Indefinido" className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {editTotalPayments ? `${editTotalPayments} pagos` : 'Indefinido'}
                    </span>
                  </div>
                </div>
              </>
            )}
            {editingPlan?.type === 'unique' && (
              <div className="space-y-2">
                <Label>Fecha de vencimiento</Label>
                <Input type="date" value={editDueDate ? new Date(editDueDate).toISOString().split('T')[0] : ''} onChange={e => setEditDueDate(new Date(e.target.value).toISOString())} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlan(null)}>Cancelar</Button>
            <Button onClick={handleSaveEditPlan}>Guardar cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// ─── Instance Row ──────────────────────────────────────────────────
function InstanceRow({
  instance,
  planId,
  planPaymentMethod,
  paymentMethods,
  isMobile,
  onMarkPaid,
  onMarkPending,
  onUpdateInstance,
}: {
  instance: PaymentInstance;
  planId: string;
  planPaymentMethod: string;
  paymentMethods: import('@/types/payment').PaymentMethodEntry[];
  isMobile: boolean;
  onMarkPaid: (planId: string, instanceId: string) => void;
  onMarkPending: (planId: string, instanceId: string) => void;
  onUpdateInstance: (planId: string, instanceId: string, data: { amount?: number; paymentMethod?: string }) => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [confirmPaidOpen, setConfirmPaidOpen] = useState(false);
  const [editAmount, setEditAmount] = useState(instance.amount);
  const [editMethod, setEditMethod] = useState(instance.paymentMethod || planPaymentMethod);

  const effectiveMethod = instance.paymentMethod || planPaymentMethod;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(n);

  const allMethodOptions = [
    ...Object.entries(METHOD_LABELS).map(([k, v]) => ({ value: k, label: v })),
    ...paymentMethods.map(m => ({ value: m.id, label: m.name })),
  ];

  const getMethodLabel = (val: string) => allMethodOptions.find(o => o.value === val)?.label || val;

  const handleSaveEdit = () => {
    onUpdateInstance(planId, instance.id, { amount: editAmount, paymentMethod: editMethod });
    setEditOpen(false);
    toast.success('Pago actualizado');
  };

  const handleConfirmPaid = () => {
    onUpdateInstance(planId, instance.id, { amount: editAmount, paymentMethod: editMethod });
    onMarkPaid(planId, instance.id);
    setConfirmPaidOpen(false);
    toast.success('Marcado como pagado');
  };

  const openConfirmPaid = () => {
    setEditAmount(instance.amount);
    setEditMethod(instance.paymentMethod || planPaymentMethod);
    setConfirmPaidOpen(true);
  };

  const openEdit = () => {
    setEditAmount(instance.amount);
    setEditMethod(instance.paymentMethod || planPaymentMethod);
    setEditOpen(true);
  };

  const handleSwipePaid = () => {
    onMarkPaid(planId, instance.id);
    toast.success('Marcado como pagado', {
      action: { label: 'Deshacer', onClick: () => onMarkPending(planId, instance.id) },
    });
  };

  const handleSwipePending = () => {
    onMarkPending(planId, instance.id);
    toast.success('Marcado como pendiente');
  };

  const rowContent = (
    <div className={cn(
      'flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors',
      instance.status === 'paid' && 'bg-paid/5',
      instance.status === 'overdue' && 'bg-overdue/5',
      instance.status === 'pending' && 'bg-muted/30',
    )}>
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          instance.status === 'paid' && 'bg-paid',
          instance.status === 'overdue' && 'bg-overdue',
          instance.status === 'pending' && 'bg-pending',
        )} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className={cn(
              'text-sm font-medium capitalize truncate',
              instance.status === 'paid' && 'text-muted-foreground line-through'
            )}>
              {instance.periodLabel}
            </p>
            <span className={cn(
              'text-sm font-semibold shrink-0',
              instance.status === 'paid' ? 'text-muted-foreground' : 'text-foreground'
            )}>
              {formatCurrency(instance.amount)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap mt-0.5">
            <span>{format(new Date(instance.dueDate), "d MMM", { locale: es })}</span>
            {instance.paidDate && <span>· {format(new Date(instance.paidDate), "d MMM", { locale: es })}</span>}
            <span className="inline-flex items-center gap-0.5">
              <Wallet className="w-3 h-3" />
              {getMethodLabel(effectiveMethod)}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop buttons */}
      {!isMobile && (
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <IconTooltip label="Editar">
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={openEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </IconTooltip>
          {instance.status !== 'paid' ? (
            <IconTooltip label="Marcar como pagado">
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-paid hover:text-paid hover:bg-paid/10" onClick={openConfirmPaid}>
                <Check className="w-3.5 h-3.5" />
              </Button>
            </IconTooltip>
          ) : (
            <IconTooltip label="Marcar como pendiente">
              <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground" onClick={() => onMarkPending(planId, instance.id)}>
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </IconTooltip>
          )}
        </div>
      )}

      {/* Mobile: edit button only (swipe handles paid/pending) */}
      {isMobile && (
        <div className="ml-2 shrink-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-muted-foreground" onClick={openEdit}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isMobile ? (
        <SwipeableRow
          isPaid={instance.status === 'paid'}
          onSwipeRight={instance.status !== 'paid' ? handleSwipePaid : undefined}
          onSwipeLeft={instance.status === 'paid' ? handleSwipePending : undefined}
        >
          {rowContent}
        </SwipeableRow>
      ) : rowContent}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar pago — {instance.periodLabel}</DialogTitle>
            <DialogDescription>Modifica el monto o método de pago para este periodo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Monto</Label>
              <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={editMethod} onValueChange={setEditMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allMethodOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Paid Dialog */}
      <Dialog open={confirmPaidOpen} onOpenChange={setConfirmPaidOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar pago — {instance.periodLabel}</DialogTitle>
            <DialogDescription>Confirma el monto y método de pago antes de marcar como pagado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Monto pagado</Label>
              <Input type="number" step="0.01" value={editAmount} onChange={(e) => setEditAmount(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={editMethod} onValueChange={setEditMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allMethodOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPaidOpen(false)}>Cancelar</Button>
            <Button className="bg-paid text-paid-foreground hover:bg-paid/90 gap-2" onClick={handleConfirmPaid}>
              <Check className="w-4 h-4" /> Confirmar pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
