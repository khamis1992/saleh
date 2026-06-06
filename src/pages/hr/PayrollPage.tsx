import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MoneyDisplay } from '@/components/shared/Phase3Components';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, MoreHorizontal, Pencil, Trash2, Users, TrendingUp, DollarSign, CreditCard } from 'lucide-react';
import { payrollStore, employeeStore } from '@/services/stores';
import { KpiCard } from '@/components/shared/DesignSystem';

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  approved: 'معتمد',
  paid: 'مدفوع',
  cancelled: 'ملغي',
};

const emptyForm = {
  payroll_month: '',
  employee_id: '',
  basic_salary: 0,
  allowances: 0,
  overtime_pay: 0,
  deductions: 0,
  status: 'draft' as const,
};

export default function PayrollPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const records = useMemo(() => payrollStore.getAll(), [refresh]);
  const employees = useMemo(() => employeeStore.getAll(), [refresh]);

  const getEmpName = (id: string) => employees.find((e: any) => e.id === id)?.full_name || id;

  const filtered = records.filter((r: any) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const empName = getEmpName(r.employee_id);
      if (!empName.includes(search) && !r.payroll_month.includes(search)) return false;
    }
    return true;
  });

  // KPI computations
  const paidPayrolls = records.filter((r: any) => r.status === 'paid').length;
  const draftPayrolls = records.filter((r: any) => r.status === 'draft').length;
  const totalPayrollAmount = records.reduce((s: number, r: any) => s + ((r.net_pay || r.net_salary || 0)), 0);

  const computedNetSalary = form.basic_salary + form.allowances + form.overtime_pay - form.deductions;

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({
      payroll_month: r.payroll_month,
      employee_id: r.employee_id,
      basic_salary: r.basic_salary,
      allowances: r.allowances,
      overtime_pay: r.overtime_pay,
      deductions: r.deductions,
      status: r.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.payroll_month || !form.employee_id) return;
    const data: any = {
      company_id: '',
      payroll_month: form.payroll_month,
      employee_id: form.employee_id,
      basic_salary: Number(form.basic_salary),
      allowances: Number(form.allowances),
      overtime_pay: Number(form.overtime_pay),
      deductions: Number(form.deductions),
      net_salary: computedNetSalary,
      status: form.status,
      notes: '',
    };
    if (editId) {
      payrollStore.update(editId, data);
    } else {
      payrollStore.create(data);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  const fmt = (v: number) =>
    formatQAR(v);

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="كشوف الرواتب" value={records.length} subtitle={`${filtered.length} كشف`} icon={Users} moduleOverride="hr" />
        <KpiCard title="مدفوعة" value={paidPayrolls} subtitle="تم صرفها" icon={CreditCard} moduleOverride="hr" />
        <KpiCard title="مسودات" value={draftPayrolls} subtitle="قيد الإعداد" icon={TrendingUp} moduleOverride="hr" />
        <KpiCard title="إجمالي الرواتب" value={formatQAR(totalPayrollAmount)} subtitle="ر.ق" icon={DollarSign} moduleOverride="hr" />
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الرواتب</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة كشوف الرواتب الشهرية ({records.length} كشف)</p>
        </div>
        <button onClick={openCreate} className="h-9 flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg px-4">
          + إضافة كشف راتب
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="بحث باسم الموظف أو الشهر..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الشهر</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الموظف</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الراتب الأساسي</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">البدلات</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">العمل الإضافي</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الخصومات</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">صافي الراتب</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الحالة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      لا توجد كشوف رواتب
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium font-mono">{r.payroll_month}</TableCell>
                    <TableCell>{getEmpName(r.employee_id)}</TableCell>
                    <TableCell className="font-mono">{fmt(r.basic_salary)}</TableCell>
                    <TableCell className="font-mono">{fmt(r.allowances)}</TableCell>
                    <TableCell className="font-mono">{fmt(r.overtime_pay)}</TableCell>
                    <TableCell className="font-mono text-red-600">{fmt(r.deductions)}</TableCell>
                    <TableCell className="font-mono font-bold">{fmt(r.net_salary)}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} label={statusLabels[r.status] || r.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => openEdit(r)}>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              payrollStore.remove(r.id);
                              setRefresh(rev => rev + 1);
                            }}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل كشف راتب' : 'إضافة كشف راتب'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">الشهر *</label>
                <Input
                  type="month"
                  value={form.payroll_month}
                  onChange={e => setForm(f => ({ ...f, payroll_month: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الموظف *</label>
                <Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e: any) => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">الراتب الأساسي</label>
                <Input
                  type="number"
                  value={form.basic_salary}
                  onChange={e => setForm(f => ({ ...f, basic_salary: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">البدلات</label>
                <Input
                  type="number"
                  value={form.allowances}
                  onChange={e => setForm(f => ({ ...f, allowances: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">العمل الإضافي</label>
                <Input
                  type="number"
                  value={form.overtime_pay}
                  onChange={e => setForm(f => ({ ...f, overtime_pay: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الخصومات</label>
                <Input
                  type="number"
                  value={form.deductions}
                  onChange={e => setForm(f => ({ ...f, deductions: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <div className="flex justify-between text-sm font-bold">
                <span>صافي الراتب (تلقائي)</span>
                <span className="font-mono text-green-600">{fmt(computedNetSalary)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                صافي الراتب = الراتب الأساسي + البدلات + العمل الإضافي - الخصومات
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>{editId ? 'تحديث' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}