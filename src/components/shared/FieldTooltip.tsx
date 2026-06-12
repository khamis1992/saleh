import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocale } from '@/providers/LocaleContext';

interface FieldTooltipProps {
  help: string;
  children?: React.ReactNode;
}

export function FieldTooltip({ help }: FieldTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gray-100 text-[#64748d] text-xs font-bold cursor-help hover:bg-[rgba(83,58,253,0.10)] hover:text-[#533afd] transition-colors ml-1">
          ?
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[280px] text-xs leading-relaxed">
        {help}
      </TooltipContent>
    </Tooltip>
  );
}

// Pre-defined tooltips for common fields
export function createFieldHelp(tt: (key: string, fallback: string) => string): Record<string, string> {
  return {
    // Tenant fields
    full_name: tt('fieldHelp.full_name', 'الاسم الكامل للمستأجر كما هو مكتوب في الهوية.'),
    phone: tt('fieldHelp.phone', 'رقم الجوال الأساسي للمستأجر. سيتم إرسال رسائل التذكير على هذا الرقم.'),
    email: tt('fieldHelp.email', 'البريد الإلكتروني. اختياري لكن مفيد لإرسال الفواتير.'),
    tenant_type: tt('fieldHelp.tenant_type', 'فرد: شخص واحد. شركة: مؤسسة تجارية.'),
    national_id: tt('fieldHelp.national_id', 'رقم الهوية أو الإقامة للمستأجر.'),

    // Lease fields
    rent_amount: tt('fieldHelp.rent_amount', 'قيمة الإيجار الشهري المتفق عليه في العقد.'),
    security_deposit: tt('fieldHelp.security_deposit', 'مبلغ التأمين. هذا المبلغ يتم تسجيله كتأمين وليس كإيراد. يُرد عند انتهاء العقد.'),
    start_date: tt('fieldHelp.start_date', 'تاريخ بداية العقد. من هذا التاريخ يبدأ احتساب الإيجار.'),
    end_date: tt('fieldHelp.end_date', 'تاريخ نهاية العقد. يتم إنشاء جدول الدفعات تلقائياً بين تاريخ البداية والنهاية.'),
    unit_id: tt('fieldHelp.unit_id', 'اختر الوحدة التي سيتم تأجيرها. لا تظهر هنا إلا الوحدات المتاحة.'),
    tenant_id: tt('fieldHelp.tenant_id', 'اختر المستأجر. إذا كان المستأجر جديداً، أضفه أولاً من صفحة المستأجرين.'),

    // Payment fields
    amount: tt('fieldHelp.amount', 'المبلغ المدفوع من المستأجر. يمكن أن يكون أقل من قيمة الفاتورة (دفعة جزئية).'),
    payment_method: tt('fieldHelp.payment_method', 'طريقة الدفع: نقدي، تحويل بنكي، شيك، أو بطاقة.'),
    invoice_id: tt('fieldHelp.invoice_id', 'اختر الفاتورة المطلوب سدادها. تظهر الفواتير غير المدفوعة فقط.'),

    // Maintenance fields
    priority: tt('fieldHelp.priority', 'عاجل: يحتاج اليوم. مهم: خلال 48 ساعة. عادي: خلال أسبوع.'),
    description: tt('fieldHelp.description', 'اكتب وصفاً مختصراً للمشكلة. مثال: "المكيف لا يبرد"، "تسرب ماء في الحمام".'),
    category: tt('fieldHelp.category', 'نوع المشكلة: سباكة، كهرباء، تكييف، هيكلي، أو غير ذلك.'),

    // Project fields
    project_name: tt('fieldHelp.project_name', 'اسم المشروع كما هو معروف في الشركة.'),
    estimated_budget: tt('fieldHelp.estimated_budget', 'الميزانية التقديرية للمشروع كاملاً.'),
    completion_percentage: tt('fieldHelp.completion_percentage', 'نسبة الإنجاز الحالية. أدخل رقماً من 0 إلى 100.'),
  };
}

export function getFieldHelp(fieldKey: string): string | undefined {
  return createFieldHelp((_k: string, fb: string) => fb)[fieldKey];
}
