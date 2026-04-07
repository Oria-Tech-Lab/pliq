import { Users, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PayeeEntry {
  id: string;
  name: string;
  paid: number;
  pending: number;
}

interface Props {
  payeeEntries: PayeeEntry[];
  formatCurrency: (n: number) => string;
}

export const PayeeReport = ({ payeeEntries, formatCurrency }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm text-foreground">Pagos por beneficiario</h3>
      </div>

      {payeeEntries.length > 0 ? (
        <div className="space-y-3">
          {payeeEntries.map((entry) => {
            const total = entry.paid + entry.pending;
            const paidPct = total > 0 ? (entry.paid / total) * 100 : 0;
            const isNavigable = entry.id !== 'no-payee';

            return (
              <button
                key={entry.id}
                onClick={() => isNavigable && navigate(`/payee/${entry.id}`)}
                disabled={!isNavigable}
                className={`w-full text-left space-y-1.5 ${isNavigable ? 'group cursor-pointer' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{entry.name}</span>
                    {isNavigable && <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}
                  </div>
                  <span className="text-sm tabular-nums text-foreground font-medium shrink-0">{formatCurrency(total)}</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                  {paidPct > 0 && <div className="h-full bg-paid transition-all" style={{ width: `${paidPct}%` }} />}
                  {paidPct < 100 && <div className="h-full bg-pending transition-all" style={{ width: `${100 - paidPct}%` }} />}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-paid inline-block" />
                    Pagado: {formatCurrency(entry.paid)}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-pending inline-block" />
                    Pendiente: {formatCurrency(entry.pending)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No hay datos en este período</p>
      )}
    </div>
  );
};
