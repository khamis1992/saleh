import { ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface NextBestActionProps {
  title: string;
  description?: string;
  actionLabel: string;
  actionTo?: string;
  onAction?: () => void;
  variant?: 'default' | 'warning' | 'success' | 'info';
  className?: string;
}

/**
 * Yellow/blue banner that shows the next step in a workflow.
 * Displayed at the top of any detail page that is mid-workflow.
 * Hides (return null) when the record is in a terminal state.
 */
export function NextBestAction({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  variant = 'info',
  className,
}: NextBestActionProps) {
  const variantMap = {
    default: 'bg-gray-50 border-gray-200 text-gray-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const buttonColor = {
    default: 'bg-gray-700 hover:bg-gray-800',
    warning: 'bg-amber-600 hover:bg-amber-700',
    success: 'bg-emerald-600 hover:bg-emerald-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  const content = (
    <div className={cn(
      'flex items-center gap-3 p-3.5 rounded-xl border',
      variantMap[variant],
      className,
    )} dir="rtl">
      <div className="h-9 w-9 rounded-lg bg-white/70 flex items-center justify-center shrink-0">
        <Sparkles className="h-4.5 w-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        {description && <p className="text-xs opacity-80 mt-0.5">{description}</p>}
      </div>
      {actionTo ? (
        <Button asChild size="sm" className={cn('text-white h-8 px-3 text-xs gap-1.5', buttonColor[variant])}>
          <Link to={actionTo}>
            {actionLabel}
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
        </Button>
      ) : (
        <Button onClick={onAction} size="sm" className={cn('text-white h-8 px-3 text-xs gap-1.5', buttonColor[variant])}>
          {actionLabel}
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );

  return content;
}
