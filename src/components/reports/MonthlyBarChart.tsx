import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Payment {
  dueDate: string;
  amount: number;
  status: string;
}

interface Props {
  payments: Payment[];
  formatCurrency: (n: number) => string;
}

export const MonthlyBarChart = ({ payments, formatCurrency }: Props) => {
  const [showPaid, setShowPaid] = useState(true);
  const [showOverdue, setShowOverdue] = useState(true);

  const data = useMemo(() => {
    const months: Record<string, { paid: number; overdue: number }> = {};
    payments.forEach(p => {
      const key = format(new Date(p.dueDate), 'yyyy-MM');
      if (!months[key]) months[key] = { paid: 0, overdue: 0 };
      if (p.status === 'paid') months[key].paid += p.amount;
      else if (p.status === 'overdue') months[key].overdue += p.amount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({
        month: format(new Date(key + '-01'), 'MMM yy', { locale: es }),
        ...(showPaid ? { Pagado: val.paid } : {}),
        ...(showOverdue ? { Vencido: val.overdue } : {}),
      }));
  }, [payments, showPaid, showOverdue]);

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-sm text-foreground">Pagos mes a mes</h3>
        </div>
      </div>

      {/* Toggle buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setShowPaid(!showPaid)}
          className={cn(
            'px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all flex items-center gap-1.5',
            showPaid ? 'bg-paid/10 text-paid border-paid/30' : 'bg-muted text-muted-foreground border-border'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-paid" />
          Pagados
        </button>
        <button
          onClick={() => setShowOverdue(!showOverdue)}
          className={cn(
            'px-2.5 py-1 rounded-full text-[10px] font-medium border transition-all flex items-center gap-1.5',
            showOverdue ? 'bg-overdue/10 text-overdue border-overdue/30' : 'bg-muted text-muted-foreground border-border'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-overdue" />
          Vencidos
        </button>
      </div>

      {data.length > 0 ? (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="20%">
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={50} tickFormatter={(v) => `S/${(v/1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  fontSize: '11px',
                  padding: '8px 12px',
                }}
              />
              {showPaid && <Bar dataKey="Pagado" stackId="a" fill="hsl(var(--paid))" radius={[0, 0, 0, 0]} />}
              {showOverdue && <Bar dataKey="Vencido" stackId="a" fill="hsl(var(--overdue))" radius={[4, 4, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No hay datos en este período</p>
      )}
    </div>
  );
};
