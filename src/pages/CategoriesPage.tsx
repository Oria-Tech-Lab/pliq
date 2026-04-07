import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { PaymentCategory, CATEGORY_LABELS } from '@/types/payment';
import { Zap, CreditCard, RefreshCw, User, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const CATEGORY_ICONS: Record<string, typeof Zap> = {
  services: Zap,
  debts: CreditCard,
  subscriptions: RefreshCw,
  personal: User,
  other: MoreHorizontal,
};

const CategoriesPage = () => {
  const { flattenedPayments: payments } = usePaymentPlans();
  const { categories: customCategories, addCategory, deleteCategory } = useCustomCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);

  const categoryStats = useMemo(() => {
    // Built-in categories
    const builtIn = (Object.keys(CATEGORY_LABELS) as PaymentCategory[]).map(cat => {
      const catPayments = payments.filter(p => p.category === cat);
      const total = catPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
      const pending = catPayments.filter(p => p.status !== 'paid').length;
      return { key: cat, label: CATEGORY_LABELS[cat], count: catPayments.length, total, pending, isCustom: false };
    });

    // Custom categories
    const custom = customCategories.map(cc => {
      const catPayments = payments.filter(p => p.category === cc.id);
      const total = catPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
      const pending = catPayments.filter(p => p.status !== 'paid').length;
      return { key: cc.id, label: cc.name, count: catPayments.length, total, pending, isCustom: true };
    });

    return [...builtIn, ...custom].filter(c => c.count > 0 || c.isCustom).sort((a, b) => b.total - a.total);
  }, [payments, customCategories]);

  const totalAmount = categoryStats.reduce((s, c) => s + c.total, 0);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addCategory(newName);
    setNewName('');
    setDialogOpen(false);
  };

  return (
    <AppLayout title="Categorías">
      <div className="container py-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {categoryStats.length} {categoryStats.length === 1 ? 'categoría' : 'categorías'}
          </span>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Nueva categoría
          </Button>
        </div>

        {categoryStats.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/60 p-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Las categorías aparecerán aquí cuando crees pagos</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {categoryStats.map(({ key, label, count, total, pending, isCustom }) => {
              const Icon = CATEGORY_ICONS[key] || MoreHorizontal;
              const percentage = totalAmount > 0 ? (total / totalAmount) * 100 : 0;
              return (
                <div key={key} className="bg-card rounded-xl border border-border/40 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm text-foreground">{label}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{formatCurrency(total)}</span>
                          {isCustom && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteCategory(key)}>
                              <Trash2 className="w-3 h-3 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {count} pago{count !== 1 ? 's' : ''} · {pending} pendiente{pending !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{percentage.toFixed(0)}%</span>
                      </div>
                      {count > 0 && (
                        <div className="mt-2 h-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${percentage}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Nueva categoría</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label>Nombre</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre de la categoría" />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleAdd} disabled={!newName.trim()}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default CategoriesPage;
