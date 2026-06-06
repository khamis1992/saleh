import { useState, useMemo } from 'react';
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
import { Search, Filter, Play } from 'lucide-react';
import { createStore, generateId } from '@/services/dataService';
import { toast } from 'sonner';

interface PreventiveMaintenance {
  id: string;
  property_id: string;
  unit_id: string;
  asset_name: string;
  category: string;
  frequency: string;
  next_due_date: string;
  assigned_to: string;
  status: string;
  notes: string;
}

const seedPM: PreventiveMaintenance[] = [
  {
    id: 'pm-1', property_id: 'prop-1', unit_id: '',
    asset_name: 'مكيفات عمارة النخيل', category: 'ac', frequency: 'monthly',
    next_due_date: '2026-06-15', assigned_to: 'فني خالد', status: 'scheduled', notes: 'تنظيف وصيانة دورية',
  },
  {
    id: 'pm-2', property_id: 'prop-2', unit_id: '',
    asset_name: 'مصاعد أبراج السلام', category: 'elevator', frequency: 'monthly',
    next_due_date: '2026-06-01', assigned_to: 'شركة المصاعد المتحدة', status: 'in_progress', notes: 'فحص السلامة الشهري',
  },
  {
    id: 'pm-3', property_id: 'prop-1', unit_id: '',
    asset_name: 'نظام إنذار الحريق', category: 'fire_alarm', frequency: 'quarterly',
    next_due_date: '2026-08-30', assigned_to: 'شركة الأمان للسلامة', status: 'scheduled', notes: 'فحص واختبار أجهزة الإنذار',
  },
  {
    id: 'pm-4', property_id: 'prop-3', unit_id: '',
    asset_name: 'مضخات المياه', category: 'water_pumps', frequency: 'monthly',
    next_due_date: '2026-06-10', assigned_to: 'فني أحمد', status: 'scheduled', notes: 'فحص وصيانة مضخات المياه',
  },
  {
    id: 'pm-5', property_id: 'prop-1', unit_id: '',
    asset_name: 'لوحات الكهرباء الرئيسية', category: 'electrical_panels', frequency: 'quarterly',
    next_due_date: '2026-07-20', assigned_to: 'فني سعيد', status: 'scheduled', notes: 'فحص القواطع والتمديدات',
  },
  {
    id: 'pm-6', property_id: 'prop-2', unit_id: '',
    asset_name: 'كاميرات المراقبة', category: 'cctv', frequency: 'monthly',
    next_due_date: '2026-06-05', assigned_to: 'فني محمد', status: 'overdue', notes: 'تنظيف وفحص الكاميرات',
  },
];

const pmStore = createStore<PreventiveMaintenance>({ key: 'erp_pm_schedules', seed: seedPM });

const categoryLabels: Record<string, string> = {
  ac: 'تكييف',
  elevator: 'مصاعد',
  fire_alarm: 'إنذار حريق',
  water_pumps: 'مضخات مياه',
  electrical_panels: 'لوحات كهرباء',
  cctv: 'كاميرات مراقبة',
  pest_control: 'مكافحة حشرات',
  cleaning: 'تنظيف',
  landscaping: 'تنسيق حدائق',
};

const frequencyLabels: Record<string, string> = {
  weekly: 'أسبوعي',
  monthly: 'شهري',
  quarterly: 'ربع سنوي',
  semi_annually: 'نصف سنوي',
  annually: 'سنوي',
};

const pmStatusLabels: Record<string, string> = {
  scheduled: 'مجدولة',
  in_progress: 'قيد التنفيذ',
  completed: 'مكتملة',
  overdue: 'متأخرة',
  cancelled: 'ملغاة',
};

// Frequency to days mapping for reschedule after completion
const frequencyDays: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  semi_annually: 180,
  annually: 365,
};

function getPropertyName(id: string): string {
  try {
    const raw = localStorage.getItem('erp_properties');
    if (raw) {
      const items: Record<string, string>[] = JSON.parse(raw);
      const p = items.find((x: Record<string, string>) => x.id === id);
      if (p) return p.property_name || '';
    }
  } catch {}
  return id;
}

export default function PreventiveMaintenancePage() {
  const { t } = useLocale();
  const [schedules, setSchedules] = useState<PreventiveMaintenance[]>(() => pmStore.getAll());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<PreventiveMaintenance>>({
    property_id: '', unit_id: '', asset_name: '', category: 'ac', frequency: 'monthly',
    next_due_date: '', assigned_to: '', status: 'scheduled', notes: '',
  });

  const refresh = () => setSchedules(pmStore.getAll());

  const filtered = useMemo(() => {
    return schedules.filter((s) => {
      if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search && !s.asset_name.includes(search) && !getPropertyName(s.property_id).includes(search)) return false;
      return true;
    });
  }, [schedules, search, categoryFilter, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      property_id: '', unit_id: '', asset_name: '', category: 'ac', frequency: 'monthly',
      next_due_date: '', assigned_to: '', status: 'scheduled', notes: '',
    });
    setShowModal(true);
  };

  const openEdit = (s: PreventiveMaintenance) => {
    setEditingId(s.id);
    setForm({ ...s });
    setShowModal(true);
  };

  const save = () => {
    if (!form.asset_name || !form.property_id) return;
    if (editingId) {
      pmStore.update(editingId, form);
    } else {
      pmStore.create(form as Omit<PreventiveMaintenance, 'id'>);
    }
    refresh();
    setShowModal(false);
  };

  const deleteItem = (id: string) => {
    if (confirm('هل أنت متأكد من حذف جدول الصيانة هذا؟')) {
      pmStore.remove(id);
      refresh();
    }
  };

  // Generate work orders for due PM schedules
  const generateWorkOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    const rawWO = localStorage.getItem('erp_work_orders');
    const existingWOs: Record<string, any>[] = rawWO ? JSON.parse(rawWO) : [];

    const allSchedules = pmStore.getAll();
    const dueSchedules = allSchedules.filter(
      s => s.next_due_date <= today && s.status === 'scheduled'
    );

    if (dueSchedules.length === 0) {
      toast.info('لا توجد جداول صيانة مستحقة لإنشاء أوامر عمل');
      return;
    }

    let created = 0;
    let woCount = existingWOs.length;

    for (const schedule of dueSchedules) {
      woCount++;
      const wo = {
        id: generateId(),
        company_id: '',
        work_order_number: `WO-2026-${String(woCount).padStart(3, '0')}`,
        maintenance_request_id: '',
        technician_id: schedule.assigned_to || '',
        scheduled_date: today,
        start_time: '',
        end_time: '',
        labor_cost: 0,
        material_cost: 0,
        vendor_cost: 0,
        total_cost: 0,
        diagnosis: '',
        work_done: '',
        materials_used: '',
        status: 'assigned',
        technician_notes: '',
        tenant_signature_url: '',
        notes: `صيانة وقائية: ${schedule.asset_name} - ${categoryLabels[schedule.category] || schedule.category}`,
      };

      existingWOs.push(wo);
      pmStore.update(schedule.id, { status: 'in_progress' } as Partial<PreventiveMaintenance>);
      created++;
    }

    localStorage.setItem('erp_work_orders', JSON.stringify(existingWOs));

    // Auto-reschedule: for any completed work orders, update PM next_due_date
    // (This runs on the next refresh after WO completion — handled on page load)
    rescheduleCompletedPMs();

    refresh();
    toast.success(`تم إنشاء ${created} أمر عمل من جداول الصيانة الوقائية المستحقة`);
  };

  // Reschedule PM schedules after work order completion
  const rescheduleCompletedPMs = () => {
    // Check for work orders that are completed/tenant_confirmed
    // and update their associated PM schedules
    // Since PM->WO link is through notes, we scan for completed WOs
    const allPM = pmStore.getAll();
    const rawWO = localStorage.getItem('erp_work_orders');
    if (!rawWO) return;
    const workOrders: Record<string, any>[] = JSON.parse(rawWO);

    // Find work orders with status 'completed' or 'tenant_confirmed' that reference PM
    const completedWOs = workOrders.filter(
      (wo: any) => (wo.status === 'completed' || wo.status === 'tenant_confirmed' || wo.status === 'closed') && wo.notes
    );

    for (const pm of allPM) {
      if (pm.status !== 'in_progress') continue;

      const relatedWO = completedWOs.find((wo: any) =>
        wo.notes && wo.notes.includes(pm.asset_name)
      );

      if (relatedWO) {
        // Calculate next due date: today + frequency days
        const days = frequencyDays[pm.frequency] || 30;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + days);
        const nextDue = nextDate.toISOString().split('T')[0];

        pmStore.update(pm.id, {
          next_due_date: nextDue,
          status: 'scheduled',
        } as Partial<PreventiveMaintenance>);

        toast.success(`تمت إعادة جدولة ${pm.asset_name} إلى ${nextDue}`);
      }
    }
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      <PageHeader
        title="الصيانة الوقائية"
        description="جدولة ومتابعة الصيانة الوقائية للأصول والمعدات"
        createLabel="جدول جديد"
        onCreate={openCreate}
      />

      {/* Generate Work Orders button */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={generateWorkOrders}
          className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Play className="h-4 w-4" />
          إنشاء أوامر عمل من الجداول المستحقة
        </Button>
      </div>

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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(pmStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الأصل / المعدة</TableHead>
                <TableHead>العقار</TableHead>
                <TableHead>الفئة</TableHead>
                <TableHead>التكرار</TableHead>
                <TableHead>التاريخ القادم</TableHead>
                <TableHead>المسؤول</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    لا توجد جداول صيانة
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.asset_name}</TableCell>
                  <TableCell>{getPropertyName(s.property_id)}</TableCell>
                  <TableCell>{categoryLabels[s.category] || s.category}</TableCell>
                  <TableCell>{frequencyLabels[s.frequency] || s.frequency}</TableCell>
                  <TableCell>{s.next_due_date}</TableCell>
                  <TableCell>{s.assigned_to}</TableCell>
                  <TableCell>
                    <StatusBadge status={s.status} label={pmStatusLabels[s.status] || s.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <span className="text-xs">✎</span>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => deleteItem(s.id)}>
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
            <DialogTitle>{editingId ? 'تعديل جدول الصيانة' : 'جدول صيانة وقائية جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>العقار *</Label>
              <Input value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })} placeholder="prop-..." />
            </div>
            <div>
              <Label>الوحدة</Label>
              <Input value={form.unit_id} onChange={(e) => setForm({ ...form, unit_id: e.target.value })} placeholder="unit-..." />
            </div>
            <div className="col-span-2">
              <Label>الأصل / المعدة *</Label>
              <Input value={form.asset_name} onChange={(e) => setForm({ ...form, asset_name: e.target.value })} />
            </div>
            <div>
              <Label>الفئة</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>التكرار</Label>
              <Select value={form.frequency} onValueChange={(v) => setForm({ ...form, frequency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(frequencyLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>التاريخ القادم</Label>
              <Input type="date" value={form.next_due_date} onChange={(e) => setForm({ ...form, next_due_date: e.target.value })} />
            </div>
            <div>
              <Label>المسؤول</Label>
              <Input value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(pmStatusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
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
