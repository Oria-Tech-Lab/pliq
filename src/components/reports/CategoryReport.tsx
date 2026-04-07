import { Tag } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const PIE_COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(160, 68%, 44%)',
  'hsl(43, 96%, 56%)',
  'hsl(0, 84%, 60%)',
  'hsl(280, 60%, 55%)',
  'hsl(190, 70%, 50%)',
  'hsl(25, 85%, 55%)',
  'hsl(330, 65%, 50%)',
];

interface Props {
  categoryEntries: [string, number][];
  categoryTotal: number;
  allCategoryLabels: Record<string, string>;
  formatCurrency: (n: number) => string;
}

export const CategoryReport = ({ categoryEntries, categoryTotal, allCategoryLabels, formatCurrency }: Props) => {
  const pieData = categoryEntries.map(([cat, amount]) => ({
    name: allCategoryLabels[cat] || cat,
    value: amount,
  }));

  return (
    <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Tag className="w-4 h-4 text-primary" />
        <h3 className="font-display font-semibold text-sm text-foreground">Gastos por categoría</h3>
      </div>

      {pieData.length > 0 ? (
        <>
          <div className="h-48 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2.5">
            {categoryEntries.map(([cat, amount], i) => {
              const pct = categoryTotal > 0 ? ((amount / categoryTotal) * 100).toFixed(1) : '0';
              return (
                <div key={cat} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground truncate">{allCategoryLabels[cat] || cat}</span>
                      <span className="text-sm tabular-nums text-foreground font-medium">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground tabular-nums w-10 text-right">{pct}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No hay pagos en este período</p>
      )}
    </div>
  );
};
