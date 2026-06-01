import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { DateDisplay } from '@/components/shared/Phase3Components';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { attendanceStore, employeeStore } from '@/services/stores';

const statusLabels: Record<string, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  half_day: 'نصف يوم',
  leave: 'إجازة',
  holiday: 'عطلة',
};

const emptyForm = {
  employee_id: '',
  attendance_date: '',
  check_in: '',
  check_out: '',
  status: 'present' as const,
};

export default function AttendancePage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const records = useMemo(() => attendanceStore.getAll(), [refresh]);
  const employees = useMemo(() => employeeStore.getAll(), [refresh]);

  const getEmpName = (id: string) => employees.find((e: any) => e.id === id)?.full_name || id;

  const filtered = records.filter((r: any) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (search) {
      const empName = getEmpName(r.employee_id);
      if (!empName.includes(search) && !r.attendance_date.includes(search)) return false;
    }
    return true;
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (r: any) => {
    setEditId(r.id);
    setForm({
      employee_id: r.employee_id,
      attendance_date: r.attendance_date,
      check_in: r.check_in,
      check_out: r.check_out,
      status: r.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.employee_id || !form.attendance_date) return;
    // Calculate hours and late minutes
    let hoursWorked = 0;
    let lateMinutes = 0;
    if (form.check_in && form.check_out) {
      const [inH, inM] = form.check_in.split(':').map(Number);
      const [outH, outM] = form.check_out.split(':').map(Number);
      const inMinutes = inH * 60 + inM;
      const outMinutes = outH * 60 + outM;
      hoursWorked = Math.max(0, (outMinutes - inMinutes) / 60);
      // Assume 8:00 is start time
      if (inMinutes > 480) lateMinutes = inMinutes - 480;
    }
    const data: any = {
      company_id: '',
      employee_id: form.employee_id,
      attendance_date: form.attendance_date,
      check_in: form.check_in,
      check_out: form.check_out,
      hours_worked: hoursWorked,
      late_minutes: lateMinutes,
      overtime_hours: 0,
      status: form.status,
      notes: '',
    };
    if (editId) {
      attendanceStore.update(editId, data);
    } else {
      attendanceStore.create(data);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الحضور والانصراف</h1>
          <p className="text-xs text-gray-500 mt-0.5">سجلات حضور وانصراف الموظفين ({records.length} سجل)</p>
        </div>
        <button onClick={openCreate} className="h-9 flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg px-4">
          + تسجيل حضور
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث باسم الموظف أو التاريخ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-10 h-9 text-sm rounded-lg border-gray-200"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الموظف</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">التاريخ</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">وقت الحضور</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">وقت الانصراف</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">ساعات العمل</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">دقائق التأخير</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الحالة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      لا توجد سجلات حضور
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{getEmpName(r.employee_id)}</TableCell>
                    <TableCell><DateDisplay value={r.attendance_date} /></TableCell>
                    <TableCell className="font-mono">{r.check_in || '-'}</TableCell>
                    <TableCell className="font-mono">{r.check_out || '-'}</TableCell>
                    <TableCell className="font-mono">
                      {r.hours_worked > 0 ? r.hours_worked.toFixed(2) : '-'}
                    </TableCell>
                    <TableCell className="font-mono">
                      {r.late_minutes > 0 ? r.late_minutes : '-'}
                    </TableCell>
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
                              attendanceStore.remove(r.id);
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
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل سجل حضور' : 'تسجيل حضور'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">الموظف *</label>
              <Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name} ({e.employee_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">التاريخ *</label>
              <Input
                type="date"
                value={form.attendance_date}
                onChange={e => setForm(f => ({ ...f, attendance_date: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">وقت الحضور</label>
                <Input
                  type="time"
                  value={form.check_in}
                  onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">وقت الانصراف</label>
                <Input
                  type="time"
                  value={form.check_out}
                  onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))}
                />
              </div>
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
