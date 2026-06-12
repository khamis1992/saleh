import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, RotateCcw, Sparkles } from 'lucide-react';
import {
  BarChart3, Map, HardHat, Building2, FileText, Wrench, Scale,
  Calculator, AlertTriangle, Clock, Package, Users,
  Wallet, Banknote, BookOpen, Search, ArrowLeft, Download,
  Star, Eye, LayoutDashboard, ChevronLeft, Activity,
} from 'lucide-react';

interface ReportDef { title: string; description: string; to: string; icon: React.ElementType; }
interface ReportGroup { title: string; icon: React.ElementType; color: string; gradient: string; reports: ReportDef[]; }

const reportGroups: ReportGroup[] = [
  { title: 'تقارير الأراضي والعقارات', icon: Map, color: 'bg-emerald-500', gradient: 'from-emerald-400 to-emerald-600',
    reports: [
      { title: 'سجل الأراضي', description: 'تقرير شامل بجميع الأراضي المسجلة مع التكلفة والقيمة المقدرة', to: '/reports/lands', icon: Map },
      { title: 'تقرير الإشغال', description: 'نسبة الإشغال لكل عقار مع عدد الوحدات المتاحة والمؤجرة', to: '/reports/occupancy', icon: Building2 },
    ] },
  { title: 'تقارير المشاريع', icon: HardHat, color: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600',
    reports: [
      { title: 'تقدم المشاريع', description: 'متابعة تقدم المشاريع والميزانية مقابل التكلفة الفعلية', to: '/reports/project-progress', icon: BarChart3 },
      { title: 'أداء المقاولين', description: 'تقييم أداء المقاولين والعقود النشطة والمستخلصات', to: '/reports/contractor-performance', icon: HardHat },
    ] },
  { title: 'تقارير التأجير والتحصيل', icon: Calculator, color: 'bg-violet-500', gradient: 'from-violet-400 to-violet-600',
    reports: [
      { title: 'سجل الإيجارات', description: 'تقرير العقود الإيجارية النشطة مع تفاصيل الدفع', to: '/reports/rent-roll', icon: FileText },
      { title: 'الإيجارات المتأخرة', description: 'الفواتير المتأخرة مع عدد أيام التأخير لكل فاتورة', to: '/reports/overdue', icon: AlertTriangle },
      { title: 'تقادم الذمم', description: 'تحليل الذمم المدينة حسب الفئات العمرية', to: '/reports/receivables-aging', icon: Clock },
    ] },
  { title: 'تقارير المخزون', icon: Package, color: 'bg-orange-500', gradient: 'from-orange-400 to-orange-600',
    reports: [{ title: 'رصيد المخزون', description: 'تقرير أرصدة المخزون حسب البنود مع الكميات والقيم', to: '/reports/stock-balance', icon: Package }] },
  { title: 'تقارير الصيانة والموارد البشرية', icon: Wrench, color: 'bg-teal-500', gradient: 'from-teal-400 to-teal-600',
    reports: [
      { title: 'تقرير الصيانة', description: 'تقرير طلبات الصيانة مع الفئة والأولوية والحالة', to: '/reports/maintenance', icon: Wrench },
      { title: 'ملخص الرواتب', description: 'ملخص الرواتب حسب الموظف والشهر', to: '/reports/payroll-summary', icon: Users },
    ] },
  { title: 'التقارير المالية', icon: Scale, color: 'bg-rose-500', gradient: 'from-rose-400 to-rose-600',
    reports: [
      { title: 'ميزان المراجعة', description: 'ميزان المراجعة بالأرصدة المدينة والدائنة', to: '/reports/trial-balance', icon: Scale },
      { title: 'قائمة الدخل', description: 'الأرباح والخسائر مع الإيرادات والمصروفات', to: '/reports/profit-loss', icon: TrendingUp },
      { title: 'الميزانية العمومية', description: 'المركز المالي مع الأصول والخصوم وحقوق الملكية', to: '/reports/balance-sheet', icon: Wallet },
      { title: 'التدفقات النقدية', description: 'التدفقات النقدية الداخلة والخارجة حسب الشهر', to: '/reports/cash-flow', icon: Banknote },
    ] },
];

const allReports = reportGroups.flatMap(g => g.reports);

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent: string;
}) {
  const a: Record<string, { iconBg: string; iconColor: string; bar: string }> = {
    slate: { iconBg: 'bg-slate-50', iconColor: 'text-slate-600', bar: 'bg-slate-500' },
    violet:{ iconBg: 'bg-violet-50', iconColor: 'text-violet-600', bar: 'bg-violet-500' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', bar: 'bg-emerald-500' },
    amber: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600', bar: 'bg-amber-500' },
  }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600', bar: 'bg-slate-500' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}>
        <Icon className={`h-4 w-4 ${a.iconColor}`} />
      </div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

export default function ReportsPage() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('erp_recent_reports') || '[]'); } catch { return []; }
  });

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return reportGroups;
    const q = search.toLowerCase();
    return reportGroups.map(g => ({ ...g, reports: g.reports.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)) })).filter(g => g.reports.length > 0);
  }, [search]);

  const totalReports = allReports.length;
  const totalGroups = reportGroups.length;
  const recentReportDefs = useMemo(() => recentlyViewed.map(to => allReports.find(r => r.to === to)).filter(Boolean) as ReportDef[], [recentlyViewed]);

  const handleReportClick = (to: string) => {
    const updated = [to, ...recentlyViewed.filter(r => r !== to)].slice(0, 4);
    setRecentlyViewed(updated);
    localStorage.setItem('erp_recent_reports', JSON.stringify(updated));
    navigate(to);
  };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">التقارير</span>
              <span className="text-[13px] font-bold text-gray-900">{totalReports} تقرير</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-md">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث عن تقرير..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-10 ps-3 h-9 text-sm rounded-xl border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>{totalGroups} مجموعات</span>
          </div>
          <div className="me-auto" />
          <button onClick={() => navigate('/dashboard')}
            className="h-8 px-3 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm">
            <LayoutDashboard className="h-3.5 w-3.5" />
            لوحة المعلومات
          </button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي التقارير" value={totalReports} sub="متاحة للعرض" icon={BookOpen} accent="slate" />
          <KpiCard label="تم عرضها مؤخراً" value={recentlyViewed.length} sub="آخر التقارير" icon={Eye} accent="violet" />
          <KpiCard label="مجموعات التقارير" value={totalGroups} sub="مصنفة حسب القسم" icon={Star} accent="emerald" />
          <KpiCard label="صيغة التصدير" value="CSV" sub="تصدير البيانات" icon={Download} accent="amber" />
        </div>

        {/* ── Recently Viewed ── */}
        {recentReportDefs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <Eye className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-700">آخر التقارير المعروضة</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentReportDefs.map(report => (
                <button key={report.to} onClick={() => handleReportClick(report.to)}
                  className="group bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all text-right w-full">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                      <report.icon className="h-4 w-4 text-violet-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-bold text-gray-800 truncate">{report.title}</div>
                      <div className="text-[11px] text-gray-400 truncate">{report.description}</div>
                    </div>
                    <ChevronLeft className="h-4 w-4 text-gray-300 group-hover:text-violet-500 shrink-0 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Report Groups ── */}
        <div className="space-y-6">
          {filteredGroups.map(group => (
            <div key={group.title}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center shadow-sm`}>
                  <group.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800">{group.title}</h2>
                  <p className="text-[11px] text-gray-400">{group.reports.length} {group.reports.length === 1 ? 'تقرير' : 'تقارير'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.reports.map(report => (
                  <button key={report.to} onClick={() => handleReportClick(report.to)}
                    className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-right w-full">
                    <div className="flex items-start gap-4">
                      <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${group.gradient} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                        <report.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-800 group-hover:text-gray-900 transition-colors">{report.title}</h3>
                        <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{report.description}</p>
                      </div>
                      <ArrowLeft className="h-4 w-4 text-gray-300 group-hover:text-gray-500 shrink-0 mt-1 transition-all group-hover:-translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
              {group.reports.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
                  <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">لا توجد تقارير مطابقة للبحث في هذه المجموعة</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-600 mb-1">لا توجد نتائج</h3>
            <p className="text-sm text-gray-400 mb-4">لم نجد تقارير تطابق "{search}"</p>
            <button onClick={() => setSearch('')} className="h-9 px-4 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">مسح البحث</button>
          </div>
        )}

        {/* ── Result meta ── */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {allReports.length} تقرير في {totalGroups} مجموعات</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />محدث في الوقت الفعلي</span>
        </div>
      </div>
    </div>
  );
}