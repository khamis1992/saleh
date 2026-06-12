import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLocale } from '@/providers/LocaleContext';

interface SimplifiedFormSectionProps {
  title?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function SimplifiedFormSection({ title = 'تفاصيل إضافية', children, defaultOpen = false }: SimplifiedFormSectionProps) {
  const { t, tt, dir } = useLocale();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[#e5edf5] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#f6f9fc] hover:bg-[#f6f9fc] transition-colors text-sm font-medium text-[#64748d]"
      >
        <span>📋 {title}</span>
        <ChevronDown className={cn('h-4 w-4 text-[#64748d] transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}

interface RequiredFieldProps {
  children: React.ReactNode;
  label: string;
  help?: string;
}

export function RequiredField({ children, label, help }: RequiredFieldProps) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-1.5">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <span className="text-red-500 text-xs">*</span>
        {help && (
          <span className="text-xs text-[#64748d]">{help}</span>
        )}
      </div>
      {children}
    </div>
  );
}
