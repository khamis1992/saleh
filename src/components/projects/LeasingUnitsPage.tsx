import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Filter, Eye, Pencil, Trash2, Plus, DoorOpen, X, Home, Calculator,
  TrendingUp, TrendingDown, RotateCcw, Sparkles, Users, Award, AlertTriangle,
  DollarSign, MapPin, Activity, ArrowRight, BedDouble, Ruler,
} from 'lucide-react';
import { unitStore, propertyStore, leaseStore } from '@/services/stores';

const fmt = formatQAR;
const fmtInt = formatQARInt;

const unitStatusConfig: Record<string, { dot: string; chip: string }> = {
  available:         { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  leased:            { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  reserved:          { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  under_maintenance: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};

function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    sky:    { iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    violet: { iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  };
  const a = accentMap[accent] || accentMap.slate;
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${a.iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
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

function UnitCard({ u, properties, onDelete }: {
  u: any; properties: any[]; onDelete: (u: any) => void;
}) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const statCfg = unitStatusConfig[u.status] || unitStatusConfig.available;
  const prop = properties.find((p: any) => p.id === u.property_id);
  const rent = u.expected_monthly_rent || u.monthly_rent || 0;

  return (
    <div onClick={() => navigate(`/units/${u.id}`)}
      className="group relative bg-white rounded-xl border border-gray-100 p-5 cursor-pointer transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${
        u.status === 'leased' ? 'bg-blue-500' :
        u.status === 'available' ? 'bg-emerald-500' :
        u.status === 'under_maintenance' ? 'bg-rose-500' : 'bg-amber-500'
      }`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-sky-50 text-sky-600 ring-1 ring-sky-100 flex items-center justify-center shrink-0">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{u.unit_number}</div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{u.unit_code}</div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${statCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statCfg.dot}`} />
          {(t.units.statuses as any)[u.status] || u.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-gray-400" />{prop?.property_name || '—'}</span>
        <span className="flex items-center gap-1.5"><Ruler className="h-3 w-3 text-gray-400" />{u.area_sqm} م²</span>
        {u.bedrooms > 0 && (
          <span className="flex items-center gap-1.5"><BedDouble className="h-3 w-3 text-gray-400" />{u.bedrooms} غرف</span>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-3.5">
        <div className="text-[10px] text-gray-400 mb-0.5">الإيجار الشهري</div>
        <div className="text-lg font-bold text-gray-900 ltr-only tabular-nums">{fmt(rent)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">النوع</div>
          <div className="text-xs font-bold text-gray-800">{(t.units.types as any)[u.unit_type] || u.unit_type}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">المساحة</div>
          <div className="text-xs font-bold text-gray-800 ltr-only">{u.area_sqm} م²</div>
        </div>
      </div>

      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => navigate(`/units/${u.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => navigate(`/units/${u.id}/edit`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(u)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1" />
        <button onClick={() => navigate(`/units/${u.id}`)} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-sky-600 transition-colors">
          التفاصيل <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function UnitRow({ u, properties, onDelete }: {
  u: any; properties: any[]; onDelete: (u: any) => void;
}) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const statCfg = unitStatusConfig[u.status] || unitStatusConfig.available;
  const prop = properties.find((p: any) => p.id === u.property_id);
  const rent = u.expected_monthly_rent || u.monthly_rent || 0;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/units/${u.id}`)}>
      <td className="px-4 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(u.unit_code).then(() => toast.success('تم نسخ الكود')); }}
              className="font-mono text-xs text-sky-600 hover:text-sky-700 transition-colors">{u.unit_code}</button>
          </TooltipTrigger>
          <TooltipContent>اضغط للنسخ</TooltipContent>
        </Tooltip>
      </td>
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{u.unit_number}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px] truncate">{prop?.property_name || '—'}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{(t.units.types as any)[u.unit_type] || u.unit_type}</td>
      <td className="px-4 py-3 text-xs text-gray-600 ltr-only">{u.area_sqm} م²</td>
      <td className="px-4 py-3 text-xs text-gray-600">{u.bedrooms || 0}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(rent)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${statCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statCfg.dot}`} />
          {(t.units.statuses as any)[u.status] || u.status}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => navigate(`/units/${u.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>عرض</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => navigate(`/units/${u.id}/edit`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(u)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyUnits({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <DoorOpen className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد وحدات</p>
        <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج تطابق فلاتر البحث</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1">
        <RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر
      </Button>
    </div>
  );
}

export default function LeasingUnitsPage() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const units = useMemo(() => unitStore.getAll(), [refresh]);
  const properties = useMemo(() => propertyStore.getAll(), [refresh]);
  const leases = useMemo(() => leaseStore.getAll(), [refresh]);

  const filtered = units.filter((u: any) => {
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (search && !u.unit_number.includes(search) && !u.unit_code.includes(search)) return false;
    return true;
  });

  const leasedUnits = units.filter((u: any) => u.status === 'leased').length;
  const availableUnits = units.filter((u: any) => u.status === 'available').length;
  const underMaintenance = units.filter((u: any) => u.status === 'under_maintenance').length;
  const occupiedRate = units.length > 0 ? Math.round((leasedUnits / units.length) * 100) : 0;
  const totalRentValue = units.reduce((s: number, u: any) => s + (u.expected_monthly_rent || u.monthly_rent || 0), 0);

  const handleDelete = () => {
    if (!deleteTarget) return;
    unitStore.remove(deleteTarget.id);
    toast.success(`تم حذف الوحدة ${deleteTarget.unit_number} بنجاح`);
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-sm">
              <DoorOpen className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600">الوحدات</span>
              <span className="text-[13px] font-bold text-gray-900">{units.length} وحدة</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في الوحدات..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>نسبة الإشغال:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{occupiedRate}%</span>
          </div>
          <div className="me-auto" />
          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'list', label: 'قائمة', icon: Sparkles },
              { key: 'grid', label: 'بطاقات', icon: DoorOpen },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} role="tab" aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                <v.icon className="h-3 w-3" /><span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={() => navigate('/units/create')}
            className="h-8 px-3 gap-1.5 bg-sky-500 hover:bg-sky-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" /><span>إضافة وحدة</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الوحدات" value={units.length} sub={`${filtered.length} معروض`} icon={DoorOpen} accent="slate" />
          <KpiCard label="مؤجرة" value={leasedUnits} sub={`${occupiedRate}% نسبة الإشغال`} icon={Home} trend={{ val: occupiedRate, dir: occupiedRate >= 50 ? 'up' : 'down' }} accent="emerald" />
          <KpiCard label="قيمة الإيجارات" value={fmtInt(totalRentValue)} sub="إجمالي الإيجار الشهري" icon={Calculator} accent="sky" />
          <KpiCard label="صيانة" value={underMaintenance} sub="وحدات تحت الصيانة" icon={AlertTriangle} trend={{ val: underMaintenance, dir: 'down' }} accent="rose" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">{t.units.title}</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                <RotateCcw className="h-3.5 w-3.5" /> إعادة
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="available">متاحة</SelectItem>
                <SelectItem value="leased">مؤجرة</SelectItem>
                <SelectItem value="reserved">محجوزة</SelectItem>
                <SelectItem value="under_maintenance">تحت الصيانة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyUnits onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(u => <UnitCard key={u.id} u={u} properties={properties} onDelete={setDeleteTarget} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الكود</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">رقم الوحدة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">العقار</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">النوع</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المساحة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الغرف</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الإيجار</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[100px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => <UnitRow key={u.id} u={u} properties={properties} onDelete={setDeleteTarget} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {units.length} وحدة</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div>
              <div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div>
            </div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف الوحدة <strong className="text-gray-900">{deleteTarget.unit_number}</strong> ({deleteTarget.unit_code})؟</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}