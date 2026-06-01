import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/utils/cn';

interface KpiCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: ReactNode;
  /** color: 'blue' | 'green' | 'red' | 'amber' | 'violet' | 'gray' | 'orange' | 'emerald' | 'cyan' */
  color?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; label: string };
  to?: string;
  className?: string;
}

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', ring: 'hover:ring-blue-200' },
  green: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'hover:ring-emerald-200' },
  red: { bg: 'bg-red-50', text: 'text-red-600', ring: 'hover:ring-red-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', ring: 'hover:ring-amber-200' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', ring: 'hover:ring-orange-200' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', ring: 'hover:ring-violet-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', ring: 'hover:ring-emerald-200' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', ring: 'hover:ring-cyan-200' },
  gray: { bg: 'bg-gray-100', text: 'text-gray-500', ring: 'hover:ring-gray-200' },
};

/**
 * Standard KPI card used on dashboards, work centers, and queues.
 * White card, colored icon background, click-through optional.
 */
export function KpiCard({ label, value, sublabel, icon, color = 'blue', trend, to, className }: KpiCardProps) {
  const c = colorMap[color] || colorMap.blue;
  const content = (
    <Card className={cn(
      'border border-gray-100 shadow-sm hover:shadow-md transition-all hover:ring-4 cursor-pointer',
      c.ring,
      className,
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-gray-500 leading-tight">{label}</p>
            <p className="text-[22px] font-extrabold text-[#1E293B] mt-1.5 tabular-nums leading-tight">{value}</p>
            {sublabel && <p className="text-[11px] text-gray-400 mt-0.5">{sublabel}</p>}
            {trend && (
              <div className={cn(
                'flex items-center gap-1 mt-2 text-[11px] font-semibold',
                trend.direction === 'up' ? 'text-emerald-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-500',
              )}>
                {trend.direction === 'up' ? <TrendingUp className="h-3 w-3" /> : trend.direction === 'down' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                <span>{trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', c.bg)}>
            <div className={cn(c.text)}>{icon}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
