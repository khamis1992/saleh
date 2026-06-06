import { useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { useRole, ROLES } from '@/providers/RoleContext';
import {
  LayoutDashboard, ClipboardList, FileText, Users, HardHat,
  DollarSign, Wrench, Building2, ChevronLeft, ChevronRight,
  CheckCircle2, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const { role } = useRole();
  const { dir, tt } = useLocale();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const roleDef = ROLES.find(r => r.value === role)!;

  const steps: OnboardingStep[] = [
    {
      title: tt('onboarding.welcomeTitle', '👋 أهلاً بك في نظام عقاري'),
      description: tt('onboarding.welcomeDesc', `مرحباً ${roleDef.label}! تم إعداد النظام خصيصاً لدورك.`),
      icon: Sparkles,
      color: 'bg-[#533afd]',
    },
    {
      title: tt('onboarding.yourRole', '🎯 دورك في النظام'),
      description: tt('onboarding.yourRoleDesc', `أنت "${roleDef.label}".${getRoleDescription(role)}\n\nالصفحة الرئيسية لدورك جاهزة. كل ما تحتاجه موجود في مكان واحد.`),
      icon: LayoutDashboard,
      color: 'bg-emerald-500',
    },
    {
      title: tt('onboarding.myWork', '📋 صفحة مهامي اليوم'),
      description: tt('onboarding.myWorkDesc', 'هذه أهم صفحة بالنسبة لك. هنا سترى:\n\n✅ المهام المطلوبة منك اليوم\n⚠️ المهام العاجلة والمتأخرة\n📅 المهام القادمة\n⚡ إجراءات سريعة لعملك'),
      icon: ClipboardList,
      color: 'bg-violet-500',
    },
    {
      title: getRolePagesTitle(role),
      description: getRolePagesDesc(role),
      icon: getRoleIcon(role),
      color: 'bg-[#9b6829]',
    },
    {
      title: tt('onboarding.helpAvailable', '💡 مساعدة دائماً متاحة'),
      description: tt('onboarding.helpAvailableDesc', 'في أي وقت تحتاج مساعدة:\n\n❓ اضغط على زر المساعدة في الأعلى\n📖 سيظهر شرح للصفحة الحالية\n💬 فيه خطوات واضحة وأسئلة شائعة\n\nلا تخف من الخطأ — النظام يمنع الأخطاء الكبيرة!'),
      icon: FileText,
      color: 'bg-[#533afd]',
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" dir={dir}>
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                i <= step ? 'bg-[#533afd] w-6' : 'bg-gray-200 w-4',
              )}
            />
          ))}
        </div>

        {/* Icon */}
        <div className={cn('h-16 w-16 rounded-lg flex items-center justify-center mx-auto mb-4', current.color)}>
          <Icon className="h-8 w-8 text-white" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-[#273951] text-center mb-3 whitespace-pre-line">
          {current.title}
        </h2>

        {/* Description */}
        <p className="text-sm text-[#64748d] text-center leading-relaxed whitespace-pre-line mb-6">
          {current.description}
        </p>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          {step > 0 && (
            <Button
              variant="outline"
              onClick={() => setStep(s => s - 1)}
              className="h-10 text-sm gap-1.5"
            >
              <ChevronRight className="h-4 w-4" />
              {tt('common.previous', 'السابق')}
            </Button>
          )}
          <Button
            onClick={() => {
              if (isLast) {
                localStorage.setItem('erp_onboarding_done', 'true');
                onComplete();
                navigate('/my-work');
              } else {
                setStep(s => s + 1);
              }
            }}
            className={cn(
              'h-10 text-sm gap-1.5 text-white flex-1',
              isLast ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#533afd] hover:bg-blue-700',
            )}
          >
            {isLast ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                {tt('onboarding.startWork', 'ابدأ العمل')}
              </>
            ) : (
              <>
                {tt('common.next', 'التالي')}
                <ChevronLeft className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getRoleDescription(role: string): string {
  switch (role) {
    case 'project_manager': return 'تدير المشاريع الإنشائية وتتابع تقدمها.';
    case 'property_manager': return 'تدير العقارات والوحدات وعقود الإيجار.';
    case 'accountant': return 'تدير الحسابات والقيود والتحصيل.';
    case 'maintenance_manager': return 'تدير طلبات الصيانة وأوامر العمل.';
    case 'technician': return 'تنفذ طلبات الصيانة وتغلقها بعد الإنجاز.';
    case 'legal_officer': return 'تدير الإشعارات القانونية والقضايا.';
    case 'hr_manager': return 'تدير الموظفين والحضور والرواتب.';
    case 'executive': return 'تشرف على أداء الشركة وتتخذ القرارات.';
    case 'admin': return 'تدير النظام كاملاً وتتحكم بكل الصلاحيات.';
    default: return '';
  }
}

function getRolePagesTitle(role: string): string {
  switch (role) {
    case 'project_manager': return '🏗️ صفحاتك المهمة';
    case 'property_manager': return '🏢 صفحاتك المهمة';
    case 'accountant': return '💰 صفحاتك المهمة';
    case 'maintenance_manager':
    case 'technician': return '🔧 صفحاتك المهمة';
    default: return '📄 صفحاتك المهمة';
  }
}

function getRolePagesDesc(role: string): string {
  switch (role) {
    case 'project_manager': return 'الصفحات الرئيسية لعملك:\n\n🏗️ مشاريعي — كل المشاريع المسندة إليك\n📝 تقرير يومي — سجل العمل اليومي\n📊 تحديث إنجاز — حدّث نسبة الإنجاز\n🧱 طلب مواد — اطلب مواد للمشروع';
    case 'property_manager': return 'الصفحات الرئيسية لعملك:\n\n🏢 الوحدات المتاحة — شوف الوحدات الفاضية\n📝 عقد جديد — أنشئ عقد إيجار\n👥 المستأجرون — كل المستأجرين\n📄 العقود — كل العقود النشطة';
    case 'accountant': return 'الصفحات الرئيسية لعملك:\n\n📊 لوحة المالية — نظرة عامة\n📋 القيود اليومية — سجل القيود\n🧾 الفواتير — كل الفواتير\n💰 التحصيل — سجل المدفوعات';
    case 'maintenance_manager':
    case 'technician': return 'الصفحات الرئيسية لعملك:\n\n🔧 طلبات الصيانة — كل الطلبات\n📋 أوامر العمل — الطلبات المسندة لك\n⚠️ طارئ — الطلبات العاجلة\n✅ إغلاق طلب — أنهِ الطلبات المكتملة';
    default: return 'تم إعداد النظام حسب دورك. استخدم القائمة الجانبية للتنقل بين الصفحات.';
  }
}

function getRoleIcon(role: string): React.ElementType {
  switch (role) {
    case 'project_manager': return HardHat;
    case 'property_manager': return Building2;
    case 'accountant': return DollarSign;
    case 'maintenance_manager':
    case 'technician': return Wrench;
    case 'legal_officer': return FileText;
    case 'hr_manager': return Users;
    default: return LayoutDashboard;
  }
}
