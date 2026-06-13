import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  BarChart3, Map, HardHat, Building2, FileText, Wrench, Scale,
  Calculator, AlertTriangle, Clock, Package, Users, TrendingUp,
  Wallet, Banknote, BookOpen, Search, ArrowLeft, Download,
  Star, Eye, LayoutDashboard, ChevronLeft, Filter, RotateCcw, X,
} from 'lucide-react';

interface ReportDef { title: string; description: string; to: string; icon: React.ElementType; }
interface ReportGroup { title: string; icon: React.ElementType; color: string; gradient: string; reports: ReportDef[]; }

const groupColorConfig: Record<string, { dot: string; chip: string; gradient: string }> = {
  'تقارير الأراضي والعقارات':        { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100', gradient: 'from-emerald-400 to-emerald-600' },
  'تقارير المشاريع':                 { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100', gradient: 'from-blue-400 to-blue-600' },
  'تقارير التأجير والتحصيل':         { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100', gradient: 'from-violet-400 to-violet-600' },
  'تقارير المخزون':                  { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100', gradient: 'from-orange-400 to-orange-600' },
  'تقارير الصيانة والموارد البشرية': { dot: 'bg-teal-500', chip: 'bg-teal-50 text-teal-700 ring-1 ring-teal-100', gradient: 'from-teal-400 to-teal-600' },
  'التقارير المالية':                 { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100', gradient: 'from-rose-400 to-rose-600' },
};

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
const allGroupTitles = reportGroups.map(g => g.title);

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent: string;
}) {
  const a: Record<string, { iconBg: string; iconColor: string }> = {
    slate: { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    violet:{ iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    amber: { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function RepRow({ report, groupTitle, gc, onOpen }: { report: ReportDef; groupTitle: string; gc: { dot: string; chip: string; gradient: string }; onOpen: () => void }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={onOpen}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gc.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
            <report.icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900">{report.title}</div>
            <div className="text-[11px] text-gray-400 truncate max-w-md">{report.description}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${gc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${gc.dot}`} />{groupTitle}</span></td>
      <td className="px-4 py-3 text-end">
        <Tooltip><TooltipTrigger asChild>
          <button onClick={e => { e.stopPropagation(); onOpen(); }} className="h-7 w-7 rounded-md text-gray-400 hover:text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center">
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger><TooltipContent>فتح التقرير</TooltipContent></Tooltip>
      </td>
    </tr>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><Search className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد تقارير</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج مطابقة</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function ReportsPage() {
  const { dir } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('erp_recent_reports') || '[]'); } catch { return []; }
  });

  const flatEntries = useMemo(() => {
    let result: { report: ReportDef; groupTitle: string; gc: typeof groupColorConfig[string] }[] = [];
    for (const g of reportGroups) {
      const gc = groupColorConfig[g.title] || groupColorConfig['التقارير المالية'];
      for (const r of g.reports) {
        result.push({ report: r, groupTitle: g.title, gc });
      }
    }
    return result;
  }, []);

  const filtered = useMemo(() => {
    return flatEntries.filter(e => {
      if (groupFilter !== 'all' && e.groupTitle !== groupFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.report.title.toLowerCase().includes(q) && !e.report.description.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [flatEntries, search, groupFilter]);

  const totalReports = allReports.length;
  const totalGroups = reportGroups.length;
  const recentReportDefs = useMemo(() => recentlyViewed.map(to => allReports.find(r => r.to === to)).filter(Boolean) as ReportDef[], [recentlyViewed]);

  const handleReportClick = (to: string) => {
    const updated = [to, ...recentlyViewed.filter(r => r !== to)].slice(0, 4);
    setRecentlyViewed(updated);
    localStorage.setItem('erp_recent_reports', JSON.stringify(updated));
    navigate(to);
  };

  const resetFilters = () => { setSearch(''); setGroupFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
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
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="me-auto" />
          <button onClick={() => navigate('/dashboard')}
            className="h-8 px-3 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm">
            <LayoutDashboard className="h-3.5 w-3.5" />
            لوحة المعلومات
          </button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي التقارير" value={totalReports} sub="متاحة للعرض" icon={BookOpen} accent="slate" />
          <KpiCard label="تم عرضها مؤخراً" value={recentlyViewed.length} sub="آخر التقارير" icon={Eye} accent="violet" />
          <KpiCard label="مجموعات التقارير" value={totalGroups} sub="مصنفة حسب القسم" icon={Star} accent="emerald" />
          <KpiCard label="صيغة التصدير" value="CSV" sub="تصدير البيانات" icon={Download} accent="amber" />
        </div>

        {/* Recently Viewed */}
        {recentReportDefs.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-violet-50 flex items-center justify-center"><Eye className="h-3.5 w-3.5 text-violet-600" /></div>
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

        {/* Filter bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">قائمة التقارير</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="w-[200px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="المجموعة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المجموعات</SelectItem>
                {allGroupTitles.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        {filtered.length === 0 ? <EmptyState onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التقرير</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المجموعة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-center w-[60px]"></th>
                </tr></thead>
                <tbody>{filtered.map(e => <RepRow key={e.report.to} report={e.report} groupTitle={e.groupTitle} gc={e.gc} onOpen={() => handleReportClick(e.report.to)} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result meta */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {totalReports} تقرير</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />محدث في الوقت الفعلي</span>
        </div>
      </div>
    </div>
  );
}