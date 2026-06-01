import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

export type WorkflowStepStatus = 'completed' | 'rejected' | 'pending' | 'current';

export interface WorkflowStep {
  key: string;
  label: string;
  status: WorkflowStepStatus;
  completedAt?: string;
  completedBy?: string;
  note?: string;
}

interface WorkflowTimelineProps {
  steps: WorkflowStep[];
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

/**
 * Reusable workflow timeline component.
 * Used by all detail pages (project, lease, claim, maintenance) to show
 * the current position in the workflow at a glance.
 */
export function WorkflowTimeline({ steps, orientation = 'horizontal', className }: WorkflowTimelineProps) {
  if (orientation === 'vertical') {
    return (
      <div className={cn('space-y-3', className)} dir="rtl">
        {steps.map((step, i) => (
          <div key={step.key} className="flex items-start gap-3">
            <StepCircle status={step.status} index={i} />
            <div className="flex-1 min-w-0 pt-0.5">
              <p className={cn(
                'text-sm font-medium',
                step.status === 'completed' ? 'text-emerald-700' :
                step.status === 'rejected' ? 'text-red-700' :
                step.status === 'current' ? 'text-blue-700' : 'text-gray-500'
              )}>{step.label}</p>
              {(step.completedAt || step.completedBy) && (
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {step.completedBy && <span>{step.completedBy}</span>}
                  {step.completedBy && step.completedAt && <span> · </span>}
                  {step.completedAt && <span>{step.completedAt}</span>}
                </p>
              )}
              {step.note && (
                <p className="text-[11px] text-muted-foreground italic mt-0.5">{step.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center w-full', className)} dir="rtl">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={step.key} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <StepCircle status={step.status} index={i} size="sm" />
              <span className={cn(
                'text-[10px] font-medium text-center whitespace-nowrap max-w-[80px] truncate',
                step.status === 'completed' ? 'text-emerald-700' :
                step.status === 'rejected' ? 'text-red-700' :
                step.status === 'current' ? 'text-blue-700' : 'text-gray-400'
              )} title={step.label}>{step.label}</span>
            </div>
            {!isLast && (
              <div className={cn(
                'h-0.5 flex-1 mx-1.5 rounded-full transition-colors',
                step.status === 'completed' ? 'bg-emerald-300' : 'bg-gray-200'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepCircle({ status, index, size = 'md' }: { status: WorkflowStepStatus; index: number; size?: 'sm' | 'md' }) {
  const wrap = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  if (status === 'completed') {
    return (
      <div className={cn(wrap, 'rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold shadow-sm')}>
        <Check className={icon} />
      </div>
    );
  }
  if (status === 'rejected') {
    return (
      <div className={cn(wrap, 'rounded-full bg-red-500 text-white flex items-center justify-center font-bold shadow-sm')}>
        <X className={icon} />
      </div>
    );
  }
  if (status === 'current') {
    return (
      <div className={cn(wrap, 'rounded-full bg-blue-500 text-white flex items-center justify-center font-bold shadow-sm ring-4 ring-blue-100 animate-pulse')}>
        <Clock className={icon} />
      </div>
    );
  }
  return (
    <div className={cn(wrap, 'rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-semibold border-2 border-gray-200')}>
      {index + 1}
    </div>
  );
}
