import { useLocale } from '@/providers/LocaleContext';
import { ReportCard } from '@/components/shared/Phase3Components';
import { BarChart3, Map, HardHat, Building2, FileText, Wrench, Scale, Calculator, AlertTriangle, Clock, Package, Users, TrendingUp, Wallet, Banknote, BookOpen } from 'lucide-react';

const reportGroups = [
  {
    title: 'تقارير الأراضي والعقارات',
    icon: Map,
    reports: [
      { title: 'سجل الأراضي', description: 'تقرير شامل بجميع الأراضي المسجلة مع التكلفة والقيمة المقدرة', to: '/reports/lands', icon: Map },
      { title: 'تقرير الإشغال', description: 'نسبة الإشغال لكل عقار مع عدد الوحدات المتاحة والمؤجرة', to: '/reports/occupancy', icon: Building2 },
    ],
  },
  {
    title: 'تقارير المشاريع',
    icon: HardHat,
    reports: [
      { title: 'تقدم المشاريع', description: 'متابعة تقدم المشاريع والميزانية مقابل التكلفة الفعلية', to: '/reports/project-progress', icon: BarChart3 },
      { title: 'أداء المقاولين', description: 'تقييم أداء المقاولين والعقود النشطة والمستخلصات', to: '/reports/contractor-performance', icon: HardHat },
    ],
  },
  {
    title: 'تقارير التأجير والتحصيل',
    icon: Calculator,
    reports: [
      { title: 'سجل الإيجارات', description: 'تقرير العقود الإيجارية النشطة مع تفاصيل الدفع', to: '/reports/rent-roll', icon: FileText },
      { title: 'الإيجارات المتأخرة', description: 'الفواتير المتأخرة مع عدد أيام التأخير لكل فاتورة', to: '/reports/overdue', icon: AlertTriangle },
      { title: 'تقادم الذمم', description: 'تحليل الذمم المدينة حسب الفئات العمرية (0-30, 31-60, 61-90, +90)', to: '/reports/receivables-aging', icon: Clock },
    ],
  },
  {
    title: 'تقارير المخزون',
    icon: Package,
    reports: [
      { title: 'رصيد المخزون', description: 'تقرير أرصدة المخزون حسب البنود مع الكميات والقيم', to: '/reports/stock-balance', icon: Package },
    ],
  },
  {
    title: 'تقارير الصيانة والموارد البشرية',
    icon: Wrench,
    reports: [
      { title: 'تقرير الصيانة', description: 'تقرير طلبات الصيانة مع الفئة والأولوية والحالة', to: '/reports/maintenance', icon: Wrench },
      { title: 'ملخص الرواتب', description: 'ملخص الرواتب حسب الموظف والشهر مع الأساسي والبدلات والخصومات', to: '/reports/payroll-summary', icon: Users },
    ],
  },
  {
    title: 'التقارير المالية',
    icon: Calculator,
    reports: [
      { title: 'ميزان المراجعة', description: 'تقرير ميزان المراجعة بالأرصدة المدينة والدائنة لكل حساب', to: '/reports/trial-balance', icon: Scale },
      { title: 'قائمة الدخل', description: 'تقرير الأرباح والخسائر مع الإيرادات والمصروفات', to: '/reports/profit-loss', icon: TrendingUp },
      { title: 'الميزانية العمومية', description: 'تقرير المركز المالي مع الأصول والخصوم وحقوق الملكية', to: '/reports/balance-sheet', icon: Wallet },
      { title: 'التدفقات النقدية', description: 'تقرير التدفقات النقدية الداخلة والخارجة حسب الشهر', to: '/reports/cash-flow', icon: Banknote },
    ],
  },
];

export default function ReportsPage() {
  const { t } = useLocale();

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">{t.reports.title}</h1>
        <p className="text-xs text-gray-500 mt-0.5">التقارير والتحليلات</p>
      </div>

      <div className="space-y-6">
        {reportGroups.map((group) => (
          <div key={group.title}>
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <group.icon className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-base font-semibold text-gray-800">{group.title}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {group.reports.map((report) => (
                <ReportCard
                  key={report.to}
                  icon={report.icon}
                  title={report.title}
                  description={report.description}
                  to={report.to}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
