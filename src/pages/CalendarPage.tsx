import { useState, useMemo } from 'react';
import { usePaymentPlans } from '@/hooks/usePaymentPlans';
import { usePayees } from '@/hooks/usePayees';
import { AppLayout } from '@/components/layout/AppLayout';
import { PaymentCard } from '@/components/payments/PaymentCard';
import { Button } from '@/components/ui/button';
import { Payment } from '@/types/payment';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const CalendarPage = () => {
  const { flattenedPayments: payments, isLoading, markPaidByInstanceId, markPendingByInstanceId } = usePaymentPlans();
  const { payees } = usePayees([], () => {});
  const navigate = useNavigate();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const paymentsByDay = useMemo(() => {
    const map = new Map<string, Payment[]>();
    payments.forEach(p => {
      const key = format(new Date(p.dueDate), 'yyyy-MM-dd');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [payments]);

  const selectedDayPayments = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return (paymentsByDay.get(key) || []).sort((a, b) => {
      if (a.status === 'overdue' && b.status !== 'overdue') return -1;
      if (b.status === 'overdue' && a.status !== 'overdue') return 1;
      if (a.status === 'paid' && b.status !== 'paid') return 1;
      if (b.status === 'paid' && a.status !== 'paid') return -1;
      return 0;
    });
  }, [selectedDay, paymentsByDay]);

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const handleMarkAsPaid = (id: string) => {
    markPaidByInstanceId(id);
    const payment = payments.find(p => p.id === id);
    toast.success('Marcado como pagado', {
      description: payment?.name,
      action: { label: 'Deshacer', onClick: () => markPendingByInstanceId(id) },
    });
  };

  if (isLoading) {
    return (
      <AppLayout title="Calendario">
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">Cargando...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout onAddPayment={() => navigate('/planes')} title="Calendario">
      <div className="container py-6 space-y-6">
        <div className="flex items-center justify-between animate-slide-up">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} title="Mes anterior">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-display font-bold text-xl text-foreground capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} title="Mes siguiente">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="animate-slide-up rounded-2xl bg-card p-4" style={{ animationDelay: '0.1s', boxShadow: '0 1px 3px 0 hsl(220 25% 14% / 0.04)' }}>
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const dayPayments = paymentsByDay.get(key) || [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const selected = selectedDay && isSameDay(day, selectedDay);

              const hasOverdue = dayPayments.some(p => p.status === 'overdue');
              const hasPending = dayPayments.some(p => p.status === 'pending');
              const allPaid = dayPayments.length > 0 && dayPayments.every(p => p.status === 'paid');

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    'relative flex flex-col items-center rounded-xl p-1.5 min-h-[60px] sm:min-h-[76px] transition-all text-sm',
                    inMonth ? 'text-foreground' : 'text-muted-foreground/30',
                    today && 'ring-2 ring-primary/50 ring-offset-1 ring-offset-card',
                    selected && 'bg-primary/8',
                    !selected && inMonth && 'hover:bg-muted/50',
                  )}
                >
                  <span className={cn('font-medium text-xs sm:text-sm', today && 'text-primary font-bold')}>
                    {format(day, 'd')}
                  </span>
                  {dayPayments.length > 0 && inMonth && (
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                      <div className="flex gap-0.5">
                        {hasOverdue && <span className="w-2 h-2 rounded-full bg-overdue" />}
                        {hasPending && <span className="w-2 h-2 rounded-full bg-pending" />}
                        {allPaid && <span className="w-2 h-2 rounded-full bg-paid" />}
                      </div>
                      <span className="text-[10px] text-muted-foreground hidden sm:block">
                        {dayPayments.length} {dayPayments.length === 1 ? 'pago' : 'pagos'}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {selectedDay && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-foreground capitalize">
                {format(selectedDay, "EEEE d 'de' MMMM", { locale: es })}
              </h3>
              <span className="text-sm text-muted-foreground">
                {selectedDayPayments.length} {selectedDayPayments.length === 1 ? 'pago' : 'pagos'}
              </span>
            </div>

            {selectedDayPayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No hay pagos para este día</div>
            ) : (
              <div className="space-y-3">
                {selectedDayPayments.map(payment => (
                  <PaymentCard
                    key={payment.id}
                    payment={payment}
                    payees={payees}
                    onMarkAsPaid={handleMarkAsPaid}
                    onMarkAsPending={markPendingByInstanceId}
                    onEdit={() => navigate('/planes')}
                    onDelete={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Toaster position="bottom-right" />
    </AppLayout>
  );
};

export default CalendarPage;
