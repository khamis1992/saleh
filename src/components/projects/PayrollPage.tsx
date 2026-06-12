import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search, Filter, Pencil, Trash2, Users, TrendingUp, TrendingDown, DollarSign, CreditCard,
  RotateCcw, Sparkles, CheckCircle2, Clock, AlertTriangle, Wallet, ArrowRight,
} from 'lucide-react';
import { payrollStore, employeeStore } from '@/services/stores';

const fmt = formatQAR;
const statusLabels: Record<string, string> = { draft: 'مسودة', approved: 'معتمد', paid: 'مدفوع', cancelled: 'ملغي' };
const statusConfig: Record<string, { dot: string; chip: string }> = {
  draft:     { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  approved:  { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  paid:      { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  cancelled: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};
const emptyForm = { payroll_month: '', employee_id: '', basic_salary: 0, allowances: 0, overtime_pay: 0, deductions: 0, status: 'draft' as const };

function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const a: Record<string, { iconBg: string; iconColor: string }> = {
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
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

function PayrollRow({ r, empName, onEdit, onDelete }: { r: any; empName: string; onEdit: (r: any) => void; onDelete: (r: any) => void }) {
  const s = statusConfig[r.status] || statusConfig.draft;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900 font-mono">{r.payroll_month}</span></td>
      <td className="px-4 py-3"><span className="text-sm text-gray-900">{empName}</span></td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(r.basic_salary)}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(r.allowances || 0)}</td>
      <td className="px-4 py-3 text-xs font-mono text-emerald-600 ltr-only tabular-nums">{fmt(r.overtime_pay || 0)}</td>
      <td className="px-4 py-3 text-xs font-mono text-rose-600 ltr-only tabular-nums">{fmt(r.deductions || 0)}</td>
      <td className="px-4 py-3 text-xs font-mono font-bold text-gray-900 ltr-only tabular-nums">{fmt(r.net_salary || r.net_pay || 0)}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${s.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />{statusLabels[r.status] || r.status}
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

function EmptyPayroll({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><Wallet className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد كشوف رواتب</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function PayrollPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const records = useMemo(() => payrollStore.getAll(), [refresh]);
  const employees = useMemo(() => employeeStore.getAll(), [refresh]);
  const getEmpName = (id: string) => employees.find((e: any) => e.id === id)?.full_name || id;
  const filtered = records.filter((r: any) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) { const n = getEmpName(r.employee_id); if (!n.includes(search) && !r.payroll_month.includes(search)) return false; }
    return true;
  });
  const paidCount = records.filter((r: any) => r.status === 'paid').length;
  const draftCount = records.filter((r: any) => r.status === 'draft').length;
  const totalPayroll = records.reduce((s, r) => s + (r.net_salary || r.net_pay || 0), 0);
  const computedNet = form.basic_salary + form.allowances + form.overtime_pay - form.deductions;

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (r: any) => { setEditId(r.id); setForm({ payroll_month: r.payroll_month, employee_id: r.employee_id, basic_salary: r.basic_salary, allowances: r.allowances, overtime_pay: r.overtime_pay, deductions: r.deductions, status: r.status }); setModalOpen(true); };
  const handleSave = () => {
    if (!form.payroll_month || !form.employee_id) return;
    const data: any = { company_id: '', payroll_month: form.payroll_month, employee_id: form.employee_id, basic_salary: Number(form.basic_salary), allowances: Number(form.allowances), overtime_pay: Number(form.overtime_pay), deductions: Number(form.deductions), net_salary: computedNet, status: form.status, notes: '' };
    if (editId) payrollStore.update(editId, data); else payrollStore.create(data);
    setModalOpen(false); setRefresh(r => r + 1);
  };
  const handleDelete = () => { if (!deleteTarget) return; payrollStore.remove(deleteTarget.id); toast.success('تم الحذف'); setDeleteTarget(null); setRefresh(r => r + 1); };
  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm"><Wallet className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">الرواتب</span><span className="text-[13px] font-bold text-gray-900">{records.length} كشف</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث باسم الموظف أو الشهر..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500"><span>إجمالي:</span><span className="font-bold text-gray-900 ltr-only tabular-nums">{fmt(totalPayroll)}</span></div>
          <div className="me-auto" />
          <Button onClick={openCreate} className="h-8 px-3 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><span>+ إضافة كشف راتب</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="كشوف الرواتب" value={records.length} sub={`${filtered.length} معروض`} icon={Users} accent="slate" />
          <KpiCard label="مدفوعة" value={paidCount} sub="تم صرفها" icon={CheckCircle2} trend={{ val: Math.round((paidCount / Math.max(1, records.length)) * 100), dir: 'up' }} accent="emerald" />
          <KpiCard label="مسودات" value={draftCount} sub="قيد الإعداد" icon={Clock} accent="amber" />
          <KpiCard label="إجمالي الرواتب" value={fmt(totalPayroll)} sub="ر.ق" icon={DollarSign} accent="blue" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">الرواتب</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الحالات</SelectItem>{Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyPayroll onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الشهر</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الموظف</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الأساسي</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">البدلات</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">إضافي</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">خصومات</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الصافي</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map(r => <PayrollRow key={r.id} r={r} empName={getEmpName(r.employee_id)} onEdit={openEdit} onDelete={setDeleteTarget} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {records.length} كشف</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف كشف الراتب؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل كشف راتب' : 'إضافة كشف راتب'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الشهر *</Label><Input type="month" value={form.payroll_month} onChange={e => setForm(f => ({ ...f, payroll_month: e.target.value }))} /></div>
              <div><Label>الموظف *</Label><Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}><SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger><SelectContent>{employees.map((e: any) => (<SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>))}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الراتب الأساسي</Label><Input type="number" value={form.basic_salary} onChange={e => setForm(f => ({ ...f, basic_salary: Number(e.target.value) }))} /></div>
              <div><Label>البدلات</Label><Input type="number" value={form.allowances} onChange={e => setForm(f => ({ ...f, allowances: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>العمل الإضافي</Label><Input type="number" value={form.overtime_pay} onChange={e => setForm(f => ({ ...f, overtime_pay: Number(e.target.value) }))} /></div>
              <div><Label>الخصومات</Label><Input type="number" value={form.deductions} onChange={e => setForm(f => ({ ...f, deductions: Number(e.target.value) }))} /></div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex justify-between text-sm font-bold"><span>صافي الراتب (تلقائي)</span><span className="font-mono text-green-600">{fmt(computedNet)}</span></div>
              <p className="text-xs text-muted-foreground mt-1">صافي الراتب = الراتب الأساسي + البدلات + العمل الإضافي - الخصومات</p>
            </div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button><Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white">{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}