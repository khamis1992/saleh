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
import { Search, Filter, MoreHorizontal, Pencil, Trash2, ClipboardCheck, Star } from 'lucide-react';
import { createStore } from '@/services/dataService';
import { unitStore, getUnitNumber } from '@/services/stores';

// ============================================================
// TYPES & SEED DATA
// ============================================================
export interface Inspection {
  id: string;
  company_id: string;
  inspection_number: string;
  unit_id: string;
  inspection_type: 'move_in' | 'move_out' | 'routine' | 'emergency';
  inspection_date: string;
  inspector_name: string;
  condition_rating: number; // 1-5
  findings: string;
  recommendations: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export const seedInspections: Inspection[] = [
  { id: 'insp-1', company_id: '', inspection_number: 'INS-2026-001', unit_id: 'unt-1', inspection_type: 'move_in', inspection_date: '2026-02-10', inspector_name: 'أحمد الشمري', condition_rating: 4, findings: 'الوحدة بحالة جيدة - بعض الخدوش البسيطة في الجدران', recommendations: 'إعادة طلاء الجدران', status: 'completed' },
  { id: 'insp-2', company_id: '', inspection_number: 'INS-2026-002', unit_id: 'unt-2', inspection_type: 'routine', inspection_date: '2026-04-15', inspector_name: 'فهد القحطاني', condition_rating: 5, findings: 'جميع المرافق تعمل بكفاءة', recommendations: 'لا توجد', status: 'completed' },
  { id: 'insp-3', company_id: '', inspection_number: 'INS-2026-003', unit_id: 'unt-3', inspection_type: 'emergency', inspection_date: '2026-05-01', inspector_name: 'محمد العمري', condition_rating: 2, findings: 'تسرب مياه في الحمام الرئيسي - تلف في السقف', recommendations: 'إصلاح عاجل للسباكة والسقف', status: 'in_progress' },
  { id: 'insp-4', company_id: '', inspection_number: 'INS-2026-004', unit_id: 'unt-4', inspection_type: 'move_out', inspection_date: '2026-06-20', inspector_name: 'أحمد الشمري', condition_rating: 3, findings: 'تلف في الأرضيات - باب المدخل بحاجة لصيانة', recommendations: 'استبدال الأرضيات وإصلاح الباب', status: 'scheduled' },
  { id: 'insp-5', company_id: '', inspection_number: 'INS-2026-005', unit_id: 'unt-5', inspection_type: 'routine', inspection_date: '2026-07-10', inspector_name: 'فهد القحطاني', condition_rating: 4, findings: 'المكيفات بحاجة لصيانة دورية', recommendations: 'جدولة صيانة المكيفات', status: 'scheduled' },
  { id: 'insp-6', company_id: '', inspection_number: 'INS-2026-006', unit_id: 'unt-1', inspection_type: 'emergency', inspection_date: '2026-03-05', inspector_name: 'محمد العمري', condition_rating: 1, findings: 'انقطاع كامل للكهرباء - تلف في اللوحة الرئيسية', recommendations: 'استبدال اللوحة الكهربائية بالكامل', status: 'completed' },
];

// In-memory store
const inspectionStore = createStore<Inspection>({ key: 'erp_inspections', seed: seedInspections });

const typeLabels: Record<string, string> = {
  move_in: 'دخول',
  move_out: 'خروج',
  routine: 'دورية',
  emergency: 'طارئة',
};

const typeIcons: Record<string, string> = {
  move_in: '✅',
  move_out: '🚪',
  routine: '🔍',
  emergency: '🚨',
};

const statusLabels: Record<string, string> = {
  scheduled: 'مجدولة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  cancelled: 'ملغاة',
};

const emptyForm = {
  inspection_number: '',
  unit_id: '',
  inspection_type: 'routine' as string,
  inspection_date: '',
  inspector_name: '',
  condition_rating: 3,
  findings: '',
  recommendations: '',
  status: 'scheduled' as string,
};

export default function InspectionsPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const inspections = useMemo(() => inspectionStore.getAll(), [refresh]);
  const units = useMemo(() => unitStore.getAll(), [refresh]);

  const filtered = inspections.filter((i: Inspection) => {
    if (typeFilter !== 'all' && i.inspection_type !== typeFilter) return false;
    if (statusFilter !== 'all' && i.status !== statusFilter) return false;
    if (search) {
      const un = getUnitNumber(i.unit_id);
      if (!i.inspection_number.includes(search) && !i.inspector_name.includes(search) && !un.includes(search)) return false;
    }
    return true;
  });

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm, inspection_number: `INS-${new Date().getFullYear()}-${String(Date.now() % 1000).padStart(3, '0')}` });
    setModalOpen(true);
  };

  const openEdit = (i: Inspection) => {
    setEditId(i.id);
    setForm({
      inspection_number: i.inspection_number,
      unit_id: i.unit_id,
      inspection_type: i.inspection_type,
      inspection_date: i.inspection_date,
      inspector_name: i.inspector_name,
      condition_rating: i.condition_rating,
      findings: i.findings,
      recommendations: i.recommendations,
      status: i.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.inspection_number || !form.unit_id) return;
    const data: any = {
      company_id: '',
      inspection_number: form.inspection_number,
      unit_id: form.unit_id,
      inspection_type: form.inspection_type,
      inspection_date: form.inspection_date,
      inspector_name: form.inspector_name,
      condition_rating: Number(form.condition_rating),
      findings: form.findings,
      recommendations: form.recommendations,
      status: form.status,
    };
    if (editId) {
      inspectionStore.update(editId, data);
    } else {
      inspectionStore.create(data);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  const renderStars = (rating: number) => {
    return '⭐'.repeat(Math.min(rating, 5)) + '☆'.repeat(Math.max(0, 5 - rating));
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      <PageHeader
        title="سجل المعاينات"
        description={`سجل معاينات الوحدات (${inspections.length} معاينة)`}
        createLabel="تسجيل معاينة"
        onCreate={openCreate}
      />
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برقم المعاينة أو المفتش..."
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
                <SelectItem value="move_in">دخول</SelectItem>
                <SelectItem value="move_out">خروج</SelectItem>
                <SelectItem value="routine">دورية</SelectItem>
                <SelectItem value="emergency">طارئة</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="scheduled">مجدولة</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم المعاينة</TableHead>
                  <TableHead>الوحدة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead>المفتش</TableHead>
                  <TableHead>تقييم الحالة</TableHead>
                  <TableHead>الملاحظات</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      لا توجد معاينات
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((i: Inspection) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium font-mono text-sm">{i.inspection_number}</TableCell>
                    <TableCell>{getUnitNumber(i.unit_id) || i.unit_id}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{typeIcons[i.inspection_type]} {typeLabels[i.inspection_type] || i.inspection_type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{i.inspection_date}</TableCell>
                    <TableCell>{i.inspector_name}</TableCell>
                    <TableCell>
                      <span className="text-sm" title={`${i.condition_rating}/5`}>{renderStars(i.condition_rating)}</span>
                    </TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{i.findings}</TableCell>
                    <TableCell>
                      <StatusBadge status={i.status} label={statusLabels[i.status] || i.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => openEdit(i)}>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              inspectionStore.remove(i.id);
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
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل معاينة' : 'تسجيل معاينة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">رقم المعاينة *</label>
                <Input value={form.inspection_number} onChange={e => setForm(f => ({ ...f, inspection_number: e.target.value }))} placeholder="INS-2026-001" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الوحدة *</label>
                <Select value={form.unit_id} onValueChange={v => setForm(f => ({ ...f, unit_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="اختر الوحدة" /></SelectTrigger>
                  <SelectContent>
                    {units.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.unit_number} ({u.unit_code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">نوع المعاينة</label>
                <Select value={form.inspection_type} onValueChange={v => setForm(f => ({ ...f, inspection_type: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="move_in">دخول</SelectItem>
                    <SelectItem value="move_out">خروج</SelectItem>
                    <SelectItem value="routine">دورية</SelectItem>
                    <SelectItem value="emergency">طارئة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">تاريخ المعاينة</label>
                <Input type="date" value={form.inspection_date} onChange={e => setForm(f => ({ ...f, inspection_date: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">اسم المفتش</label>
              <Input value={form.inspector_name} onChange={e => setForm(f => ({ ...f, inspector_name: e.target.value }))} placeholder="اسم المفتش" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">تقييم الحالة (1-5)</label>
              <div className="flex items-center gap-2">
                <Input
                  type="range"
                  min="1"
                  max="5"
                  value={form.condition_rating}
                  onChange={e => setForm(f => ({ ...f, condition_rating: Number(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-lg font-bold w-12 text-center">{form.condition_rating}/5</span>
                <span className="text-sm">{renderStars(form.condition_rating)}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الملاحظات</label>
              <Textarea value={form.findings} onChange={e => setForm(f => ({ ...f, findings: e.target.value }))} placeholder="نتائج المعاينة والملاحظات..." rows={3} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">التوصيات</label>
              <Textarea value={form.recommendations} onChange={e => setForm(f => ({ ...f, recommendations: e.target.value }))} placeholder="التوصيات والإجراءات المطلوبة..." rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">مجدولة</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="completed">مكتملة</SelectItem>
                  <SelectItem value="cancelled">ملغاة</SelectItem>
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
