import { useState, useMemo } from 'react';
import { formatQAR, formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Filter, Pencil, Trash2, TrendingUp, TrendingDown, RotateCcw, Sparkles, DollarSign, Activity, AlertTriangle, CheckCircle2, ArrowRight, X, Wrench, Users, Clock } from 'lucide-react';
import { createStore } from '@/services/dataService';
import { generateJournalEntry } from '@/utils/exportUtils';

const fmt = formatQAR;
const fmtInt = formatQARInt;

interface WorkOrder {
  id: string; work_order_number: string; maintenance_request_id: string; technician_id: string;
  scheduled_date: string; start_time: string; end_time: string; labor_cost: number; material_cost: number;
  vendor_cost: number; total_cost: number; diagnosis: string; work_done: string; materials_used: string;
  status: string; notes: string;
}

const seedWorkOrders: WorkOrder[] = [
  { id: 'wo-1', work_order_number: 'WO-2026-001', maintenance_request_id: 'mnt-1', technician_id: 'فني أحمد', scheduled_date: '2026-03-10', start_time: '09:00', end_time: '12:00', labor_cost: 500, material_cost: 1200, vendor_cost: 0, total_cost: 1700, diagnosis: 'تلف في صمام المياه الرئيسي', work_done: 'تم استبدال الصمام وإصلاح التسرب', materials_used: 'صمام مياه 2 بوصة، شريط تفلون، وصلات نحاس', status: 'completed', notes: '' },
  { id: 'wo-2', work_order_number: 'WO-2026-002', maintenance_request_id: 'mnt-2', technician_id: 'فني خالد', scheduled_date: '2026-04-05', start_time: '14:00', end_time: '16:00', labor_cost: 350, material_cost: 0, vendor_cost: 850, total_cost: 1200, diagnosis: 'نقص غاز الفريون في وحدة التكييف', work_done: 'تم تعبئة غاز الفريون وصيانة الوحدة الخارجية', materials_used: 'غاز فريون R410، فلتر هواء', status: 'completed', notes: '' },
  { id: 'wo-3', work_order_number: 'WO-2026-003', maintenance_request_id: 'mnt-3', technician_id: 'فني سعيد', scheduled_date: '2026-05-20', start_time: '08:00', end_time: '', labor_cost: 800, material_cost: 2500, vendor_cost: 0, total_cost: 3300, diagnosis: 'تماس كهربائي في اللوحة الرئيسية', work_done: 'جاري العمل على إصلاح اللوحة الكهربائية', materials_used: 'قاطع كهرباء 60 أمبير، أسلاك 10مم', status: 'in_progress', notes: 'بانتظار توصيل القاطع الكهربائي' },
  { id: 'wo-4', work_order_number: 'WO-2026-004', maintenance_request_id: 'mnt-4', technician_id: 'فني محمد', scheduled_date: '2026-02-15', start_time: '09:00', end_time: '11:00', labor_cost: 300, material_cost: 200, vendor_cost: 0, total_cost: 500, diagnosis: 'صيانة دورية روتينية', work_done: 'تم فحص جميع المرافق وإصلاح حنفية المطبخ', materials_used: 'حشية حنفية، شريط تفلون', status: 'tenant_confirmed', notes: 'تم تأكيد الاستلام من المستأجر' },
  { id: 'wo-5', work_order_number: 'WO-2026-005', maintenance_request_id: 'mnt-1', technician_id: 'فني عبدالله', scheduled_date: '2026-06-01', start_time: '', end_time: '', labor_cost: 400, material_cost: 0, vendor_cost: 0, total_cost: 400, diagnosis: '', work_done: '', materials_used: '', status: 'assigned', notes: 'طلب متابعة تسرب آخر' },
  { id: 'wo-6', work_order_number: 'WO-2026-006', maintenance_request_id: 'mnt-2', technician_id: 'فني خالد', scheduled_date: '2026-03-25', start_time: '10:00', end_time: '11:30', labor_cost: 250, material_cost: 450, vendor_cost: 0, total_cost: 700, diagnosis: 'فلتر المكيف متسخ', work_done: 'تم تنظيف الفلاتر وتنظيف الوحدة الداخلية', materials_used: 'سائل تنظيف، فلتر بديل', status: 'closed', notes: '' },
];

const workOrderStore = createStore<WorkOrder>({ key: 'erp_work_orders', seed: seedWorkOrders });

const statusLabels: Record<string, string> = { assigned: 'معين للفني', in_progress: 'قيد التنفيذ', waiting_parts: 'بانتظار قطع', completed: 'مكتمل', tenant_confirmed: 'مؤكد من المستأجر', closed: 'مغلق', cancelled: 'ملغي' };
const statusConfig: Record<string, { dot: string; chip: string }> = {
  assigned:         { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  in_progress:      { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  waiting_parts:    { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  completed:        { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  tenant_confirmed: { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  closed:           { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  cancelled:        { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};

function getRequestNumber(id: string): string {
  try { const raw = localStorage.getItem('erp_maintenance'); if (raw) { const items = JSON.parse(raw); const r = items.find((x: any) => x.id === id); if (r) return r.request_number || ''; } } catch {}
  return id;
}

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  const a: Record<string, { iconBg: string; iconColor: string }> = { orange:{ iconBg: 'bg-orange-50', iconColor: 'text-orange-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' } }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

function WORow({ o, onEdit, onDelete }: { o: WorkOrder; onEdit: (o: WorkOrder) => void; onDelete: (id: string) => void }) {
  const sc = statusConfig[o.status] || statusConfig.assigned;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900 font-mono">{o.work_order_number}</span></td>
      <td className="px-4 py-3 text-xs font-mono text-gray-600">{getRequestNumber(o.maintenance_request_id)}</td>
      <td className="px-4 py-3"><span className="flex items-center gap-1 text-xs text-gray-600"><Users className="h-3 w-3" />{o.technician_id}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{o.scheduled_date}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(o.labor_cost)}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(o.material_cost)}</td>
      <td className="px-4 py-3 text-xs font-mono font-bold text-gray-900 ltr-only tabular-nums">{fmt(o.total_cost)}</td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${sc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />{statusLabels[o.status]}</span></td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(o)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(o.id)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyWO({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><Wrench className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد أوامر عمل</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function WorkOrdersPage() {
  const { t, dir } = useLocale();
  const [orders, setOrders] = useState<WorkOrder[]>(() => workOrderStore.getAll());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkOrder | null>(null);
  const [form, setForm] = useState<Partial<WorkOrder>>({ work_order_number: '', maintenance_request_id: '', technician_id: '', scheduled_date: '', start_time: '', end_time: '', labor_cost: 0, material_cost: 0, vendor_cost: 0, total_cost: 0, diagnosis: '', work_done: '', materials_used: '', status: 'assigned', notes: '' });

  const refresh = () => setOrders(workOrderStore.getAll());
  const filtered = useMemo(() => orders.filter(o => { if (statusFilter !== 'all' && o.status !== statusFilter) return false; if (search && !o.work_order_number.includes(search) && !o.technician_id.includes(search)) return false; return true; }), [orders, search, statusFilter]);

  const totalCost = orders.reduce((s, o) => s + o.total_cost, 0);
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'closed').length;
  const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;

  const openCreate = () => { setEditingId(null); const count = orders.length + 1; setForm({ work_order_number: `WO-2026-${String(count).padStart(3, '0')}`, maintenance_request_id: '', technician_id: '', scheduled_date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', labor_cost: 0, material_cost: 0, vendor_cost: 0, total_cost: 0, diagnosis: '', work_done: '', materials_used: '', status: 'assigned', notes: '' }); setShowModal(true); };
  const openEdit = (o: WorkOrder) => { setEditingId(o.id); setForm({ ...o }); setShowModal(true); };
  const save = () => {
    if (!form.work_order_number || !form.maintenance_request_id) return;
    const total = (form.labor_cost || 0) + (form.material_cost || 0) + (form.vendor_cost || 0);
    const previousStatus = editingId ? workOrderStore.getById(editingId)?.status : null;
    if (editingId) workOrderStore.update(editingId, { ...form, total_cost: total }); else workOrderStore.create({ ...form, total_cost: total } as Omit<WorkOrder, 'id'>);
    if (form.status === 'completed' && previousStatus !== 'completed' && total > 0) generateJournalEntry(`صيانة — أمر عمل ${form.work_order_number}`, 'صيانة', editingId || '', [{ account_id: 'acc-15', debit: total, credit: 0, description: 'مصروفات صيانة' }, { account_id: 'acc-1', debit: 0, credit: total, description: 'دفع نقدي / بنك' }]);
    refresh(); setShowModal(false);
  };
  const handleDelete = () => { if (!deleteTarget) return; workOrderStore.remove(deleteTarget.id); toast.success('تم الحذف'); setDeleteTarget(null); refresh(); };
  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm"><Wrench className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-orange-600">أوامر العمل</span><span className="text-[13px] font-bold text-gray-900">{orders.length} أمر</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500"><span>التكلفة الإجمالية:</span><span className="font-bold text-gray-900 ltr-only tabular-nums">{fmtInt(totalCost)}</span></div>
          <div className="me-auto" />
          <Button onClick={openCreate} className="h-8 px-3 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><span>+ أمر عمل جديد</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الأوامر" value={orders.length} icon={Activity} accent="slate" />
          <KpiCard label="قيد التنفيذ" value={inProgressOrders} icon={Clock} accent="amber" />
          <KpiCard label="مكتملة" value={completedOrders} icon={CheckCircle2} accent="emerald" />
          <KpiCard label="التكلفة الإجمالية" value={fmtInt(totalCost)} icon={DollarSign} accent="orange" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">أوامر العمل</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الحالات</SelectItem>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyWO onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">رقم الأمر</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">طلب الصيانة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الفني</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التاريخ</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">العمالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المواد</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الإجمالي</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map(o => <WORow key={o.id} o={o} onEdit={openEdit} onDelete={(id) => { const item = orders.find(x => x.id === id); if (item) setDeleteTarget(item); }} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {orders.length} أمر</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف أمر العمل <strong className="text-gray-900">{deleteTarget.work_order_number}</strong>؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editingId ? 'تعديل أمر عمل' : 'أمر عمل جديد'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div><Label>رقم أمر العمل</Label><Input value={form.work_order_number} onChange={e => setForm({ ...form, work_order_number: e.target.value })} /></div>
            <div><Label>طلب الصيانة *</Label><Input value={form.maintenance_request_id} onChange={e => setForm({ ...form, maintenance_request_id: e.target.value })} /></div>
            <div><Label>الفني</Label><Input value={form.technician_id} onChange={e => setForm({ ...form, technician_id: e.target.value })} /></div>
            <div><Label>التاريخ المقرر</Label><Input type="date" value={form.scheduled_date} onChange={e => setForm({ ...form, scheduled_date: e.target.value })} /></div>
            <div><Label>وقت البدء</Label><Input type="time" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} /></div>
            <div><Label>وقت الانتهاء</Label><Input type="time" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} /></div>
            <div><Label>تكلفة العمالة</Label><Input type="number" value={form.labor_cost} onChange={e => setForm({ ...form, labor_cost: Number(e.target.value) })} /></div>
            <div><Label>تكلفة المواد</Label><Input type="number" value={form.material_cost} onChange={e => setForm({ ...form, material_cost: Number(e.target.value) })} /></div>
            <div><Label>تكلفة المقاول</Label><Input type="number" value={form.vendor_cost} onChange={e => setForm({ ...form, vendor_cost: Number(e.target.value) })} /></div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="col-span-2"><Label>التشخيص</Label><Textarea value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} rows={2} /></div>
            <div className="col-span-2"><Label>الأعمال المنفذة</Label><Textarea value={form.work_done} onChange={e => setForm({ ...form, work_done: e.target.value })} rows={2} /></div>
            <div className="col-span-2"><Label>المواد المستخدمة</Label><Textarea value={form.materials_used} onChange={e => setForm({ ...form, materials_used: e.target.value })} rows={2} /></div>
            <div className="col-span-2"><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowModal(false)}>إلغاء</Button><Button onClick={save} className="bg-orange-500 hover:bg-orange-600 text-white">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}