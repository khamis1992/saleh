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
  Search, Filter, Eye, Pencil, Trash2, Plus, Building2, X, DoorOpen, TrendingUp,
  TrendingDown, RotateCcw, Sparkles, Users, Award, AlertTriangle, DollarSign,
  MapPin, Home, Percent, Activity, ArrowRight,
} from 'lucide-react';
import { propertyStore, unitStore } from '@/services/stores';

const fmt = formatQAR;
const fmtInt = formatQARInt;

const propertyTypeLabels: Record<string, string> = {
  residential_building: 'عمارة سكنية', commercial_building: 'عمارة تجارية',
  villa_compound: 'مجمع فلل', retail_complex: 'مجمع تجاري',
  villa: 'فيلا', mixed_use: 'متعدد الاستخدامات',
  warehouse: 'مستودع', office_building: 'مبنى مكاتب',
};

const typeConfig: Record<string, { dot: string; chip: string }> = {
  residential_building: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  commercial_building:  { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  villa_compound:       { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  retail_complex:       { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  villa:                { dot: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100' },
  mixed_use:            { dot: 'bg-pink-500', chip: 'bg-pink-50 text-pink-700 ring-1 ring-pink-100' },
  warehouse:            { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  office_building:      { dot: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' },
};

function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    indigo: { iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
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

function PropertyCard({ p, onDelete }: { p: any; onDelete: (p: any) => void }) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const typeCfg = typeConfig[p.property_type] || typeConfig.residential_building;
  const units = unitStore.getAll().filter((u: any) => u.property_id === p.id);
  const leased = units.filter((u: any) => u.status === 'leased').length;
  const totalUnits = units.length;
  const occRate = totalUnits > 0 ? Math.round((leased / totalUnits) * 100) : 0;

  return (
    <div onClick={() => navigate(`/properties/${p.id}`)}
      className="group relative bg-white rounded-xl border border-gray-100 p-5 cursor-pointer transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-indigo-500 opacity-60" />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{p.property_name}</div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{p.property_code}</div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${typeCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${typeCfg.dot}`} />
          {(t.properties.types as any)[p.property_type] || p.property_type}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-gray-400" />{p.address || '—'}</span>
        <span className="flex items-center gap-1.5"><DoorOpen className="h-3 w-3 text-gray-400" />{totalUnits} وحدة</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">الإشغال</div>
          <div className="flex items-center justify-center gap-1">
            <span className="text-lg font-bold text-gray-900">{occRate}%</span>
          </div>
          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${occRate > 80 ? 'bg-emerald-500' : occRate > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${occRate}%` }} />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">قيمة الأصل</div>
          <div className="text-xs font-bold text-gray-800 ltr-only tabular-nums">{fmtInt(p.total_asset_value || 0)}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => navigate(`/properties/${p.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => navigate(`/properties/${p.id}/edit`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(p)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1" />
        <button onClick={() => navigate(`/properties/${p.id}`)} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-indigo-600 transition-colors">
          التفاصيل <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function PropertyRow({ p, onDelete }: { p: any; onDelete: (p: any) => void }) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const typeCfg = typeConfig[p.property_type] || typeConfig.residential_building;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/properties/${p.id}`)}>
      <td className="px-4 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.property_code).then(() => toast.success('تم نسخ الكود')); }}
              className="font-mono text-xs text-indigo-600 hover:text-indigo-700 transition-colors">
              {p.property_code}
            </button>
          </TooltipTrigger>
          <TooltipContent>اضغط للنسخ</TooltipContent>
        </Tooltip>
      </td>
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{p.property_name}</span></td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${typeCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${typeCfg.dot}`} />
          {(t.properties.types as any)[p.property_type] || p.property_type}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">{p.address || '—'}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(p.total_asset_value)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${
          p.status === 'active' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' :
          p.status === 'under_construction' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' :
          p.status === 'inactive' ? 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' :
          'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${
            p.status === 'active' ? 'bg-emerald-500' :
            p.status === 'under_construction' ? 'bg-amber-500' :
            p.status === 'inactive' ? 'bg-gray-400' : 'bg-blue-500'
          }`} />
          {(t.properties.statuses as any)[p.status] || p.status}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => navigate(`/properties/${p.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>عرض</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => navigate(`/properties/${p.id}/edit`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(p)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyProperties({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <Building2 className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد عقارات</p>
        <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج تطابق فلاتر البحث</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1">
        <RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر
      </Button>
    </div>
  );
}

export default function LeasingPropertiesPage() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const properties = useMemo(() => propertyStore.getAll(), [refresh]);
  const units = useMemo(() => unitStore.getAll(), [refresh]);

  const filtered = properties.filter((p: any) => {
    if (typeFilter !== 'all' && p.property_type !== typeFilter) return false;
    if (search && !p.property_name.includes(search) && !p.property_code.includes(search)) return false;
    return true;
  });

  const totalUnits = units.length;
  const leasedUnits = units.filter((u: any) => u.status === 'leased').length;
  const availableUnits = units.filter((u: any) => u.status === 'available').length;
  const occupiedRate = totalUnits > 0 ? Math.round((leasedUnits / totalUnits) * 100) : 0;
  const totalAssetValue = properties.reduce((s: number, p: any) => s + (p.total_asset_value || 0), 0);

  const handleDelete = () => {
    if (!deleteTarget) return;
    propertyStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.property_name} بنجاح`);
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  const resetFilters = () => { setSearch(''); setTypeFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-indigo-600">العقارات</span>
              <span className="text-[13px] font-bold text-gray-900">{properties.length} عقار</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في العقارات..." value={search} onChange={e => setSearch(e.target.value)}
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
              { key: 'grid', label: 'بطاقات', icon: Building2 },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} role="tab" aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                <v.icon className="h-3 w-3" /><span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={() => navigate('/properties/create')}
            className="h-8 px-3 gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" /><span>إضافة عقار</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي العقارات" value={properties.length} sub={`${filtered.length} معروض`} icon={Building2} accent="slate" />
          <KpiCard label="إجمالي الوحدات" value={totalUnits} sub={`${leasedUnits} مؤجرة، ${availableUnits} متاحة`} icon={DoorOpen} accent="indigo" />
          <KpiCard label="نسبة الإشغال" value={`${occupiedRate}%`} sub="من إجمالي الوحدات" icon={Percent} trend={{ val: occupiedRate, dir: occupiedRate >= 50 ? 'up' : 'down' }} accent="emerald" />
          <KpiCard label="قيمة الأصول" value={fmtInt(totalAssetValue)} sub="إجمالي القيمة الدفترية" icon={DollarSign} accent="violet" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">{t.properties.title}</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                <RotateCcw className="h-3.5 w-3.5" /> إعادة
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(propertyTypeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyProperties onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(p => <PropertyCard key={p.id} p={p} onDelete={setDeleteTarget} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الكود</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">اسم العقار</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">النوع</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">العنوان</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">قيمة الأصل</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[100px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => <PropertyRow key={p.id} p={p} onDelete={setDeleteTarget} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {properties.length} عقار</span>
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
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف <strong className="text-gray-900">{deleteTarget.property_name}</strong> ({deleteTarget.property_code})؟</p>
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