import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  BarChart3, Map, HardHat, Building2, FileText, Wrench, Scale,
  Calculator, AlertTriangle, Clock, Package, Users, TrendingUp,
  Wallet, Banknote, BookOpen, Search, ArrowLeft, Download,
  Star, Eye, LayoutDashboard, ChevronLeft,
} from 'lucide-react';

// ─── Report definitions ───────────────────────────────────
interface ReportDef {
  title: string;
  description: string;
  to: string;
  icon: React.ElementType;
}

interface ReportGroup {
  title: string;
  icon: React.ElementType;
  color: string;       // tailwind color class for icon bg
  gradient: string;    // gradient for section header dot
  reports: ReportDef[];
}

const reportGroups: ReportGroup[] = [
  {
    title: 'تقارير الأراضي والعقارات',
    icon: Map,
    color: 'bg-emerald-500',
    gradient: 'from-emerald-400 to-emerald-600',
    reports: [
      { title: 'سجل الأراضي', description: 'تقرير شامل بجميع الأراضي المسجلة مع التكلفة والقيمة المقدرة', to: '/reports/lands', icon: Map },
      { title: 'تقرير الإشغال', description: 'نسبة الإشغال لكل عقار مع عدد الوحدات المتاحة والمؤجرة', to: '/reports/occupancy', icon: Building2 },
    ],
  },
  {
    title: 'تقارير المشاريع',
    icon: HardHat,
    color: 'bg-blue-500',
    gradient: 'from-blue-400 to-blue-600',
    reports: [
      { title: 'تقدم المشاريع', description: 'متابعة تقدم المشاريع والميزانية مقابل التكلفة الفعلية', to: '/reports/project-progress', icon: BarChart3 },
      { title: 'أداء المقاولين', description: 'تقييم أداء المقاولين والعقود النشطة والمستخلصات', to: '/reports/contractor-performance', icon: HardHat },
    ],
  },
  {
    title: 'تقارير التأجير والتحصيل',
    icon: Calculator,
    color: 'bg-violet-500',
    gradient: 'from-violet-400 to-violet-600',
    reports: [
      { title: 'سجل الإيجارات', description: 'تقرير العقود الإيجارية النشطة مع تفاصيل الدفع', to: '/reports/rent-roll', icon: FileText },
      { title: 'الإيجارات المتأخرة', description: 'الفواتير المتأخرة مع عدد أيام التأخير لكل فاتورة', to: '/reports/overdue', icon: AlertTriangle },
      { title: 'تقادم الذمم', description: 'تحليل الذمم المدينة حسب الفئات العمرية (0-30, 31-60, 61-90, +90)', to: '/reports/receivables-aging', icon: Clock },
    ],
  },
  {
    title: 'تقارير المخزون',
    icon: Package,
    color: 'bg-orange-500',
    gradient: 'from-orange-400 to-orange-600',
    reports: [
      { title: 'رصيد المخزون', description: 'تقرير أرصدة المخزون حسب البنود مع الكميات والقيم', to: '/reports/stock-balance', icon: Package },
    ],
  },
  {
    title: 'تقارير الصيانة والموارد البشرية',
    icon: Wrench,
    color: 'bg-teal-500',
    gradient: 'from-teal-400 to-teal-600',
    reports: [
      { title: 'تقرير الصيانة', description: 'تقرير طلبات الصيانة مع الفئة والأولوية والحالة', to: '/reports/maintenance', icon: Wrench },
      { title: 'ملخص الرواتب', description: 'ملخص الرواتب حسب الموظف والشهر مع الأساسي والبدلات والخصومات', to: '/reports/payroll-summary', icon: Users },
    ],
  },
  {
    title: 'التقارير المالية',
    icon: Scale,
    color: 'bg-rose-500',
    gradient: 'from-rose-400 to-rose-600',
    reports: [
      { title: 'ميزان المراجعة', description: 'تقرير ميزان المراجعة بالأرصدة المدينة والدائنة لكل حساب', to: '/reports/trial-balance', icon: Scale },
      { title: 'قائمة الدخل', description: 'تقرير الأرباح والخسائر مع الإيرادات والمصروفات', to: '/reports/profit-loss', icon: TrendingUp },
      { title: 'الميزانية العمومية', description: 'تقرير المركز المالي مع الأصول والخصوم وحقوق الملكية', to: '/reports/balance-sheet', icon: Wallet },
      { title: 'التدفقات النقدية', description: 'تقرير التدفقات النقدية الداخلة والخارجة حسب الشهر', to: '/reports/cash-flow', icon: Banknote },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────
const allReports = reportGroups.flatMap(g => g.reports);

// ─── Main Component ───────────────────────────────────────
export default function ReportsPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('erp_recent_reports') || '[]');
    } catch { return []; }
  });

  // Filter reports by search
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return reportGroups;
    const q = search.toLowerCase();
    return reportGroups
      .map(g => ({
        ...g,
        reports: g.reports.filter(r =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.reports.length > 0);
  }, [search]);

  const totalReports = allReports.length;
  const totalGroups = reportGroups.length;

  // Recently viewed report objects
  const recentReportDefs = useMemo(
    () => recentlyViewed
      .map(to => allReports.find(r => r.to === to))
      .filter(Boolean) as ReportDef[],
    [recentlyViewed],
  );

  const handleReportClick = (to: string) => {
    // Track recently viewed
    const updated = [to, ...recentlyViewed.filter(r => r !== to)].slice(0, 4);
    setRecentlyViewed(updated);
    localStorage.setItem('erp_recent_reports', JSON.stringify(updated));
    navigate(to);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {t.reports?.title || 'التقارير والتحليلات'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            استعرض وحلل بياناتك عبر {totalReports} تقرير في {totalGroups} مجموعات
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            لوحة المعلومات
          </button>
        </div>
      </div>

      {/* ─── KPI Summary Cards ──────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="h-9 w-9 rounded-lg bg-blue-500 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              {totalReports}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
              إجمالي التقارير
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="h-9 w-9 rounded-lg bg-violet-500 flex items-center justify-center">
                <Eye className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              {recentlyViewed.length}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
              تم عرضها مؤخراً
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="h-9 w-9 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              {totalGroups}
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
              مجموعات التقارير
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="h-9 w-9 rounded-lg bg-amber-500 flex items-center justify-center">
                <Download className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
              CSV
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 font-medium">
              صيغة التصدير
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Recently Viewed ─────────────────────────────── */}
      {recentReportDefs.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center">
              <Eye className="h-3.5 w-3.5 text-violet-600" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">آخر التقارير المعروضة</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {recentReportDefs.map((report) => (
              <button
                key={report.to}
                onClick={() => handleReportClick(report.to)}
                className="group bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all text-right w-full"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                    <report.icon className="h-4 w-4 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-gray-800 truncate">{report.title}</div>
                    <div className="text-[11px] text-gray-400 truncate">{report.description}</div>
                  </div>
                  <ChevronLeft className="h-4 w-4 text-gray-300 group-hover:text-violet-500 shrink-0 transition-colors ms-auto" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Search ──────────────────────────────────────── */}
      <div className="relative mb-6">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="ابحث عن تقرير..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9 h-10 rounded-xl border-gray-200 bg-white text-sm focus-visible:ring-violet-500"
        />
      </div>

      {/* ─── Report Groups ───────────────────────────────── */}
      <div className="space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.title}>
            {/* Group header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center shadow-lg shadow-current/10`}>
                  <group.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-800">{group.title}</h2>
                <p className="text-[11px] text-gray-400">
                  {group.reports.length} {group.reports.length === 1 ? 'تقرير' : 'تقارير'}
                </p>
              </div>
            </div>

            {/* Report cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.reports.map((report) => (
                <button
                  key={report.to}
                  onClick={() => handleReportClick(report.to)}
                  className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-right w-full"
                >
                  <div className="flex items-start gap-4">
                    <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform duration-200`}>
                      <report.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-800 group-hover:text-gray-900 transition-colors">
                        {report.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {report.description}
                      </p>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-1 transition-all group-hover:-translate-x-0.5" />
                  </div>
                </button>
              ))}
            </div>

            {/* Empty state within group */}
            {group.reports.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">لا توجد تقارير مطابقة للبحث في هذه المجموعة</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ─── Global empty state ──────────────────────────── */}
      {filteredGroups.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-600 mb-1">لا توجد نتائج</h3>
          <p className="text-sm text-gray-400 mb-4">لم نجد تقارير تطابق "{search}"</p>
          <button
            onClick={() => setSearch('')}
            className="h-9 px-4 rounded-lg bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 transition-colors"
          >
            مسح البحث
          </button>
        </div>
      )}
    </div>
  );
}
