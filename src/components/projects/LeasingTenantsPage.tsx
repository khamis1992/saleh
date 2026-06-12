import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Filter, Eye, Pencil, Trash2, Plus, Users, X, UserPlus, Phone, Calendar,
  TrendingUp, TrendingDown, RotateCcw, Sparkles, Award, AlertTriangle,
  Mail, MapPin, CreditCard, Building2, ArrowRight, UserCheck,
} from 'lucide-react';
import { tenantStore, leaseStore } from '@/services/stores';

const typeConfig: Record<string, { dot: string; chip: string }> = {
  individual: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  company:    { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
};

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
    violet2:{ iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
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

function TenantCard({ tn, onDelete }: { tn: any; onDelete: (t: any) => void }) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const typeCfg = typeConfig[tn.tenant_type] || typeConfig.individual;
  const isActive = tn.status === 'active';

  return (
    <div onClick={() => navigate(`/tenants/${tn.id}`)}
      className="group relative bg-white rounded-xl border border-gray-100 p-5 cursor-pointer transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${isActive ? 'bg-violet-500' : 'bg-gray-300'}`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-lg ${isActive ? 'bg-violet-50 text-violet-600 ring-1 ring-violet-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'} flex items-center justify-center shrink-0`}>
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{tn.full_name}</div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{tn.tenant_code}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${typeCfg.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${typeCfg.dot}`} />
            {(t.tenants.types as any)[tn.tenant_type] || tn.tenant_type}
          </span>
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {isActive ? 'نشط' : 'غير نشط'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-gray-400" />{tn.phone}</span>
        <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-gray-400" />{tn.email}</span>
        {tn.national_id && <span className="flex items-center gap-1.5"><CreditCard className="h-3 w-3 text-gray-400" />{tn.national_id}</span>}
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-3.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">العقود النشطة</div>
          <div className="text-lg font-bold text-gray-900 tabular-nums">{tn.active_contracts ?? 0}</div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
          <UserCheck className="h-5 w-5" />
        </div>
      </div>

      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => navigate(`/tenants/${tn.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => navigate(`/tenants/${tn.id}/edit`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(tn)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1" />
        <button onClick={() => navigate(`/tenants/${tn.id}`)} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-violet-600 transition-colors">
          التفاصيل <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function TenantRow({ tn, onDelete }: { tn: any; onDelete: (t: any) => void }) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const typeCfg = typeConfig[tn.tenant_type] || typeConfig.individual;
  const isActive = tn.status === 'active';

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => navigate(`/tenants/${tn.id}`)}>
      <td className="px-4 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(tn.tenant_code).then(() => toast.success('تم نسخ الكود')); }}
              className="font-mono text-xs text-violet-600 hover:text-violet-700 transition-colors">{tn.tenant_code}</button>
          </TooltipTrigger>
          <TooltipContent>اضغط للنسخ</TooltipContent>
        </Tooltip>
      </td>
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{tn.full_name}</span></td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${typeCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${typeCfg.dot}`} />
          {(t.tenants.types as any)[tn.tenant_type] || tn.tenant_type}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600 font-mono ltr-only">{tn.national_id || '—'}</td>
      <td className="px-4 py-3 text-xs text-gray-600 ltr-only" dir="ltr">{tn.phone}</td>
      <td className="px-4 py-3 text-xs text-gray-600 truncate max-w-[160px] ltr-only">{tn.email}</td>
      <td className="px-4 py-3 text-xs font-bold text-gray-800 tabular-nums">{tn.active_contracts ?? 0}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {isActive ? 'نشط' : 'غير نشط'}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => navigate(`/tenants/${tn.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>عرض</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => navigate(`/tenants/${tn.id}/edit`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(tn)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyTenants({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <Users className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا يوجد مستأجرون</p>
        <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج تطابق فلاتر البحث</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1">
        <RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر
      </Button>
    </div>
  );
}

export default function LeasingTenantsPage() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const tenants = useMemo(() => tenantStore.getAll(), [refresh]);
  const leases = useMemo(() => leaseStore.getAll(), [refresh]);

  const filtered = tenants.filter((t: any) => {
    if (typeFilter !== 'all' && t.tenant_type !== typeFilter) return false;
    if (search && !t.full_name.includes(search) && !t.tenant_code.includes(search)) return false;
    return true;
  });

  const activeLeases = leases.filter((l: any) => l.status === 'active').length;
  const individualTenants = tenants.filter((t: any) => t.tenant_type === 'individual').length;
  const companyTenants = tenants.filter((t: any) => t.tenant_type === 'company').length;

  const handleDelete = () => {
    if (!deleteTarget) return;
    tenantStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.full_name} بنجاح`);
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  const resetFilters = () => { setSearch(''); setTypeFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-600">المستأجرون</span>
              <span className="text-[13px] font-bold text-gray-900">{tenants.length} مستأجر</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في المستأجرين..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>عقود نشطة:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{activeLeases}</span>
          </div>
          <div className="me-auto" />
          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'list', label: 'قائمة', icon: Sparkles },
              { key: 'grid', label: 'بطاقات', icon: Users },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} role="tab" aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                <v.icon className="h-3 w-3" /><span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={() => navigate('/tenants/create')}
            className="h-8 px-3 gap-1.5 bg-violet-500 hover:bg-violet-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" /><span>إضافة مستأجر</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي المستأجرين" value={tenants.length} sub={`${filtered.length} معروض`} icon={Users} accent="slate" />
          <KpiCard label="عقود نشطة" value={activeLeases} sub="عقود إيجار سارية" icon={Calendar} trend={{ val: Math.round((activeLeases / Math.max(1, tenants.length)) * 100), dir: 'up' }} accent="emerald" />
          <KpiCard label="أفراد" value={individualTenants} sub="مستأجرين أفراد" icon={UserPlus} accent="blue" />
          <KpiCard label="شركات" value={companyTenants} sub="مستأجرين شركات" icon={Building2} accent="violet" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">{t.tenants.title}</h2>
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
                <SelectItem value="individual">فرد</SelectItem>
                <SelectItem value="company">شركة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyTenants onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(tn => <TenantCard key={tn.id} tn={tn} onDelete={setDeleteTarget} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الكود</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الاسم</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">النوع</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">رقم الهوية</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الهاتف</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">البريد</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">العقود</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[100px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(tn => <TenantRow key={tn.id} tn={tn} onDelete={setDeleteTarget} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {tenants.length} مستأجر</span>
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
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف المستأجر <strong className="text-gray-900">{deleteTarget.full_name}</strong> ({deleteTarget.tenant_code})؟</p>
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