import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search, Filter, Pencil, Trash2, Wrench, TrendingUp, TrendingDown,
  Clock, AlertTriangle, X, RotateCcw, Sparkles, Wrench as WrenchIcon,
  DollarSign, Activity, Award, MapPin, CalendarDays, Building2,
  Package, HardHat, Settings, Zap,
} from 'lucide-react';
import { equipmentStore, getProjectName } from '@/services/stores';

const fmt = (v: number) => formatQAR(v);

const categoryLabels: Record<string, string> = {
  vehicle: 'مركبة', generator: 'مولد كهرباء', excavator: 'حفار',
  crane: 'رافعة', compressor: 'ضاغط هواء', tools: 'أدوات',
  safety_equipment: 'معدات سلامة', scaffolding: 'سقالات', other: 'أخرى',
};

const categoryConfig: Record<string, { dot: string; chip: string }> = {
  vehicle:          { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  generator:        { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  excavator:        { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  crane:            { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
  compressor:       { dot: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100' },
  tools:            { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  safety_equipment: { dot: 'bg-lime-500', chip: 'bg-lime-50 text-lime-700 ring-1 ring-lime-100' },
  scaffolding:      { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  other:            { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};

const statusLabels: Record<string, string> = {
  available: 'متاح', assigned: 'مخصص', under_maintenance: 'قيد الصيانة',
  damaged: 'تالف', sold: 'مباع', retired: 'متقاعد',
};

const statusConfig: Record<string, { dot: string; chip: string }> = {
  available:         { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  assigned:          { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  under_maintenance: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  damaged:           { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  sold:              { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  retired:           { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};

const emptyForm = {
  equipment_code: '', equipment_name: '', category: 'other' as string,
  serial_number: '', purchase_date: '', purchase_cost: 0, current_value: 0,
  assigned_project_id: '', current_location: '', responsible_person_id: '',
  condition: '', status: 'available', notes: '',
};

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
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

/* ── Equipment Card ── */
function EquipmentCard({ eq, onEdit, onDelete, onMaintenance }: {
  eq: any; onEdit: (e: any) => void; onDelete: (e: any) => void; onMaintenance: (e: any) => void;
}) {
  const catCfg = categoryConfig[eq.category] || categoryConfig.other;
  const statCfg = statusConfig[eq.status] || statusConfig.available;
  const isUnderMaint = eq.status === 'under_maintenance';
  const isDamaged = eq.status === 'damaged';
  const depreciation = eq.purchase_cost > 0 ? Math.round(((eq.purchase_cost - (eq.current_value || 0)) / eq.purchase_cost) * 100) : 0;

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${
        isDamaged ? 'bg-rose-500' : isUnderMaint ? 'bg-amber-500' : 'bg-slate-500'
      }`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-slate-50 text-slate-600 ring-1 ring-slate-100 flex items-center justify-center shrink-0">
            <Wrench className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{eq.equipment_name}</div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{eq.equipment_code}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${catCfg.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${catCfg.dot}`} />
            {categoryLabels[eq.category] || eq.category}
          </span>
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${statCfg.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statCfg.dot}`} />
            {statusLabels[eq.status] || eq.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-gray-400" />{eq.current_location || '—'}</span>
        {eq.assigned_project_id && (
          <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3 text-gray-400" />{getProjectName(eq.assigned_project_id)}</span>
        )}
        {eq.serial_number && (
          <span className="flex items-center gap-1.5"><Settings className="h-3 w-3 text-gray-400" />{eq.serial_number}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">تكلفة الشراء</div>
          <div className="text-xs font-bold text-gray-800 ltr-only tabular-nums">{fmt(eq.purchase_cost)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">القيمة الحالية</div>
          <div className={`text-xs font-bold ltr-only tabular-nums ${depreciation > 50 ? 'text-amber-600' : 'text-gray-800'}`}>{fmt(eq.current_value)}</div>
        </div>
      </div>

      {depreciation > 0 && (
        <div className="mb-3.5">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-semibold text-gray-600">الاستهلاك</span>
            <span className="font-bold text-gray-800">{depreciation}%</span>
          </div>
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${depreciation > 70 ? 'bg-rose-500' : depreciation > 40 ? 'bg-amber-500' : 'bg-gradient-to-r from-slate-500 to-slate-400'}`}
              style={{ width: `${Math.min(100, depreciation)}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => onEdit(eq)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onMaintenance(eq)} className="h-7 px-2 rounded-md text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1">
          <Wrench className="h-3 w-3" /> صيانة
        </button>
        <button onClick={() => onDelete(eq)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Equipment List Row ── */
function EquipmentRow({ eq, onEdit, onDelete, onMaintenance }: {
  eq: any; onEdit: (e: any) => void; onDelete: (e: any) => void; onMaintenance: (e: any) => void;
}) {
  const catCfg = categoryConfig[eq.category] || categoryConfig.other;
  const statCfg = statusConfig[eq.status] || statusConfig.available;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <span className="font-mono text-xs text-blue-600">{eq.equipment_code}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm font-bold text-gray-900">{eq.equipment_name}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${catCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${catCfg.dot}`} />
          {categoryLabels[eq.category] || eq.category}
        </span>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-gray-600">{eq.serial_number || '—'}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(eq.purchase_cost)}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(eq.current_value)}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{eq.assigned_project_id ? getProjectName(eq.assigned_project_id) : '—'}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${statCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statCfg.dot}`} />
          {statusLabels[eq.status] || eq.status}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => onMaintenance(eq)} className="h-7 w-7 rounded-md text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors flex items-center justify-center">
                <Wrench className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>طلب صيانة</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => onEdit(eq)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>تعديل</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => onDelete(eq)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>حذف</TooltipContent>
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

/* ── Empty State ── */
function EmptyEquipment({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <HardHat className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد معدات</p>
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
export default function EquipmentPage() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const items = useMemo(() => equipmentStore.getAll(), [refresh]);

  const filtered = items.filter((eq: any) => {
    if (categoryFilter !== 'all' && eq.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && eq.status !== statusFilter) return false;
    if (search && !eq.equipment_name.includes(search) && !eq.equipment_code.includes(search)) return false;
    return true;
  });

  const activeCount = items.filter((eq: any) => eq.status === 'assigned' || eq.status === 'available').length;
  const underMaintenance = items.filter((eq: any) => eq.status === 'under_maintenance').length;
  const totalValue = items.reduce((s: number, eq: any) => s + (eq.purchase_cost || 0), 0);
  const damagedCount = items.filter((eq: any) => eq.status === 'damaged').length;

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };

  const openEdit = (eq: any) => {
    setEditId(eq.id);
    setForm({
      equipment_code: eq.equipment_code, equipment_name: eq.equipment_name,
      category: eq.category, serial_number: eq.serial_number,
      purchase_date: eq.purchase_date || '', purchase_cost: eq.purchase_cost,
      current_value: eq.current_value, assigned_project_id: eq.assigned_project_id || '',
      current_location: eq.current_location || '', responsible_person_id: eq.responsible_person_id || '',
      condition: eq.condition || '', status: eq.status, notes: eq.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.equipment_code || !form.equipment_name) return;
    const data: any = {
      company_id: '', equipment_code: form.equipment_code, equipment_name: form.equipment_name,
      category: form.category, serial_number: form.serial_number,
      purchase_date: form.purchase_date, purchase_cost: Number(form.purchase_cost),
      current_value: Number(form.current_value), assigned_project_id: form.assigned_project_id,
      current_location: form.current_location, responsible_person_id: form.responsible_person_id,
      condition: form.condition, status: form.status, notes: form.notes,
    };
    if (editId) equipmentStore.update(editId, data);
    else equipmentStore.create(data);
    setModalOpen(false); setRefresh(r => r + 1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    equipmentStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.equipment_name}`);
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  const resetFilters = () => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">المعدات</span>
              <span className="text-[13px] font-bold text-gray-900">{items.length} معدة</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block" />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث باسم أو كود المعدة..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>قيمة المعدات:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{fmt(totalValue)}</span>
          </div>

          <div className="me-auto" />

          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'list', label: 'قائمة', icon: Sparkles },
              { key: 'grid', label: 'بطاقات', icon: Activity },
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

          <Button onClick={openCreate}
            className="h-8 px-3 gap-1.5 bg-slate-500 hover:bg-slate-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <span>إضافة معدة</span>
          </Button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي المعدات" value={items.length} sub={`${filtered.length} معروض`} icon={Wrench} accent="slate" />
          <KpiCard label="نشطة" value={activeCount} sub="معدات عاملة" icon={Activity} trend={{ val: Math.round((activeCount / Math.max(1, items.length)) * 100), dir: 'up' }} accent="emerald" />
          <KpiCard label="صيانة" value={underMaintenance} sub="قيد الصيانة" icon={Clock} trend={{ val: underMaintenance, dir: 'down' }} accent="amber" />
          <KpiCard label="تالفة" value={damagedCount} sub="بحاجة إصلاح" icon={AlertTriangle} accent="rose" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">المعدات</h2>
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Activity className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyEquipment onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map((eq: any) => (
              <EquipmentCard key={eq.id} eq={eq} onEdit={openEdit} onDelete={setDeleteTarget}
                onMaintenance={(e) => navigate(`/maintenance/requests?assetId=${e.id}&assetName=${encodeURIComponent(e.equipment_name)}`)} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الكود</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">اسم المعدة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الفئة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الرقم التسلسلي</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">تكلفة الشراء</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">القيمة الحالية</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المشروع</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[120px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((eq: any) => (
                    <EquipmentRow key={eq.id} eq={eq} onEdit={openEdit} onDelete={setDeleteTarget}
                      onMaintenance={(e) => navigate(`/maintenance/requests?assetId=${e.id}&assetName=${encodeURIComponent(e.equipment_name)}`)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {items.length} معدة</span>
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
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف <strong className="text-gray-900">{deleteTarget.equipment_name}</strong>؟</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل معدة' : 'إضافة معدة'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>كود المعدة *</Label><Input value={form.equipment_code} onChange={e => setForm(f => ({ ...f, equipment_code: e.target.value }))} placeholder="مثال: EQP-001" /></div>
              <div><Label>اسم المعدة *</Label><Input value={form.equipment_name} onChange={e => setForm(f => ({ ...f, equipment_name: e.target.value }))} placeholder="اسم المعدة" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الفئة</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
              <div><Label>الرقم التسلسلي</Label><Input value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} placeholder="الرقم التسلسلي" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>تاريخ الشراء</Label><Input type="date" value={form.purchase_date} onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))} /></div>
              <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>تكلفة الشراء</Label><Input type="number" value={form.purchase_cost} onChange={e => setForm(f => ({ ...f, purchase_cost: Number(e.target.value) }))} /></div>
              <div><Label>القيمة الحالية</Label><Input type="number" value={form.current_value} onChange={e => setForm(f => ({ ...f, current_value: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>المشروع المخصص له</Label><Input value={form.assigned_project_id} onChange={e => setForm(f => ({ ...f, assigned_project_id: e.target.value }))} placeholder="معرف المشروع" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الموقع الحالي</Label><Input value={form.current_location} onChange={e => setForm(f => ({ ...f, current_location: e.target.value }))} placeholder="الموقع" /></div>
              <div><Label>الحالة الفنية</Label><Input value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))} placeholder="ممتازة - جيدة - متوسطة" /></div>
            </div>
            <div><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)} className="border-gray-200">إلغاء</Button><Button onClick={handleSave} className="bg-slate-500 hover:bg-slate-600 text-white">{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}