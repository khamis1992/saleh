import { useState, useMemo } from 'react';
import { formatQAR, formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Filter } from 'lucide-react';
import { createStore } from '@/services/dataService';
import { generateJournalEntry } from '@/utils/exportUtils';

interface WorkOrder {
  id: string;
  work_order_number: string;
  maintenance_request_id: string;
  technician_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  labor_cost: number;
  material_cost: number;
  vendor_cost: number;
  total_cost: number;
  diagnosis: string;
  work_done: string;
  materials_used: string;
  status: string;
  notes: string;
}

const seedWorkOrders: WorkOrder[] = [
  {
    id: 'wo-1', work_order_number: 'WO-2026-001', maintenance_request_id: 'mnt-1',
    technician_id: 'فني أحمد', scheduled_date: '2026-03-10', start_time: '09:00', end_time: '12:00',
    labor_cost: 500, material_cost: 1200, vendor_cost: 0, total_cost: 1700,
    diagnosis: 'تلف في صمام المياه الرئيسي', work_done: 'تم استبدال الصمام وإصلاح التسرب',
    materials_used: 'صمام مياه 2 بوصة، شريط تفلون، وصلات نحاس', status: 'completed', notes: '',
  },
  {
    id: 'wo-2', work_order_number: 'WO-2026-002', maintenance_request_id: 'mnt-2',
    technician_id: 'فني خالد', scheduled_date: '2026-04-05', start_time: '14:00', end_time: '16:00',
    labor_cost: 350, material_cost: 0, vendor_cost: 850, total_cost: 1200,
    diagnosis: 'نقص غاز الفريون في وحدة التكييف', work_done: 'تم تعبئة غاز الفريون وصيانة الوحدة الخارجية',
    materials_used: 'غاز فريون R410، فلتر هواء', status: 'completed', notes: '',
  },
  {
    id: 'wo-3', work_order_number: 'WO-2026-003', maintenance_request_id: 'mnt-3',
    technician_id: 'فني سعيد', scheduled_date: '2026-05-20', start_time: '08:00', end_time: '',
    labor_cost: 800, material_cost: 2500, vendor_cost: 0, total_cost: 3300,
    diagnosis: 'تماس كهربائي في اللوحة الرئيسية', work_done: 'جاري العمل على إصلاح اللوحة الكهربائية',
    materials_used: 'قاطع كهرباء 60 أمبير، أسلاك 10مم', status: 'in_progress', notes: 'بانتظار توصيل القاطع الكهربائي',
  },
  {
    id: 'wo-4', work_order_number: 'WO-2026-004', maintenance_request_id: 'mnt-4',
    technician_id: 'فني محمد', scheduled_date: '2026-02-15', start_time: '09:00', end_time: '11:00',
    labor_cost: 300, material_cost: 200, vendor_cost: 0, total_cost: 500,
    diagnosis: 'صيانة دورية روتينية', work_done: 'تم فحص جميع المرافق وإصلاح حنفية المطبخ',
    materials_used: 'حشية حنفية، شريط تفلون', status: 'tenant_confirmed', notes: 'تم تأكيد الاستلام من المستأجر',
  },
  {
    id: 'wo-5', work_order_number: 'WO-2026-005', maintenance_request_id: 'mnt-1',
    technician_id: 'فني عبدالله', scheduled_date: '2026-06-01', start_time: '', end_time: '',
    labor_cost: 400, material_cost: 0, vendor_cost: 0, total_cost: 400,
    diagnosis: '', work_done: '', materials_used: '', status: 'assigned', notes: 'طلب متابعة تسرب آخر',
  },
  {
    id: 'wo-6', work_order_number: 'WO-2026-006', maintenance_request_id: 'mnt-2',
    technician_id: 'فني خالد', scheduled_date: '2026-03-25', start_time: '10:00', end_time: '11:30',
    labor_cost: 250, material_cost: 450, vendor_cost: 0, total_cost: 700,
    diagnosis: 'فلتر المكيف متسخ', work_done: 'تم تنظيف الفلاتر وتنظيف الوحدة الداخلية',
    materials_used: 'سائل تنظيف، فلتر بديل', status: 'closed', notes: '',
  },
];

const workOrderStore = createStore<WorkOrder>({ key: 'erp_work_orders', seed: seedWorkOrders });

const woStatusLabels: Record<string, string> = {
  assigned: 'معين للفني',
  in_progress: 'قيد التنفيذ',
  waiting_parts: 'بانتظار قطع',
  completed: 'مكتمل',
  tenant_confirmed: 'مؤكد من المستأجر',
  closed: 'مغلق',
  cancelled: 'ملغي',
};

function getRequestNumber(id: string): string {
  try {
    const raw = localStorage.getItem('erp_maintenance');
    if (raw) {
      const items: Record<string, string>[] = JSON.parse(raw);
      const r = items.find((x: Record<string, string>) => x.id === id);
      if (r) return r.request_number || '';
    }
  } catch {}
  return id;
}

export default function WorkOrdersPage() {
  const { t } = useLocale();
  const [orders, setOrders] = useState<WorkOrder[]>(() => workOrderStore.getAll());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<WorkOrder>>({
    work_order_number: '', maintenance_request_id: '', technician_id: '',
    scheduled_date: '', start_time: '', end_time: '',
    labor_cost: 0, material_cost: 0, vendor_cost: 0, total_cost: 0,
    diagnosis: '', work_done: '', materials_used: '', status: 'assigned', notes: '',
  });

  const refresh = () => setOrders(workOrderStore.getAll());

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search && !o.work_order_number.includes(search) && !o.technician_id.includes(search)) return false;
      return true;
    });
  }, [orders, search, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    const count = orders.length + 1;
    setForm({
      work_order_number: `WO-2026-${String(count).padStart(3, '0')}`,
      maintenance_request_id: '', technician_id: '',
      scheduled_date: new Date().toISOString().split('T')[0], start_time: '', end_time: '',
      labor_cost: 0, material_cost: 0, vendor_cost: 0, total_cost: 0,
      diagnosis: '', work_done: '', materials_used: '', status: 'assigned', notes: '',
    });
    setShowModal(true);
  };

  const openEdit = (o: WorkOrder) => {
    setEditingId(o.id);
    setForm({ ...o });
    setShowModal(true);
  };

  const recalcTotal = (labor: number, material: number, vendor: number) => {
    return labor + material + vendor;
  };

  const save = () => {
    if (!form.work_order_number || !form.maintenance_request_id) return;
    const total = recalcTotal(form.labor_cost || 0, form.material_cost || 0, form.vendor_cost || 0);
    const previousStatus = editingId ? workOrderStore.getById(editingId)?.status : null;
    if (editingId) {
      workOrderStore.update(editingId, { ...form, total_cost: total });
    } else {
      workOrderStore.create({ ...form, total_cost: total } as Omit<WorkOrder, 'id'>);
    }
    // Generate JE when status changes to 'completed'
    if (form.status === 'completed' && previousStatus !== 'completed') {
      const jeAmount = total || (form.labor_cost || 0) + (form.material_cost || 0) + (form.vendor_cost || 0);
      if (jeAmount > 0) {
        generateJournalEntry(
          `صيانة — أمر عمل ${form.work_order_number}`,
          'صيانة',
          editingId || '',
          [
            { account_id: 'acc-15', debit: jeAmount, credit: 0, description: 'مصروفات صيانة' },
            { account_id: 'acc-1', debit: 0, credit: jeAmount, description: 'دفع نقدي / بنك' },
          ],
        );
      }
    }
    refresh();
    setShowModal(false);
  };

  const deleteOrder = (id: string) => {
    if (confirm('هل أنت متأكد من حذف أمر العمل هذا؟')) {
      workOrderStore.remove(id);
      refresh();
    }
  };

  const fmt = (v: number) => formatQAR(v);

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      <PageHeader
        title="أوامر العمل"
        description="إدارة أوامر العمل والصيانة للفنيين"
        createLabel="أمر عمل جديد"
        onCreate={openCreate}
      />

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.common.search + '...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(woStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="text-[11px] font-bold text-[#64748B]">رقم أمر العمل</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">طلب الصيانة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الفني</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">التاريخ المقرر</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">تكلفة العمالة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">تكلفة المواد</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الإجمالي</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الحالة</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    لا توجد أوامر عمل
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((o) => (
                <TableRow key={o.id} className="hover:bg-gray-50">
                  <TableCell className="font-mono font-medium">{o.work_order_number}</TableCell>
                  <TableCell className="font-mono">{getRequestNumber(o.maintenance_request_id)}</TableCell>
                  <TableCell>{o.technician_id}</TableCell>
                  <TableCell>{o.scheduled_date}</TableCell>
                  <TableCell className="font-mono">{fmt(o.labor_cost)}</TableCell>
                  <TableCell className="font-mono">{fmt(o.material_cost)}</TableCell>
                  <TableCell className="font-mono font-semibold">{fmt(o.total_cost)}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} label={woStatusLabels[o.status] || o.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}>
                        <span className="text-xs">✎</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteOrder(o.id)}>
                        <span className="text-xs">✕</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل أمر عمل' : 'أمر عمل جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>رقم أمر العمل</Label>
              <Input value={form.work_order_number} onChange={(e) => setForm({ ...form, work_order_number: e.target.value })} />
            </div>
            <div>
              <Label>طلب الصيانة *</Label>
              <Input value={form.maintenance_request_id} onChange={(e) => setForm({ ...form, maintenance_request_id: e.target.value })} placeholder="mnt-..." />
            </div>
            <div>
              <Label>الفني</Label>
              <Input value={form.technician_id} onChange={(e) => setForm({ ...form, technician_id: e.target.value })} placeholder="اسم الفني" />
            </div>
            <div>
              <Label>التاريخ المقرر</Label>
              <Input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} />
            </div>
            <div>
              <Label>وقت البدء</Label>
              <Input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>
            <div>
              <Label>وقت الانتهاء</Label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
            </div>
            <div>
              <Label>تكلفة العمالة</Label>
              <Input type="number" value={form.labor_cost} onChange={(e) => setForm({ ...form, labor_cost: Number(e.target.value) })} />
            </div>
            <div>
              <Label>تكلفة المواد</Label>
              <Input type="number" value={form.material_cost} onChange={(e) => setForm({ ...form, material_cost: Number(e.target.value) })} />
            </div>
            <div>
              <Label>تكلفة المقاول الخارجي</Label>
              <Input type="number" value={form.vendor_cost} onChange={(e) => setForm({ ...form, vendor_cost: Number(e.target.value) })} />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(woStatusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>التشخيص</Label>
              <Textarea value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} rows={2} />
            </div>
            <div className="col-span-2">
              <Label>الأعمال المنفذة</Label>
              <Textarea value={form.work_done} onChange={(e) => setForm({ ...form, work_done: e.target.value })} rows={2} />
            </div>
            <div className="col-span-2">
              <Label>المواد المستخدمة</Label>
              <Textarea value={form.materials_used} onChange={(e) => setForm({ ...form, materials_used: e.target.value })} rows={2} />
            </div>
            <div className="col-span-2">
              <Label>ملاحظات</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button onClick={save}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
