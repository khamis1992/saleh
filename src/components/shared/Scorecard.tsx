import { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface ScorecardProps {
  label: string;
  value: string | number;
  target?: string | number;
  /** % difference vs target. Green if positive direction, red if reverse. */
  delta?: { value: number; direction: 'up-good' | 'down-good' | 'neutral' };
  sublabel?: string;
  icon?: ReactNode;
  iconBg?: string;
  className?: string;
}

/**
 * Performance scorecard with target + delta indicator.
 * Used for center KPIs and contractor/vendor scorecards.
 */
export function Scorecard({ label, value, target, delta, sublabel, icon, iconBg = 'bg-blue-50', className }: ScorecardProps) {
  const isGood = delta ? (delta.direction === 'up-good' ? delta.value >= 0 : delta.direction === 'down-good' ? delta.value <= 0 : true) : true;
  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2.5', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12px] font-medium text-gray-500 leading-tight">{label}</p>
        {icon && <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', iconBg)}>{icon}</div>}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-[#1E293B] tabular-nums leading-tight">{value}</p>
        {sublabel && <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
      {(target || delta) && (
        <div className="flex items-center justify-between text-[11px]">
          {target && <span className="text-gray-400">الهدف: <span className="font-semibold text-gray-700">{target}</span></span>}
          {delta && (
            <span className={cn(
              'font-bold tabular-nums px-1.5 py-0.5 rounded',
              isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
            )}>
              {delta.value > 0 ? '+' : ''}{delta.value}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface ScorecardGridProps {
  title: string;
  subtitle?: string;
  scorecards: ScorecardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ScorecardGrid({ title, subtitle, scorecards, columns = 4, className }: ScorecardGridProps) {
  const colsMap = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 md:grid-cols-4' };
  return (
    <div className={className}>
      <div className="mb-3">
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className={cn('grid grid-cols-1 gap-3', colsMap[columns])}>
        {scorecards.map((sc, i) => <Scorecard key={i} {...sc} />)}
      </div>
    </div>
  );
}
