import { ReactNode } from 'react';
import { formatQARInt } from '@/lib/format';
import { cn } from '@/utils/cn';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, Clock, Circle, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

// ============================================================
// 1. FormSection - wrapper for form field groups with title
// ============================================================
interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn('space-y-3', className)} dir="rtl">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ============================================================
// 2. ConfirmDialog - confirmation dialog with title, message, actions
// ============================================================
interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={variant === 'destructive' ? 'destructive' : 'default'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// 3. Timeline - horizontal/vertical timeline with steps
// ============================================================
interface TimelineStep {
  label: string;
  status: 'completed' | 'current' | 'pending';
  timestamp?: string;
  description?: string;
}

interface TimelineProps {
  steps: TimelineStep[];
  direction?: 'horizontal' | 'vertical';
  className?: string;
}

export function Timeline({ steps, direction = 'horizontal', className }: TimelineProps) {
  if (direction === 'vertical') {
    return (
      <div className={cn('space-y-0', className)} dir="rtl">
        {steps.map((step, i) => (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-6 w-6 rounded-full flex items-center justify-center border-2 shrink-0',
                  step.status === 'completed' && 'bg-green-500 border-green-500 text-white',
                  step.status === 'current' && 'bg-amber-500 border-amber-500 text-white',
                  step.status === 'pending' && 'bg-gray-100 border-gray-300 text-gray-400',
                )}
              >
                {step.status === 'completed' && <Check className="h-3 w-3" />}
                {step.status === 'current' && <Clock className="h-3 w-3" />}
                {step.status === 'pending' && <Circle className="h-3 w-3" />}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 flex-1 min-h-[20px]',
                    step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200',
                  )}
                />
              )}
            </div>
            <div className="pb-4">
              <p
                className={cn(
                  'text-sm font-medium',
                  step.status === 'pending' && 'text-muted-foreground',
                )}
              >
                {step.label}
              </p>
              {step.timestamp && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.timestamp}</p>
              )}
              {step.description && (
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Horizontal
  return (
    <div className={cn('flex items-start gap-1', className)} dir="rtl">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-1 flex-1">
          <div className="flex flex-col items-center flex-1">
            <div
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0',
                step.status === 'completed' && 'bg-green-500 border-green-500 text-white',
                step.status === 'current' && 'bg-amber-500 border-amber-500 text-white',
                step.status === 'pending' && 'bg-gray-100 border-gray-300 text-gray-400',
              )}
            >
              {step.status === 'completed' && <Check className="h-4 w-4" />}
              {step.status === 'current' && <Clock className="h-4 w-4" />}
              {step.status === 'pending' && <Circle className="h-4 w-4" />}
            </div>
            <p
              className={cn(
                'text-xs mt-1 text-center',
                step.status === 'pending' && 'text-muted-foreground',
              )}
            >
              {step.label}
            </p>
            {step.timestamp && (
              <p className="text-[10px] text-muted-foreground text-center">{step.timestamp}</p>
            )}
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'h-0.5 mt-4 flex-1 min-w-[20px]',
                step.status === 'completed' ? 'bg-green-500' : 'bg-gray-200',
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 4. MoneyDisplay - format number as SAR currency
// ============================================================
interface MoneyDisplayProps {
  value: number;
  className?: string;
  showZero?: boolean;
}

export function MoneyDisplay({ value, className, showZero = true }: MoneyDisplayProps) {
  if (!showZero && value === 0) return <span className={className}>-</span>;
  const formatted = formatQARInt(value);
  return (
    <span className={cn('font-mono', className)} dir="rtl">
      {formatted}
    </span>
  );
}

// ============================================================
// 5. DateDisplay - format date string
// ============================================================
interface DateDisplayProps {
  value: string;
  className?: string;
  format?: 'full' | 'short' | 'relative';
}

export function DateDisplay({ value, className, format = 'short' }: DateDisplayProps) {
  if (!value) return <span className={cn('text-muted-foreground', className)}>-</span>;

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return <span className={className}>{value}</span>;

    let formatted: string;
    switch (format) {
      case 'full':
        formatted = new Intl.DateTimeFormat('ar-SA', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }).format(date);
        break;
      case 'relative': {
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) formatted = 'اليوم';
        else if (diffDays === 1) formatted = 'غداً';
        else if (diffDays === -1) formatted = 'أمس';
        else if (diffDays > 0 && diffDays < 30) formatted = `بعد ${diffDays} يوم`;
        else if (diffDays < 0 && diffDays > -30) formatted = `منذ ${Math.abs(diffDays)} يوم`;
        else formatted = new Intl.DateTimeFormat('ar-SA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(date);
        break;
      }
      default:
        formatted = new Intl.DateTimeFormat('ar-SA', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(date);
    }
    return <span className={cn('whitespace-nowrap', className)}>{formatted}</span>;
  } catch {
    return <span className={className}>{value}</span>;
  }
}

// ============================================================
// 6. KPIGrid - grid container for StatCard children
// ============================================================
interface KPIGridProps {
  children: ReactNode;
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function KPIGrid({ children, className, cols = 4 }: KPIGridProps) {
  const gridCols: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-4', gridCols[cols] || gridCols[4], className)}>
      {children}
    </div>
  );
}

// ============================================================
// 7. ReportCard - card with icon, title, description, link
// ============================================================
interface ReportCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  to: string;
  className?: string;
}

export function ReportCard({ icon: Icon, title, description, to, className }: ReportCardProps) {
  return (
    <Link to={to} className="block">
      <Card className={cn('hover:shadow-md transition-shadow cursor-pointer group', className)}>
        <CardContent className="p-5">
          <div className="flex items-start gap-4" dir="rtl">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">{title}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{description}</p>
            </div>
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================
// 8. PermissionGuard - wraps children, checks permission, hides if none
// ============================================================
interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

import { useAuth } from '@/providers/AuthContext';
import { getUserPermissions } from '@/services/stores';

function useHasPermission(permission: string): boolean {
  const { profile } = useAuth();

  if (!profile) {
    // No profile — fallback to localStorage check or default true
    try {
      const stored = localStorage.getItem('erp_permissions');
      if (stored) {
        const permissions: string[] = JSON.parse(stored);
        return permissions.includes(permission) || permissions.includes('*');
      }
    } catch { /* ignore */ }
    return true;
  }

  const userPermissions = getUserPermissions(profile.user_id);
  if (userPermissions.length === 0) {
    // No permissions assigned — grant access (allows admin/setup phase)
    return true;
  }
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(permission);
}

export function PermissionGuard({ permission, children, fallback }: PermissionGuardProps) {
  const hasPermission = useHasPermission(permission);
  if (!hasPermission) return <>{fallback || null}</>;
  return <>{children}</>;
}
