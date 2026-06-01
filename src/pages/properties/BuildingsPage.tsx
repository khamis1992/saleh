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
import { Search, Filter, MoreHorizontal, Pencil, Trash2, ChevronDown, ChevronLeft } from 'lucide-react';
import { buildingStore, getPropertyName } from '@/services/stores';

export default function BuildingsPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    property_id: '',
    building_code: '',
    building_name: '',
    number_of_floors: 1,
    number_of_units: 0,
    parking_spaces: 0,
    elevator_count: 0,
    completion_date: '',
    status: 'ready',
  });

  const buildings = useMemo(() => buildingStore.getAll(), [refresh]);

  const filtered = buildings.filter((b: any) => {
    if (search && !b.building_name.includes(search) && !b.building_code.includes(search)) return false;
    return true;
  });

  const openCreate = () => {
    setEditId(null);
    setForm({
      property_id: '',
      building_code: '',
      building_name: '',
      number_of_floors: 1,
      number_of_units: 0,
      parking_spaces: 0,
      elevator_count: 0,
      completion_date: '',
      status: 'ready',
    });
    setModalOpen(true);
  };

  const openEdit = (b: any) => {
    setEditId(b.id);
    setForm({
      property_id: b.property_id || '',
      building_code: b.building_code,
      building_name: b.building_name,
      number_of_floors: b.number_of_floors,
      number_of_units: b.number_of_units,
      parking_spaces: b.parking_spaces,
      elevator_count: b.elevator_count,
      completion_date: b.completion_date || '',
      status: b.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.building_code || !form.building_name) return;
    const data: any = {
      company_id: '',
      property_id: form.property_id,
      building_code: form.building_code,
      building_name: form.building_name,
      number_of_floors: Number(form.number_of_floors),
      number_of_units: Number(form.number_of_units),
      parking_spaces: Number(form.parking_spaces),
      elevator_count: Number(form.elevator_count),
      completion_date: form.completion_date,
      status: form.status,
    };
    if (editId) {
      buildingStore.update(editId, data);
    } else {
      buildingStore.create(data);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  // Generate fake floors for expanded view
  const getFloors = (floorsCount: number) => {
    return Array.from({ length: floorsCount }, (_, i) => ({
      floor_number: `${i + 1}`,
      label: i === 0 ? 'الدور الأرضي' : `الدور ${i === 1 ? 'الأول' : i === 2 ? 'الثاني' : i === 3 ? 'الثالث' : i + 1}`,
      units: Math.ceil(Math.random() * 8),
    }));
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div dir="rtl">
      <PageHeader
        title="المباني"
        description="إدارة المباني داخل العقارات"
        createLabel="إضافة مبنى"
        onCreate={openCreate}
      />
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث باسم أو كود المبنى..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>كود المبنى</TableHead>
                  <TableHead>اسم المبنى</TableHead>
                  <TableHead>العقار</TableHead>
                  <TableHead>عدد الطوابق</TableHead>
                  <TableHead>عدد الوحدات</TableHead>
                  <TableHead>مواقف السيارات</TableHead>
                  <TableHead>عدد المصاعد</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      لا توجد مباني
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((b: any) => (
                  <>
                    <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => toggleExpand(b.id)}>
                      <TableCell>
                        {expandedId === b.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronLeft className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{b.building_code}</TableCell>
                      <TableCell>{b.building_name}</TableCell>
                      <TableCell>{getPropertyName(b.property_id)}</TableCell>
                      <TableCell>{b.number_of_floors}</TableCell>
                      <TableCell>{b.number_of_units}</TableCell>
                      <TableCell>{b.parking_spaces}</TableCell>
                      <TableCell>{b.elevator_count}</TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} label="جاهز" />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(b); }}>
                              <Pencil className="h-4 w-4 ml-2" />
                              تعديل
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                buildingStore.remove(b.id);
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
                    {expandedId === b.id && (
                      <TableRow key={`${b.id}-floors`}>
                        <TableCell colSpan={10} className="p-0">
                          <div className="bg-muted/30 p-4 space-y-2">
                            <h4 className="text-sm font-semibold mb-2">الطوابق ({b.number_of_floors})</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>رقم الطابق</TableHead>
                                  <TableHead>المسمى</TableHead>
                                  <TableHead>عدد الوحدات التقديري</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {getFloors(b.number_of_floors).map((floor, i) => (
                                  <TableRow key={i}>
                                    <TableCell>{floor.floor_number}</TableCell>
                                    <TableCell>{floor.label}</TableCell>
                                    <TableCell>{floor.units}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل مبنى' : 'إضافة مبنى'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">كود المبنى *</label>
              <Input
                value={form.building_code}
                onChange={e => setForm(f => ({ ...f, building_code: e.target.value }))}
                placeholder="مثال: BLD-001"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">اسم المبنى *</label>
              <Input
                value={form.building_name}
                onChange={e => setForm(f => ({ ...f, building_name: e.target.value }))}
                placeholder="اسم المبنى"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">العقار</label>
              <Input
                value={form.property_id}
                onChange={e => setForm(f => ({ ...f, property_id: e.target.value }))}
                placeholder="معرف العقار"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">عدد الطوابق</label>
                <Input
                  type="number"
                  value={form.number_of_floors}
                  onChange={e => setForm(f => ({ ...f, number_of_floors: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">عدد الوحدات</label>
                <Input
                  type="number"
                  value={form.number_of_units}
                  onChange={e => setForm(f => ({ ...f, number_of_units: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">مواقف السيارات</label>
                <Input
                  type="number"
                  value={form.parking_spaces}
                  onChange={e => setForm(f => ({ ...f, parking_spaces: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">عدد المصاعد</label>
                <Input
                  type="number"
                  value={form.elevator_count}
                  onChange={e => setForm(f => ({ ...f, elevator_count: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">تاريخ الإنجاز</label>
              <Input
                type="date"
                value={form.completion_date}
                onChange={e => setForm(f => ({ ...f, completion_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ready">جاهز</SelectItem>
                  <SelectItem value="under_construction">قيد الإنشاء</SelectItem>
                  <SelectItem value="under_maintenance">قيد الصيانة</SelectItem>
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
