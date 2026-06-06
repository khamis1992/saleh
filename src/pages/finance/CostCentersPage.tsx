import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, MoreHorizontal, Pencil, Trash2, Building2, TrendingUp, CreditCard } from 'lucide-react';
import { costCenterStore } from '@/services/stores';
import { KpiCard } from '@/components/shared/DesignSystem';

const typeLabels: Record<string, string> = {
  project: 'مشروع',
  property: 'عقار',
  department: 'قسم',
  unit: 'وحدة',
  other: 'أخرى',
};

const statusLabels: Record<string, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
};

const emptyForm = {
  cost_center_code: '',
  cost_center_name: '',
  type: 'project' as string,
  linked_entity: '',
  status: 'active' as string,
};

export default function CostCentersPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const centers = useMemo(() => costCenterStore.getAll(), [refresh]);

  const filtered = centers.filter((cc: any) => {
    if (typeFilter !== 'all' && cc.type !== typeFilter) return false;
    if (search && !cc.cost_center_name.includes(search) && !cc.cost_center_code.includes(search)) return false;
    return true;
  });

  // KPI computations
  const activeCenters = centers.filter((cc: any) => cc.status === 'active').length;
  const projectCenters = centers.filter((cc: any) => cc.type === 'project').length;
  const propertyCenters = centers.filter((cc: any) => cc.type === 'property').length;

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (cc: any) => {
    setEditId(cc.id);
    // Determine linked entity display
    let linkedEntity = '';
    if (cc.linked_project_id) linkedEntity = cc.linked_project_id;
    else if (cc.linked_property_id) linkedEntity = cc.linked_property_id;
    else if (cc.linked_department_id) linkedEntity = cc.linked_department_id;

    setForm({
      cost_center_code: cc.cost_center_code,
      cost_center_name: cc.cost_center_name,
      type: cc.type,
      linked_entity: linkedEntity,
      status: cc.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.cost_center_code || !form.cost_center_name) return;
    const data: any = {
      company_id: '',
      cost_center_code: form.cost_center_code,
      cost_center_name: form.cost_center_name,
      type: form.type,
      linked_project_id: form.type === 'project' ? form.linked_entity : '',
      linked_property_id: form.type === 'property' ? form.linked_entity : '',
      linked_department_id: form.type === 'department' ? form.linked_entity : '',
      status: form.status,
    };
    if (editId) {
      costCenterStore.update(editId, data);
    } else {
      costCenterStore.create(data);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  const getLinkedEntityLabel = (cc: any): string => {
    if (cc.linked_project_id) return `مشروع: ${cc.linked_project_id}`;
    if (cc.linked_property_id) return `عقار: ${cc.linked_property_id}`;
    if (cc.linked_department_id) return `قسم: ${cc.linked_department_id}`;
    return '-';
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="مراكز التكلفة" value={centers.length} subtitle={`${filtered.length} مركز`} icon={Building2} moduleOverride="finance" />
        <KpiCard title="نشطة" value={activeCenters} subtitle="مراكز عاملة" icon={TrendingUp} moduleOverride="finance" />
        <KpiCard title="مشاريع" value={projectCenters} subtitle="مراكز مشاريع" icon={CreditCard} moduleOverride="finance" />
        <KpiCard title="عقارات" value={propertyCenters} subtitle="مراكز عقارية" icon={Building2} moduleOverride="finance" />
      </div>

      <PageHeader
        title="مراكز التكلفة"
        description={`إدارة مراكز التكلفة (${centers.length} مركز)`}
        createLabel="إضافة مركز تكلفة"
        onCreate={openCreate}
      />
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث باسم المركز أو الكود..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(typeLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>كود المركز</TableHead>
                  <TableHead>الاسم</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>الكيان المرتبط</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      لا توجد مراكز تكلفة
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((cc: any) => (
                  <TableRow key={cc.id}>
                    <TableCell className="font-medium">{cc.cost_center_code}</TableCell>
                    <TableCell>{cc.cost_center_name}</TableCell>
                    <TableCell>{typeLabels[cc.type] || cc.type}</TableCell>
                    <TableCell className="text-sm">{getLinkedEntityLabel(cc)}</TableCell>
                    <TableCell>
                      <StatusBadge status={cc.status} label={statusLabels[cc.status] || cc.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => openEdit(cc)}>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              costCenterStore.remove(cc.id);
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
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل مركز تكلفة' : 'إضافة مركز تكلفة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">كود المركز *</label>
              <Input
                value={form.cost_center_code}
                onChange={e => setForm(f => ({ ...f, cost_center_code: e.target.value }))}
                placeholder="مثال: CC-PRJ-005"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">اسم المركز *</label>
              <Input
                value={form.cost_center_name}
                onChange={e => setForm(f => ({ ...f, cost_center_name: e.target.value }))}
                placeholder="اسم مركز التكلفة"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">النوع</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الكيان المرتبط</label>
              <Input
                value={form.linked_entity}
                onChange={e => setForm(f => ({ ...f, linked_entity: e.target.value }))}
                placeholder={form.type === 'project' ? 'مثال: prj-1' : form.type === 'property' ? 'مثال: prop-1' : 'معرف القسم'}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
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
    </div>
  );
}
