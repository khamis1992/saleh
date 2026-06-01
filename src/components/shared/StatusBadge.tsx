import { cn } from '@/utils/cn';
import { getStatusColor } from '@/constants/status-colors';

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'badge',
      getStatusColor(status),
      className
    )}>
      {label || status.replace(/_/g, ' ')}
    </span>
  );
}
