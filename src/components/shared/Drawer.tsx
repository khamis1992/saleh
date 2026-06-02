import { ReactNode, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  side?: 'right' | 'left' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  footer?: ReactNode;
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

/**
 * Side drawer / sheet for detail views, forms, and quick actions.
 * Slides in from right (default), left, or bottom.
 */
export function Drawer({ open, onClose, title, description, children, side = 'right', size = 'md', footer }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const sideClass = {
    right: 'inset-y-0 right-0',
    left: 'inset-y-0 left-0',
    bottom: 'inset-x-0 bottom-0 max-h-[80vh]',
  }[side];

  const animClass = {
    right: 'animate-in slide-in-from-right',
    left: 'animate-in slide-in-from-left',
    bottom: 'animate-in slide-in-from-bottom',
  }[side];

  return (
    <div className="fixed inset-0 z-50" dir="rtl">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'absolute bg-white shadow-2xl flex flex-col overflow-hidden',
        sideClass, animClass,
        side === 'bottom' ? sizeMap[size] : `w-full ${sizeMap[size]}`,
      )}>
        {(title || description) && (
          <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              {title && <h2 className="text-base font-bold text-gray-900">{title}</h2>}
              {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50">{footer}</div>}
      </div>
    </div>
  );
}
