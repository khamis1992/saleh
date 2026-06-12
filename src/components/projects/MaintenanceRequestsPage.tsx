import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Filter, Eye, Trash2, X, Wrench, AlertTriangle, CheckCircle2, Clock,
  TrendingUp, TrendingDown, RotateCcw, Sparkles, Users, CalendarDays, Activity,
  ArrowRight, HardHat, Zap, MapPin, FileText,
} from 'lucide-react';
import { maintenanceStore, unitStore, tenantStore, workOrderStore } from '@/services/stores';
import type { MaintenanceRequest } from '@/types';

const priorityConfig: Record<string, { dot: string; chip: string }> = {
  emergency: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  high:      { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  medium:    { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  low:       { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
};

const statusConfig: Record<string, { dot: string; chip: string }> = {
  open:          { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  approved:      { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  in_progress:   { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  completed:     { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  closed:        { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  cancelled:     { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};

function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    orange: { iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
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

function MaintCard({ m, onDelete, onCreateWO, getUnitNumber, getTenantName }: {
  m: MaintenanceRequest; onDelete: (m: MaintenanceRequest) => void; onCreateWO: (m: MaintenanceRequest) => void;
  getUnitNumber: (id: string) => string; getTenantName: (id: string) => string;
}) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const prioCfg = priorityConfig[m.priority] || priorityConfig.medium;
  const statCfg = statusConfig[m.status] || statusConfig.open;
  const isEmergency = m.priority === 'emergency';

  return (
    <div onClick={() => navigate(`/maintenance/requests/${m.id}`)}
      className="group relative bg-white rounded-xl border border-gray-100 p-5 cursor-pointer transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${isEmergency ? 'bg-rose-500' : m.priority === 'high' ? 'bg-orange-500' : 'bg-amber-500'}`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-lg ${isEmergency ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-100' : 'bg-orange-50 text-orange-600 ring-1 ring-orange-100'} flex items-center justify-center shrink-0`}>
            <Wrench className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{m.request_number}</div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">{m.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${prioCfg.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${prioCfg.dot}`} />
            {(t.maintenance.priorities as any)[m.priority] || m.priority}
          </span>
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${statCfg.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statCfg.dot}`} />
            {(t.maintenance.statuses as any)[m.status] || m.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-gray-400" />وحدة {getUnitNumber(m.unit_id)}</span>
        <span className="flex items-center gap-1.5"><Users className="h-3 w-3 text-gray-400" />{getTenantName(m.tenant_id)}</span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><Activity className="h-3 w-3 text-gray-400" />{(t.maintenance.categories as any)[m.category] || m.category}</span>
        {m.created_at && <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-gray-400" />{m.created_at.slice(0, 10)}</span>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => navigate(`/maintenance/requests/${m.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </button>
        {m.status === 'approved' && (
          <button onClick={() => onCreateWO(m)} className="h-7 px-2 rounded-md text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1">
            <Wrench className="h-3 w-3" /> أمر عمل
          </button>
        )}
        <button onClick={() => onDelete(m)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1" />
        <button onClick={() => navigate(`/maintenance/requests/${m.id}`)} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-orange-600 transition-colors">
          التفاصيل <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function MaintRow({ m, onDelete, onCreateWO, getUnitNumber, getTenantName }: {
  m: MaintenanceRequest; onDelete: (m: MaintenanceRequest) => void; onCreateWO: (m: MaintenanceRequest) => void;
  getUnitNumber: (id: string) => string; getTenantName: (id: string) => string;
}) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const prioCfg = priorityConfig[m.priority] || priorityConfig.medium;
  const statCfg = statusConfig[m.status] || statusConfig.open;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/maintenance/requests/${m.id}`)}>
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{m.request_number}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{getUnitNumber(m.unit_id)}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{getTenantName(m.tenant_id)}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{(t.maintenance.categories as any)[m.category] || m.category}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${prioCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${prioCfg.dot}`} />
          {(t.maintenance.priorities as any)[m.priority] || m.priority}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">{m.description}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${statCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statCfg.dot}`} />
          {(t.maintenance.statuses as any)[m.status] || m.status}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => navigate(`/maintenance/requests/${m.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>عرض</TooltipContent></Tooltip>
          {m.status === 'approved' && (
            <Tooltip><TooltipTrigger asChild><button onClick={() => onCreateWO(m)} className="h-7 px-2 rounded-md text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1"><Wrench className="h-3 w-3" />أمر عمل</button></TooltipTrigger><TooltipContent>إنشاء أمر عمل</TooltipContent></Tooltip>
          )}
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(m)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyMaint({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <Wrench className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد طلبات صيانة</p>
        <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج تطابق فلاتر البحث</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function MaintenanceRequestsPage() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MaintenanceRequest[]>(() => maintenanceStore.getAll());
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceRequest | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const refresh = () => setRequests(maintenanceStore.getAll());

  const getUnitNumber = (unitId: string) => unitStore.getById(unitId)?.unit_number || '—';
  const getTenantName = (tenantId: string) => {
    const t = tenantStore.getById(tenantId);
    return t?.full_name || t?.company_name || '—';
  };

  const filtered = useMemo(() => {
    return requests.filter((m) => {
      if (priorityFilter !== 'all' && m.priority !== priorityFilter) return false;
      if (search && !m.description.includes(search) && !m.request_number.includes(search)) return false;
      return true;
    });
  }, [requests, search, priorityFilter]);

  const workOrders = useMemo(() => workOrderStore.getAll(), []);
  const openOrders = workOrders.filter((w: any) => w.status !== 'completed' && w.status !== 'closed').length;
  const emergencyRequests = requests.filter((m: any) => m.priority === 'emergency' || m.priority === 'high').length;
  const completedRequests = requests.filter((m: any) => m.status === 'completed' || m.status === 'closed').length;

  const handleDelete = () => {
    if (!deleteTarget) return;
    maintenanceStore.remove(deleteTarget.id);
    refresh();
    toast.success(`تم حذف طلب الصيانة ${deleteTarget.request_number} بنجاح`);
    setDeleteTarget(null);
  };

  const handleCreateWO = (m: MaintenanceRequest) => {
    const yearCode = new Date().getFullYear();
    const existing = workOrderStore.getAll();
    const count = existing.filter((w: any) => w.work_order_number?.includes(String(yearCode))).length + 1;
    const woNumber = `WO-${yearCode}-${String(count).padStart(3, '0')}`;
    workOrderStore.create({
      work_order_number: woNumber, maintenance_request_id: m.id, technician_id: '',
      scheduled_date: new Date().toISOString().split('T')[0], total_cost: 0, status: 'assigned',
      diagnosis: m.issue_description || '', notes: `تم إنشاؤه من طلب الصيانة ${m.request_number}`,
    } as any);
    maintenanceStore.update(m.id, { status: 'in_progress' } as any);
    toast.success(`تم إنشاء أمر العمل ${woNumber}`);
    refresh();
  };

  const resetFilters = () => { setSearch(''); setPriorityFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-sm">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-orange-600">الصيانة</span>
              <span className="text-[13px] font-bold text-gray-900">{requests.length} طلب</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في طلبات الصيانة..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>طارئة:</span>
            <span className="font-bold text-rose-600 ltr-only tabular-nums">{emergencyRequests}</span>
          </div>
          <div className="me-auto" />
          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'list', label: 'قائمة', icon: Sparkles },
              { key: 'grid', label: 'بطاقات', icon: Wrench },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} role="tab" aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                <v.icon className="h-3 w-3" /><span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={() => navigate('/maintenance/requests/create')}
            className="h-8 px-3 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <span>+ طلب صيانة</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الطلبات" value={requests.length} sub={`${filtered.length} معروض`} icon={FileText} accent="slate" />
          <KpiCard label="طارئة" value={emergencyRequests} sub="أولوية عالية" icon={AlertTriangle} trend={{ val: emergencyRequests, dir: 'down' }} accent="rose" />
          <KpiCard label="أوامر عمل" value={openOrders} sub="قيد التنفيذ" icon={Clock} accent="amber" />
          <KpiCard label="مكتملة" value={completedRequests} sub="مغلقة ومؤرشفة" icon={CheckCircle2} accent="emerald" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">{t.maintenance.title}</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="emergency">طارئة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyMaint onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(m => <MaintCard key={m.id} m={m} onDelete={setDeleteTarget} onCreateWO={handleCreateWO} getUnitNumber={getUnitNumber} getTenantName={getTenantName} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">رقم الطلب</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الوحدة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المستأجر</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التصنيف</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الأولوية</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الوصف</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[130px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => <MaintRow key={m.id} m={m} onDelete={setDeleteTarget} onCreateWO={handleCreateWO} getUnitNumber={getUnitNumber} getTenantName={getTenantName} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {requests.length} طلب</span>
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
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف طلب الصيانة <strong className="text-gray-900">{deleteTarget.request_number}</strong>؟</p>
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