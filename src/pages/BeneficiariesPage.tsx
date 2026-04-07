import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { usePayees } from '@/hooks/usePayees';
import { BeneficiaryType, BENEFICIARY_TYPE_LABELS, BankAccount, Payee } from '@/types/payment';
import { Users, CreditCard, ChevronRight, Plus, X, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

const generateId = () => Math.random().toString(36).substring(2) + Date.now().toString(36);

const BeneficiariesPage = () => {
  const { flattenedPayments: payments } = usePaymentPlans();
  const { payees, addPayee: addPayeeBase, deletePayee, updatePayee } = usePayees([], () => {});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayee, setEditingPayee] = useState<Payee | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<BeneficiaryType>('persona');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const payeeStats = useMemo(() => {
    return payees.map(payee => {
      const payeePayments = payments.filter(p => p.payeeId === payee.id);
      const total = payeePayments.reduce((s, p) => s + p.amount, 0);
      const pending = payeePayments.filter(p => p.status !== 'paid').length;
      return { ...payee, total, count: payeePayments.length, pending };
    }).sort((a, b) => b.total - a.total);
  }, [payees, payments]);

  const addBankAccount = () => {
    setBankAccounts(prev => [...prev, { id: generateId(), bank: '', accountHolder: '', accountNumber: '', interbankCode: '' }]);
  };

  const updateBankAccount = (id: string, field: keyof Omit<BankAccount, 'id'>, value: string) => {
    setBankAccounts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeBankAccount = (id: string) => {
    setBankAccounts(prev => prev.filter(a => a.id !== id));
  };

  const resetForm = () => {
    setName('');
    setType('persona');
    setBankAccounts([]);
    setEditingPayee(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (payee: Payee, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingPayee(payee);
    setName(payee.name);
    setType(payee.type || 'otro');
    setBankAccounts(payee.bankAccounts?.map(a => ({ ...a, accountHolder: a.accountHolder || '' })) || []);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editingPayee) {
      updatePayee(editingPayee.id, { name: name.trim(), type, bankAccounts });
      toast.success('Beneficiario actualizado');
    } else {
      const newPayee = addPayeeBase(name);
      // Patch with extra data via localStorage
      const stored = localStorage.getItem('payees-app-data');
      if (stored) {
        try {
          const all = JSON.parse(stored) as Payee[];
          const idx = all.findIndex(p => p.id === newPayee.id);
          if (idx >= 0) {
            all[idx] = { ...all[idx], type, bankAccounts };
            localStorage.setItem('payees-app-data', JSON.stringify(all));
          }
        } catch {}
      }
      toast.success('Beneficiario creado');
    }
    resetForm();
    setDialogOpen(false);
  };

  return (
    <AppLayout title="Beneficiarios">
      <div className="container py-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {payeeStats.length} {payeeStats.length === 1 ? 'beneficiario' : 'beneficiarios'}
          </span>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Nuevo
          </Button>
        </div>

        {payeeStats.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/60 p-12 text-center shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Los beneficiarios aparecerán aquí cuando los crees</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {payeeStats.map((payee) => (
              <Link
                key={payee.id}
                to={`/payee/${payee.id}`}
                className="flex items-center gap-3 bg-card rounded-xl border border-border/40 px-4 py-3 hover:border-primary/30 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">{payee.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm text-foreground truncate">{payee.name}</h3>
                    {payee.type && payee.type !== 'otro' && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground">
                        {BENEFICIARY_TYPE_LABELS[payee.type]}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <CreditCard className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {payee.count} pago{payee.count !== 1 ? 's' : ''} · {formatCurrency(payee.total)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {payee.pending > 0 && (
                    <span className="text-[10px] font-medium text-pending bg-pending/10 px-1.5 py-0.5 rounded-full">
                      {payee.pending}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                    onClick={(e) => openEdit(payee, e)}
                    title="Editar beneficiario"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                </div>
              </Link>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { resetForm(); } setDialogOpen(open); }}>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>{editingPayee ? 'Editar beneficiario' : 'Nuevo beneficiario'}</DialogTitle>
              <DialogDescription>
                {editingPayee ? 'Modifica los datos de este beneficiario.' : 'Agrega un nuevo beneficiario.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
              <div className="space-y-2">
                <Label>Nombre <span className="text-destructive">*</span></Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del beneficiario" />
              </div>

              <div className="space-y-2">
                <Label>Tipo de beneficiario</Label>
                <Select value={type} onValueChange={v => setType(v as BeneficiaryType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(BENEFICIARY_TYPE_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Cuentas bancarias</Label>
                  <Button variant="ghost" size="sm" onClick={addBankAccount} className="gap-1 text-xs h-7">
                    <Plus className="w-3 h-3" /> Agregar cuenta
                  </Button>
                </div>

                {bankAccounts.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3 bg-muted/30 rounded-lg">
                    Sin cuentas bancarias
                  </p>
                )}

                {bankAccounts.map((account, idx) => (
                  <div key={account.id} className="space-y-2 p-3 bg-muted/30 rounded-lg relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground">Cuenta {idx + 1}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeBankAccount(account.id)} title="Eliminar cuenta">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Banco"
                      value={account.bank}
                      onChange={e => updateBankAccount(account.id, 'bank', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Titular de la cuenta"
                      value={account.accountHolder}
                      onChange={e => updateBankAccount(account.id, 'accountHolder', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Número de cuenta"
                      value={account.accountNumber}
                      onChange={e => updateBankAccount(account.id, 'accountNumber', e.target.value)}
                      className="h-8 text-sm"
                    />
                    <Input
                      placeholder="Código interbancario (CCI)"
                      value={account.interbankCode}
                      onChange={e => updateBankAccount(account.id, 'interbankCode', e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-border bg-card px-6 py-4 flex gap-3">
              <Button variant="outline" onClick={() => { resetForm(); setDialogOpen(false); }} className="flex-1">Cancelar</Button>
              <Button onClick={handleSubmit} disabled={!name.trim()} className="flex-1">
                {editingPayee ? 'Guardar cambios' : 'Crear beneficiario'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default BeneficiariesPage;
