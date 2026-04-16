import { useState, useMemo, useCallback } from 'react';
import { Payment, PaymentStatus, PaymentCategory, QuickFilter } from '@/types/payment';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { usePayees } from '@/hooks/usePayees';
import { AppLayout } from '@/components/layout/AppLayout';
import { SummaryCards } from '@/components/payments/SummaryCards';
import { PaymentFilters } from '@/components/payments/PaymentFilters';
import { PaymentList } from '@/components/payments/PaymentList';
import { NotificationBar } from '@/components/payments/NotificationBar';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { isToday, isThisWeek, isThisMonth } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';

const QUICK_FILTER_TITLES: Record<NonNullable<QuickFilter>, string> = {
  overdue: 'Pagos vencidos',
  today: 'Pagos de hoy',
  week: 'Pagos de esta semana',
  month: 'Pagos de este mes',
  pending: 'Por pagar este mes',
  paid_month: 'Pagados este mes',
};

const VALID_FILTERS: QuickFilter[] = ['overdue', 'today', 'week', 'month', 'pending', 'paid_month'];

const Index = () => {
  const { flattenedPayments, isLoading, markPaidByInstanceId, markPendingByInstanceId, addPlan } = usePaymentPlans();
  const { payees } = usePayees([], () => {});
  const { prefs, loading: prefsLoading, updatePrefs } = useUserPreferences();
  const { userName } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialFilter = searchParams.get('filter') as QuickFilter;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>(
    initialFilter && VALID_FILTERS.includes(initialFilter) ? initialFilter : 'pending'
  );

  const payments = flattenedPayments;

  const quickFilteredPayments = useMemo(() => {
    if (!quickFilter) return payments;
    switch (quickFilter) {
      case 'overdue': return payments.filter(p => p.status === 'overdue');
      case 'today': return payments.filter(p => p.status !== 'paid' && isToday(new Date(p.dueDate)));
      case 'week': return payments.filter(p => p.status !== 'paid' && isThisWeek(new Date(p.dueDate), { weekStartsOn: 1 }));
      case 'month': return payments.filter(p => isThisMonth(new Date(p.dueDate)));
      case 'pending': return payments.filter(p => p.status !== 'paid' && isThisMonth(new Date(p.dueDate)));
      case 'paid_month': return payments.filter(p => p.status === 'paid' && p.paidDate && isThisMonth(new Date(p.paidDate)));
      default: return payments;
    }
  }, [payments, quickFilter]);

  const sectionTitle = quickFilter ? QUICK_FILTER_TITLES[quickFilter] : 'Todos los pagos';
  const displayCount = quickFilter ? quickFilteredPayments.length : payments.length;

  const handleAddPayment = () => navigate('/planes');

  const handleMarkAsPaid = (id: string) => {
    markPaidByInstanceId(id);
    const payment = payments.find(p => p.id === id);
    toast.success('Marcado como pagado', {
      description: payment?.name,
      action: { label: 'Deshacer', onClick: () => markPendingByInstanceId(id) },
    });
  };

  const showOnboarding = !prefsLoading && !prefs.onboardingCompleted;

  const handleOnboardingComplete = useCallback(async (paymentData?: {
    name: string; amount: number; startDate: string; frequency: any;
    categoryId: string; methodId: string; payeeId?: string;
  }) => {
    if (paymentData) {
      const payee = payees.find(p => p.id === paymentData.payeeId);
      await addPlan({
        name: paymentData.name,
        type: 'recurring',
        category: paymentData.categoryId,
        amount: paymentData.amount,
        payTo: payee?.name || '',
        payeeId: paymentData.payeeId,
        paymentMethod: paymentData.methodId,
        notes: '',
        startDate: paymentData.startDate,
        frequency: paymentData.frequency,
        totalPayments: 12,
        notificationsEnabled: true,
        notificationDaysBefore: 1,
        notificationTime: '09:00',
      });
    }
  }, [addPlan, payees]);

  const handleOnboardingSkip = useCallback(() => {
    updatePrefs({ onboardingCompleted: true });
  }, [updatePrefs]);

  const handleQuickFilter = (filter: QuickFilter) => {
    setQuickFilter(filter);
    if (filter) { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); }
  };

  if (isLoading) {
    return (
      <AppLayout title="Inicio">
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout onAddPayment={handleAddPayment} title="Inicio">
      <div className="container py-4 space-y-4">
        {/* Notification bar */}
        <NotificationBar payments={payments} />

        <section className="animate-slide-up">
          <SummaryCards payments={payments} activeFilter={quickFilter} onCardClick={handleQuickFilter} />
        </section>

        <section className="space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-lg text-foreground">{sectionTitle}</h2>
              {quickFilter && (
                <Button variant="ghost" size="sm" onClick={() => setQuickFilter(null)} className="h-7 px-2 text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5 mr-1" /> Limpiar
                </Button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {displayCount} {displayCount === 1 ? 'pago' : 'pagos'}
            </span>
          </div>

          <PaymentFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} statusFilter={statusFilter} onStatusChange={setStatusFilter} categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter} />

          <PaymentList
            payments={quickFilteredPayments}
            payees={payees}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            onMarkAsPaid={handleMarkAsPaid}
            onMarkAsPending={markPendingByInstanceId}
            onEdit={() => navigate('/planes')}
            onDelete={() => {}}
            onAddPayment={handleAddPayment}
            pageSize={10}
          />
        </section>
      </div>

      <Toaster position="bottom-right" />

      <OnboardingModal
        open={showOnboarding}
        userName={userName}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </AppLayout>
  );
};

export default Index;
