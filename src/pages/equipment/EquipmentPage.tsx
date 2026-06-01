import { formatQAR } from '@/lib/format';
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
import { Search, Filter, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { equipmentStore, getProjectName } from '@/services/stores';

const categoryLabels: Record<string, string> = {
  vehicle: 'مركبة',
  generator: 'مولد كهرباء',
  excavator: 'حفار',
  crane: 'رافعة',
  compressor: 'ضاغط هواء',
  tools: 'أدوات',
  safety_equipment: 'معدات سلامة',
  scaffolding: 'سقالات',
  other: 'أخرى',
};

const statusLabels: Record<string, string> = {
  available: 'متاح',
  assigned: 'مخصص',
  under_maintenance: 'قيد الصيانة',
  damaged: 'تالف',
  sold: 'مباع',
  retired: 'متقاعد',
};

const emptyForm = {
  equipment_code: '',
  equipment_name: '',
  category: 'other' as string,
  serial_number: '',
  purchase_date: '',
  purchase_cost: 0,
  current_value: 0,
  assigned_project_id: '',
  current_location: '',
  responsible_person_id: '',
  condition: '',
  status: 'available',
  notes: '',
};

export default function EquipmentPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const items = useMemo(() => equipmentStore.getAll(), [refresh]);

  const filtered = items.filter((eq: any) => {
    if (categoryFilter !== 'all' && eq.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && eq.status !== statusFilter) return false;
    if (search && !eq.equipment_name.includes(search) && !eq.equipment_code.includes(search)) return false;
    return true;
  });

  const fmt = (v: number) =>
    formatQAR(v);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (eq: any) => {
    setEditId(eq.id);
    setForm({
      equipment_code: eq.equipment_code,
      equipment_name: eq.equipment_name,
      category: eq.category,
      serial_number: eq.serial_number,
      purchase_date: eq.purchase_date || '',
      purchase_cost: eq.purchase_cost,
      current_value: eq.current_value,
      assigned_project_id: eq.assigned_project_id || '',
      current_location: eq.current_location || '',
      responsible_person_id: eq.responsible_person_id || '',
      condition: eq.condition || '',
      status: eq.status,
      notes: eq.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.equipment_code || !form.equipment_name) return;
    const data: any = {
      company_id: '',
      equipment_code: form.equipment_code,
      equipment_name: form.equipment_name,
      category: form.category,
      serial_number: form.serial_number,
      purchase_date: form.purchase_date,
      purchase_cost: Number(form.purchase_cost),
      current_value: Number(form.current_value),
      assigned_project_id: form.assigned_project_id,
      current_location: form.current_location,
      responsible_person_id: form.responsible_person_id,
      condition: form.condition,
      status: form.status,
      notes: form.notes,
    };
    if (editId) {
      equipmentStore.update(editId, data);
    } else {
      equipmentStore.create(data);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">المعدات</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة المعدات والآليات والمولدات والأدوات</p>
        </div>
        <button onClick={openCreate} className="h-9 flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg px-4">
          + إضافة معدة
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="بحث باسم أو كود المعدة..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              {Object.entries(categoryLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
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
                <TableHead className="text-[11px] font-bold text-[#64748B]">الكود</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">اسم المعدة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الفئة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الرقم التسلسلي</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">تكلفة الشراء</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">القيمة الحالية</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">المشروع</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الحالة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      لا توجد معدات
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((eq: any) => (
                  <TableRow key={eq.id}>
                    <TableCell className="font-medium">{eq.equipment_code}</TableCell>
                    <TableCell>{eq.equipment_name}</TableCell>
                    <TableCell>{categoryLabels[eq.category] || eq.category}</TableCell>
                    <TableCell className="font-mono text-xs">{eq.serial_number}</TableCell>
                    <TableCell className="font-mono">{fmt(eq.purchase_cost)}</TableCell>
                    <TableCell className="font-mono">{fmt(eq.current_value)}</TableCell>
                    <TableCell>{eq.assigned_project_id ? getProjectName(eq.assigned_project_id) : '-'}</TableCell>
                    <TableCell>
                      <StatusBadge status={eq.status} label={statusLabels[eq.status] || eq.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => openEdit(eq)}>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              equipmentStore.remove(eq.id);
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
            <DialogTitle>{editId ? 'تعديل معدة' : 'إضافة معدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">كود المعدة *</label>
                <Input
                  value={form.equipment_code}
                  onChange={e => setForm(f => ({ ...f, equipment_code: e.target.value }))}
                  placeholder="مثال: EQP-001"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">اسم المعدة *</label>
                <Input
                  value={form.equipment_name}
                  onChange={e => setForm(f => ({ ...f, equipment_name: e.target.value }))}
                  placeholder="اسم المعدة"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">الفئة</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الرقم التسلسلي</label>
                <Input
                  value={form.serial_number}
                  onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))}
                  placeholder="الرقم التسلسلي"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">تاريخ الشراء</label>
                <Input
                  type="date"
                  value={form.purchase_date}
                  onChange={e => setForm(f => ({ ...f, purchase_date: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الحالة</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">تكلفة الشراء</label>
                <Input
                  type="number"
                  value={form.purchase_cost}
                  onChange={e => setForm(f => ({ ...f, purchase_cost: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">القيمة الحالية</label>
                <Input
                  type="number"
                  value={form.current_value}
                  onChange={e => setForm(f => ({ ...f, current_value: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">المشروع المخصص له</label>
              <Input
                value={form.assigned_project_id}
                onChange={e => setForm(f => ({ ...f, assigned_project_id: e.target.value }))}
                placeholder="معرف المشروع"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">الموقع الحالي</label>
                <Input
                  value={form.current_location}
                  onChange={e => setForm(f => ({ ...f, current_location: e.target.value }))}
                  placeholder="الموقع"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الحالة الفنية</label>
                <Input
                  value={form.condition}
                  onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                  placeholder="ممتازة - جيدة - متوسطة"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظات</label>
              <Input
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="ملاحظات"
              />
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