import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { usePayees } from '@/hooks/usePayees';
import { PaymentFrequency } from '@/types/payment';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getCurrencySymbol } from '@/lib/currency';

type Screen = 'welcome' | 1 | 2 | 3 | 4 | 'done';

const FREQ_OPTIONS: { value: PaymentFrequency; label: string }[] = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'yearly', label: 'Anual' },
];

interface OnboardingModalProps {
  open: boolean;
  userName: string;
  onComplete: (paymentData?: {
    name: string;
    amount: number;
    currency: string;
    startDate: string;
    frequency: PaymentFrequency;
    categoryId: string;
    methodId: string;
    payeeId?: string;
  }) => void;
  onSkip: () => void;
}

export function OnboardingModal({ open, userName, onComplete, onSkip }: OnboardingModalProps) {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [dateOpen, setDateOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString());
  const [frequency, setFrequency] = useState<PaymentFrequency>('monthly');
  const [categoryId, setCategoryId] = useState('');
  const [methodId, setMethodId] = useState('');
  const [payeeId, setPayeeId] = useState('');

  // Created payment info for done screen
  const [createdName, setCreatedName] = useState('');
  const [createdAmount, setCreatedAmount] = useState(0);
  const [createdFreq, setCreatedFreq] = useState('');

  const { categories } = useCustomCategories();
  const { methods } = usePaymentMethods();
  const { payees } = usePayees([], () => {});

  // Pre-select default method
  const defaultMethod = methods.find(m => m.isDefault);
  if (defaultMethod && !methodId && screen === 'welcome') {
    // will be set when entering step 3
  }

  const stepNumber = typeof screen === 'number' ? screen : 0;
  const progress = stepNumber > 0 ? (stepNumber / 4) * 100 : 0;

  const freqLabel = FREQ_OPTIONS.find(f => f.value === frequency)?.label ?? '';

  const canProceedStep1 = name.trim() && amount > 0;

  const handleCreate = () => {
    setCreatedName(name);
    setCreatedAmount(amount);
    setCreatedFreq(freqLabel);
    onComplete({ name, amount, startDate, frequency, categoryId, methodId, payeeId: payeeId || undefined });
    setScreen('done');
  };

  const handleDone = () => {
    // onComplete already called, just signal close
    onSkip(); // reuse skip to mark completed and close
  };

  const goToStep = (s: Screen) => {
    if (s === 3 && !methodId && defaultMethod) {
      setMethodId(defaultMethod.id);
    }
    setScreen(s);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Progress bar for steps 1-4 */}
        {typeof screen === 'number' && (
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Paso {screen} de 4</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )}

        {/* WELCOME */}
        {screen === 'welcome' && (
          <div className="space-y-4 text-center py-4">
            <h2 className="text-xl font-display font-bold">👋 Hola, {userName || 'amigo'}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pliq te ayuda a recordar y controlar todos tus pagos recurrentes en un solo lugar.
              En 2 minutos tendrás tu primer pago registrado.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={() => goToStep(1)} className="w-full">
                Empezar <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="ghost" onClick={onSkip} className="text-muted-foreground text-sm">
                Saltar por ahora
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1 — Payment */}
        {screen === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-bold">¿Qué pago quieres registrar?</h2>
              <p className="text-sm text-muted-foreground">Puede ser el alquiler, Netflix, el gym, un préstamo...</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Netflix, Alquiler..." />
              </div>
              <div>
                <Label>Monto (S/)</Label>
                <Input type="number" min={0} step={0.01} value={amount || ''} onChange={e => setAmount(Number(e.target.value))} placeholder="0.00" />
              </div>
              <div>
                <Label>Fecha de inicio</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !startDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(new Date(startDate), 'PPP', { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={new Date(startDate)}
                      onSelect={d => { if (d) { setStartDate(d.toISOString()); setDateOpen(false); } }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Recurrencia</Label>
                <Select value={frequency} onValueChange={v => setFrequency(v as PaymentFrequency)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FREQ_OPTIONS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => goToStep('welcome')} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Atrás
              </Button>
              <Button onClick={() => goToStep(2)} disabled={!canProceedStep1} className="flex-1">
                Siguiente <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2 — Category */}
        {screen === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-bold">¿A qué categoría pertenece?</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                    categoryId === c.id
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                      : 'bg-muted/50 border-border text-foreground hover:border-muted-foreground'
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin categorías aún — crea una en Categorías</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => goToStep(1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Atrás
              </Button>
              <Button onClick={() => goToStep(3)} className="flex-1">
                Siguiente <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3 — Payment Method */}
        {screen === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-bold">¿Con qué método pagas?</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {methods.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethodId(m.id)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                    methodId === m.id
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                      : 'bg-muted/50 border-border text-foreground hover:border-muted-foreground'
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
            {methods.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin métodos aún — crea uno en Métodos de pago</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => goToStep(2)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Atrás
              </Button>
              <Button onClick={() => goToStep(4)} className="flex-1">
                Siguiente <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4 — Payee */}
        {screen === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-display font-bold">¿A quién le pagas?</h2>
              <p className="text-sm text-muted-foreground">Opcional — puedes completarlo después.</p>
            </div>
            {payees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {payees.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPayeeId(payeeId === p.id ? '' : p.id)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-sm font-medium border transition-colors',
                      payeeId === p.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                        : 'bg-muted/50 border-border text-foreground hover:border-muted-foreground'
                    )}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
            {payees.length === 0 && (
              <p className="text-sm text-muted-foreground">No tienes beneficiarios registrados aún.</p>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => goToStep(3)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Atrás
              </Button>
              <Button onClick={handleCreate} className="flex-1">
                Crear pago <Check className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* DONE */}
        {screen === 'done' && (
          <div className="space-y-4 text-center py-4">
            <h2 className="text-xl font-display font-bold">🎉 ¡Listo!</h2>
            <p className="text-sm text-foreground">
              <span className="font-semibold">{createdName}</span> fue registrado por{' '}
              <span className="font-semibold">S/ {createdAmount.toFixed(2)}</span> — {createdFreq}.
            </p>
            <p className="text-sm text-muted-foreground">Pliq te avisará antes de que venza.</p>
            <Button onClick={handleDone} className="w-full mt-2">
              Ver mi dashboard
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
