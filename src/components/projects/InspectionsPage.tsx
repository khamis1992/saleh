import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Filter, Pencil, Trash2, RotateCcw, Sparkles, Activity, CheckCircle2, Clock, AlertTriangle, TrendingUp, TrendingDown, X, ClipboardCheck, Star } from 'lucide-react';
import { createStore } from '@/services/dataService';
import { unitStore, getUnitNumber } from '@/services/stores';

interface Inspection { id: string; company_id: string; inspection_number: string; unit_id: string; inspection_type: 'move_in' | 'move_out' | 'routine' | 'emergency'; inspection_date: string; inspector_name: string; condition_rating: number; findings: string; recommendations: string; status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'; }

const seedInspections: Inspection[] = [
  { id: 'insp-1', company_id: '', inspection_number: 'INS-2026-001', unit_id: 'unt-1', inspection_type: 'move_in', inspection_date: '2026-02-10', inspector_name: 'أحمد الشمري', condition_rating: 4, findings: 'الوحدة بحالة جيدة - بعض الخدوش البسيطة في الجدران', recommendations: 'إعادة طلاء الجدران', status: 'completed' },
  { id: 'insp-2', company_id: '', inspection_number: 'INS-2026-002', unit_id: 'unt-2', inspection_type: 'routine', inspection_date: '2026-04-15', inspector_name: 'فهد القحطاني', condition_rating: 5, findings: 'جميع المرافق تعمل بكفاءة', recommendations: 'لا توجد', status: 'completed' },
  { id: 'insp-3', company_id: '', inspection_number: 'INS-2026-003', unit_id: 'unt-3', inspection_type: 'emergency', inspection_date: '2026-05-01', inspector_name: 'محمد العمري', condition_rating: 2, findings: 'تسرب مياه في الحمام الرئيسي - تلف في السقف', recommendations: 'إصلاح عاجل للسباكة والسقف', status: 'in_progress' },
  { id: 'insp-4', company_id: '', inspection_number: 'INS-2026-004', unit_id: 'unt-4', inspection_type: 'move_out', inspection_date: '2026-06-20', inspector_name: 'أحمد الشمري', condition_rating: 3, findings: 'تلف في الأرضيات - باب المدخل بحاجة لصيانة', recommendations: 'استبدال الأرضيات وإصلاح الباب', status: 'scheduled' },
  { id: 'insp-5', company_id: '', inspection_number: 'INS-2026-005', unit_id: 'unt-5', inspection_type: 'routine', inspection_date: '2026-07-10', inspector_name: 'فهد القحطاني', condition_rating: 4, findings: 'المكيفات بحاجة لصيانة دورية', recommendations: 'جدولة صيانة المكيفات', status: 'scheduled' },
  { id: 'insp-6', company_id: '', inspection_number: 'INS-2026-006', unit_id: 'unt-1', inspection_type: 'emergency', inspection_date: '2026-03-05', inspector_name: 'محمد العمري', condition_rating: 1, findings: 'انقطاع كامل للكهرباء - تلف في اللوحة الرئيسية', recommendations: 'استبدال اللوحة الكهربائية بالكامل', status: 'completed' },
];

const inspectionStore = createStore<Inspection>({ key: 'erp_inspections', seed: seedInspections });

const typeLabels: Record<string, string> = { move_in: 'دخول', move_out: 'خروج', routine: 'دورية', emergency: 'طارئة' };
const typeConfig: Record<string, { dot: string; chip: string }> = {
  move_in:  { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  move_out: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  routine:  { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  emergency:{ dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};
const statusLabels: Record<string, string> = { scheduled: 'مجدولة', in_progress: 'قيد التنفيذ', completed: 'مكتملة', cancelled: 'ملغاة' };
const statusConfig: Record<string, { dot: string; chip: string }> = {
  scheduled:   { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  in_progress: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  completed:   { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  cancelled:   { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};
const emptyForm = { inspection_number: '', unit_id: '', inspection_type: 'routine' as string, inspection_date: '', inspector_name: '', condition_rating: 3, findings: '', recommendations: '', status: 'scheduled' as string };

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
      ))}
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  const a: Record<string, { iconBg: string; iconColor: string }> = { cyan:{ iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, rose:{ iconBg: 'bg-rose-50', iconColor: 'text-rose-600' }, slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' } }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

function InspRow({ i, onEdit, onDelete }: { i: Inspection; onEdit: (i: Inspection) => void; onDelete: (id: string) => void }) {
  const tc = typeConfig[i.inspection_type] || typeConfig.routine;
  const sc = statusConfig[i.status] || statusConfig.scheduled;
  const isEmergency = i.inspection_type === 'emergency';
  return (
    <tr className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${isEmergency && i.status !== 'completed' ? 'bg-rose-50/20' : ''}`}>
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900 font-mono">{i.inspection_number}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{getUnitNumber(i.unit_id) || i.unit_id}</td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${tc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${tc.dot}`} />{typeLabels[i.inspection_type]}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{i.inspection_date}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{i.inspector_name}</td>
      <td className="px-4 py-3">{renderStars(i.condition_rating)}</td>
      <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px] truncate" title={i.findings}>{i.findings}</td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${sc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />{statusLabels[i.status]}</span></td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(i)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(i.id)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyInsp({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><ClipboardCheck className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد معاينات</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function InspectionsPage() {
  const { t, dir } = useLocale();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Inspection | null>(null);
  const [form, setForm] = useState(emptyForm);

  const inspections = useMemo(() => inspectionStore.getAll(), [refresh]);
  const units = useMemo(() => unitStore.getAll(), [refresh]);

  const filtered = inspections.filter((i: Inspection) => {
    if (typeFilter !== 'all' && i.inspection_type !== typeFilter) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (search) { const un = getUnitNumber(i.unit_id); if (!i.inspection_number.includes(search) && !i.inspector_name.includes(search) && !un.includes(search)) return false; }
    return true;
  });

  const completedCount = inspections.filter(i => i.status === 'completed').length;
  const scheduledCount = inspections.filter(i => i.status === 'scheduled').length;
  const emergencyCount = inspections.filter(i => i.inspection_type === 'emergency').length;
  const avgRating = Math.round((inspections.reduce((s, i) => s + i.condition_rating, 0) / Math.max(1, inspections.length)) * 10) / 10;

  const openCreate = () => { setEditId(null); setForm({ ...emptyForm, inspection_number: `INS-${new Date().getFullYear()}-${String(Date.now() % 1000).padStart(3, '0')}` }); setModalOpen(true); };
  const openEdit = (i: Inspection) => { setEditId(i.id); setForm({ inspection_number: i.inspection_number, unit_id: i.unit_id, inspection_type: i.inspection_type, inspection_date: i.inspection_date, inspector_name: i.inspector_name, condition_rating: i.condition_rating, findings: i.findings, recommendations: i.recommendations, status: i.status }); setModalOpen(true); };
  const handleSave = () => {
    if (!form.inspection_number || !form.unit_id) return;
    const data: any = { company_id: '', inspection_number: form.inspection_number, unit_id: form.unit_id, inspection_type: form.inspection_type, inspection_date: form.inspection_date, inspector_name: form.inspector_name, condition_rating: Number(form.condition_rating), findings: form.findings, recommendations: form.recommendations, status: form.status };
    if (editId) inspectionStore.update(editId, data); else inspectionStore.create(data);
    setModalOpen(false); setRefresh(r => r + 1);
  };
  const handleDelete = () => { if (!deleteTarget) return; inspectionStore.remove(deleteTarget.id); toast.success('تم الحذف'); setDeleteTarget(null); setRefresh(r => r + 1); };
  const resetFilters = () => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm"><ClipboardCheck className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-600">المعاينات</span><span className="text-[13px] font-bold text-gray-900">{inspections.length} معاينة</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500"><span>متوسط التقييم:</span><span className="font-bold text-gray-900 ltr-only tabular-nums">{avgRating}</span></div>
          <div className="me-auto" />
          <Button onClick={openCreate} className="h-8 px-3 gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><span>+ تسجيل معاينة</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي المعاينات" value={inspections.length} icon={ClipboardCheck} accent="slate" />
          <KpiCard label="مكتملة" value={completedCount} icon={CheckCircle2} accent="emerald" />
          <KpiCard label="مجدولة" value={scheduledCount} icon={Clock} accent="amber" />
          <KpiCard label="متوسط التقييم" value={avgRating} icon={Star} accent="cyan" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">سجل المعاينات</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="النوع" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الأنواع</SelectItem><SelectItem value="move_in">دخول</SelectItem><SelectItem value="move_out">خروج</SelectItem><SelectItem value="routine">دورية</SelectItem><SelectItem value="emergency">طارئة</SelectItem></SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الحالات</SelectItem><SelectItem value="scheduled">مجدولة</SelectItem><SelectItem value="in_progress">قيد التنفيذ</SelectItem><SelectItem value="completed">مكتملة</SelectItem><SelectItem value="cancelled">ملغاة</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyInsp onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">رقم المعاينة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الوحدة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">النوع</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التاريخ</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المفتش</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التقييم</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الملاحظات</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map((i: Inspection) => <InspRow key={i.id} i={i} onEdit={openEdit} onDelete={(id) => { const item = inspections.find(x => x.id === id); if (item) setDeleteTarget(item); }} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {inspections.length} معاينة</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف المعاينة <strong className="text-gray-900">{deleteTarget.inspection_number}</strong>؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل معاينة' : 'تسجيل معاينة جديدة'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>رقم المعاينة *</Label><Input value={form.inspection_number} onChange={e => setForm(f => ({ ...f, inspection_number: e.target.value }))} /></div>
              <div><Label>الوحدة *</Label><Select value={form.unit_id} onValueChange={v => setForm(f => ({ ...f, unit_id: v }))}><SelectTrigger><SelectValue placeholder="اختر الوحدة" /></SelectTrigger><SelectContent>{units.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unit_number} ({u.unit_code})</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>النوع</Label><Select value={form.inspection_type} onValueChange={v => setForm(f => ({ ...f, inspection_type: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="move_in">دخول</SelectItem><SelectItem value="move_out">خروج</SelectItem><SelectItem value="routine">دورية</SelectItem><SelectItem value="emergency">طارئة</SelectItem></SelectContent></Select></div>
              <div><Label>التاريخ</Label><Input type="date" value={form.inspection_date} onChange={e => setForm(f => ({ ...f, inspection_date: e.target.value }))} /></div>
            </div>
            <div><Label>المفتش</Label><Input value={form.inspector_name} onChange={e => setForm(f => ({ ...f, inspector_name: e.target.value }))} /></div>
            <div><Label>التقييم (1-5)</Label>
              <div className="flex items-center gap-3">
                <input type="range" min="1" max="5" value={form.condition_rating} onChange={e => setForm(f => ({ ...f, condition_rating: Number(e.target.value) }))} className="flex-1 accent-cyan-500" />
                <div className="flex items-center gap-0.5 min-w-[80px]">{renderStars(form.condition_rating)}</div>
                <span className="text-xs font-bold text-gray-700 w-8 text-center">{form.condition_rating}/5</span>
              </div>
            </div>
            <div><Label>الملاحظات</Label><Textarea value={form.findings} onChange={e => setForm(f => ({ ...f, findings: e.target.value }))} rows={3} /></div>
            <div><Label>التوصيات</Label><Textarea value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} rows={2} /></div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="scheduled">مجدولة</SelectItem><SelectItem value="in_progress">قيد التنفيذ</SelectItem><SelectItem value="completed">مكتملة</SelectItem><SelectItem value="cancelled">ملغاة</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button><Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600 text-white">{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}