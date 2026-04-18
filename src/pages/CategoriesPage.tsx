import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { useCustomCategories } from '@/hooks/useCustomCategories';
import { CustomCategory } from '@/types/payment';
import { Zap, CreditCard, RefreshCw, User, MoreHorizontal, Plus, Trash2, Pencil, Tag, Wallet, Heart, Home, Car, Utensils, GraduationCap, Briefcase, ShoppingBag, Plane, Smartphone, Music, Dumbbell, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { IconTooltip } from '@/components/ui/icon-tooltip';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatCurrency } from '@/lib/currency';

const ICON_OPTIONS = [
  { value: 'tag', label: 'Etiqueta', Icon: Tag },
  { value: 'zap', label: 'Rayo', Icon: Zap },
  { value: 'credit-card', label: 'Tarjeta', Icon: CreditCard },
  { value: 'wallet', label: 'Billetera', Icon: Wallet },
  { value: 'heart', label: 'Corazón', Icon: Heart },
  { value: 'home', label: 'Casa', Icon: Home },
  { value: 'car', label: 'Auto', Icon: Car },
  { value: 'utensils', label: 'Comida', Icon: Utensils },
  { value: 'graduation-cap', label: 'Educación', Icon: GraduationCap },
  { value: 'briefcase', label: 'Trabajo', Icon: Briefcase },
  { value: 'shopping-bag', label: 'Compras', Icon: ShoppingBag },
  { value: 'plane', label: 'Viaje', Icon: Plane },
  { value: 'smartphone', label: 'Teléfono', Icon: Smartphone },
  { value: 'music', label: 'Música', Icon: Music },
  { value: 'dumbbell', label: 'Gym', Icon: Dumbbell },
  { value: 'baby', label: 'Familia', Icon: Baby },
];

const ICON_MAP: Record<string, typeof Tag> = Object.fromEntries(ICON_OPTIONS.map(i => [i.value, i.Icon]));

const COLOR_OPTIONS = [
  { value: 'primary', label: 'Azul', class: 'bg-primary' },
  { value: 'emerald', label: 'Verde', class: 'bg-emerald-500' },
  { value: 'amber', label: 'Ámbar', class: 'bg-amber-500' },
  { value: 'rose', label: 'Rosa', class: 'bg-rose-500' },
  { value: 'violet', label: 'Violeta', class: 'bg-violet-500' },
  { value: 'cyan', label: 'Cian', class: 'bg-cyan-500' },
  { value: 'orange', label: 'Naranja', class: 'bg-orange-500' },
  { value: 'teal', label: 'Teal', class: 'bg-teal-500' },
];

const COLOR_BG_MAP: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  emerald: 'bg-emerald-500/10 text-emerald-600',
  amber: 'bg-amber-500/10 text-amber-600',
  rose: 'bg-rose-500/10 text-rose-600',
  violet: 'bg-violet-500/10 text-violet-600',
  cyan: 'bg-cyan-500/10 text-cyan-600',
  orange: 'bg-orange-500/10 text-orange-600',
  teal: 'bg-teal-500/10 text-teal-600',
};

function getIconComponent(iconValue?: string) {
  return ICON_MAP[iconValue || ''] || Tag;
}

function getColorClasses(colorValue?: string) {
  return COLOR_BG_MAP[colorValue || 'primary'] || COLOR_BG_MAP.primary;
}

const CategoriesPage = () => {
  const { flattenedPayments: payments } = usePaymentPlans();
  const { categories: customCategories, addCategory, updateCategory, deleteCategory } = useCustomCategories();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);

  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('tag');
  const [formColor, setFormColor] = useState('primary');
  const [formDescription, setFormDescription] = useState('');

  const { primaryCurrency } = useCurrency();

  const renderTotals = (map: Record<string, number>) => {
    const entries = Object.entries(map).filter(([, v]) => v > 0);
    if (entries.length === 0) return formatCurrency(0, primaryCurrency);
    return entries.map(([c, v]) => formatCurrency(v, c)).join(' · ');
  };

  const categoryStats = useMemo(() => {
    return customCategories.map(cc => {
      const catPayments = payments.filter(p => p.category === cc.id);
      const paid = catPayments.filter(p => p.status === 'paid');
      const totalsByCurrency = paid.reduce<Record<string, number>>((acc, p) => {
        const c = p.currency || primaryCurrency;
        acc[c] = (acc[c] || 0) + p.amount;
        return acc;
      }, {});
      const total = paid.reduce((s, p) => s + p.amount, 0); // for percent only
      const pending = catPayments.filter(p => p.status !== 'paid').length;
      return { key: cc.id, label: cc.name, count: catPayments.length, total, totalsByCurrency, pending, customData: cc };
    }).sort((a, b) => b.total - a.total);
  }, [payments, customCategories, primaryCurrency]);

  const totalAmount = categoryStats.reduce((s, c) => s + c.total, 0);

  const openCreate = () => {
    setFormName('');
    setFormIcon('tag');
    setFormColor('primary');
    setFormDescription('');
    setDialogOpen(true);
    setEditingCategory(null);
  };

  const openEdit = (cc: CustomCategory) => {
    setFormName(cc.name);
    setFormIcon(cc.icon || 'tag');
    setFormColor(cc.color || 'primary');
    setFormDescription(cc.description || '');
    setEditingCategory(cc);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    const extra = { icon: formIcon, color: formColor, description: formDescription.trim() || undefined };
    if (editingCategory) {
      updateCategory(editingCategory.id, { name: formName.trim(), ...extra });
      toast.success('Categoría actualizada');
    } else {
      addCategory(formName.trim(), extra);
      toast.success('Categoría creada');
    }
    setDialogOpen(false);
    setEditingCategory(null);
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteCategory(deletingId);
      toast.success('Categoría eliminada');
      setDeletingId(null);
    }
  };

  return (
    <AppLayout title="Categorías">
      <div className="container py-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {customCategories.length} {customCategories.length === 1 ? 'categoría' : 'categorías'}
          </span>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Nueva categoría
          </Button>
        </div>

        {customCategories.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/60 p-12 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">Sin categorías aún — crea una con el botón de arriba</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {categoryStats.map(({ key, label, count, total, totalsByCurrency, pending, customData }) => {
              const IconComp = getIconComponent(customData.icon);
              const colorClasses = getColorClasses(customData.color);
              const percentage = totalAmount > 0 ? (total / totalAmount) * 100 : 0;
              const canDelete = count === 0;

              return (
                <div key={key} className="bg-card rounded-xl border border-border/40 px-4 py-3.5 group">
                  <div className="flex items-center gap-3">
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', colorClasses)}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm text-foreground">{label}</h3>
                          {customData.description && (
                            <p className="text-[11px] text-muted-foreground truncate">{customData.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-foreground mr-1">{renderTotals(totalsByCurrency)}</span>
                          <IconTooltip label="Editar categoría">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                              onClick={() => openEdit(customData)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </IconTooltip>
                          {canDelete && (
                            <IconTooltip label="Eliminar categoría">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                onClick={() => setDeletingId(key)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </IconTooltip>
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

        {/* Create / Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setDialogOpen(false); setEditingCategory(null); } }}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
              <DialogDescription>
                {editingCategory ? 'Modifica los datos de esta categoría.' : 'Crea una nueva categoría personalizada.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nombre <span className="text-destructive">*</span></Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nombre de la categoría" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }} />
              </div>

              <div className="space-y-2">
                <Label>Ícono</Label>
                <div className="grid grid-cols-8 gap-1.5">
                  {ICON_OPTIONS.map(({ value, Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormIcon(value)}
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center transition-all border-2',
                        formIcon === value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-transparent bg-muted/50 text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map(({ value, class: cls }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormColor(value)}
                      className={cn(
                        'w-8 h-8 rounded-full transition-all border-2',
                        cls,
                        formColor === value
                          ? 'border-foreground scale-110 shadow-md'
                          : 'border-transparent hover:scale-105'
                      )}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Describe esta categoría..." rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); setEditingCategory(null); }}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!formName.trim()}>
                {editingCategory ? 'Guardar cambios' : 'Crear categoría'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta categoría?</AlertDialogTitle>
              <AlertDialogDescription>Esta categoría no tiene pagos asociados y se eliminará permanentemente.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default CategoriesPage;
