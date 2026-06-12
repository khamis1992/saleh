import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Filter, Eye, Pencil, Trash2, Star, Plus, HardHat, X, Users, FileText,
  AlertTriangle, TrendingUp, TrendingDown, Phone, MapPin, Building2, Award,
  ArrowRight, RotateCcw, Download, CheckCircle, XCircle, Sparkles,
} from 'lucide-react';
import { contractorStore, contractorClaimStore } from '@/services/stores';

/* ── KPI Card — editorial stat block ── */
function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    violet: { iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    cyan:   { iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
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

/* ── Contractor Card — editorial card ── */
function ContractorCard({ c, onDelete }: { c: any; onDelete: (c: any) => void }) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const isActive = c.status === 'active';
  const rating = c.rating || 0;

  return (
    <div
      onClick={() => navigate(`/contractors/${c.id}`)}
      className="group relative bg-white rounded-xl border border-gray-100 p-5 cursor-pointer transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]"
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl ${isActive ? 'bg-emerald-500' : 'bg-gray-300'} opacity-60`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-lg ${isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'} flex items-center justify-center shrink-0`}>
            <HardHat className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{c.name}</div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{c.contractor_code}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${
            isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {isActive ? 'نشط' : 'غير نشط'}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5">
          <Building2 className="h-3 w-3 text-gray-400" />
          {(t.contractors.specialties as any)[c.specialty] || c.specialty}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3 w-3 text-gray-400" />
          {c.contact_person || '—'}
        </span>
        <span className="flex items-center gap-1.5">
          <Phone className="h-3 w-3 text-gray-400" />
          {c.phone || '—'}
        </span>
      </div>

      {/* Rating + details grid */}
      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">التقييم</div>
          <div className="flex items-center justify-center gap-1">
            <Star className={`h-3.5 w-3.5 ${rating >= 4 ? 'fill-amber-400 text-amber-400' : rating >= 3 ? 'fill-amber-300 text-amber-300' : 'fill-gray-300 text-gray-300'}`} />
            <span className="text-xs font-bold text-gray-800">{rating}/5</span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">المشاريع</div>
          <div className="text-xs font-bold text-gray-800">{c.project_count || 0}</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => navigate(`/contractors/${c.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => navigate(`/contractors/${c.id}/edit`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(c)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1" />
        <button onClick={() => navigate(`/contractors/${c.id}`)} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-amber-600 transition-colors">
          التفاصيل <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ── List Row ── */
function ContractorListRow({ c, onDelete }: { c: any; onDelete: (c: any) => void }) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const isActive = c.status === 'active';
  const rating = c.rating || 0;

  return (
    <div
      onClick={() => navigate(`/contractors/${c.id}`)}
      className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 cursor-pointer transition-all hover:border-gray-200 hover:shadow-sm"
    >
      <div className={`h-10 w-10 rounded-lg ${isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'} flex items-center justify-center shrink-0`}>
        <HardHat className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{c.name}</div>
          <div className="text-[11px] text-gray-400 font-mono">{c.contractor_code}</div>
        </div>
        <div className="text-xs text-gray-600">{(t.contractors.specialties as any)[c.specialty] || c.specialty}</div>
        <div className="text-xs text-gray-600">{c.contact_person || '—'}</div>
        <div className="text-xs text-gray-600 ltr-only" dir="ltr">{c.phone || '—'}</div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className={`h-3.5 w-3.5 ${rating >= 4 ? 'fill-amber-400 text-amber-400' : rating >= 3 ? 'fill-amber-300 text-amber-300' : 'fill-gray-300 text-gray-300'}`} />
            <span className="text-xs font-bold text-gray-800">{rating}/5</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${
            isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {isActive ? 'نشط' : 'غير نشط'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => navigate(`/contractors/${c.id}`)} className="h-8 w-8 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-4 w-4" /></button>
        <button onClick={() => navigate(`/contractors/${c.id}/edit`)} className="h-8 w-8 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => onDelete(c)} className="h-8 w-8 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyContractors({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <HardHat className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا يوجد مقاولون</p>
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
export default function ConstructionContractorsPage() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const contractors = useMemo(() => contractorStore.getAll(), [refresh]);
  const claims = useMemo(() => contractorClaimStore.getAll(), [refresh]);
  const pendingClaims = claims.filter((c: any) => c.status === 'submitted' || c.status === 'verified').length;

  const specialties = useMemo(() => [...new Set(contractors.map((c: any) => c.specialty).filter(Boolean))], [contractors]);

  const filtered = contractors.filter((c: any) => {
    if (specialtyFilter !== 'all' && c.specialty !== specialtyFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (c.name || '').toLowerCase();
      const code = (c.contractor_code || '').toLowerCase();
      if (!name.includes(q) && !code.includes(q)) return false;
    }
    return true;
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    contractorStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.name} بنجاح`);
    setDeleteTarget(null);
    setRefresh(r => r + 1);
  };

  const resetFilters = () => {
    setSearch(''); setSpecialtyFilter('all');
  };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <HardHat className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">المقاولون</span>
              <span className="text-[13px] font-bold text-gray-900">{contractors.length} مقاول</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block" />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="ابحث في المقاولين..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>المقاولون النشطون:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{contractors.filter((c: any) => c.status === 'active').length}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
              {Math.round((contractors.filter((c: any) => c.status === 'active').length / Math.max(1, contractors.length)) * 100)}%
            </span>
          </div>

          <div className="me-auto" />

          {/* View switcher */}
          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'grid', label: 'بطاقات', icon: Sparkles },
              { key: 'list', label: 'قائمة', icon: Users },
            ] as const).map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                role="tab"
                aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <v.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          <Button onClick={() => navigate('/contractors/create')}
            className="h-8 px-3 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>إضافة مقاول</span>
          </Button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي المقاولين" value={contractors.length} sub={`${filtered.length} معروض`} icon={HardHat} accent="slate" />
          <KpiCard label="مطالبات معلقة" value={pendingClaims} sub="بانتظار الاعتماد" icon={AlertTriangle} trend={{ val: pendingClaims > 0 ? 20 : 0, dir: pendingClaims > 0 ? 'down' : 'up' }} accent="rose" />
          <KpiCard label="مقاولون معتمدون" value={contractors.filter((c: any) => c.status === 'active').length} sub="نشطون حالياً" icon={Award} accent="emerald" />
          <KpiCard label="إجمالي المطالبات" value={claims.length} sub="جميع المطالبات" icon={FileText} accent="violet" />
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">المقاولون</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}
                className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                <RotateCcw className="h-3.5 w-3.5" /> إعادة
              </Button>
              <Button variant="outline" size="sm"
                className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                <Download className="h-3.5 w-3.5" /> تصدير
              </Button>
              <Button onClick={() => navigate('/contractors/create')}
                className="h-8 text-xs rounded-lg gap-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-3 shadow-sm">
                <Plus className="h-3.5 w-3.5" /> إضافة مقاول
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="التخصص" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التخصصات</SelectItem>
                {specialties.map((s: string) => (
                  <SelectItem key={s} value={s}>{(t.contractors.specialties as any)[s] || s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Content ── */}
        {filtered.length === 0 ? (
          <EmptyContractors onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((c: any) => <ContractorCard key={c.id} c={c} onDelete={setDeleteTarget} />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((c: any) => <ContractorListRow key={c.id} c={c} onDelete={setDeleteTarget} />)}
          </div>
        )}

        {/* ── Result meta ── */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {contractors.length} مقاول</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            مفلتر محلياً
          </span>
        </div>
      </div>

      {/* ── Delete Dialog ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3>
                <p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              هل أنت متأكد من حذف <strong className="text-gray-900">{deleteTarget.name}</strong> ({deleteTarget.contractor_code})؟
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}
                className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}
                className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
