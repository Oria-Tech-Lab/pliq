import { useState, useEffect, useMemo } from 'react';
import { PaymentPlan, PlanType } from '@/types/paymentPlan';
import { PaymentFrequency, PaymentMethod, CATEGORY_LABELS, FREQUENCY_LABELS, Payee, PaymentMethodEntry, METHOD_TYPE_LABELS } from '@/types/payment';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { addWeeks, addMonths, addYears, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Plus, Repeat, FileText, CalendarCheck, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentPlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payees: Payee[];
  onAddPayee: (name: string) => Payee;
  onSubmit: (data: Omit<PaymentPlan, 'id' | 'instances' | 'status' | 'createdAt' | 'updatedAt'>) => void;
}

const defaultForm = {
  name: '',
  type: 'recurring' as PlanType,
  category: 'services',
  amount: 0,
  payTo: '',
  payeeId: '',
  paymentMethodId: '',
  paymentMethod: 'bank' as PaymentMethod,
  notes: '',
  dueDate: new Date().toISOString(),
  startDate: new Date().toISOString(),
  frequency: 'monthly' as PaymentFrequency,
  totalPayments: 12 as number | null,
  isIndefinite: false,
};

function computeEndDate(startDate: string, frequency: PaymentFrequency, totalPayments: number): Date {
  const start = new Date(startDate);
  switch (frequency) {
    case 'weekly': return addWeeks(start, totalPayments - 1);
    case 'monthly': return addMonths(start, totalPayments - 1);
    case 'yearly': return addYears(start, totalPayments - 1);
    default: return start;
  }
}

export function PaymentPlanForm({ open, onOpenChange, payees, onAddPayee, onSubmit }: PaymentPlanFormProps) {
  const [form, setForm] = useState(defaultForm);
  const [dateOpen, setDateOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewPayee, setShowNewPayee] = useState(false);
  const [newPayeeName, setNewPayeeName] = useState('');
  const [showNewMethod, setShowNewMethod] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const { categories, addCategory } = useCustomCategories();
  const { methods, addMethod } = usePaymentMethods();

  useEffect(() => {
    if (open) {
      setForm(defaultForm);
      setShowNewCategory(false);
      setShowNewPayee(false);
      setShowNewMethod(false);
    }
  }, [open]);

  const allCategories: Record<string, string> = {
    ...CATEGORY_LABELS,
    ...Object.fromEntries(categories.map(c => [c.id, c.name])),
  };

  const projectedEndDate = useMemo(() => {
    if (form.type !== 'recurring' || form.isIndefinite || !form.totalPayments || !form.startDate) return null;
    return computeEndDate(form.startDate, form.frequency, form.totalPayments);
  }, [form.type, form.isIndefinite, form.totalPayments, form.startDate, form.frequency]);

  const isRecurring = form.type === 'recurring';
  const modalTitle = isRecurring ? 'Nuevo pago recurrente' : 'Nuevo pago único';
  const submitLabel = isRecurring ? 'Crear pago recurrente' : 'Crear pago único';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payee = payees.find(p => p.id === form.payeeId);
    onSubmit({
      name: form.name,
      type: form.type,
      category: form.category,
      amount: form.amount,
      payTo: payee?.name || form.payTo,
      payeeId: form.payeeId || undefined,
      paymentMethod: form.paymentMethod,
      notes: form.notes || undefined,
      dueDate: form.type === 'unique' ? form.dueDate : undefined,
      startDate: form.type === 'recurring' ? form.startDate : undefined,
      frequency: form.type === 'recurring' ? form.frequency : undefined,
      totalPayments: form.type === 'recurring' ? (form.isIndefinite ? null : form.totalPayments) : undefined,
    });
    onOpenChange(false);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const cat = addCategory(newCategoryName);
    setForm({ ...form, category: cat.id });
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  const handleAddPayee = () => {
    if (!newPayeeName.trim()) return;
    const payee = onAddPayee(newPayeeName);
    setForm({ ...form, payeeId: payee.id, payTo: payee.name });
    setShowNewPayee(false);
    setNewPayeeName('');
  };

  const handleAddMethod = () => {
    if (!newMethodName.trim()) return;
    const m = addMethod({ name: newMethodName.trim(), provider: '', type: 'bank_account', initialBalance: 0, remainingBalance: 0 });
    setForm({ ...form, paymentMethodId: m.id });
    setShowNewMethod(false);
    setNewMethodName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="font-display text-xl">{modalTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-5">
            {/* Type selector - horizontal pills */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tipo de pago</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'recurring' })}
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all duration-200',
                    form.type === 'recurring'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0',
                    form.type === 'recurring' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className={cn(
                      'text-sm font-semibold block',
                      form.type === 'recurring' ? 'text-primary' : 'text-muted-foreground'
                    )}>Recurrente</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Pagos periódicos</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: 'unique' })}
                  className={cn(
                    'relative flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 transition-all duration-200',
                    form.type === 'unique'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0',
                    form.type === 'unique' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className={cn(
                      'text-sm font-semibold block',
                      form.type === 'unique' ? 'text-primary' : 'text-muted-foreground'
                    )}>Único</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">Pago puntual</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="plan-name">Nombre <span className="text-destructive">*</span></Label>
              <Input id="plan-name" placeholder={isRecurring ? 'Ej: Préstamo auto, Netflix, Alquiler' : 'Ej: Reparación, Compra equipo'} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label>Categoría</Label>
              {!showNewCategory ? (
                <div className="flex gap-2">
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(allCategories).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowNewCategory(true)} title="Nueva categoría">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <Input autoFocus placeholder="Nombre de categoría" className="flex-1" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } if (e.key === 'Escape') setShowNewCategory(false); }} />
                  <Button type="button" variant="outline" size="icon" onClick={handleAddCategory} disabled={!newCategoryName.trim()} title="Confirmar" className="shrink-0 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowNewCategory(false)} title="Cancelar" className="shrink-0 text-destructive/70 hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Amount & Payment method */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plan-amount">Monto (S/) <span className="text-destructive">*</span></Label>
                <Input id="plan-amount" type="number" step="0.01" min="0" placeholder="0.00" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div className="space-y-2">
                <Label>Método de pago</Label>
                {!showNewMethod ? (
                  <div className="flex gap-2">
                    {methods.length > 0 ? (
                      <Select value={form.paymentMethodId} onValueChange={v => setForm({ ...form, paymentMethodId: v })}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar método" /></SelectTrigger>
                        <SelectContent>
                          {methods.map(m => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} <span className="text-muted-foreground ml-1">({METHOD_TYPE_LABELS[m.type]})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Button type="button" variant="outline" className="flex-1 text-muted-foreground" onClick={() => setShowNewMethod(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Agregar método
                      </Button>
                    )}
                    {methods.length > 0 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => setShowNewMethod(true)} title="Nuevo método">
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-2 items-center">
                    <Input autoFocus placeholder="Nombre del método" className="flex-1" value={newMethodName} onChange={e => setNewMethodName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddMethod(); } if (e.key === 'Escape') setShowNewMethod(false); }} />
                    <Button type="button" variant="outline" size="icon" onClick={handleAddMethod} disabled={!newMethodName.trim()} title="Confirmar" className="shrink-0 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setShowNewMethod(false)} title="Cancelar" className="shrink-0 text-destructive/70 hover:bg-destructive/10 hover:text-destructive">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Beneficiary */}
            <div className="space-y-2">
              <Label>A quién se paga <span className="text-destructive">*</span></Label>
              {!showNewPayee ? (
                <div className="flex gap-2">
                  <Select value={form.payeeId} onValueChange={v => { const p = payees.find(x => x.id === v); setForm({ ...form, payeeId: v, payTo: p?.name || '' }); }}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar beneficiario" /></SelectTrigger>
                    <SelectContent>
                      {payees.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setShowNewPayee(true)} title="Nuevo beneficiario">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <Input autoFocus placeholder="Nombre del beneficiario" className="flex-1" value={newPayeeName} onChange={e => setNewPayeeName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddPayee(); } if (e.key === 'Escape') setShowNewPayee(false); }} />
                  <Button type="button" variant="outline" size="icon" onClick={handleAddPayee} disabled={!newPayeeName.trim()} title="Confirmar" className="shrink-0 border-primary/30 text-primary hover:bg-primary/10 hover:text-primary">
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setShowNewPayee(false)} title="Cancelar" className="shrink-0 text-destructive/70 hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Unique: due date */}
            {form.type === 'unique' && (
              <div className="space-y-2">
                <Label>Fecha de vencimiento <span className="text-destructive">*</span></Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(new Date(form.dueDate), 'PPP', { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={new Date(form.dueDate)} onSelect={d => { if (d) { setForm({ ...form, dueDate: d.toISOString() }); setDateOpen(false); } }} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Recurring fields */}
            {form.type === 'recurring' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de inicio <span className="text-destructive">*</span></Label>
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn('w-full justify-start text-left font-normal')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(new Date(form.startDate), 'PPP', { locale: es })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={new Date(form.startDate)} onSelect={d => { if (d) { setForm({ ...form, startDate: d.toISOString() }); setStartDateOpen(false); } }} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Recurrencia <span className="text-destructive">*</span></Label>
                    <Select value={form.frequency} onValueChange={(v: PaymentFrequency) => setForm({ ...form, frequency: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(FREQUENCY_LABELS).filter(([k]) => k !== 'once').map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Cantidad de pagos</Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="indefinite" className="text-sm text-muted-foreground font-normal">Indefinido</Label>
                      <Switch id="indefinite" checked={form.isIndefinite} onCheckedChange={v => setForm({ ...form, isIndefinite: v })} />
                    </div>
                  </div>
                  {!form.isIndefinite && (
                    <div className="space-y-2">
                      <Input type="number" min="1" max="360" value={form.totalPayments || ''} onChange={e => setForm({ ...form, totalPayments: parseInt(e.target.value) || 1 })} placeholder="Número de pagos" />
                      {projectedEndDate && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-xl px-3 py-2">
                          <CalendarCheck className="w-4 h-4 text-primary flex-shrink-0" />
                          <span>
                            Finaliza el <strong className="text-foreground">{format(projectedEndDate, "d 'de' MMMM yyyy", { locale: es })}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="plan-notes">Notas (opcional)</Label>
              <Textarea id="plan-notes" placeholder="Detalles adicionales..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="border-t border-border bg-card px-6 py-4 flex gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 h-12 text-base rounded-xl">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 h-12 text-base rounded-xl font-semibold gap-2">
              {isRecurring ? <Repeat className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              {submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
