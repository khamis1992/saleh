import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/providers/LocaleContext';

interface PrintTemplateProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onPrint?: () => void;
}

export function PrintTemplate({ title, subtitle, children, onPrint }: PrintTemplateProps) {
  const { t, tt, dir } = useLocale();
  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }
    window.print();
  };

  return (
    <>
      {/* Print button */}
      <div className="print:hidden mb-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="h-8 text-xs gap-1.5"
        >
          <Printer className="h-3.5 w-3.5" />
          طباعة
        </Button>
      </div>

      {/* Printable content */}
      <div className="print:block">
        {/* Print header — visible only when printing */}
        <div className="hidden print:block mb-6 text-center border-b-2 border-[#e5edf5] pb-4">
          <h1 className="text-xl font-bold text-[#061b31]">{title}</h1>
          {subtitle && <p className="text-sm text-[#64748d] mt-1">{subtitle}</p>}
          <p className="text-xs text-[#64748d] mt-2">
            تاريخ الطباعة: {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Content — visible on screen and print */}
        <div className="print:shadow-none print:border-none bg-white rounded-xl shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] border border-[#e5edf5] p-6">
          {children}
        </div>

        {/* Print footer */}
        <div className="hidden print:block mt-8 text-center text-xs text-[#64748d] border-t border-[#e5edf5] pt-4">
          <p>تم إنشاء هذا المستند بواسطة نظام عقاري ERP</p>
          <p className="mt-1">Land2 Real Estate Management System</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border-none { border: none !important; }
          @page { margin: 2cm; size: A4; }
        }
      `}</style>
    </>
  );
}
