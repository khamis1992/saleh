import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Search, Filter, MoreHorizontal, Pencil, Trash2, CalendarCheck } from 'lucide-react';
import { createStore } from '@/services/dataService';
import { employeeStore, getEmployeeName } from '@/services/stores';

// ============================================================
// SEED DATA
// ============================================================
export interface LeaveRequest {
  id: string;
  company_id: string;
  employee_id: string;
  leave_type: 'annual' | 'sick' | 'emergency' | 'unpaid';
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  created_at: string;
}

export const seedLeaveRequests: LeaveRequest[] = [
  { id: 'lv-1', company_id: '', employee_id: 'emp-1', leave_type: 'annual', start_date: '2026-03-10', end_date: '2026-03-24', days_count: 15, reason: 'إجازة سنوية', status: 'approved', created_at: '2026-02-20' },
  { id: 'lv-2', company_id: '', employee_id: 'emp-2', leave_type: 'sick', start_date: '2026-04-01', end_date: '2026-04-03', days_count: 3, reason: 'تعب وإرهاق', status: 'approved', created_at: '2026-03-30' },
  { id: 'lv-3', company_id: '', employee_id: 'emp-3', leave_type: 'emergency', start_date: '2026-05-15', end_date: '2026-05-17', days_count: 3, reason: 'ظرف عائلي طارئ', status: 'submitted', created_at: '2026-05-10' },
  { id: 'lv-4', company_id: '', employee_id: 'emp-4', leave_type: 'unpaid', start_date: '2026-06-01', end_date: '2026-06-10', days_count: 10, reason: 'سفر خارج المملكة', status: 'draft', created_at: '2026-05-20' },
  { id: 'lv-5', company_id: '', employee_id: 'emp-5', leave_type: 'annual', start_date: '2026-07-01', end_date: '2026-07-07', days_count: 7, reason: 'إجازة عيد الأضحى', status: 'submitted', created_at: '2026-06-25' },
  { id: 'lv-6', company_id: '', employee_id: 'emp-1', leave_type: 'sick', start_date: '2026-03-25', end_date: '2026-03-26', days_count: 2, reason: 'صداع نصفي', status: 'rejected', created_at: '2026-03-24' },
];

// In-memory store
const leaveStore = createStore<LeaveRequest>({ key: 'erp_leave_requests', seed: seedLeaveRequests });

const leaveTypeLabels: Record<string, string> = {
  annual: 'سنوية',
  sick: 'مرضية',
  emergency: 'طارئة',
  unpaid: 'بدون راتب',
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  submitted: 'مقدم',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const emptyForm = {
  employee_id: '',
  leave_type: 'annual' as string,
  start_date: '',
  end_date: '',
  days_count: 0,
  reason: '',
  status: 'draft' as string,
};

export default function LeaveManagementPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const leaves = useMemo(() => leaveStore.getAll(), [refresh]);

  const calcDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const filtered = leaves.filter((lv: LeaveRequest) => {
    if (statusFilter !== 'all' && lv.status !== statusFilter) return false;
    if (search) {
      const empName = getEmployeeName(lv.employee_id);
      if (!empName.includes(search) && !lv.employee_id.includes(search) && !lv.reason.includes(search)) return false;
    }
    return true;
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (lv: LeaveRequest) => {
    setEditId(lv.id);
    setForm({
      employee_id: lv.employee_id,
      leave_type: lv.leave_type,
      start_date: lv.start_date,
      end_date: lv.end_date,
      days_count: lv.days_count,
      reason: lv.reason,
      status: lv.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.employee_id || !form.start_date || !form.end_date) return;
    const days = calcDays(form.start_date, form.end_date);
    const data: any = {
      company_id: '',
      employee_id: form.employee_id,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      days_count: days,
      reason: form.reason,
      status: form.status,
      created_at: new Date().toISOString().split('T')[0],
    };
    if (editId) {
      leaveStore.update(editId, data);
    } else {
      leaveStore.create(data);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  const employees = useMemo(() => employeeStore.getAll(), [refresh]);

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">إدارة الإجازات</h1>
          <p className="text-xs text-gray-500 mt-0.5">سجل طلبات الإجازات ({leaves.length} طلب)</p>
        </div>
        <button onClick={openCreate} className="h-9 flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg px-4">
          + طلب إجازة
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="بحث باسم الموظف أو السبب..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="submitted">مقدم</SelectItem>
              <SelectItem value="approved">معتمد</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
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
                <TableHead className="text-[11px] font-bold text-[#64748B]">نوع الإجازة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">تاريخ البداية</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">تاريخ النهاية</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">عدد الأيام</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">السبب</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الحالة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      لا توجد طلبات إجازة
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((lv: LeaveRequest) => (
                  <TableRow key={lv.id}>
                    <TableCell className="font-medium">{getEmployeeName(lv.employee_id) || lv.employee_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{leaveTypeLabels[lv.leave_type] || lv.leave_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{lv.start_date}</TableCell>
                    <TableCell className="text-sm">{lv.end_date}</TableCell>
                    <TableCell className="text-center">{lv.days_count}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{lv.reason}</TableCell>
                    <TableCell>
                      <StatusBadge status={lv.status} label={statusLabels[lv.status] || lv.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => openEdit(lv)}>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              leaveStore.remove(lv.id);
                              setRefresh(r => r + 1);
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
            <DialogTitle>{editId ? 'تعديل طلب إجازة' : 'طلب إجازة جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium mb-1 block">الموظف *</label>
              <Select value={form.employee_id} onValueChange={v => setForm(f => ({ ...f, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                <SelectContent>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">نوع الإجازة</label>
              <Select value={form.leave_type} onValueChange={v => setForm(f => ({ ...f, leave_type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="annual">سنوية</SelectItem>
                  <SelectItem value="sick">مرضية</SelectItem>
                  <SelectItem value="emergency">طارئة</SelectItem>
                  <SelectItem value="unpaid">بدون راتب</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">تاريخ البداية *</label>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={e => {
                    const start = e.target.value;
                    setForm(f => ({
                      ...f,
                      start_date: start,
                      days_count: calcDays(start, f.end_date),
                    }));
                  }}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">تاريخ النهاية *</label>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={e => {
                    const end = e.target.value;
                    setForm(f => ({
                      ...f,
                      end_date: end,
                      days_count: calcDays(f.start_date, end),
                    }));
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">عدد الأيام</label>
              <Input
                type="number"
                value={form.days_count}
                readOnly
                className="bg-muted"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">السبب</label>
              <Textarea
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="سبب طلب الإجازة..."
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="submitted">مقدم</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="rejected">مرفوض</SelectItem>
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
