import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { MoneyDisplay } from '@/components/shared/Phase3Components';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Filter, Pencil, Trash2, Users, X } from 'lucide-react';
import { employeeStore } from '@/services/stores';

const statusLabels: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
};

const departmentLabels: Record<string, string> = {
  hr: 'الموارد البشرية',
  finance: 'المالية',
  engineering: 'الهندسة',
  procurement: 'المشتريات',
  maintenance: 'الصيانة',
  admin: 'الإدارة',
  tenant_relations: 'علاقات المستأجرين',
  security: 'الأمن والسلامة',
};

const emptyForm = {
  employee_code: '',
  full_name: '',
  nationality: '',
  phone: '',
  email: '',
  job_title: '',
  department_id: '',
  manager_id: '',
  hire_date: '',
  salary: 0,
  allowances: 0,
  status: 'active' as const,
};

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const employees = useMemo(() => {
    const data = employeeStore.getAll();
    const timer = setTimeout(() => setLoading(false), 300);
    return data;
  }, [refresh]);

  const filtered = employees.filter((emp: any) => {
    if (statusFilter !== 'all' && emp.status !== statusFilter) return false;
    if (search && !emp.full_name.includes(search) && !emp.employee_code.includes(search) && !emp.job_title.includes(search)) return false;
    return true;
  });

  const fmt = (v: number) =>
    formatQAR(v);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (emp: any) => {
    setEditId(emp.id);
    setForm({
      employee_code: emp.employee_code,
      full_name: emp.full_name,
      nationality: emp.nationality,
      phone: emp.phone,
      email: emp.email,
      job_title: emp.job_title,
      department_id: emp.department_id,
      manager_id: emp.manager_id || '',
      hire_date: emp.hire_date,
      salary: emp.salary,
      allowances: emp.allowances || 0,
      status: emp.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.employee_code || !form.full_name) return;
    const data: any = {
      company_id: '',
      employee_code: form.employee_code,
      full_name: form.full_name,
      nationality: form.nationality,
      phone: form.phone,
      email: form.email,
      job_title: form.job_title,
      department_id: form.department_id,
      manager_id: form.manager_id,
      hire_date: form.hire_date,
      salary: Number(form.salary),
      allowances: Number(form.allowances),
      status: form.status,
      notes: '',
    };
    if (editId) {
      employeeStore.update(editId, data);
      toast.success(`تم تحديث ${form.full_name} بنجاح`);
    } else {
      employeeStore.create(data);
      toast.success(`تم إضافة ${form.full_name} بنجاح`);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    employeeStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.full_name} بنجاح`);
    setDeleteTarget(null);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الموظفين</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة سجلات الموظفين ({employees.length} موظف)</p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          + إضافة موظف
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
            <Input
              placeholder="بحث باسم الموظف أو الكود..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10 h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="inactive">غير نشط</SelectItem>
            </SelectContent>
          </Select>
          {search && (
            <span className="text-xs text-gray-400">{filtered.length} نتيجة</span>
          )}
        </div>
      </div>

      {/* Table Card */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[11px] font-bold text-[#64748B]">كود الموظف</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B]">الاسم الكامل</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B]">المسمى الوظيفي</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B]">القسم</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B]">رقم الجوال</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B]">الراتب</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B]">الحالة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] w-[80px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <Users className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا يوجد موظفين</p>
                        <p className="text-xs text-gray-400">لم يتم العثور على أي نتائج</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSearch(''); setStatusFilter('all'); }}
                          className="h-8 text-xs rounded-lg mt-1"
                        >
                          مسح الفلاتر
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((emp: any) => (
                  <TableRow key={emp.id} className="">
                    <TableCell className="font-medium text-sm">{emp.employee_code}</TableCell>
                    <TableCell className="text-sm">{emp.full_name}</TableCell>
                    <TableCell className="text-sm">{emp.job_title}</TableCell>
                    <TableCell className="text-sm">{departmentLabels[emp.department_id] || emp.department_id || '-'}</TableCell>
                    <TableCell className="font-mono text-sm">{emp.phone}</TableCell>
                    <TableCell className="font-mono text-sm">{fmt(emp.salary)}</TableCell>
                    <TableCell>
                      <StatusBadge status={emp.status} label={statusLabels[emp.status] || emp.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => openEdit(emp)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>تعديل</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(emp)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>حذف</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 0 && (
            <div className="py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs text-gray-500">عرض {filtered.length} من {employees.length} موظف</span>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل موظف' : 'إضافة موظف'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">كود الموظف *</label>
                <Input
                  value={form.employee_code}
                  onChange={e => setForm(f => ({ ...f, employee_code: e.target.value }))}
                  placeholder="مثال: EMP-009"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الاسم الكامل *</label>
                <Input
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  placeholder="الاسم الكامل"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">الجنسية</label>
                <Input
                  value={form.nationality}
                  onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
                  placeholder="الجنسية"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">رقم الجوال</label>
                <Input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="05xxxxxxxx"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
              <Input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">المسمى الوظيفي</label>
                <Input
                  value={form.job_title}
                  onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
                  placeholder="المسمى الوظيفي"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">القسم</label>
                <Select value={form.department_id} onValueChange={v => setForm(f => ({ ...f, department_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر القسم" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(departmentLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">المدير المباشر</label>
              <Input
                value={form.manager_id}
                onChange={e => setForm(f => ({ ...f, manager_id: e.target.value }))}
                placeholder="معرف المدير"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">تاريخ التوظيف</label>
                <Input
                  type="date"
                  value={form.hire_date}
                  onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الراتب الأساسي</label>
                <Input
                  type="number"
                  value={form.salary}
                  onChange={e => setForm(f => ({ ...f, salary: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">البدلات</label>
              <Input
                type="number"
                value={form.allowances}
                onChange={e => setForm(f => ({ ...f, allowances: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الموظف <strong>{deleteTarget?.full_name}</strong> ({deleteTarget?.employee_code})؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}