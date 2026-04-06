import { useState, useEffect } from 'react';
import { PaymentPlan, PlanType, PLAN_TYPE_LABELS } from '@/types/paymentPlan';
import { PaymentFrequency, PaymentMethod, CATEGORY_LABELS, FREQUENCY_LABELS, METHOD_LABELS, Payee } from '@/types/payment';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentPlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payees: Payee[];
  onSubmit: (data: Omit<PaymentPlan, 'id' | 'instances' | 'status' | 'createdAt' | 'updatedAt'>) => void;
}

const defaultForm = {
  name: '',
  type: 'recurring' as PlanType,
  category: 'services',
  amount: 0,
  payTo: '',
  payeeId: '',
  paymentMethod: 'bank' as PaymentMethod,
  notes: '',
  dueDate: new Date().toISOString(),
  startDate: new Date().toISOString(),
  frequency: 'monthly' as PaymentFrequency,
  totalPayments: 12 as number | null,
  isIndefinite: false,
};

export function PaymentPlanForm({ open, onOpenChange, payees, onSubmit }: PaymentPlanFormProps) {
  const [form, setForm] = useState(defaultForm);
  const [dateOpen, setDateOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { categories, addCategory } = useCustomCategories();

  useEffect(() => {
    if (open) setForm(defaultForm);
  }, [open]);

  const allCategories: Record<string, string> = {
    ...CATEGORY_LABELS,
    ...Object.fromEntries(categories.map(c => [c.id, c.name])),
  };

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Nuevo plan de pago</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Tipo de pago</Label>
            <Select value={form.type} onValueChange={(v: PlanType) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PLAN_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="plan-name">Nombre</Label>
            <Input id="plan-name" placeholder="Ej: Préstamo auto, Netflix, Alquiler" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
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
              <div className="flex gap-2">
                <Input autoFocus placeholder="Nombre de categoría" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } if (e.key === 'Escape') setShowNewCategory(false); }} />
                <Button type="button" size="sm" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>Agregar</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewCategory(false)}>Cancelar</Button>
              </div>
            )}
          </div>

          {/* Amount & Payment method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan-amount">Monto (S/)</Label>
              <Input id="plan-amount" type="number" step="0.01" min="0" placeholder="0.00" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select value={form.paymentMethod} onValueChange={(v: PaymentMethod) => setForm({ ...form, paymentMethod: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(METHOD_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Beneficiary */}
          <div className="space-y-2">
            <Label>A quién se paga</Label>
            <Select value={form.payeeId} onValueChange={v => { const p = payees.find(x => x.id === v); setForm({ ...form, payeeId: v, payTo: p?.name || '' }); }}>
              <SelectTrigger><SelectValue placeholder="Seleccionar beneficiario" /></SelectTrigger>
              <SelectContent>
                {payees.sort((a, b) => a.name.localeCompare(b.name)).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unique: due date */}
          {form.type === 'unique' && (
            <div className="space-y-2">
              <Label>Fecha de vencimiento</Label>
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
                  <Label>Fecha de inicio</Label>
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
                  <Label>Recurrencia</Label>
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
                  <Input type="number" min="1" max="360" value={form.totalPayments || ''} onChange={e => setForm({ ...form, totalPayments: parseInt(e.target.value) || 1 })} placeholder="Número de pagos" />
                )}
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="plan-notes">Notas (opcional)</Label>
            <Textarea id="plan-notes" placeholder="Detalles adicionales..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Crear plan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
