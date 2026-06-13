import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Filter, Pencil, Trash2, Play, RotateCcw, Sparkles, Activity, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, X, Wrench } from 'lucide-react';
import { createStore, generateId } from '@/services/dataService';

interface PreventiveMaintenance { id: string; property_id: string; unit_id: string; asset_name: string; category: string; frequency: string; next_due_date: string; assigned_to: string; status: string; notes: string; }

const seedPM: PreventiveMaintenance[] = [
  { id: 'pm-1', property_id: 'prop-1', unit_id: '', asset_name: 'مكيفات عمارة النخيل', category: 'ac', frequency: 'monthly', next_due_date: '2026-06-15', assigned_to: 'فني خالد', status: 'scheduled', notes: 'تنظيف وصيانة دورية' },
  { id: 'pm-2', property_id: 'prop-2', unit_id: '', asset_name: 'مصاعد أبراج السلام', category: 'elevator', frequency: 'monthly', next_due_date: '2026-06-01', assigned_to: 'شركة المصاعد المتحدة', status: 'in_progress', notes: 'فحص السلامة الشهري' },
  { id: 'pm-3', property_id: 'prop-1', unit_id: '', asset_name: 'نظام إنذار الحريق', category: 'fire_alarm', frequency: 'quarterly', next_due_date: '2026-08-30', assigned_to: 'شركة الأمان للسلامة', status: 'scheduled', notes: 'فحص واختبار أجهزة الإنذار' },
  { id: 'pm-4', property_id: 'prop-3', unit_id: '', asset_name: 'مضخات المياه', category: 'water_pumps', frequency: 'monthly', next_due_date: '2026-06-10', assigned_to: 'فني أحمد', status: 'scheduled', notes: 'فحص وصيانة مضخات المياه' },
  { id: 'pm-5', property_id: 'prop-1', unit_id: '', asset_name: 'لوحات الكهرباء الرئيسية', category: 'electrical_panels', frequency: 'quarterly', next_due_date: '2026-07-20', assigned_to: 'فني سعيد', status: 'scheduled', notes: 'فحص القواطع والتمديدات' },
  { id: 'pm-6', property_id: 'prop-2', unit_id: '', asset_name: 'كاميرات المراقبة', category: 'cctv', frequency: 'monthly', next_due_date: '2026-06-05', assigned_to: 'فني محمد', status: 'overdue', notes: 'تنظيف وفحص الكاميرات' },
];

const pmStore = createStore<PreventiveMaintenance>({ key: 'erp_pm_schedules', seed: seedPM });

const categoryLabels: Record<string, string> = { ac: 'تكييف', elevator: 'مصاعد', fire_alarm: 'إنذار حريق', water_pumps: 'مضخات مياه', electrical_panels: 'لوحات كهرباء', cctv: 'كاميرات مراقبة', pest_control: 'مكافحة حشرات', cleaning: 'تنظيف', landscaping: 'تنسيق حدائق' };
const categoryConfig: Record<string, { dot: string; chip: string }> = {
  ac: { dot: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100' }, elevator: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  fire_alarm: { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 ring-1 ring-red-100' }, water_pumps: { dot: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100' },
  electrical_panels: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' }, cctv: { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  pest_control: { dot: 'bg-lime-500', chip: 'bg-lime-50 text-lime-700 ring-1 ring-lime-100' }, cleaning: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  landscaping: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
};
const frequencyLabels: Record<string, string> = { weekly: 'أسبوعي', monthly: 'شهري', quarterly: 'ربع سنوي', semi_annually: 'نصف سنوي', annually: 'سنوي' };
const statusLabels: Record<string, string> = { scheduled: 'مجدولة', in_progress: 'قيد التنفيذ', completed: 'مكتملة', overdue: 'متأخرة', cancelled: 'ملغاة' };
const statusConfig: Record<string, { dot: string; chip: string }> = {
  scheduled:   { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  in_progress: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  completed:   { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  overdue:     { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  cancelled:   { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};
const frequencyDays: Record<string, number> = { weekly: 7, monthly: 30, quarterly: 90, semi_annually: 180, annually: 365 };

function getPropertyName(id: string): string {
  try { const raw = localStorage.getItem('erp_properties'); if (raw) { const items = JSON.parse(raw); const p = items.find((x: any) => x.id === id); if (p) return p.property_name || ''; } } catch {}
  return id;
}

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  const a: Record<string, { iconBg: string; iconColor: string }> = { teal:{ iconBg: 'bg-teal-50', iconColor: 'text-teal-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, rose:{ iconBg: 'bg-rose-50', iconColor: 'text-rose-600' }, slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' } }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

function PMRow({ s, onEdit, onDelete }: { s: PreventiveMaintenance; onEdit: (s: PreventiveMaintenance) => void; onDelete: (id: string) => void }) {
  const isOverdue = s.status === 'overdue';
  const cc = categoryConfig[s.category] || categoryConfig.ac;
  const sc = statusConfig[s.status] || statusConfig.scheduled;
  return (
    <tr className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${isOverdue ? 'bg-rose-50/30' : ''}`}>
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{s.asset_name}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{getPropertyName(s.property_id)}</td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${cc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} />{categoryLabels[s.category]}</span></td>
      <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold bg-gray-50 text-gray-600 ring-1 ring-gray-100">{frequencyLabels[s.frequency]}</span></td>
      <td className="px-4 py-3"><span className={`text-xs font-mono font-bold ${isOverdue ? 'text-rose-600' : 'text-gray-700'}`}>{s.next_due_date}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{s.assigned_to}</td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${sc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />{statusLabels[s.status]}</span></td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(s)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(s.id)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyPM({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><Wrench className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد جداول صيانة</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function PreventiveMaintenancePage() {
  const { t, dir } = useLocale();
  const [schedules, setSchedules] = useState<PreventiveMaintenance[]>(() => pmStore.getAll());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PreventiveMaintenance | null>(null);
  const [form, setForm] = useState<Partial<PreventiveMaintenance>>({ property_id: '', unit_id: '', asset_name: '', category: 'ac', frequency: 'monthly', next_due_date: '', assigned_to: '', status: 'scheduled', notes: '' });

  const refresh = () => setSchedules(pmStore.getAll());
  const filtered = useMemo(() => schedules.filter(s => { if (categoryFilter !== 'all' && s.category !== categoryFilter) return false; if (statusFilter !== 'all' && s.status !== statusFilter) return false; if (search && !s.asset_name.includes(search) && !getPropertyName(s.property_id).includes(search)) return false; return true; }), [schedules, search, categoryFilter, statusFilter]);

  const overdueCount = schedules.filter(s => s.status === 'overdue').length;
  const scheduledCount = schedules.filter(s => s.status === 'scheduled').length;
  const inProgressCount = schedules.filter(s => s.status === 'in_progress').length;

  const openCreate = () => { setEditingId(null); setForm({ property_id: '', unit_id: '', asset_name: '', category: 'ac', frequency: 'monthly', next_due_date: '', assigned_to: '', status: 'scheduled', notes: '' }); setShowModal(true); };
  const openEdit = (s: PreventiveMaintenance) => { setEditingId(s.id); setForm({ ...s }); setShowModal(true); };
  const save = () => { if (!form.asset_name || !form.property_id) return; if (editingId) pmStore.update(editingId, form); else pmStore.create(form as Omit<PreventiveMaintenance, 'id'>); refresh(); setShowModal(false); };
  const handleDelete = () => { if (!deleteTarget) return; pmStore.remove(deleteTarget.id); toast.success('تم الحذف'); setDeleteTarget(null); refresh(); };
  const resetFilters = () => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all'); };

  const generateWorkOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    const rawWO = localStorage.getItem('erp_work_orders');
    const existingWOs: any[] = rawWO ? JSON.parse(rawWO) : [];
    const dueSchedules = pmStore.getAll().filter(s => s.next_due_date <= today && s.status === 'scheduled');
    if (dueSchedules.length === 0) { toast.info('لا توجد جداول مستحقة'); return; }
    let created = 0, woCount = existingWOs.length;
    for (const schedule of dueSchedules) {
      woCount++;
      existingWOs.push({ id: generateId(), company_id: '', work_order_number: `WO-2026-${String(woCount).padStart(3, '0')}`, maintenance_request_id: '', technician_id: schedule.assigned_to || '', scheduled_date: today, start_time: '', end_time: '', labor_cost: 0, material_cost: 0, vendor_cost: 0, total_cost: 0, diagnosis: '', work_done: '', materials_used: '', status: 'assigned', technician_notes: '', tenant_signature_url: '', notes: `صيانة وقائية: ${schedule.asset_name} - ${categoryLabels[schedule.category] || schedule.category}` });
      pmStore.update(schedule.id, { status: 'in_progress' } as any); created++;
    }
    localStorage.setItem('erp_work_orders', JSON.stringify(existingWOs));
    // Auto-reschedule
    const allPM = pmStore.getAll(); const completedWOs = existingWOs.filter((wo: any) => (wo.status === 'completed' || wo.status === 'tenant_confirmed' || wo.status === 'closed') && wo.notes);
    for (const pm of allPM) {
      if (pm.status !== 'in_progress') continue;
      const relatedWO = completedWOs.find((wo: any) => wo.notes && wo.notes.includes(pm.asset_name));
      if (relatedWO) { const days = frequencyDays[pm.frequency] || 30; const nd = new Date(); nd.setDate(nd.getDate() + days); pmStore.update(pm.id, { next_due_date: nd.toISOString().split('T')[0], status: 'scheduled' } as any); }
    }
    refresh();
    toast.success(`تم إنشاء ${created} أمر عمل من الجداول المستحقة`);
  };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm"><Activity className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-teal-600">صيانة وقائية</span><span className="text-[13px] font-bold text-gray-900">{schedules.length} جدول</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500"><span>متأخرة:</span><span className="font-bold text-rose-600 ltr-only tabular-nums">{overdueCount}</span></div>
          <div className="me-auto" />
          <Button onClick={generateWorkOrders} className="h-8 px-3 gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><Play className="h-3.5 w-3.5" /><span>إنشاء أوامر عمل</span></Button>
          <Button onClick={openCreate} className="h-8 px-3 gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><span>+ جدول جديد</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الجداول" value={schedules.length} icon={Activity} accent="slate" />
          <KpiCard label="مجدولة" value={scheduledCount} icon={Clock} accent="blue" />
          <KpiCard label="قيد التنفيذ" value={inProgressCount} icon={Wrench} accent="amber" />
          <KpiCard label="متأخرة" value={overdueCount} icon={AlertTriangle} accent="rose" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">جداول الصيانة الوقائية</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الفئة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الفئات</SelectItem>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الحالات</SelectItem>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyPM onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الأصل / المعدة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">العقار</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الفئة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التكرار</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التاريخ القادم</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المسؤول</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map(s => <PMRow key={s.id} s={s} onEdit={openEdit} onDelete={(id) => { const item = schedules.find(x => x.id === id); if (item) setDeleteTarget(item); }} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {schedules.length} جدول</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف جدول الصيانة <strong className="text-gray-900">{deleteTarget.asset_name}</strong>؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editingId ? 'تعديل جدول الصيانة' : 'جدول صيانة وقائية جديد'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div><Label>العقار *</Label><Input value={form.property_id} onChange={e => setForm({ ...form, property_id: e.target.value })} /></div>
            <div><Label>الوحدة</Label><Input value={form.unit_id} onChange={e => setForm({ ...form, unit_id: e.target.value })} /></div>
            <div className="col-span-2"><Label>الأصل / المعدة *</Label><Input value={form.asset_name} onChange={e => setForm({ ...form, asset_name: e.target.value })} /></div>
            <div><Label>الفئة</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>التكرار</Label><Select value={form.frequency} onValueChange={v => setForm({ ...form, frequency: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(frequencyLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>التاريخ القادم</Label><Input type="date" value={form.next_due_date} onChange={e => setForm({ ...form, next_due_date: e.target.value })} /></div>
            <div><Label>المسؤول</Label><Input value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })} /></div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2"><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowModal(false)}>إلغاء</Button><Button onClick={save} className="bg-teal-500 hover:bg-teal-600 text-white">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}