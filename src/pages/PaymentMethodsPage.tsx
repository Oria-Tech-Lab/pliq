import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { PaymentMethodEntry, METHOD_TYPE_LABELS } from '@/types/payment';
import { Building2, CreditCard, Wallet, Banknote, Plus, Trash2, Star, Pencil, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconTooltip } from '@/components/ui/icon-tooltip';
import { useCurrency } from '@/contexts/CurrencyContext';

const TYPE_ICONS: Record<string, typeof CreditCard> = {
  card: CreditCard,
  bank_account: Building2,
  cash: Banknote,
  wallet: Wallet,
};

const PaymentMethodsPage = () => {
  const { methods, addMethod, updateMethod, deleteMethod, setDefaultMethod } = usePaymentMethods();
  const { formatAmount } = useCurrency();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [methodType, setMethodType] = useState<PaymentMethodEntry['type']>('bank_account');
  const [initialBalance, setInitialBalance] = useState('');
  const [remainingBalance, setRemainingBalance] = useState('');

  const resetForm = () => {
    setName('');
    setProvider('');
    setMethodType('bank_account');
    setInitialBalance('');
    setRemainingBalance('');
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (method: PaymentMethodEntry) => {
    setEditingId(method.id);
    setName(method.name);
    setProvider(method.provider);
    setMethodType(method.type);
    setInitialBalance(String(method.initialBalance));
    setRemainingBalance(String(method.remainingBalance));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const ib = parseFloat(initialBalance) || 0;
    const rb = remainingBalance ? parseFloat(remainingBalance) : ib;
    if (editingId) {
      await updateMethod(editingId, { name, provider, type: methodType, initialBalance: ib, remainingBalance: rb });
    } else {
      await addMethod({ name, provider, type: methodType, initialBalance: ib, remainingBalance: rb });
    }
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
          <Button size="sm" onClick={openCreate} className="gap-1.5">
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
              const Icon = TYPE_ICONS[method.type] ?? CreditCard;
              return (
                <div key={method.id} className="bg-card rounded-xl border border-border/40 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm text-foreground">{method.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground">
                              {METHOD_TYPE_LABELS[method.type]}
                            </span>
                            {method.provider && (
                              <span className="text-xs text-muted-foreground">{method.provider}</span>
                            )}
                          </div>
                          {(method.initialBalance !== 0 || method.remainingBalance !== 0) && (
                            <div className="mt-1.5 space-y-0.5">
                              <p className="text-sm font-semibold text-foreground">{formatAmount(method.remainingBalance)}</p>
                              {method.initialBalance !== method.remainingBalance && (
                                <p className="text-[10px] text-muted-foreground">Saldo inicial: {formatAmount(method.initialBalance)}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <IconTooltip label={method.isDefault ? 'Método predeterminado' : 'Marcar como predeterminado'}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setDefaultMethod(method.id)}
                            >
                              <Star
                                className={`w-3.5 h-3.5 ${method.isDefault ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                              />
                            </Button>
                          </IconTooltip>
                          <IconTooltip label="Editar método">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(method)}>
                              <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                          </IconTooltip>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => deleteMethod(method.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar método de pago' : 'Nuevo método de pago'}</DialogTitle>
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
                <Label>Proveedor</Label>
                <Input
                  value={provider}
                  onChange={e => setProvider(e.target.value)}
                  placeholder="Ej: BCP, Interbank, Yape"
                />
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
              <Button onClick={handleSubmit} disabled={!name.trim()}>
                {editingId ? 'Guardar cambios' : 'Guardar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default PaymentMethodsPage;
