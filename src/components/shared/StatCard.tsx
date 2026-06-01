import { formatQARInt, formatThousand } from '@/lib/format';
import { cn } from '@/utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
  className?: string;
  format?: 'number' | 'currency' | 'percentage';
}

export function StatCard({ title, value, icon: Icon, trend, className, format = 'number' }: StatCardProps) {
  const formatValue = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return val;
    if (format === 'currency') {
      return formatQARInt(num);
    }
    if (format === 'percentage') return `${num}%`;
    return formatThousand(num);
  };

  return (
    <div className={cn('stat-card group', className)}>
      <div className="flex items-start justify-between mb-1">
        <span className="stat-label">{title}</span>
        <div className="stat-icon group-hover:scale-110 transition-transform duration-200">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="stat-value" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {formatValue(value)}
      </div>
      {trend && (
        <div className={cn(
          'inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium',
          trend.isPositive 
            ? 'bg-[#27a644]/10 text-[#27a644]' 
            : 'bg-red-500/10 text-red-400'
        )}>
          <span className="text-[10px]">{trend.isPositive ? '↑' : '↓'}</span>
          {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  );
}