import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Search, Plus, Shield, UserX, UserCheck, X, Download, Filter as FilterIcon,
  Eye, Pencil, MoreHorizontal, ChevronLeft, ChevronRight, SlidersHorizontal,
} from 'lucide-react';
import { createStore } from '@/services/dataService';
import { roleStore } from '@/services/stores';
import { exportToCSV } from '@/utils/exportUtils';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
}

const seedUsers: AppUser[] = [
  { id: 'u1', name: 'د. محمد العتيبي', email: 'mohammed@company.com', role: 'مدير النظام', department: 'الإدارة', status: 'active' },
  { id: 'u2', name: 'م. خالد العمري', email: 'khaled@company.com', role: 'مدير المشاريع', department: 'المشاريع', status: 'active' },
  { id: 'u3', name: 'أ. سارة القحطاني', email: 'sara@company.com', role: 'مدير العقارات', department: 'العقارات', status: 'active' },
  { id: 'u4', name: 'م. فيصل الشهري', email: 'faisal@company.com', role: 'مهندس موقع', department: 'المشاريع', status: 'active' },
  { id: 'u5', name: 'أ. نورة الدوسري', email: 'noura@company.com', role: 'المدير المالي', department: 'المالية', status: 'active' },
  { id: 'u6', name: 'أ. عبدالله القحطاني', email: 'abdullah@company.com', role: 'مسؤول التأجير', department: 'التأجير', status: 'inactive' },
];

const departments = [
  'الإدارة',
  'المشاريع',
  'العقارات',
  'التأجير',
  'المالية',
  'الصيانة',
  'المشتريات',
  'الموارد البشرية',
  'القانونية',
  'تقنية المعلومات',
];

const userStore = createStore<AppUser>({ key: 'erp_users', seed: seedUsers });

// ============================================================
// AVATAR (initials with color-coded background)
// ============================================================
const avatarColorPalette = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-pink-100 text-pink-700',
];

function UserAvatar({ name }: { name: string }) {
  // Pick the first non-prefix character (skip "د.", "م.", "أ.", "د", "م", "أ")
  const clean = name.replace(/^(د\.|م\.|أ\.|د|م|أ)\s*/, '');
  const initial = (clean || name).charAt(0);
  // Stable color from name hash
  const hash = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const color = avatarColorPalette[hash % avatarColorPalette.length];
  return (
    <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center text-[13px] font-bold flex-shrink-0 ring-2 ring-white`}>
      {initial}
    </div>
  );
}

export default function UsersPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<{ role: string; department: string; status: 'active' | 'inactive' }>({ role: '', department: '', status: 'active' });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', role: 'مهندس موقع', department: 'المشاريع', status: 'active' as const });

  const [filterRole, setFilterRole] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const users = useMemo(() => userStore.getAll(), [refresh]);

  const filtered = useMemo(() => users.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterDept !== 'all' && u.department !== filterDept) return false;
    if (filterStatus !== 'all' && u.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.role.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [users, search, filterRole, filterDept, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const allRoles = useMemo(() => Array.from(new Set(users.map(u => u.role))), [users]);

  // Edit role/status
  function openEdit(user: AppUser) {
    setEditUser(user);
    setForm({ role: user.role, department: user.department, status: user.status });
    setDialogOpen(true);
  }

  function handleSaveEdit() {
    if (!editUser) return;
    userStore.update(editUser.id, { ...editUser, role: form.role, department: form.department, status: form.status } as AppUser);
    toast.success(`تم تحديث ${editUser.name}`);
    setDialogOpen(false);
    setRefresh(r => r + 1);
  }

  // Toggle user status
  function toggleStatus(user: AppUser) {
    const newStatus = user.status === 'active' ? 'inactive' : 'active' as const;
    userStore.update(user.id, { ...user, status: newStatus } as AppUser);
    toast.success(newStatus === 'active' ? `تم تفعيل ${user.name}` : `تم تعطيل ${user.name}`);
    setRefresh(r => r + 1);
  }

  // Create new user
  function handleCreate() {
    if (!createForm.name || !createForm.email) {
      toast.error('يرجى ملء الاسم والبريد الإلكتروني');
      return;
    }
    const newUser: AppUser = {
      id: `u-${Date.now()}`,
      name: createForm.name,
      email: createForm.email,
      role: createForm.role,
      department: createForm.department,
      status: createForm.status,
    };
    userStore.create(newUser);
    toast.success(`تم إضافة ${createForm.name}`);
    setCreateOpen(false);
    setCreateForm({ name: '', email: '', role: 'مهندس موقع', department: 'المشاريع', status: 'active' });
    setRefresh(r => r + 1);
  }

  function handleResetFilters() {
    setSearch('');
    setFilterRole('all');
    setFilterDept('all');
    setFilterStatus('all');
    setCurrentPage(1);
  }

  function handleExport() {
    const data = filtered.map((u) => ({
      'الاسم': u.name,
      'البريد الإلكتروني': u.email,
      'الدور': u.role,
      'القسم': u.department,
      'الحالة': u.status === 'active' ? 'نشط' : 'غير نشط',
    }));
    exportToCSV(data, [
      { key: 'الاسم', label: 'الاسم' },
      { key: 'البريد الإلكتروني', label: 'البريد الإلكتروني' },
      { key: 'الدور', label: 'الدور' },
      { key: 'القسم', label: 'القسم' },
      { key: 'الحالة', label: 'الحالة' },
    ], 'المستخدمين.csv');
  }

  return (
    <div className="bg-gray-50 min-h-full" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة المستخدمين والأدوار والصلاحيات داخل النظام</p>
        </div>
        <div className="hidden" />
      </div>

      {/* ── ACTION BAR ────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-3 flex flex-wrap items-center gap-2">
        {/* Search (right in RTL) */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="البحث بإسم المستخدم أو البريد الإلكتروني..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pr-10 h-9 text-sm rounded-lg border-gray-200 bg-gray-50 focus:bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-3 top-2.5 text-gray-300 hover:text-gray-500">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export */}
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="gap-2 h-9 border-gray-200 text-gray-600 hover:text-gray-800 text-sm rounded-lg"
        >
          <Download className="h-4 w-4" />
          تصدير
        </Button>

        {/* Advanced Filter */}
        <Button variant="outline" className="gap-2 h-9 border-gray-200 text-gray-600 hover:text-gray-800 text-sm rounded-lg">
          <SlidersHorizontal className="h-4 w-4" />
          تصفية متقدمة
        </Button>

        {/* Add User */}
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" />
          إضافة مستخدم
        </Button>
      </div>

      {/* ── FILTER DROPDOWNS ROW ─────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-3 flex flex-wrap items-center gap-2">
        {/* Reset (rightmost in RTL) */}
        <Button variant="outline" size="sm" onClick={handleResetFilters}
          className="h-9 border-gray-200 text-gray-500 hover:text-gray-800 rounded-lg gap-1.5 text-xs mr-auto">
          <FilterIcon className="h-3.5 w-3.5" />
          إعادة تعيين
        </Button>

        {/* Department */}
        <Select value={filterDept} onValueChange={v => { setFilterDept(v); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-[160px] text-xs border-gray-200 rounded-lg bg-gray-50">
            <SelectValue placeholder="القسم" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأقسام</SelectItem>
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Role */}
        <Select value={filterRole} onValueChange={v => { setFilterRole(v); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-[160px] text-xs border-gray-200 rounded-lg bg-gray-50">
            <SelectValue placeholder="الدور" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأدوار</SelectItem>
            {allRoles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-[150px] text-xs border-gray-200 rounded-lg bg-gray-50">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="active">نشط</SelectItem>
            <SelectItem value="inactive">غير نشط</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── DATA TABLE ───────────────────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow >
              <TableHead>المستخدم</TableHead>
              <TableHead>البريد الإلكتروني</TableHead>
              <TableHead>الدور</TableHead>
              <TableHead>القسم</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead className="w-[160px]">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <UserX className="h-5 w-5 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">لا يوجد مستخدمين</p>
                    <p className="text-xs text-gray-300">لا توجد نتائج تطابق معايير البحث</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {paginated.map((u) => (
              <TableRow key={u.id} className=" h-[64px] group">
                {/* User (avatar + name) */}
                <TableCell >
                  <div className="flex items-center gap-3">
                    <UserAvatar name={u.name} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1E293B] leading-tight">{u.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">ID: {u.id}</p>
                    </div>
                  </div>
                </TableCell>

                {/* Email */}
                <TableCell  dir="ltr">
                  <span className="text-xs text-gray-500 font-mono">{u.email}</span>
                </TableCell>

                {/* Role */}
                <TableCell >
                  <span className="text-xs font-medium text-[#334155]">{u.role}</span>
                </TableCell>

                {/* Department */}
                <TableCell >
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                    {u.department}
                  </span>
                </TableCell>

                {/* Status */}
                <TableCell >
                  {u.status === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500 text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      نشط
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500 text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      غير نشط
                    </span>
                  )}
                </TableCell>

                {/* Actions */}
                <TableCell >
                  <div className="flex items-center gap-0.5 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>عرض</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => openEdit(u)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>تعديل</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md text-gray-400 hover:text-violet-600 hover:bg-violet-50">
                          <Shield className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>الصلاحيات</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="sm"
                          className={`h-7 w-7 p-0 rounded-md ${u.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          onClick={() => toggleStatus(u)}
                        >
                          {u.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{u.status === 'active' ? 'تعطيل' : 'تفعيل'}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md text-gray-400 hover:bg-gray-100">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>المزيد</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* ── PAGINATION ─────────────────────────────────────────── */}
        <div className="py-3 border-t border-gray-100 bg-[#FAFBFC] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Select value={String(rowsPerPage)} onValueChange={v => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200 rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-gray-500">لكل صفحة</span>
          </div>

          <span className="text-xs text-gray-500">
            عرض <span className="font-bold text-[#1E293B]">{filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</span> -{' '}
            <span className="font-bold text-[#1E293B]">{Math.min(currentPage * rowsPerPage, filtered.length)}</span> من{' '}
            <span className="font-bold text-[#1E293B]">{filtered.length}</span> مستخدمين
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-2 text-xs border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40 gap-1"
            >
              <ChevronRight className="h-3.5 w-3.5" />
              السابق
            </Button>
            <div className="h-8 min-w-[32px] px-2 bg-[#3B82F6] text-white rounded-lg text-xs font-bold flex items-center justify-center">
              {currentPage}
            </div>
            <Button
              variant="outline" size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-2 text-xs border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40 gap-1"
            >
              التالي
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Role/Department Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              تعديل صلاحيات — {editUser?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الدور الوظيفي</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roleStore.getAll().map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>القسم</Label>
              <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as 'active' | 'inactive' }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">نشط</SelectItem>
                  <SelectItem value="inactive">غير نشط</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSaveEdit}>حفظ التغييرات</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-600" />
              {t.users.create}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>الاسم الكامل *</Label>
              <Input value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="الاسم الكامل" />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني *</Label>
              <Input value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} placeholder="email@company.com" dir="ltr" className="ltr-only" />
            </div>
            <div className="space-y-2">
              <Label>الدور الوظيفي</Label>
              <Select value={createForm.role} onValueChange={v => setCreateForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roleStore.getAll().map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>القسم</Label>
              <Select value={createForm.department} onValueChange={v => setCreateForm(f => ({ ...f, department: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button onClick={handleCreate}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
