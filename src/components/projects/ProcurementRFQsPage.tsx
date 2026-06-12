import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, FileText, Plus, Eye, TrendingUp, TrendingDown, Clock, CheckCircle2,
  X, RotateCcw, Sparkles, Users, Award, AlertTriangle, Send, Ban, BarChart3,
  ArrowRight, ShoppingCart, HardHat,
} from 'lucide-react';
import { rfqStore, vendorQuotationStore, getProjectName } from '@/services/stores';

const statusLabels: Record<string, string> = {
  draft: 'مسودة', sent: 'مُرسل', quotations_received: 'تم استلام العروض',
  under_evaluation: 'قيد التقييم', awarded: 'مُرسى', cancelled: 'ملغي', closed: 'مغلق',
};

const statusConfig: Record<string, { dot: string; chip: string }> = {
  draft:                { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-700 ring-1 ring-gray-100' },
  sent:                 { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  quotations_received:  { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  under_evaluation:     { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  awarded:              { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  cancelled:            { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
  closed:               { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-700 ring-1 ring-gray-100' },
};

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    violet: { iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    indigo: { iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
  };
  const a = accentMap[accent] || accentMap.slate;
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${a.iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {trend.dir === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend.val)}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── RFQ Card ── */
function RFQCard({ rfq, quoteCount, onStatusChange, onViewQuotes }: {
  rfq: any; quoteCount: number;
  onStatusChange: (id: string, status: string) => void;
  onViewQuotes: (id: string) => void;
}) {
  const stat = statusConfig[rfq.status] || statusConfig.draft;
  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${
        rfq.status === 'awarded' ? 'bg-emerald-500' :
        rfq.status === 'under_evaluation' ? 'bg-violet-500' :
        rfq.status === 'quotations_received' ? 'bg-amber-500' :
        rfq.status === 'sent' ? 'bg-blue-500' :
        rfq.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-300'
      }`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100 flex items-center justify-center shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{rfq.rfq_number}</div>
            <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{rfq.title}</div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${stat.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
          {statusLabels[rfq.status] || rfq.status}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5">
          <HardHat className="h-3 w-3 text-gray-400" />
          {getProjectName(rfq.project_id) || rfq.project_id || '—'}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-gray-400" />
          {rfq.submission_deadline || rfq.due_date || '—'}
        </span>
      </div>

      {/* Quotes count */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">العروض المستلمة</div>
          <div className="text-lg font-bold text-gray-900 tabular-nums">{quoteCount}</div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
          <Users className="h-5 w-5" />
        </div>
      </div>

      {/* Status control + actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <Select value={rfq.status} onValueChange={(v) => onStatusChange(rfq.id, v)}>
          <SelectTrigger className="h-7 text-[11px] rounded-lg border-gray-200 bg-white flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-sm">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button onClick={() => onViewQuotes(rfq.id)}
          className="h-7 px-2.5 rounded-md text-[10px] font-bold text-violet-600 hover:bg-violet-50 transition-colors flex items-center gap-1 shrink-0">
          <Eye className="h-3 w-3" /> عرض العروض
        </button>
      </div>
    </div>
  );
}

/* ── RFQ List Row ── */
function RFQListRow({ rfq, quoteCount, onStatusChange, onViewQuotes }: {
  rfq: any; quoteCount: number;
  onStatusChange: (id: string, status: string) => void;
  onViewQuotes: (id: string) => void;
}) {
  const stat = statusConfig[rfq.status] || statusConfig.draft;
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm">
      <div className="h-10 w-10 rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100 flex items-center justify-center shrink-0">
        <FileText className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{rfq.rfq_number}</div>
          <div className="text-[11px] text-gray-500 truncate">{rfq.title}</div>
        </div>
        <div className="text-xs text-gray-600 truncate">{getProjectName(rfq.project_id) || rfq.project_id || '—'}</div>
        <div className="text-xs text-gray-600">{rfq.submission_deadline || rfq.due_date || '—'}</div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-gray-800">{quoteCount}</span>
          <span className="text-[11px] text-gray-400">عرض</span>
        </div>
        <div className="flex items-center gap-2">
          <Select value={rfq.status} onValueChange={(v) => onStatusChange(rfq.id, v)}>
            <SelectTrigger className="h-7 w-[140px] text-[11px] rounded-lg border-gray-200 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-sm">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => onViewQuotes(rfq.id)}
          className="h-8 px-3 rounded-md text-[11px] font-bold text-violet-600 hover:bg-violet-50 transition-colors flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> عرض العروض
        </button>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyRFQs({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <FileText className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد طلبات عروض أسعار</p>
        <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج تطابق فلاتر البحث</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1">
        <RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ProcurementRFQsPage() {
  const { dir } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const rfqs = useMemo(() => rfqStore.getAll(), [refresh]);
  const quotations = useMemo(() => vendorQuotationStore.getAll(), [refresh]);

  const filtered = useMemo(() => rfqs.filter((r: any) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search && !r.rfq_number?.includes(search) && !r.title?.includes(search)) return false;
    return true;
  }), [rfqs, search, statusFilter]);

  const getQuoteCount = (rfqId: string) => quotations.filter((q: any) => q.rfq_id === rfqId).length;

  // KPIs
  const totalQuotes = quotations.length;
  const sentCount = rfqs.filter((r: any) => r.status === 'sent').length;
  const evalCount = rfqs.filter((r: any) => r.status === 'under_evaluation').length;
  const awardedCount = rfqs.filter((r: any) => r.status === 'awarded').length;

  const handleStatusChange = (rfqId: string, newStatus: string) => {
    rfqStore.update(rfqId, { status: newStatus } as any);
    setRefresh(r => r + 1);
    toast.success(`تم تحديث الحالة إلى "${statusLabels[newStatus] || newStatus}"`);
  };

  const handleViewQuotes = (rfqId: string) => {
    navigate(`/procurement/quotation-comparison?rfqId=${rfqId}`);
  };

  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-600">عروض الأسعار</span>
              <span className="text-[13px] font-bold text-gray-900">{rfqs.length} طلب</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block" />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="بحث برقم RFQ أو العنوان..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>إجمالي العروض:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{totalQuotes}</span>
          </div>

          <div className="me-auto" />

          {/* View switcher */}
          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'list', label: 'قائمة', icon: FileText },
              { key: 'grid', label: 'بطاقات', icon: Sparkles },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} role="tab" aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}>
                <v.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          <Button onClick={() => navigate('/procurement/quotation-comparison')}
            className="h-8 px-3 gap-1.5 bg-violet-500 hover:bg-violet-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <BarChart3 className="h-3.5 w-3.5" />
            <span>مقارنة عروض</span>
          </Button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الطلبات" value={rfqs.length} sub={`${filtered.length} معروض`} icon={FileText} accent="slate" />
          <KpiCard label="مُرسلة" value={sentCount} sub="بانتظار العروض" icon={Send} trend={{ val: sentCount > 0 ? 15 : 0, dir: 'up' }} accent="blue" />
          <KpiCard label="قيد التقييم" value={evalCount} sub="تحت المراجعة" icon={Clock} accent="violet" />
          <KpiCard label="مُرساة" value={awardedCount} sub="تم الترسية" icon={Award} trend={{ val: awardedCount > 0 ? 10 : 0, dir: 'up' }} accent="emerald" />
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">طلبات عروض الأسعار</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}
                className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                <RotateCcw className="h-3.5 w-3.5" /> إعادة
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Search className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Content ── */}
        {filtered.length === 0 ? (
          <EmptyRFQs onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((rfq: any) => (
              <RFQCard key={rfq.id} rfq={rfq} quoteCount={getQuoteCount(rfq.id)}
                onStatusChange={handleStatusChange} onViewQuotes={handleViewQuotes} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((rfq: any) => (
              <RFQListRow key={rfq.id} rfq={rfq} quoteCount={getQuoteCount(rfq.id)}
                onStatusChange={handleStatusChange} onViewQuotes={handleViewQuotes} />
            ))}
          </div>
        )}

        {/* ── Result meta ── */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {rfqs.length} طلب</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            مفلتر محلياً
          </span>
        </div>
      </div>
    </div>
  );
}