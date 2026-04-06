import { useState, useEffect } from 'react';
import { Payment, PaymentCategory, PaymentFrequency, PaymentMethod, Payee, CATEGORY_LABELS, FREQUENCY_LABELS, METHOD_LABELS } from '@/types/payment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment | null;
  payees: Payee[];
  onAddPayee: (name: string) => Payee;
  onSubmit: (data: Omit<Payment, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => void;
}

const defaultFormData = {
  name: '',
  category: 'services' as PaymentCategory,
  amount: 0,
  frequency: 'monthly' as PaymentFrequency,
  dueDate: new Date().toISOString(),
  payTo: '',
  payeeId: '',
  paymentMethod: 'bank' as PaymentMethod,
  reminderDays: 3,
  notes: '',
};

export function PaymentForm({ open, onOpenChange, payment, payees, onAddPayee, onSubmit }: PaymentFormProps) {
  const [formData, setFormData] = useState(defaultFormData);
  const [dateOpen, setDateOpen] = useState(false);
  const [showNewPayee, setShowNewPayee] = useState(false);
  const [newPayeeName, setNewPayeeName] = useState('');

  useEffect(() => {
    if (payment) {
      setFormData({
        name: payment.name,
        category: payment.category,
        amount: payment.amount,
        frequency: payment.frequency,
        dueDate: payment.dueDate,
        payTo: payment.payTo,
        payeeId: payment.payeeId || '',
        paymentMethod: payment.paymentMethod,
        reminderDays: payment.reminderDays,
        notes: payment.notes || '',
      });
    } else {
      setFormData(defaultFormData);
    }
    setShowNewPayee(false);
    setNewPayeeName('');
  }, [payment, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payee = payees.find(p => p.id === formData.payeeId);
    onSubmit({
      ...formData,
      payTo: payee?.name || formData.payTo,
    });
    onOpenChange(false);
  };

  const handleAddNewPayee = () => {
    if (!newPayeeName.trim()) return;
    const payee = onAddPayee(newPayeeName);
    setFormData({ ...formData, payeeId: payee.id, payTo: payee.name });
    setShowNewPayee(false);
    setNewPayeeName('');
  };

  const isEditing = !!payment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">
            {isEditing ? 'Editar pago' : 'Nuevo pago'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del pago</Label>
            <Input
              id="name"
              placeholder="Ej: Internet, Alquiler, Netflix"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Category & Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select
                value={formData.category}
                onValueChange={(value: PaymentCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frecuencia</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: PaymentFrequency) => setFormData({ ...formData, frequency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FREQUENCY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Monto (S/)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de vencimiento</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !formData.dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate
                      ? format(new Date(formData.dueDate), 'PPP', { locale: es })
                      : 'Seleccionar fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={new Date(formData.dueDate)}
                    onSelect={(date) => {
                      if (date) {
                        setFormData({ ...formData, dueDate: date.toISOString() });
                        setDateOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Pay To - Payee Selector */}
          <div className="space-y-2">
            <Label>A quién se paga</Label>
            {!showNewPayee ? (
              <div className="flex gap-2">
                <Select
                  value={formData.payeeId}
                  onValueChange={(value: string) => {
                    const payee = payees.find(p => p.id === value);
                    setFormData({ ...formData, payeeId: value, payTo: payee?.name || '' });
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar receptor" />
                  </SelectTrigger>
                  <SelectContent>
                    {payees
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((payee) => (
                        <SelectItem key={payee.id} value={payee.id}>{payee.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowNewPayee(true)}
                  title="Agregar nuevo receptor"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  autoFocus
                  placeholder="Nombre del receptor"
                  value={newPayeeName}
                  onChange={(e) => setNewPayeeName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewPayee();
                    }
                    if (e.key === 'Escape') setShowNewPayee(false);
                  }}
                />
                <Button type="button" variant="default" size="sm" onClick={handleAddNewPayee} disabled={!newPayeeName.trim()}>
                  Agregar
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewPayee(false)}>
                  Cancelar
                </Button>
              </div>
            )}
          </div>

          {/* Payment Method & Reminder */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value: PaymentMethod) => setFormData({ ...formData, paymentMethod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(METHOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminderDays">Recordar (días antes)</Label>
              <Input
                id="reminderDays"
                type="number"
                min="0"
                max="30"
                value={formData.reminderDays}
                onChange={(e) => setFormData({ ...formData, reminderDays: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Añade detalles adicionales..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Guardar cambios' : 'Crear pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
