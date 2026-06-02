import { useEffect, useMemo, useState } from 'react';
import { Plus, Wrench, AlertTriangle, Calendar, Package, Search } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyStateWithAction } from '@/components/shared/EmptyStateWithAction';
import { KpiCard } from '@/components/shared/KpiCard';
import { toast } from 'sonner';
import { logAudit } from '@/utils/exportUtils';
import { cn } from '@/utils/cn';

interface Asset {
  id: string;
  asset_code: string;
  asset_name: string;
  category: 'hvac' | 'electrical' | 'plumbing' | 'elevator' | 'fire_safety' | 'security' | 'kitchen' | 'other';
  property_id: string;
  property_name?: string;
  unit_id?: string;
  unit_code?: string;
  manufacturer: string;
  model: string;
  serial_number: string;
  install_date: string;
  warranty_end: string;
  last_service_date: string;
  next_service_date: string;
  service_frequency_months: number;
  status: 'operational' | 'needs_service' | 'out_of_service' | 'retired';
  notes: string;
  created_at: string;
}

const seedAssets: Asset[] = [
  { id: 'a-1', asset_code: 'AC-001', asset_name: 'مكيف سبليت 24000 وحدة', category: 'hvac', property_id: 'p-1', property_name: 'برج اللؤلؤة', unit_id: 'u-101', unit_code: 'A-101', manufacturer: 'LG', model: 'PC246SQ', serial_number: 'LG24-2024-001', install_date: '2024-01-15', warranty_end: '2026-01-15', last_service_date: '2025-10-15', next_service_date: '2026-04-15', service_frequency_months: 6, status: 'operational', notes: '', created_at: '2024-01-15' },
  { id: 'a-2', asset_code: 'EL-002', asset_name: 'لوحة كهرباء رئيسية', category: 'electrical', property_id: 'p-1', property_name: 'برج اللؤلؤة', manufacturer: 'Schneider', model: 'Prisma Plus', serial_number: 'SCH-PP-2024-002', install_date: '2024-01-15', warranty_end: '2027-01-15', last_service_date: '2025-07-15', next_service_date: '2026-01-15', service_frequency_months: 6, status: 'needs_service', notes: 'فحص دوري مستحق', created_at: '2024-01-15' },
  { id: 'a-3', asset_code: 'ELV-001', asset_name: 'مصعد ركاب رئيسي', category: 'elevator', property_id: 'p-1', property_name: 'برج اللؤلؤة', manufacturer: 'KONE', model: 'MonoSpace 500', serial_number: 'KN-MS500-2024-003', install_date: '2024-01-15', warranty_end: '2029-01-15', last_service_date: '2026-01-10', next_service_date: '2026-04-10', service_frequency_months: 3, status: 'operational', notes: 'تحت عقد صيانة سنوية', created_at: '2024-01-15' },
  { id: 'a-4', asset_code: 'PLB-005', asset_name: 'مضخة مياه رئيسية', category: 'plumbing', property_id: 'p-2', property_name: 'مجمع الياسمين', manufacturer: 'Grundfos', model: 'CR-32', serial_number: 'GF-CR32-2024-005', install_date: '2024-06-10', warranty_end: '2026-06-10', last_service_date: '2025-08-10', next_service_date: '2026-02-10', service_frequency_months: 6, status: 'operational', notes: '', created_at: '2024-06-10' },
  { id: 'a-5', asset_code: 'FS-001', asset_name: 'نظام إطفاء حريق', category: 'fire_safety', property_id: 'p-1', property_name: 'برج اللؤلؤة', manufacturer: 'Honeywell', model: 'XLS-140', serial_number: 'HW-XLS-2024-001', install_date: '2024-01-15', warranty_end: '2025-01-15', last_service_date: '2025-09-15', next_service_date: '2025-12-15', service_frequency_months: 3, status: 'needs_service', notes: 'الضمان انتهى، فحص سنوي ضروري', created_at: '2024-01-15' },
];

const CATEGORY_LABELS: Record<string, string> = {
  hvac: 'تكييف', electrical: 'كهرباء', plumbing: 'سباكة', elevator: 'مصاعد',
  fire_safety: 'إطفاء حريق', security: 'أمن', kitchen: 'مطبخ', other: 'أخرى',
};

const CATEGORY_ICONS: Record<string, any> = {
  hvac: '❄️', electrical: '⚡', plumbing: '💧', elevator: '🛗',
  fire_safety: '🔥', security: '🔒', kitchen: '🍳', other: '📦',
};

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
  operational: { label: 'يعمل', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  needs_service: { label: 'يحتاج صيانة', bg: 'bg-amber-100', text: 'text-amber-700' },
  out_of_service: { label: 'متوقف', bg: 'bg-red-100', text: 'text-red-700' },
  retired: { label: 'مستبعد', bg: 'bg-gray-100', text: 'text-gray-600' },
};

function loadAssets(): Asset[] {
  try { return JSON.parse(localStorage.getItem('erp_assets') || '[]'); } catch { return []; }
}
function saveAssets(assets: Asset[]) { localStorage.setItem('erp_assets', JSON.stringify(assets)); }

export default function AssetRegistryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<Asset>>({ category: 'hvac', status: 'operational', service_frequency_months: 6 });

  useEffect(() => {
    const existing = loadAssets();
    if (existing.length === 0) { saveAssets(seedAssets); setAssets(seedAssets); }
    else setAssets(existing);
  }, []);

  const refresh = () => setAssets(loadAssets());

  const filtered = useMemo(() => {
    return assets.filter(a => {
      if (filterCategory !== 'all' && a.category !== filterCategory) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${a.asset_code} ${a.asset_name} ${a.manufacturer} ${a.model} ${a.serial_number}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [assets, search, filterCategory, filterStatus]);

  const stats = useMemo(() => {
    const total = assets.length;
    const operational = assets.filter(a => a.status === 'operational').length;
    const needService = assets.filter(a => a.status === 'needs_service').length;
    const warrantyExpiring = assets.filter(a => {
      const days = Math.floor((new Date(a.warranty_end).getTime() - Date.now()) / 86400000);
      return days < 90 && days > 0;
    }).length;
    return { total, operational, needService, warrantyExpiring };
  }, [assets]);

  const dueForService = useMemo(() => {
    return assets.filter(a => a.next_service_date && new Date(a.next_service_date) <= new Date(Date.now() + 30 * 86400000)).length;
  }, [assets]);

  function submitAsset() {
    if (!form.asset_code || !form.asset_name) { toast.error('كود واسم الأصل مطلوبان'); return; }
    const newAsset: Asset = {
      id: `a-${Date.now()}`,
      asset_code: form.asset_code!,
      asset_name: form.asset_name!,
      category: form.category as Asset['category'],
      property_id: form.property_id || '',
      property_name: form.property_name,
      unit_id: form.unit_id,
      unit_code: form.unit_code,
      manufacturer: form.manufacturer || '',
      model: form.model || '',
      serial_number: form.serial_number || '',
      install_date: form.install_date || new Date().toISOString().split('T')[0],
      warranty_end: form.warranty_end || '',
      last_service_date: form.last_service_date || '',
      next_service_date: form.next_service_date || '',
      service_frequency_months: form.service_frequency_months || 6,
      status: form.status as Asset['status'],
      notes: form.notes || '',
      created_at: new Date().toISOString().split('T')[0],
    };
    const updated = [newAsset, ...assets];
    saveAssets(updated);
    setAssets(updated);
    setShowAdd(false);
    setForm({ category: 'hvac', status: 'operational', service_frequency_months: 6 });
    logAudit('create', 'assets', newAsset.id, '', newAsset.asset_code);
    toast.success('تم تسجيل الأصل');
  }

  function logService(id: string) {
    const updated = assets.map(a => a.id === id ? { ...a, last_service_date: new Date().toISOString().split('T')[0], status: 'operational' as const } : a);
    saveAssets(updated);
    setAssets(updated);
    toast.success('تم تسجيل الصيانة');
  }

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader title="سجل الأصول" description="تتبع جميع أصول العقارات — معدات، أنظمة، تجهيزات">
        <Button onClick={() => setShowAdd(true)} className="bg-[#3B82F6] hover:bg-blue-600 text-white h-9 text-sm gap-1.5">
          <Plus className="h-4 w-4" /> تسجيل أصل
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="إجمالي الأصول" value={stats.total} sublabel="مسجلة" icon={<Package className="h-5 w-5" />} color="blue" />
        <KpiCard label="تعمل" value={stats.operational} sublabel="حالة جيدة" icon={<Wrench className="h-5 w-5" />} color="emerald" />
        <KpiCard label="تحتاج صيانة" value={stats.needService} sublabel="مستحقة" icon={<Wrench className="h-5 w-5" />} color="amber" />
        <KpiCard label="صيانة خلال 30 يوم" value={dueForService} sublabel="قادمة" icon={<Calendar className="h-5 w-5" />} color="orange" />
        <KpiCard label="ضمان ينتهي قريباً" value={stats.warrantyExpiring} sublabel="خلال 90 يوم" icon={<AlertTriangle className="h-5 w-5" />} color="red" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بكود، اسم، مصنع، موديل، رقم تسلسلي..." className="pr-9 h-9 text-sm" />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue placeholder="الفئة" /></SelectTrigger>
          <SelectContent>{[{ value: 'all', label: 'كل الفئات' }, ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))].map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue placeholder="الحالة" /></SelectTrigger>
          <SelectContent>{[{ value: 'all', label: 'كل الحالات' }, ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))].map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyStateWithAction
              size="lg"
              icon={<Package className="h-10 w-10 text-blue-500" />}
              title="لا توجد أصول"
              description="سجّل أصول العقار لتتبع الصيانة الدورية والضمان."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-right p-3 font-semibold">الكود</th>
                    <th className="text-right p-3 font-semibold">الأصل</th>
                    <th className="text-right p-3 font-semibold">الفئة</th>
                    <th className="text-right p-3 font-semibold">المصنع/الموديل</th>
                    <th className="text-right p-3 font-semibold">الموقع</th>
                    <th className="text-right p-3 font-semibold">آخر صيانة</th>
                    <th className="text-right p-3 font-semibold">الصيانة القادمة</th>
                    <th className="text-right p-3 font-semibold">الضمان</th>
                    <th className="text-right p-3 font-semibold">الحالة</th>
                    <th className="text-right p-3 font-semibold w-[100px]">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(a => {
                    const st = STATUS_META[a.status];
                    const warrantyDays = a.warranty_end ? Math.floor((new Date(a.warranty_end).getTime() - Date.now()) / 86400000) : 99999;
                    const serviceOverdue = a.next_service_date && new Date(a.next_service_date) < new Date();
                    return (
                      <tr key={a.id} className={cn('hover:bg-gray-50/50', a.status === 'needs_service' && 'bg-amber-50/30')}>
                        <td className="p-3 font-mono text-xs">{a.asset_code}</td>
                        <td className="p-3">
                          <p className="font-semibold text-sm">{CATEGORY_ICONS[a.category]} {a.asset_name}</p>
                        </td>
                        <td className="p-3"><span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">{CATEGORY_LABELS[a.category]}</span></td>
                        <td className="p-3 text-xs">
                          <p className="font-semibold">{a.manufacturer}</p>
                          <p className="text-muted-foreground">{a.model}</p>
                        </td>
                        <td className="p-3 text-xs">
                          <p className="font-semibold">{a.property_name || '—'}</p>
                          {a.unit_code && <p className="text-muted-foreground font-mono">{a.unit_code}</p>}
                        </td>
                        <td className="p-3 text-xs">{a.last_service_date || '—'}</td>
                        <td className="p-3 text-xs">
                          <span className={cn(serviceOverdue && 'text-red-700 font-bold')}>
                            {a.next_service_date || '—'}
                          </span>
                        </td>
                        <td className="p-3 text-xs">
                          {a.warranty_end && (
                            <span className={cn(warrantyDays < 0 ? 'text-red-700 font-bold' : warrantyDays < 90 ? 'text-amber-700' : 'text-emerald-700')}>
                              {a.warranty_end} {warrantyDays < 0 ? '(منتهي)' : `(${warrantyDays} يوم)`}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', st.bg, st.text)}>{st.label}</span>
                        </td>
                        <td className="p-3">
                          <Button size="sm" variant="outline" onClick={() => logService(a.id)} className="h-7 text-[11px]">
                            <Wrench className="h-3 w-3" /> صيانة
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold">تسجيل أصل جديد</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>إلغاء</Button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>كود الأصل *</Label><Input value={form.asset_code || ''} onChange={e => setForm(f => ({ ...f, asset_code: e.target.value }))} placeholder="AC-005" /></div>
                  <div><Label>الفئة</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as Asset['category'] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>اسم الأصل *</Label><Input value={form.asset_name || ''} onChange={e => setForm(f => ({ ...f, asset_name: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>المصنع</Label><Input value={form.manufacturer || ''} onChange={e => setForm(f => ({ ...f, manufacturer: e.target.value }))} /></div>
                  <div><Label>الموديل</Label><Input value={form.model || ''} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>الرقم التسلسلي</Label><Input value={form.serial_number || ''} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} /></div>
                  <div><Label>دورية الصيانة (شهور)</Label><Input type="number" value={form.service_frequency_months || 6} onChange={e => setForm(f => ({ ...f, service_frequency_months: Number(e.target.value) }))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>تاريخ التركيب</Label><Input type="date" value={form.install_date || ''} onChange={e => setForm(f => ({ ...f, install_date: e.target.value }))} /></div>
                  <div><Label>انتهاء الضمان</Label><Input type="date" value={form.warranty_end || ''} onChange={e => setForm(f => ({ ...f, warranty_end: e.target.value }))} /></div>
                  <div><Label>آخر صيانة</Label><Input type="date" value={form.last_service_date || ''} onChange={e => setForm(f => ({ ...f, last_service_date: e.target.value }))} /></div>
                </div>
                <Button onClick={submitAsset} className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white h-9">تسجيل الأصل</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
