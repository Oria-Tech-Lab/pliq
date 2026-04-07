import { useRef } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

export type DatePreset = 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'all' | 'custom';

export const PRESET_LABELS: Record<DatePreset, string> = {
  week: 'Esta semana',
  month: 'Este mes',
  quarter: 'Trimestre',
  semester: 'Semestre',
  year: 'Este año',
  all: 'Todo',
  custom: 'Personalizado',
};

const PRESETS: DatePreset[] = ['week', 'month', 'quarter', 'semester', 'year', 'all'];

interface Props {
  activePreset: DatePreset;
  setActivePreset: (p: DatePreset) => void;
  customFrom?: Date;
  customTo?: Date;
  setCustomFrom: (d: Date | undefined) => void;
  setCustomTo: (d: Date | undefined) => void;
  dateRange: { from: Date; to: Date } | null;
}

export const DateFilterBar = ({ activePreset, setActivePreset, customFrom, customTo, setCustomFrom, setCustomTo, dateRange }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* Scrollable presets */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1.5 w-max pr-2">
            {PRESETS.map(preset => (
              <button
                key={preset}
                onClick={() => setActivePreset(preset)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap',
                  activePreset === preset
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                )}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
          </div>
        </div>

        {/* Fixed range button */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all border inline-flex items-center gap-1.5 shrink-0',
                activePreset === 'custom'
                  ? 'bg-accent text-accent-foreground border-accent-foreground/20 shadow-sm'
                  : 'bg-muted text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
              )}
            >
              <CalendarIcon className="w-3 h-3" />
              {activePreset === 'custom' && customFrom && customTo
                ? `${format(customFrom, 'dd/MM', { locale: es })} - ${format(customTo, 'dd/MM', { locale: es })}`
                : 'Rango'}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 flex flex-col gap-2" align="end">
            <div className="p-3 pb-0">
              <p className="text-xs font-medium text-muted-foreground mb-2">Selecciona el rango</p>
            </div>
            <Calendar
              mode="range"
              selected={customFrom && customTo ? { from: customFrom, to: customTo } : undefined}
              onSelect={(range) => {
                if (range?.from) setCustomFrom(range.from);
                if (range?.to) setCustomTo(range.to);
                if (range?.from && range?.to) setActivePreset('custom');
              }}
              numberOfMonths={1}
              locale={es}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {dateRange && (
        <p className="text-[11px] text-muted-foreground">
          {format(dateRange.from, "d 'de' MMMM yyyy", { locale: es })} — {format(dateRange.to, "d 'de' MMMM yyyy", { locale: es })}
        </p>
      )}
    </div>
  );
};
