import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { useProviders } from '@/hooks/useProviders';
import { PaymentMethodEntry, METHOD_TYPE_LABELS } from '@/types/payment';
import { Building2, CreditCard, Wallet, Banknote, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const TYPE_ICONS: Record<PaymentMethodEntry['type'], typeof CreditCard> = {
  card: CreditCard,
  bank_account: Building2,
  cash: Banknote,
};

const PaymentMethodsPage = () => {
  const { methods, addMethod, deleteMethod } = usePaymentMethods();
  const { providers, addProvider } = useProviders();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [newProvider, setNewProvider] = useState('');
  const [showNewProvider, setShowNewProvider] = useState(false);
  const [methodType, setMethodType] = useState<PaymentMethodEntry['type']>('bank_account');
  const [initialBalance, setInitialBalance] = useState('');
  const [remainingBalance, setRemainingBalance] = useState('');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const resetForm = () => {
    setName('');
    setProvider('');
    setNewProvider('');
    setShowNewProvider(false);
    setMethodType('bank_account');
    setInitialBalance('');
    setRemainingBalance('');
  };

  const handleAddProvider = () => {
    if (!newProvider.trim()) return;
    const p = addProvider(newProvider);
    setProvider(p.id);
    setNewProvider('');
    setShowNewProvider(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const ib = parseFloat(initialBalance) || 0;
    const rb = remainingBalance ? parseFloat(remainingBalance) : ib;
    const providerName = providers.find(p => p.id === provider)?.name || '';
    addMethod({ name, provider: providerName, type: methodType, initialBalance: ib, remainingBalance: rb });
    resetForm();
    setDialogOpen(false);
  };

  return (
    <AppLayout title="Métodos de pago">
      <div className="container py-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {methods.length} {methods.length === 1 ? 'método' : 'métodos'}
          </span>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Nuevo
          </Button>
        </div>

        {methods.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/60 p-12 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Agrega tus métodos de pago para llevar un control</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {methods.map((method) => {
              const Icon = TYPE_ICONS[method.type];
              return (
                <div key={method.id} className="bg-card rounded-xl border border-border/40 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-sm text-foreground">{method.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground">
                              {METHOD_TYPE_LABELS[method.type]}
                            </span>
                            {method.provider && (
                              <span className="text-xs text-muted-foreground">{method.provider}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground">{formatCurrency(method.remainingBalance)}</p>
                            {method.initialBalance !== method.remainingBalance && (
                              <p className="text-[10px] text-muted-foreground">de {formatCurrency(method.initialBalance)}</p>
                            )}
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteMethod(method.id)}>
                            <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo método de pago</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Tarjeta BCP Visa" />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={methodType} onValueChange={v => setMethodType(v as PaymentMethodEntry['type'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(METHOD_TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Proveedor</Label>
                  <Button variant="ghost" size="sm" className="text-xs h-6 gap-1" onClick={() => setShowNewProvider(!showNewProvider)}>
                    <Plus className="w-3 h-3" /> Crear
                  </Button>
                </div>
                {showNewProvider && (
                  <div className="flex gap-2">
                    <Input
                      value={newProvider}
                      onChange={e => setNewProvider(e.target.value)}
                      placeholder="Nombre del proveedor"
                      className="h-8 text-sm"
                    />
                    <Button size="sm" className="h-8" onClick={handleAddProvider} disabled={!newProvider.trim()}>
                      Agregar
                    </Button>
                  </div>
                )}
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                  <SelectContent>
                    {providers.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                    {providers.length === 0 && (
                      <div className="px-2 py-1.5 text-xs text-muted-foreground">Crea un proveedor primero</div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Saldo inicial</Label>
                  <Input
                    type="number"
                    value={initialBalance}
                    onChange={e => setInitialBalance(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Saldo restante</Label>
                  <Input
                    type="number"
                    value={remainingBalance}
                    onChange={e => setRemainingBalance(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!name.trim()}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default PaymentMethodsPage;
