import { AlertTriangle, Trash2, CheckCircle2, XCircle, Ban, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';
import { useLocale } from '@/providers/LocaleContext';

export type ConfirmVariant = 'delete' | 'activate' | 'cancel' | 'approve' | 'close' | 'pay' | 'terminate';

interface ConfirmActionProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  variant: ConfirmVariant;
  title?: string;
  description?: string;
  impact?: string;
  undoable?: boolean;
}

function createVariantConfig(tt: (key: string, fallback: string) => string): Record<ConfirmVariant, {
  icon: React.ElementType;
  color: string;
  iconBg: string;
  buttonColor: string;
  confirmLabel: string;
  defaultTitle: string;
}> {
  return {
    delete: {
      icon: Trash2,
      color: 'text-[#ea2261]',
      iconBg: 'bg-red-50',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      confirmLabel: tt('common.confirmDelete', 'نعم، احذف'),
      defaultTitle: tt('common.deleteRecord', 'حذف السجل'),
    },
    activate: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
      confirmLabel: tt('common.confirmActivate', 'نعم، فعّل'),
      defaultTitle: tt('common.activate', 'تفعيل'),
    },
    cancel: {
      icon: XCircle,
      color: 'text-[#ea2261]',
      iconBg: 'bg-red-50',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      confirmLabel: tt('common.confirmCancel', 'نعم، ألغِ'),
      defaultTitle: tt('common.cancel', 'إلغاء'),
    },
    approve: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
      confirmLabel: tt('common.confirmApprove', 'نعم، اعتمد'),
      defaultTitle: tt('common.approve', 'اعتماد'),
    },
    close: {
      icon: Ban,
      color: 'text-[#64748d]',
      iconBg: 'bg-[#f6f9fc]',
      buttonColor: 'bg-gray-600 hover:bg-gray-700',
      confirmLabel: tt('common.confirmClose', 'نعم، أغلق'),
      defaultTitle: tt('common.close', 'إغلاق'),
    },
    pay: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      buttonColor: 'bg-emerald-600 hover:bg-emerald-700',
      confirmLabel: tt('common.confirmPay', 'نعم، ادفع'),
      defaultTitle: tt('common.paymentConfirm', 'تأكيد الدفع'),
    },
    terminate: {
      icon: AlertTriangle,
      color: 'text-[#ea2261]',
      iconBg: 'bg-red-50',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      confirmLabel: tt('common.confirmTerminate', 'نعم، أنهِ'),
      defaultTitle: tt('common.terminateContract', 'إنهاء العقد'),
    },
  };
}

export function ConfirmAction({
  open, onClose, onConfirm, variant,
  title, description, impact, undoable = false,
}: ConfirmActionProps) {
  const { tt } = useLocale();
  const VARIANT_CONFIG = createVariantConfig(tt);
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', config.iconBg)}>
              <Icon className={cn('h-6 w-6', config.color)} />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-[#273951]">
                {title || config.defaultTitle}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#64748d] mt-0.5">
                {tt('common.sureConfirm', 'هل أنت متأكد؟')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {description && (
            <p className="text-sm text-gray-700">{description}</p>
          )}

          {impact && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-[#9b6829] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800 mb-0.5">{tt('common.actionImpact', 'تأثير هذا الإجراء')}</p>
                  <p className="text-xs text-[#9b6829]">{impact}</p>
                </div>
              </div>
            </div>
          )}

          {!undoable && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-[#ea2261]">
                {'⚠️ '}{tt('common.cannotUndo', 'لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={onClose} className="h-9 text-sm">
            {tt('common.cancel', 'تراجع')}
          </Button>
          <Button
            onClick={() => { onConfirm(); onClose(); }}
            className={cn('h-9 text-sm text-white', config.buttonColor)}
          >
            {config.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
