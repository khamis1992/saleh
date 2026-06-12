import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Filter, Pencil, Trash2, CalendarCheck, TrendingUp, TrendingDown,
  RotateCcw, Sparkles, Users, CheckCircle2, Clock, AlertTriangle, XCircle,
  ArrowRight, CalendarDays, Sun, FileText,
} from 'lucide-react';
import { createStore } from '@/services/dataService';
import { employeeStore, getEmployeeName } from '@/services/stores';

interface LeaveRequest {
  id: string; company_id: string; employee_id: string;
  leave_type: 'annual' | 'sick' | 'emergency' | 'unpaid';
  start_date: string; end_date: string; days_count: number;
  reason: string; status: 'draft' | 'submitted' | 'approved' | 'rejected'; created_at: string;
}

const seedLeaveRequests: LeaveRequest[] = [
  { id: 'lv-1', company_id: '', employee_id: 'emp-1', leave_type: 'annual', start_date: '2026-03-10', end_date: '2026-03-24', days_count: 15, reason: 'إجازة سنوية', status: 'approved', created_at: '2026-02-20' },
  { id: 'lv-2', company_id: '', employee_id: 'emp-2', leave_type: 'sick', start_date: '2026-04-01', end_date: '2026-04-03', days_count: 3, reason: 'تعب وإرهاق', status: 'approved', created_at: '2026-03-30' },
  { id: 'lv-3', company_id: '', employee_id: 'emp-3', leave_type: 'emergency', start_date: '2026-05-15', end_date: '2026-05-17', days_count: 3, reason: 'ظرف عائلي طارئ', status: 'submitted', created_at: '2026-05-10' },
  { id: 'lv-4', company_id: '', employee_id: 'emp-4', leave_type: 'unpaid', start_date: '2026-06-01', end_date: '2026-06-10', days_count: 10, reason: 'سفر خارج المملكة', status: 'draft', created_at: '2026-05-20' },
  { id: 'lv-5', company_id: '', employee_id: 'emp-5', leave_type: 'annual', start_date: '2026-07-01', end_date: '2026-07-07', days_count: 7, reason: 'إجازة عيد الأضحى', status: 'submitted', created_at: '2026-06-25' },
  { id: 'lv-6', company_id: '', employee_id: 'emp-1', leave_type: 'sick', start_date: '2026-03-25', end_date: '2026-03-26', days_count: 2, reason: 'صداع نصفي', status: 'rejected', created_at: '2026-03-24' },
];

const leaveStore = createStore<LeaveRequest>({ key: 'erp_leave_requests', seed: seedLeaveRequests });

const leaveTypeConfig: Record<string, { dot: string; chip: string }> = {
  annual:   { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  sick:     { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  emergency:{ dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  unpaid:   { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};

const statusConfig: Record<string, { dot: string; chip: string }> = {
  draft:    { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  submitted:{ dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  approved: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  rejected: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};

const leaveTypeLabels: Record<string, string> = { annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة', unpaid: 'بدون راتب' };
const statusLabels: Record<string, string> = { draft: 'مسودة', submitted: 'مقدم', approved: 'معتمد', rejected: 'مرفوض' };

const emptyForm = { employee_id: '', leave_type: 'annual' as string, start_date: '', end_date: '', days_count: 0, reason: '', status: 'draft' as string };

function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const a: Record<string, { iconBg: string; iconColor: string }> = {
    violet: { iconBg: 'bg-violet-50', iconColor: 'text-violet-600' }, emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
  }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
        {trend && <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{trend.dir === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{Math.abs(trend.val)}%</div>}
      </div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function LeaveCard({ lv, onEdit, onDelete }: { lv: LeaveRequest; onEdit: (l: LeaveRequest) => void; onDelete: (l: LeaveRequest) => void }) {
  const lt = leaveTypeConfig[lv.leave_type] || leaveTypeConfig.annual;
  const st = statusConfig[lv.status] || statusConfig.draft;
  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${lv.status === 'approved' ? 'bg-emerald-500' : lv.status === 'rejected' ? 'bg-rose-500' : 'bg-violet-500'}`} />
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-violet-50 text-violet-600 ring-1 ring-violet-100 flex items-center justify-center shrink-0"><CalendarCheck className="h-5 w-5" /></div>
          <div className="min-w-0"><div className="text-sm font-bold text-gray-900 truncate">{getEmployeeName(lv.employee_id) || lv.employee_id}</div><div className="text-[11px] text-gray-400 mt-0.5">{lv.reason}</div></div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${lt.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${lt.dot}`} />{leaveTypeLabels[lv.leave_type]}</span>
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${st.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{statusLabels[lv.status]}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-gray-400" />{lv.start_date} → {lv.end_date}</span>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 mb-3.5 flex items-center justify-between">
        <div><div className="text-[10px] text-gray-400 mb-0.5">عدد الأيام</div><div className="text-lg font-bold text-gray-900 tabular-nums">{lv.days_count}</div></div>
        <div className="text-right"><div className="text-[10px] text-gray-400 mb-0.5">تاريخ الطلب</div><div className="text-xs font-bold text-gray-700">{lv.created_at}</div></div>
      </div>
      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => onEdit(lv)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={() => onDelete(lv)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
}

function LeaveRow({ lv, onEdit, onDelete }: { lv: LeaveRequest; onEdit: (l: LeaveRequest) => void; onDelete: (l: LeaveRequest) => void }) {
  const lt = leaveTypeConfig[lv.leave_type] || leaveTypeConfig.annual;
  const st = statusConfig[lv.status] || statusConfig.draft;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{getEmployeeName(lv.employee_id) || lv.employee_id}</span></td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${lt.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${lt.dot}`} />{leaveTypeLabels[lv.leave_type]}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{lv.start_date}</td>
      <td className="px-4 py-3 text-xs text-gray-600">{lv.end_date}</td>
      <td className="px-4 py-3 text-xs font-bold text-gray-800 tabular-nums text-center">{lv.days_count}</td>
      <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px] truncate">{lv.reason}</td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${st.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />{statusLabels[lv.status]}</span></td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(lv)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(lv)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyLeaves({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><CalendarCheck className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد طلبات إجازة</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function LeaveManagementPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<LeaveRequest | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const leaves = useMemo(() => leaveStore.getAll(), [refresh]);
  const employees = useMemo(() => employeeStore.getAll(), [refresh]);

  const calcDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const filtered = leaves.filter((lv: LeaveRequest) => {
    if (statusFilter !== 'all' && lv.status !== statusFilter) return false;
    if (search) { const n = getEmployeeName(lv.employee_id); if (!n.includes(search) && !lv.reason.includes(search)) return false; }
    return true;
  });

  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const pendingCount = leaves.filter(l => l.status === 'submitted').length;
  const totalDays = leaves.reduce((s, l) => s + l.days_count, 0);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (lv: LeaveRequest) => { setEditId(lv.id); setForm({ employee_id: lv.employee_id, leave_type: lv.leave_type, start_date: lv.start_date, end_date: lv.end_date, days_count: lv.days_count, reason: lv.reason, status: lv.status }); setModalOpen(true); };
  const handleSave = () => {
    if (!form.employee_id || !form.start_date || !form.end_date) return;
    const days = calcDays(form.start_date, form.end_date);
    const data: any = { company_id: '', employee_id: form.employee_id, leave_type: form.leave_type, start_date: form.start_date, end_date: form.end_date, days_count: days, reason: form.reason, status: form.status, created_at: new Date().toISOString().split('T')[0] };
    if (editId) leaveStore.update(editId, data); else leaveStore.create(data);
    setModalOpen(false); setRefresh(r => r + 1);
  };
  const handleDelete = () => { if (!deleteTarget) return; leaveStore.remove(deleteTarget.id); toast.success('تم الحذف'); setDeleteTarget(null); setRefresh(r => r + 1); };
  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm"><CalendarCheck className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-600">الإجازات</span><span className="text-[13px] font-bold text-gray-900">{leaves.length} طلب</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث باسم الموظف..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500"><span>إجمالي أيام:</span><span className="font-bold text-gray-900 ltr-only tabular-nums">{totalDays}</span></div>
          <div className="me-auto" />
          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([{key:'list',label:'قائمة',icon:Sparkles},{key:'grid',label:'بطاقات',icon:CalendarCheck}] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} role="tab" aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                <v.icon className="h-3 w-3" /><span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={openCreate} className="h-8 px-3 gap-1.5 bg-violet-500 hover:bg-violet-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><span>+ طلب إجازة</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الطلبات" value={leaves.length} sub={`${filtered.length} معروض`} icon={FileText} accent="slate" />
          <KpiCard label="معتمدة" value={approvedCount} sub="تمت الموافقة" icon={CheckCircle2} trend={{ val: Math.round((approvedCount / Math.max(1, leaves.length)) * 100), dir: 'up' }} accent="emerald" />
          <KpiCard label="قيد الانتظار" value={pendingCount} sub="بانتظار الاعتماد" icon={Clock} accent="amber" />
          <KpiCard label="إجمالي الأيام" value={totalDays} sub="مجموع أيام الإجازات" icon={Sun} accent="violet" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">إدارة الإجازات</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الحالات</SelectItem><SelectItem value="draft">مسودة</SelectItem><SelectItem value="submitted">مقدم</SelectItem><SelectItem value="approved">معتمد</SelectItem><SelectItem value="rejected">مرفوض</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyLeaves onReset={resetFilters} /> : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(lv => <LeaveCard key={lv.id} lv={lv} onEdit={openEdit} onDelete={setDeleteTarget} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الموظف</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">النوع</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">البداية</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">النهاية</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الأيام</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">السبب</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map(lv => <LeaveRow key={lv.id} lv={lv} onEdit={openEdit} onDelete={setDeleteTarget} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {leaves.length} طلب</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف طلب الإجازة؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل طلب إجازة' : 'طلب إجازة جديد'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div><Label>الموظف *</Label><Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}><SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger><SelectContent>{employees.map((emp: any) => (<SelectItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</SelectItem>))}</SelectContent></Select></div>
            <div><Label>نوع الإجازة</Label><Select value={form.leave_type} onValueChange={v => setForm(f => ({ ...f, leave_type: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="annual">سنوية</SelectItem><SelectItem value="sick">مرضية</SelectItem><SelectItem value="emergency">طارئة</SelectItem><SelectItem value="unpaid">بدون راتب</SelectItem></SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>تاريخ البداية *</Label><Input type="date" value={form.start_date} onChange={e => { const s = e.target.value; setForm(f => ({ ...f, start_date: s, days_count: calcDays(s, f.end_date) })); }} /></div>
              <div><Label>تاريخ النهاية *</Label><Input type="date" value={form.end_date} onChange={e => { const en = e.target.value; setForm(f => ({ ...f, end_date: en, days_count: calcDays(f.start_date, en) })); }} /></div>
            </div>
            <div><Label>عدد الأيام</Label><Input type="number" value={form.days_count} readOnly className="bg-muted" /></div>
            <div><Label>السبب</Label><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="سبب طلب الإجازة..." rows={3} /></div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">مسودة</SelectItem><SelectItem value="submitted">مقدم</SelectItem><SelectItem value="approved">معتمد</SelectItem><SelectItem value="rejected">مرفوض</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button><Button onClick={handleSave} className="bg-violet-500 hover:bg-violet-600 text-white">{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}