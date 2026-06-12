import { formatQAR, formatQARInt } from '@/lib/format';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search, Filter, Pencil, Trash2, Users, X, UserCheck, Calendar, DollarSign,
  TrendingUp, TrendingDown, RotateCcw, Sparkles, Award, AlertTriangle, Activity,
  Phone, Mail, MapPin, ArrowRight, Briefcase, Clock,
} from 'lucide-react';
import { employeeStore, leaveRequestStore, payrollStore } from '@/services/stores';

const fmt = formatQAR;
const fmtInt = formatQARInt;

const departmentLabels: Record<string, string> = {
  hr: 'الموارد البشرية', finance: 'المالية', engineering: 'الهندسة',
  procurement: 'المشتريات', maintenance: 'الصيانة', admin: 'الإدارة',
  tenant_relations: 'علاقات المستأجرين', security: 'الأمن والسلامة',
};

const departmentConfig: Record<string, { dot: string; chip: string }> = {
  hr:               { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  finance:          { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  engineering:      { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  procurement:      { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  maintenance:      { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  admin:            { dot: 'bg-slate-500', chip: 'bg-slate-50 text-slate-700 ring-1 ring-slate-100' },
  tenant_relations: { dot: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100' },
  security:         { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};

const emptyForm = {
  employee_code: '', full_name: '', nationality: '', phone: '', email: '',
  job_title: '', department_id: '', manager_id: '', hire_date: '',
  salary: 0, allowances: 0, status: 'active' as const,
};

function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
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

function EmployeeCard({ emp, onEdit, onDelete }: {
  emp: any; onEdit: (e: any) => void; onDelete: (e: any) => void;
}) {
  const deptCfg = departmentConfig[emp.department_id] || departmentConfig.admin;
  const isActive = emp.status === 'active';

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${isActive ? 'bg-amber-500' : 'bg-gray-300'}`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-lg ${isActive ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'} flex items-center justify-center shrink-0`}>
            <Users className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{emp.full_name}</div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{emp.employee_code}</div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {isActive ? 'نشط' : 'غير نشط'}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><Briefcase className="h-3 w-3 text-gray-400" />{emp.job_title || '—'}</span>
        <span className={`inline-flex items-center gap-1.5 h-6 px-2 rounded text-[10px] font-bold ${deptCfg.chip}`}>
          <span className={`h-1 w-1 rounded-full ${deptCfg.dot}`} />
          {departmentLabels[emp.department_id] || emp.department_id || '—'}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-gray-400" />{emp.phone || '—'}</span>
        <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-gray-400" />{emp.email || '—'}</span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-3.5 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-gray-400 mb-0.5">الراتب الأساسي</div>
          <div className="text-lg font-bold text-gray-900 ltr-only tabular-nums">{fmt(emp.salary)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gray-400 mb-0.5">تاريخ التوظيف</div>
          <div className="text-xs font-bold text-gray-700">{emp.hire_date || '—'}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => onEdit(emp)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(emp)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function EmployeeRow({ emp, onEdit, onDelete }: {
  emp: any; onEdit: (e: any) => void; onDelete: (e: any) => void;
}) {
  const deptCfg = departmentConfig[emp.department_id] || departmentConfig.admin;
  const isActive = emp.status === 'active';

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{emp.employee_code}</span></td>
      <td className="px-4 py-3">
        <div>
          <div className="text-sm font-bold text-gray-900">{emp.full_name}</div>
          <div className="text-[11px] text-gray-400">{emp.job_title || '—'}</div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${deptCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${deptCfg.dot}`} />
          {departmentLabels[emp.department_id] || emp.department_id || '—'}
        </span>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-gray-600 ltr-only">{emp.phone || '—'}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(emp.salary)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {isActive ? 'نشط' : 'غير نشط'}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(emp)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(emp)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyEmployees({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><Users className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا يوجد موظفين</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const employees = useMemo(() => employeeStore.getAll(), [refresh]);
  const leaves = useMemo(() => leaveRequestStore.getAll(), [refresh]);
  const payrolls = useMemo(() => payrollStore.getAll(), [refresh]);

  const filtered = employees.filter((emp: any) => {
    if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
    if (search && !emp.full_name.includes(search) && !emp.employee_code.includes(search) && !emp.job_title.includes(search)) return false;
    return true;
  });

  const activeEmployees = employees.filter((emp: any) => emp.status === 'active').length;
  const onLeave = leaves.filter((l: any) => l.status === 'approved').length;
  const totalPayroll = payrolls.reduce((s: number, p: any) => s + (p.net_pay || p.total_amount || 0), 0);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (emp: any) => {
    setEditId(emp.id);
    setForm({
      employee_code: emp.employee_code, full_name: emp.full_name, nationality: emp.nationality,
      phone: emp.phone, email: emp.email, job_title: emp.job_title, department_id: emp.department_id,
      manager_id: emp.manager_id || '', hire_date: emp.hire_date, salary: emp.salary,
      allowances: emp.allowances || 0, status: emp.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.employee_code || !form.full_name) return;
    const data: any = { company_id: '', employee_code: form.employee_code, full_name: form.full_name, nationality: form.nationality, phone: form.phone, email: form.email, job_title: form.job_title, department_id: form.department_id, manager_id: form.manager_id, hire_date: form.hire_date, salary: Number(form.salary), allowances: Number(form.allowances), status: form.status, notes: '' };
    if (editId) { employeeStore.update(editId, data); toast.success(`تم تحديث ${form.full_name} بنجاح`); }
    else { employeeStore.create(data); toast.success(`تم إضافة ${form.full_name} بنجاح`); }
    setModalOpen(false); setRefresh(r => r + 1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    employeeStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.full_name} بنجاح`);
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">الموارد البشرية</span>
              <span className="text-[13px] font-bold text-gray-900">{employees.length} موظف</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث باسم الموظف أو الكود..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>نشط:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{activeEmployees}</span>
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
          <Button onClick={openCreate}
            className="h-8 px-3 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <span>+ إضافة موظف</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الموظفين" value={employees.length} sub={`${filtered.length} معروض`} icon={Users} accent="slate" />
          <KpiCard label="نشطون" value={activeEmployees} sub="موظفين حاليين" icon={UserCheck} trend={{ val: Math.round((activeEmployees / Math.max(1, employees.length)) * 100), dir: 'up' }} accent="emerald" />
          <KpiCard label="في إجازة" value={onLeave} sub="إجازات معتمدة" icon={Calendar} trend={{ val: onLeave, dir: 'down' }} accent="amber" />
          <KpiCard label="إجمالي الرواتب" value={fmtInt(totalPayroll)} sub="ر.ق" icon={DollarSign} accent="blue" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">الموظفين</h2>
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
                <SelectItem value="active">نشط</SelectItem>
                <SelectItem value="inactive">غير نشط</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyEmployees onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(emp => <EmployeeCard key={emp.id} emp={emp} onEdit={openEdit} onDelete={setDeleteTarget} />)}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">كود الموظف</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الاسم / المسمى</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">القسم</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الجوال</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الراتب</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => <EmployeeRow key={emp.id} emp={emp} onEdit={openEdit} onDelete={setDeleteTarget} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {employees.length} موظف</span>
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
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف الموظف <strong className="text-gray-900">{deleteTarget.full_name}</strong> ({deleteTarget.employee_code})؟</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل موظف' : 'إضافة موظف'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>كود الموظف *</Label><Input value={form.employee_code} onChange={e => setForm(f => ({ ...f, employee_code: e.target.value }))} placeholder="مثال: EMP-009" /></div>
              <div><Label>الاسم الكامل *</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="الاسم الكامل" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الجنسية</Label><Input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} placeholder="الجنسية" /></div>
              <div><Label>رقم الجوال</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="05xxxxxxxx" /></div>
            </div>
            <div><Label>البريد الإلكتروني</Label><Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" dir="ltr" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>المسمى الوظيفي</Label><Input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} placeholder="المسمى الوظيفي" /></div>
              <div><Label>القسم</Label><Select value={form.department_id} onValueChange={v => setForm(f => ({ ...f, department_id: v }))}><SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger><SelectContent>{Object.entries(departmentLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div><Label>المدير المباشر</Label><Input value={form.manager_id} onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))} placeholder="معرف المدير" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>تاريخ التوظيف</Label><Input type="date" value={form.hire_date} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))} /></div>
              <div><Label>الراتب الأساسي</Label><Input type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>البدلات</Label><Input type="number" value={form.allowances} onChange={e => setForm(f => ({ ...f, allowances: Number(e.target.value) }))} /></div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="inactive">غير نشط</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button><Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white">{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}