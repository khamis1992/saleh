import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
import { Search, Filter, Pencil, Trash2, Plus, Warehouse, X } from 'lucide-react';
import { warehouseStore } from '@/services/stores';

const warehouseTypeLabels: Record<string, string> = {
  main: 'مستودع رئيسي',
  project: 'مستودع مشروع',
  site: 'مستودع موقع',
  maintenance: 'مستودع صيانة',
};

const emptyForm = {
  warehouse_code: '',
  warehouse_name: '',
  location: '',
  type: 'main' as const,
  status: 'active',
};

export default function WarehousesPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const warehouses = useMemo(() => {
    const data = warehouseStore.getAll();
    const timer = setTimeout(() => setLoading(false), 300);
    return data;
  }, [refresh]);

  const filtered = warehouses.filter((w: any) => {
    if (typeFilter !== 'all' && w.type !== typeFilter) return false;
    if (search && !w.warehouse_name.includes(search) && !w.warehouse_code.includes(search)) return false;
    return true;
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (w: any) => {
    setEditId(w.id);
    setForm({
      warehouse_code: w.warehouse_code,
      warehouse_name: w.warehouse_name,
      location: w.location,
      type: w.type,
      status: w.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.warehouse_code || !form.warehouse_name) return;
    const data: any = {
      company_id: '',
      warehouse_code: form.warehouse_code,
      warehouse_name: form.warehouse_name,
      location: form.location,
      manager_id: '',
      type: form.type,
      status: form.status,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (editId) {
      warehouseStore.update(editId, data);
      toast.success(`تم تحديث ${form.warehouse_name} بنجاح`);
    } else {
      warehouseStore.create(data);
      toast.success(`تم إضافة ${form.warehouse_name} بنجاح`);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    warehouseStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.warehouse_name} بنجاح`);
    setDeleteTarget(null);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">المستودعات</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة المستودعات الرئيسية ومستودعات المشاريع والمواقع</p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          إضافة مستودع
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
            <Input
              placeholder="بحث..."
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="نوع المستودع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="main">مستودع رئيسي</SelectItem>
              <SelectItem value="project">مستودع مشروع</SelectItem>
              <SelectItem value="site">مستودع موقع</SelectItem>
              <SelectItem value="maintenance">مستودع صيانة</SelectItem>
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
                <TableRow >
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الكود</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">اسم المستودع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الموقع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">النوع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الحالة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[80px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <Warehouse className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا توجد مستودعات</p>
                        <p className="text-xs text-gray-400">لم يتم العثور على أي نتائج</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSearch(''); setTypeFilter('all'); }}
                          className="h-8 text-xs rounded-lg mt-1"
                        >
                          مسح الفلاتر
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((w: any) => (
                  <TableRow key={w.id} className="">
                    <TableCell className="font-medium text-sm">{w.warehouse_code}</TableCell>
                    <TableCell className="text-sm">{w.warehouse_name}</TableCell>
                    <TableCell className="text-sm">{w.location}</TableCell>
                    <TableCell className="text-sm">{warehouseTypeLabels[w.type] || w.type}</TableCell>
                    <TableCell>
                      <StatusBadge status={w.status} label={w.status === 'active' ? 'نشط' : 'غير نشط'} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => openEdit(w)}>
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
                              onClick={() => setDeleteTarget(w)}
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
              <span className="text-xs text-gray-500">عرض {filtered.length} من {warehouses.length} مستودع</span>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل مستودع' : 'إضافة مستودع'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">كود المستودع *</label>
              <Input
                value={form.warehouse_code}
                onChange={e => setForm(f => ({ ...f, warehouse_code: e.target.value }))}
                placeholder="مثال: WH-MAIN-001"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">اسم المستودع *</label>
              <Input
                value={form.warehouse_name}
                onChange={e => setForm(f => ({ ...f, warehouse_name: e.target.value }))}
                placeholder="اسم المستودع"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الموقع</label>
              <Input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                placeholder="الموقع"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">النوع</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">مستودع رئيسي</SelectItem>
                  <SelectItem value="project">مستودع مشروع</SelectItem>
                  <SelectItem value="site">مستودع موقع</SelectItem>
                  <SelectItem value="maintenance">مستودع صيانة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
              هل أنت متأكد من حذف المستودع <strong>{deleteTarget?.warehouse_name}</strong> ({deleteTarget?.warehouse_code})؟ لا يمكن التراجع عن هذا الإجراء.
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
