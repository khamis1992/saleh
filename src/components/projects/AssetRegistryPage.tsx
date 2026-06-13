import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Wrench, AlertTriangle, Calendar, Package, Search, RotateCcw, Sparkles, Activity, CheckCircle2, Clock, X, TrendingUp, TrendingDown, Filter, Trash2 } from 'lucide-react';
import { logAudit } from '@/utils/exportUtils';

interface Asset { id: string; asset_code: string; asset_name: string; category: 'hvac' | 'electrical' | 'plumbing' | 'elevator' | 'fire_safety' | 'security' | 'kitchen' | 'other'; property_id: string; property_name?: string; unit_id?: string; unit_code?: string; manufacturer: string; model: string; serial_number: string; install_date: string; warranty_end: string; last_service_date: string; next_service_date: string; service_frequency_months: number; status: 'operational' | 'needs_service' | 'out_of_service' | 'retired'; notes: string; created_at: string; }

const seedAssets: Asset[] = [
  { id: 'a-1', asset_code: 'AC-001', asset_name: 'مكيف سبليت 24000 وحدة', category: 'hvac', property_id: 'p-1', property_name: 'برج اللؤلؤة', unit_id: 'u-101', unit_code: 'A-101', manufacturer: 'LG', model: 'PC246SQ', serial_number: 'LG24-2024-001', install_date: '2024-01-15', warranty_end: '2026-01-15', last_service_date: '2025-10-15', next_service_date: '2026-04-15', service_frequency_months: 6, status: 'operational', notes: '', created_at: '2024-01-15' },
  { id: 'a-2', asset_code: 'EL-002', asset_name: 'لوحة كهرباء رئيسية', category: 'electrical', property_id: 'p-1', property_name: 'برج اللؤلؤة', manufacturer: 'Schneider', model: 'Prisma Plus', serial_number: 'SCH-PP-2024-002', install_date: '2024-01-15', warranty_end: '2027-01-15', last_service_date: '2025-07-15', next_service_date: '2026-01-15', service_frequency_months: 6, status: 'needs_service', notes: 'فحص دوري مستحق', created_at: '2024-01-15' },
  { id: 'a-3', asset_code: 'ELV-001', asset_name: 'مصعد ركاب رئيسي', category: 'elevator', property_id: 'p-1', property_name: 'برج اللؤلؤة', manufacturer: 'KONE', model: 'MonoSpace 500', serial_number: 'KN-MS500-2024-003', install_date: '2024-01-15', warranty_end: '2029-01-15', last_service_date: '2026-01-10', next_service_date: '2026-04-10', service_frequency_months: 3, status: 'operational', notes: 'تحت عقد صيانة سنوية', created_at: '2024-01-15' },
  { id: 'a-4', asset_code: 'PLB-005', asset_name: 'مضخة مياه رئيسية', category: 'plumbing', property_id: 'p-2', property_name: 'مجمع الياسمين', manufacturer: 'Grundfos', model: 'CR-32', serial_number: 'GF-CR32-2024-005', install_date: '2024-06-10', warranty_end: '2026-06-10', last_service_date: '2025-08-10', next_service_date: '2026-02-10', service_frequency_months: 6, status: 'operational', notes: '', created_at: '2024-06-10' },
  { id: 'a-5', asset_code: 'FS-001', asset_name: 'نظام إطفاء حريق', category: 'fire_safety', property_id: 'p-1', property_name: 'برج اللؤلؤة', manufacturer: 'Honeywell', model: 'XLS-140', serial_number: 'HW-XLS-2024-001', install_date: '2024-01-15', warranty_end: '2025-01-15', last_service_date: '2025-09-15', next_service_date: '2025-12-15', service_frequency_months: 3, status: 'needs_service', notes: 'الضمان انتهى، فحص سنوي ضروري', created_at: '2024-01-15' },
];

const categoryLabels: Record<string, string> = { hvac: 'تكييف', electrical: 'كهرباء', plumbing: 'سباكة', elevator: 'مصاعد', fire_safety: 'إطفاء حريق', security: 'أمن', kitchen: 'مطبخ', other: 'أخرى' };
const categoryConfig: Record<string, { dot: string; chip: string }> = {
  hvac: { dot: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100' }, electrical: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  plumbing: { dot: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100' }, elevator: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  fire_safety: { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 ring-1 ring-red-100' }, security: { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  kitchen: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' }, other: { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};
const statusMeta: Record<string, { label: string; dot: string; chip: string }> = {
  operational:    { label: 'يعمل', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  needs_service:  { label: 'يحتاج صيانة', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  out_of_service: { label: 'متوقف', dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  retired:        { label: 'مستبعد', dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};

function loadAssets(): Asset[] { try { return JSON.parse(localStorage.getItem('erp_assets') || '[]'); } catch { return []; } }
function saveAssets(assets: Asset[]) { localStorage.setItem('erp_assets', JSON.stringify(assets)); }

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  const a: Record<string, { iconBg: string; iconColor: string }> = { violet:{ iconBg: 'bg-violet-50', iconColor: 'text-violet-600' }, emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, rose:{ iconBg: 'bg-rose-50', iconColor: 'text-rose-600' }, slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' } }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

export default function AssetRegistryPage() {
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<Asset>>({ category: 'hvac', status: 'operational', service_frequency_months: 6 });
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  useEffect(() => { const e = loadAssets(); if (e.length === 0) { saveAssets(seedAssets); setAssets(seedAssets); } else setAssets(e); }, []);
  const refresh = () => setAssets(loadAssets());

  const filtered = useMemo(() => assets.filter(a => { if (filterCategory !== 'all' && a.category !== filterCategory) return false; if (filterStatus !== 'all' && a.status !== filterStatus) return false; if (search) { const q = search.toLowerCase(); const hay = `${a.asset_code} ${a.asset_name} ${a.manufacturer} ${a.model} ${a.serial_number}`.toLowerCase(); if (!hay.includes(q)) return false; } return true; }), [assets, search, filterCategory, filterStatus]);

  const stats = useMemo(() => {
    const total = assets.length;
    const operational = assets.filter(a => a.status === 'operational').length;
    const needService = assets.filter(a => a.status === 'needs_service').length;
    const warrantyExpiring = assets.filter(a => { const days = Math.floor((new Date(a.warranty_end).getTime() - Date.now()) / 86400000); return days < 90 && days > 0; }).length;
    return { total, operational, needService, warrantyExpiring };
  }, [assets]);
  const dueForService = useMemo(() => assets.filter(a => a.next_service_date && new Date(a.next_service_date) <= new Date(Date.now() + 30 * 86400000)).length, [assets]);

  const submitAsset = () => {
    if (!form.asset_code || !form.asset_name) { toast.error('كود واسم الأصل مطلوبان'); return; }
    const newAsset: Asset = { id: `a-${Date.now()}`, asset_code: form.asset_code!, asset_name: form.asset_name!, category: form.category as Asset['category'], property_id: form.property_id || '', property_name: form.property_name, unit_id: form.unit_id, unit_code: form.unit_code, manufacturer: form.manufacturer || '', model: form.model || '', serial_number: form.serial_number || '', install_date: form.install_date || new Date().toISOString().split('T')[0], warranty_end: form.warranty_end || '', last_service_date: form.last_service_date || '', next_service_date: form.next_service_date || '', service_frequency_months: form.service_frequency_months || 6, status: form.status as Asset['status'], notes: form.notes || '', created_at: new Date().toISOString().split('T')[0] };
    const updated = [newAsset, ...assets]; saveAssets(updated); setAssets(updated); setShowAdd(false); setForm({ category: 'hvac', status: 'operational', service_frequency_months: 6 });
    logAudit('create', 'assets', newAsset.id, '', newAsset.asset_code); toast.success('تم تسجيل الأصل');
  };

  const logService = (id: string) => {
    const updated = assets.map(a => a.id === id ? { ...a, last_service_date: new Date().toISOString().split('T')[0], status: 'operational' as const } : a);
    saveAssets(updated); setAssets(updated); toast.success('تم تسجيل الصيانة');
  };

  const handleDelete = () => { if (!deleteTarget) return; const updated = assets.filter(a => a.id !== deleteTarget.id); saveAssets(updated); setAssets(updated); toast.success('تم الحذف'); setDeleteTarget(null); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm"><Package className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-600">الأصول</span><span className="text-[13px] font-bold text-gray-900">{assets.length} أصل</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500"><span>تحتاج صيانة:</span><span className="font-bold text-amber-600 ltr-only tabular-nums">{stats.needService}</span></div>
          <div className="me-auto" />
          <Button onClick={() => setShowAdd(true)} className="h-8 px-3 gap-1.5 bg-violet-500 hover:bg-violet-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><Plus className="h-3.5 w-3.5" /><span>تسجيل أصل</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <KpiCard label="إجمالي الأصول" value={stats.total} icon={Package} accent="slate" />
          <KpiCard label="تعمل" value={stats.operational} icon={CheckCircle2} accent="emerald" />
          <KpiCard label="تحتاج صيانة" value={stats.needService} icon={AlertTriangle} accent="amber" />
          <KpiCard label="صيانة خلال 30 يوم" value={dueForService} icon={Calendar} accent="rose" />
          <KpiCard label="ضمان ينتهي قريباً" value={stats.warrantyExpiring} icon={Clock} accent="violet" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">سجل الأصول</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => { setSearch(''); setFilterCategory('all'); setFilterStatus('all'); }} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الفئة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">كل الفئات</SelectItem>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">كل الحالات</SelectItem>{Object.entries(statusMeta).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
            <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><Package className="h-8 w-8 text-gray-300" /></div>
            <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد أصول</p><p className="text-xs text-gray-400 mt-1">سجّل أصول العقار لتتبع الصيانة الدورية</p></div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-3 text-right">الكود</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-3 text-right">الأصل</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-3 text-right">الفئة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-3 text-right">المصنع/الموديل</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-3 text-right">الموقع</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-3 text-right">آخر صيانة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-3 text-right">القادمة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-3 text-right">الضمان</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-3 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-3 text-right w-[120px]">الإجراءات</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(a => {
                    const st = statusMeta[a.status];
                    const warrantyDays = a.warranty_end ? Math.floor((new Date(a.warranty_end).getTime() - Date.now()) / 86400000) : 99999;
                    const serviceOverdue = a.next_service_date && new Date(a.next_service_date) < new Date();
                    const cc = categoryConfig[a.category] || categoryConfig.other;
                    return (
                      <tr key={a.id} className={`hover:bg-gray-50/50 transition-colors ${a.status === 'needs_service' ? 'bg-amber-50/20' : ''}`}>
                        <td className="px-3 py-3"><span className="text-xs font-mono font-bold text-gray-900">{a.asset_code}</span></td>
                        <td className="px-3 py-3"><div><span className="text-sm font-bold text-gray-900">{a.asset_name}</span>{a.notes && <div className="text-[10px] text-gray-400">{a.notes}</div>}</div></td>
                        <td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${cc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} />{categoryLabels[a.category]}</span></td>
                        <td className="px-3 py-3"><div><div className="text-xs font-semibold text-gray-800">{a.manufacturer || '—'}</div><div className="text-[10px] text-gray-400">{a.model || '—'}</div></div></td>
                        <td className="px-3 py-3"><div><div className="text-xs font-semibold text-gray-800">{a.property_name || '—'}</div>{a.unit_code && <div className="text-[10px] font-mono text-gray-400">{a.unit_code}</div>}</div></td>
                        <td className="px-3 py-3 text-xs text-gray-600">{a.last_service_date || '—'}</td>
                        <td className="px-3 py-3 text-xs"><span className={`${serviceOverdue ? 'text-rose-700 font-bold' : 'text-gray-600'}`}>{a.next_service_date || '—'}</span></td>
                        <td className="px-3 py-3 text-xs"><span className={`${warrantyDays < 0 ? 'text-rose-700 font-bold' : warrantyDays < 90 ? 'text-amber-700' : 'text-emerald-700'}`}>{a.warranty_end ? `${a.warranty_end} ${warrantyDays < 0 ? '(منتهي)' : `(${warrantyDays} يوم)`}` : '—'}</span></td>
                        <td className="px-3 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${st.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{st.label}</span></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <Tooltip><TooltipTrigger asChild><button onClick={() => navigate(`/maintenance/requests?assetId=${a.id}&assetName=${encodeURIComponent(a.asset_name)}`)} className="h-7 px-2 rounded-md text-[10px] font-bold text-violet-600 hover:bg-violet-50 transition-colors flex items-center gap-1"><Wrench className="h-3 w-3" />صيانة</button></TooltipTrigger><TooltipContent>طلب صيانة</TooltipContent></Tooltip>
                            {a.status === 'needs_service' && <Tooltip><TooltipTrigger asChild><button onClick={() => logService(a.id)} className="h-7 px-2 rounded-md text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />تم</button></TooltipTrigger><TooltipContent>تسجيل الصيانة</TooltipContent></Tooltip>}
                            <Tooltip><TooltipTrigger asChild><button onClick={() => setDeleteTarget(a)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {assets.length} أصل</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف الأصل <strong className="text-gray-900">{deleteTarget.asset_name}</strong>؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">تسجيل أصل جديد</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="h-8 w-8 p-0 text-gray-400"><X className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>كود الأصل *</Label><Input value={form.asset_code || ''} onChange={e => setForm(f => ({ ...f, asset_code: e.target.value }))} /></div>
                <div><Label>الفئة</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div><Label>اسم الأصل *</Label><Input value={form.asset_name || ''} onChange={e => setForm(f => ({ ...f, asset_name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>المصنع</Label><Input value={form.manufacturer || ''} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} /></div><div><Label>الموديل</Label><Input value={form.model || ''} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} /></div></div>
              <div className="grid grid-cols-2 gap-3"><div><Label>الرقم التسلسلي</Label><Input value={form.serial_number || ''} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} /></div><div><Label>دورية الصيانة (شهور)</Label><Input type="number" value={form.service_frequency_months || 6} onChange={e => setForm(f => ({ ...f, service_frequency_months: Number(e.target.value) }))} /></div></div>
              <div className="grid grid-cols-3 gap-3"><div><Label>تاريخ التركيب</Label><Input type="date" value={form.install_date || ''} onChange={e => setForm(f => ({ ...f, install_date: e.target.value }))} /></div><div><Label>انتهاء الضمان</Label><Input type="date" value={form.warranty_end || ''} onChange={e => setForm(f => ({ ...f, warranty_end: e.target.value }))} /></div><div><Label>آخر صيانة</Label><Input type="date" value={form.last_service_date || ''} onChange={e => setForm(f => ({ ...f, last_service_date: e.target.value }))} /></div></div>
              <Button onClick={submitAsset} className="w-full bg-violet-500 hover:bg-violet-600 text-white h-9 text-sm font-bold rounded-lg">تسجيل الأصل</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}