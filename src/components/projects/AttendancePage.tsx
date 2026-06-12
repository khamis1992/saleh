import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search, Filter, Pencil, Trash2, Users, Clock, TrendingUp, TrendingDown,
  AlertTriangle, RotateCcw, Sparkles, CheckCircle2, XCircle, UserCheck,
  ArrowRight, CalendarDays, Sun, Moon, Activity,
} from 'lucide-react';
import { attendanceStore, employeeStore } from '@/services/stores';

const statusLabels: Record<string, string> = {
  present: 'حاضر', absent: 'غائب', late: 'متأخر',
  half_day: 'نصف يوم', leave: 'إجازة', holiday: 'عطلة',
};

const statusConfig: Record<string, { dot: string; chip: string }> = {
  present:  { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  absent:   { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  late:     { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  half_day: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  leave:    { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  holiday:  { dot: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100' },
};

const emptyForm = {
  employee_id: '', attendance_date: '', check_in: '', check_out: '',
  status: 'present' as const,
};

function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    cyan:   { iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
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

function AttendanceCard({ r, empName, onEdit, onDelete }: {
  r: any; empName: string; onEdit: (r: any) => void; onDelete: (r: any) => void;
}) {
  const statCfg = statusConfig[r.status] || statusConfig.present;
  const isLate = r.status === 'late' || r.late_minutes > 0;
  const isAbsent = r.status === 'absent';

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${isAbsent ? 'bg-rose-500' : isLate ? 'bg-amber-500' : 'bg-cyan-500'}`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-lg ${isAbsent ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-100' : isLate ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' : 'bg-cyan-50 text-cyan-600 ring-1 ring-cyan-100'} flex items-center justify-center shrink-0`}>
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{empName}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{r.attendance_date}</div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${statCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statCfg.dot}`} />
          {statusLabels[r.status] || r.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><Sun className="h-3 w-3 text-gray-400" />حضور: {r.check_in || '—'}</span>
        <span className="flex items-center gap-1.5"><Moon className="h-3 w-3 text-gray-400" />انصراف: {r.check_out || '—'}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">ساعات العمل</div>
          <div className="text-sm font-bold text-gray-900 ltr-only tabular-nums">{r.hours_worked > 0 ? r.hours_worked.toFixed(1) : '—'}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">دقائق التأخير</div>
          <div className={`text-sm font-bold ltr-only tabular-nums ${r.late_minutes > 0 ? 'text-amber-600' : 'text-gray-900'}`}>{r.late_minutes > 0 ? r.late_minutes : '—'}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => onEdit(r)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(r)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function AttendanceRow({ r, empName, onEdit, onDelete }: {
  r: any; empName: string; onEdit: (r: any) => void; onDelete: (r: any) => void;
}) {
  const statCfg = statusConfig[r.status] || statusConfig.present;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{empName}</span></td>
      <td className="px-4 py-3 text-xs text-gray-600">{r.attendance_date}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-600">{r.check_in || '—'}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-600">{r.check_out || '—'}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{r.hours_worked > 0 ? r.hours_worked.toFixed(1) : '—'}</td>
      <td className="px-4 py-3 text-xs font-mono ltr-only tabular-nums">{r.late_minutes > 0 ? <span className="text-amber-600 font-bold">{r.late_minutes}</span> : '—'}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${statCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statCfg.dot}`} />
          {statusLabels[r.status] || r.status}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(r)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(r)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyAttendance({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><Clock className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد سجلات حضور</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function AttendancePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const records = useMemo(() => attendanceStore.getAll(), [refresh]);
  const employees = useMemo(() => employeeStore.getAll(), [refresh]);
  const getEmpName = (id: string) => employees.find((e: any) => e.id === id)?.full_name || id;

  const filtered = records.filter((r: any) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) { const empName = getEmpName(r.employee_id); if (!empName.includes(search) && !r.attendance_date.includes(search)) return false; }
    return true;
  });

  const presentCount = records.filter((r: any) => r.status === 'present').length;
  const absentCount = records.filter((r: any) => r.status === 'absent').length;
  const lateCount = records.filter((r: any) => r.status === 'late').length;
  const attendanceRate = records.length > 0 ? Math.round((presentCount / records.length) * 100) : 0;

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({ employee_id: r.employee_id, attendance_date: r.attendance_date, check_in: r.check_in, check_out: r.check_out, status: r.status });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.employee_id || !form.attendance_date) return;
    let hoursWorked = 0, lateMinutes = 0;
    if (form.check_in && form.check_out) {
      const [inH, inM] = form.check_in.split(':').map(Number);
      const [outH, outM] = form.check_out.split(':').map(Number);
      const inMinutes = inH * 60 + inM, outMinutes = outH * 60 + outM;
      hoursWorked = Math.max(0, (outMinutes - inMinutes) / 60);
      if (inMinutes > 480) lateMinutes = inMinutes - 480;
    }
    const data: any = {
      company_id: '', employee_id: form.employee_id, attendance_date: form.attendance_date,
      check_in: form.check_in, check_out: form.check_out, hours_worked: hoursWorked,
      late_minutes: lateMinutes, overtime_hours: 0, status: form.status, notes: '',
    };
    if (editId) attendanceStore.update(editId, data);
    else attendanceStore.create(data);
    setModalOpen(false); setRefresh(r => r + 1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    attendanceStore.remove(deleteTarget.id);
    toast.success(`تم حذف السجل`);
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-sm">
              <Clock className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-cyan-600">الحضور</span>
              <span className="text-[13px] font-bold text-gray-900">{records.length} سجل</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث باسم الموظف أو التاريخ..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>نسبة الحضور:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{attendanceRate}%</span>
          </div>
          <div className="me-auto" />
          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'list', label: 'قائمة', icon: Sparkles },
              { key: 'grid', label: 'بطاقات', icon: Clock },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} role="tab" aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                <v.icon className="h-3 w-3" /><span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <Button onClick={openCreate}
            className="h-8 px-3 gap-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <span>+ تسجيل حضور</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="سجلات الحضور" value={records.length} sub={`${filtered.length} معروض`} icon={Users} accent="slate" />
          <KpiCard label="نسبة الحضور" value={`${attendanceRate}%`} sub="من إجمالي السجلات" icon={TrendingUp} trend={{ val: attendanceRate, dir: attendanceRate >= 50 ? 'up' : 'down' }} accent="emerald" />
          <KpiCard label="متأخرون" value={lateCount} sub="تأخير عن الدوام" icon={Clock} trend={{ val: lateCount, dir: 'down' }} accent="amber" />
          <KpiCard label="غائبون" value={absentCount} sub="غياب غير مبرر" icon={AlertTriangle} trend={{ val: absentCount, dir: 'down' }} accent="rose" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">سجلات الحضور والانصراف</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyAttendance onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(r => <AttendanceCard key={r.id} r={r} empName={getEmpName(r.employee_id)} onEdit={openEdit} onDelete={setDeleteTarget} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الموظف</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">التاريخ</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحضور</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الانصراف</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">ساعات</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">تأخير</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => <AttendanceRow key={r.id} r={r} empName={getEmpName(r.employee_id)} onEdit={openEdit} onDelete={setDeleteTarget} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {records.length} سجل</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div>
              <div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div>
            </div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف سجل الحضور؟</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل سجل حضور' : 'تسجيل حضور'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>الموظف *</Label><Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}><SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger><SelectContent>{employees.map((e: any) => (<SelectItem key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</SelectItem>))}</SelectContent></Select></div>
            <div><Label>التاريخ *</Label><Input type="date" value={form.attendance_date} onChange={e => setForm(f => ({ ...f, attendance_date: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>وقت الحضور</Label><Input type="time" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} /></div>
              <div><Label>وقت الانصراف</Label><Input type="time" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} /></div>
            </div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button><Button onClick={handleSave} className="bg-cyan-500 hover:bg-cyan-600 text-white">{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}