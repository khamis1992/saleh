import { ReactNode } from 'react';
import { FileX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface EmptyStateWithActionProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Reusable empty state with primary + secondary action buttons.
 * Used by every list page and queue page in the system.
 * Replaces the "لا توجد بيانات" placeholder with a guided next step.
 */
export function EmptyStateWithAction({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  size = 'md',
}: EmptyStateWithActionProps) {
  const iconWrap = size === 'lg' ? 'h-20 w-20' : size === 'sm' ? 'h-12 w-12' : 'h-16 w-16';
  const iconInner = size === 'lg' ? 'h-10 w-10' : size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const titleSize = size === 'lg' ? 'text-xl' : 'text-base';
  const pad = size === 'lg' ? 'py-16' : size === 'sm' ? 'py-6' : 'py-12';

  return (
    <div className={cn('flex flex-col items-center justify-center text-center', pad, className)} dir="rtl">
      <div className={cn(iconWrap, 'rounded-full bg-muted flex items-center justify-center mb-4')}>
        {icon || <FileX className={cn(iconInner, 'text-muted-foreground')} />}
      </div>
      <h3 className={cn(titleSize, 'font-semibold mb-1 text-gray-900')}>{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-5 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="bg-[#3B82F6] hover:bg-blue-600 text-white h-9 rounded-lg px-4 text-sm gap-1.5"
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              className="h-9 rounded-lg px-4 text-sm gap-1.5"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
