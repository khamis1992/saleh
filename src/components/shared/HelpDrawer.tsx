import { useLocale } from '@/providers/LocaleContext';
import { useState } from 'react';
import { X, HelpCircle, ChevronLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLocation } from 'react-router-dom';
import { useRole } from '@/providers/RoleContext';

interface HelpEntry {
  title: string;
  whatToDo: string;
  steps?: string[];
  notes?: string;
  whoApproves?: string;
  nextStep?: string;
}

function createPageHelp(tt: (key: string, fallback: string) => string): Record<string, HelpEntry> {
  return {
    '/my-work': {
      title: tt('help.myWorkTitle', 'مهامي اليوم'),
      whatToDo: tt('help.myWorkWhat', 'هذه صفحة مهامك اليومية. هنا ترى كل ما تحتاج إنجازه اليوم.'),
      steps: [
        tt('help.myWorkStep1', 'انظر إلى المهام العاجلة أولاً (باللون الأحمر)'),
        tt('help.myWorkStep2', 'اضغط على "تنفيذ" للانتقال إلى المهمة'),
        tt('help.myWorkStep3', 'بعد إنجاز المهمة، ستنتهي من القائمة تلقائياً'),
      ],
      notes: tt('help.myWorkNotes', 'المهام تتحدث تلقائياً كل بضع ثوانٍ. إذا لم ترى مهمة، فقد تكون منجزاً لكل شيء!'),
    },
    '/wizards/payment': {
      title: tt('help.paymentTitle', 'تسجيل دفعة'),
      whatToDo: tt('help.paymentWhat', 'هنا تسجل دفعة من مستأجر مقابل فاتورة.'),
      steps: [
        tt('help.paymentStep1', 'ابحث عن المستأجر بالاسم أو رقم الجوال'),
        tt('help.paymentStep2', 'اختر الفاتورة المطلوب سدادها'),
        tt('help.paymentStep3', 'أدخل المبلغ المدفوع (يمكن أن يكون أقل من الفاتورة)'),
        tt('help.paymentStep4', 'اختر طريقة الدفع (نقدي، تحويل، شيك)'),
        tt('help.paymentStep5', 'أرفق إثبات الدفع إن وجد'),
        tt('help.paymentStep6', 'اضغط حفظ لتسجيل الإيصال'),
      ],
      notes: tt('help.paymentNotes', 'إذا دفع المستأجر المبلغ كاملاً، ستتغير حالة الفاتورة إلى "مدفوعة". إذا دفع جزء، سيبقى المتبقي مستحقاً.'),
    },
    '/wizards/lease': {
      title: tt('help.leaseTitle', 'إنشاء عقد إيجار'),
      whatToDo: tt('help.leaseWhat', 'هنا تنشئ عقد إيجار جديد بين مستأجر ووحدة.'),
      steps: [
        tt('help.leaseStep1', 'اختر المستأجر من القائمة أو أضف مستأجر جديد'),
        tt('help.leaseStep2', 'اختر الوحدة المتاحة (لا تظهر إلا الوحدات الشاغرة)'),
        tt('help.leaseStep3', 'حدد مدة العقد (سنة، سنتين، إلخ)'),
        tt('help.leaseStep4', 'أدخل قيمة الإيجار الشهري والتأمين'),
        tt('help.leaseStep5', 'راجع جدول الدفعات الذي يتم إنشاؤه تلقائياً'),
        tt('help.leaseStep6', 'ارفع نسخة من العقد الموقع'),
        tt('help.leaseStep7', 'اضغط تفعيل لتأكيد العقد'),
      ],
      notes: tt('help.leaseNotes', 'عند التفعيل، ستتغير حالة الوحدة إلى "مؤجرة" تلقائياً. لا يمكن التراجع بعد التفعيل.'),
      whoApproves: tt('help.leaseApproves', 'العقد يحتاج اعتماد المدير إذا كانت قيمة الإيجار أعلى من الحد المعتمد.'),
    },
    '/maintenance/requests': {
      title: tt('help.maintenanceTitle', 'طلبات الصيانة'),
      whatToDo: tt('help.maintenanceWhat', 'هنا تدير طلبات الصيانة للعقارات والوحدات.'),
      steps: [
        tt('help.maintenanceStep1', 'الطلبات الجديدة تظهر في الأعلى'),
        tt('help.maintenanceStep2', 'انقر على طلب لفتح تفاصيله'),
        tt('help.maintenanceStep3', 'يمكنك تعيين فني، بدء العمل، أو إغلاق الطلب'),
        tt('help.maintenanceStep4', 'أضف صوراً وملاحظات خلال العمل'),
        tt('help.maintenanceStep5', 'أغلق الطلب بعد الانتهاء من الإصلاح'),
      ],
      notes: tt('help.maintenanceNotes', 'الطلبات الطارئة تظهر باللون الأحمر. يجب معالجتها خلال 24 ساعة.'),
    },
    '/tenants': {
      title: tt('help.tenantsTitle', 'المستأجرون'),
      whatToDo: tt('help.tenantsWhat', 'هنا تدير جميع المستأجرين المسجلين في النظام.'),
      steps: [
        tt('help.tenantsStep1', 'لإضافة مستأجر جديد، اضغط على "مستأجر جديد"'),
        tt('help.tenantsStep2', 'ابحث عن مستأجر بالاسم أو رقم الجوال'),
        tt('help.tenantsStep3', 'انقر على مستأجر لعرض تفاصيله وعقوده ومدفوعاته'),
      ],
    },
    '/leases': {
      title: tt('help.leasesTitle', 'العقود'),
      whatToDo: tt('help.leasesWhat', 'هنا تدير جميع عقود الإيجار.'),
      steps: [
        tt('help.leasesStep1', 'العقود النشطة تظهر أولاً'),
        tt('help.leasesStep2', 'العقود التي تنتهي قريباً تظهر بعلامة تنبيه'),
        tt('help.leasesStep3', 'انقر على عقد لعرض التفاصيل والدفعات'),
        tt('help.leasesStep4', 'لتجديد عقد، افتح العقد واضغط "تجديد"'),
      ],
    },
    '/rent-collection/invoices': {
      title: tt('help.invoicesTitle', 'الفواتير'),
      whatToDo: tt('help.invoicesWhat', 'هنا تدير جميع فواتير الإيجار.'),
      steps: [
        tt('help.invoicesStep1', 'الفواتير المستحقة تظهر أولاً'),
        tt('help.invoicesStep2', 'الفواتير المتأخرة تظهر باللون الأحمر'),
        tt('help.invoicesStep3', 'لتسجيل دفعة، انقر على الفاتورة ثم "تسجيل دفعة"'),
        tt('help.invoicesStep4', 'الفواتير المدفوعة تظهر باللون الأخضر'),
      ],
    },
    '/units': {
      title: tt('help.unitsTitle', 'الوحدات'),
      whatToDo: tt('help.unitsWhat', 'هنا تدير جميع الوحدات العقارية.'),
      steps: [
        tt('help.unitsStep1', 'الوحدات المتاحة تظهر باللون الأخضر'),
        tt('help.unitsStep2', 'الوحدات المؤجرة تظهر باللون الأزرق'),
        tt('help.unitsStep3', 'الوحدات تحت الصيانة تظهر باللون البرتقالي'),
        tt('help.unitsStep4', 'انقر على وحدة لعرض تفاصيلها وعقودها'),
      ],
    },
  };
}

export function HelpDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation();
  const { dir, tt } = useLocale();

  const PAGE_HELP = createPageHelp(tt);

  const path = location.pathname;
  const help = PAGE_HELP[path];

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className={cn(
        'fixed top-0 left-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full',
      )}
        dir={dir}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#e5edf5]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[rgba(83,58,253,0.06)] flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-[#533afd]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#273951]">{tt('help.title', 'المساعدة')}</h2>
              <p className="text-xs text-[#64748d]">{help?.title || tt('help.pageExplanation', 'شرح الصفحة')}</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-[#f6f9fc] flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-[#64748d]" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-4" style={{ height: 'calc(100% - 65px)' }}>
          {help ? (
            <>
              {/* What to do */}
              <div className="bg-[rgba(83,58,253,0.06)] rounded-xl p-4 border border-blue-100">
                <h3 className="text-sm font-bold text-blue-800 mb-2">{'💡 '}{tt('help.whatToDo', 'ماذا أفعل هنا؟')}</h3>
                <p className="text-sm text-[#533afd] leading-relaxed">{help.whatToDo}</p>
              </div>

              {/* Steps */}
              {help.steps && (
                <div>
                  <h3 className="text-sm font-bold text-[#273951] mb-2">{'📋 '}{tt('help.steps', 'الخطوات')}</h3>
                  <div className="space-y-2">
                    {help.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#f6f9fc]">
                        <div className="h-6 w-6 rounded-full bg-[rgba(83,58,253,0.10)] text-[#533afd] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="text-sm text-gray-700">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Who approves */}
              {help.whoApproves && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h3 className="text-sm font-bold text-amber-800 mb-1">{'👤 '}{tt('help.whoApproves', 'من يعتمد هذا؟')}</h3>
                  <p className="text-sm text-[#9b6829]">{help.whoApproves}</p>
                </div>
              )}

              {/* Notes */}
              {help.notes && (
                <div className="bg-[#f6f9fc] rounded-xl p-4 border border-[#e5edf5]">
                  <h3 className="text-sm font-bold text-gray-700 mb-1">{'📝 '}{tt('help.notes', 'ملاحظات')}</h3>
                  <p className="text-sm text-[#64748d]">{help.notes}</p>
                </div>
              )}

              {/* Next step */}
              {help.nextStep && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <h3 className="text-sm font-bold text-emerald-800 mb-1">{'➡️ '}{tt('help.nextStep', 'الخطوة التالية')}</h3>
                  <p className="text-sm text-emerald-700">{help.nextStep}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-[#64748d] font-medium">{tt('help.noExplanation', 'لا يوجد شرح لهذه الصفحة بعد')}</p>
              <p className="text-sm text-[#64748d] mt-2">{tt('help.contactAdmin', 'سيتم إضافة المساعدة قريباً. إذا كنت تحتاج مساعدة الآن، تواصل مع مدير النظام.')}</p>
            </div>
          )}

          {/* General help */}
          <div className="border-t border-[#e5edf5] pt-4">
            <h3 className="text-sm font-bold text-[#273951] mb-2">{'❓ '}{tt('help.faq', 'أسئلة شائعة')}</h3>
            <div className="space-y-1">
              {[
                { q: tt('help.faqQ1', 'كيف أضيف سجل جديد؟'), a: tt('help.faqA1', 'اذهب إلى الصفحة المناسبة (مستأجرين، عقود، فواتير) واضغط على زر الإضافة.') },
                { q: tt('help.faqQ2', 'كيف أعرف حالة الطلب؟'), a: tt('help.faqA2', 'الحالة تظهر بلون: أخضر = مكتمل، أزرق = قيد التنفيذ، برتقالي = بانتظار، أحمر = متأخر.') },
                { q: tt('help.faqQ3', 'ماذا أفعل إذا أخطأت؟'), a: tt('help.faqA3', 'معظم السجلات يمكن تعديلها. إذا كان السجل مؤكداً أو مفعلاً، قد تحتاج مساعدة المدير لتعديله.') },
                { q: tt('help.faqQ4', 'كيف أطبع مستنداً؟'), a: tt('help.faqA4', 'في أي صفحة تفاصيل، ابحث عن زر 🖨️ طباعة في الأعلى.') },
              ].map((faq, i) => (
                <details key={i} className="group rounded-lg border border-[#e5edf5]">
                  <summary className="flex items-center gap-2 p-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-[#f6f9fc] rounded-lg transition-colors">
                    <ChevronLeft className="h-3 w-3 text-[#64748d] group-open:rotate-90 transition-transform" />
                    {faq.q}
                  </summary>
                  <p className="px-3 pb-3 text-sm text-[#64748d] pr-8">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
