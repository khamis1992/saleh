import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ArrowRight, Clock, Wrench, User, Camera, ClipboardCheck } from 'lucide-react';
import { maintenanceStore, unitStore, tenantStore, workOrderStore } from '@/services/stores';
import { MaintenanceRequest, WorkOrder } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WorkflowTimeline } from '@/components/shared/WorkflowTimeline';
import { NextBestAction } from '@/components/shared/NextBestAction';

export default function MaintenanceRequestDetailPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [showWOModal, setShowWOModal] = useState(false);
  const [woForm, setWoForm] = useState({
    technician_id: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    labor_cost: 0,
    material_cost: 0,
    vendor_cost: 0,
    diagnosis: '',
    notes: '',
  });

  useEffect(() => {
    if (id) {
      const found = maintenanceStore.getById(id);
      setRequest(found || null);
    }
  }, [id]);

  if (!request) {
    return (
      <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate('/maintenance/requests')}>
            <ArrowRight className="h-4 w-4 ml-2" />{t.common.back}
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-16 text-gray-500">طلب الصيانة غير موجود</CardContent>
        </Card>
      </div>
    );
  }

  const unit = unitStore.getById(request.unit_id);
  const tenant = tenantStore.getById(request.tenant_id);

  const categoryLabel = (t.maintenance.categories as any)?.[request.category] || request.category;
  const priorityLabel = (t.maintenance.priorities as any)?.[request.priority] || request.priority;
  const statusLabel = (t.maintenance.statuses as any)?.[request.status] || request.status;

  const handleCreateWorkOrder = () => {
    // Generate work order number
    const allWO = workOrderStore.getAll();
    const maxNum = allWO.reduce((max, wo) => {
      const m = wo.work_order_number?.match(/WO-(\d+)-(\d+)/);
      if (m) { const n = parseInt(m[2]); return n > max ? n : max; }
      return max;
    }, 0);
    const newNum = String(maxNum + 1).padStart(3, '0');
    const year = new Date().getFullYear();

    const total = (woForm.labor_cost || 0) + (woForm.material_cost || 0) + (woForm.vendor_cost || 0);

    workOrderStore.create({
      company_id: '',
      work_order_number: `WO-${year}-${newNum}`,
      maintenance_request_id: request.id,
      technician_id: woForm.technician_id,
      scheduled_date: woForm.scheduled_date,
      start_time: woForm.start_time,
      end_time: woForm.end_time,
      labor_cost: woForm.labor_cost,
      material_cost: woForm.material_cost,
      vendor_cost: woForm.vendor_cost,
      total_cost: total,
      diagnosis: woForm.diagnosis,
      work_done: '',
      materials_used: '',
      status: 'assigned',
      technician_notes: '',
      tenant_signature_url: '',
      notes: woForm.notes,
    });

    // Update maintenance request status to 'assigned'
    maintenanceStore.update(request.id, { status: 'assigned' });
    setRequest({ ...request, status: 'assigned' });

    toast.success(`تم إنشاء أمر العمل WO-${year}-${newNum} بنجاح`);
    setShowWOModal(false);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/maintenance/requests')}>
          <ArrowRight className="h-4 w-4 ml-2" />{t.common.back}
        </Button>
        <div className="flex-1"><h1 className="text-xl font-bold text-gray-900">{request.request_number}</h1></div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowWOModal(true)}
          >
            <Wrench className="h-4 w-4" />
            إنشاء أمر عمل
          </Button>
          <Button
            className="bg-[#3B82F6] hover:bg-blue-600"
            onClick={() => navigate(`/maintenance/requests/${request.id}/edit`)}
          >
            تحديث الحالة
          </Button>
        </div>
      </div>

      {/* Workflow timeline */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">دورة حياة طلب الصيانة</p>
        <WorkflowTimeline
          steps={(() => {
            const status = request.status;
            const isClosed = status === 'closed' || status === 'cancelled';
            const isCompleted = status === 'completed' || status === 'tenant_confirmed' || isClosed;
            const isInProgress = status === 'in_progress' || status === 'assigned';
            const order = [
              { key: 'submitted', label: 'مقدم' },
              { key: 'reviewed', label: 'قيد المراجعة' },
              { key: 'assigned', label: 'معين' },
              { key: 'in_progress', label: 'قيد التنفيذ' },
              { key: 'completed', label: 'مكتمل' },
              { key: 'closed', label: 'مغلق' },
            ];
            return order.map((o, i) => {
              let st: 'completed' | 'current' | 'pending' | 'rejected' = 'pending';
              if (isClosed && o.key === 'closed') st = 'completed';
              else if (isCompleted && o.key === 'completed') st = 'completed';
              else if (isCompleted && i < 4) st = 'completed';
              else if (isInProgress && o.key === 'in_progress') st = 'current';
              else if (isInProgress && i < 3) st = 'completed';
              else if (status === 'submitted' && o.key === 'submitted') st = 'current';
              else if (status === 'submitted' && o.key === 'reviewed') st = 'pending';
              else if (status === 'under_review' && (o.key === 'submitted' || o.key === 'reviewed')) st = 'completed';
              else if (status === 'under_review' && o.key === 'reviewed') st = 'current';
              else if (status === 'rejected') st = 'rejected';
              return { ...o, status: st };
            });
          })()}
        />
      </div>

      {/* Next best action */}
      {request.status === 'submitted' && (
        <NextBestAction
          title="الطلب بانتظار المراجعة"
          description="راجع الطلب ووافق عليه أو اعين فني."
          actionLabel="إنشاء أمر عمل"
          actionTo="#"
          variant="info"
          className="mb-4"
        />
      )}
      {request.status === 'in_progress' && (
        <NextBestAction
          title="العمل جارٍ على الطلب"
          description="بعد الانتهاء، استخدم معالج الإغلاق لتأكيد العمل وتسجيل التكلفة."
          actionLabel="إغلاق الطلب (معالج)"
          actionTo="/wizards/maintenance"
          variant="success"
          className="mb-4"
        />
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-2">إجراءات سريعة:</span>
        <Button variant="outline" size="sm" onClick={() => setShowWOModal(true)} className="h-8 text-xs gap-1">
          <Wrench className="h-3.5 w-3.5" /> تعيين فني
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/wizards/maintenance')} className="h-8 text-xs gap-1">
          <ClipboardCheck className="h-3.5 w-3.5" /> إغلاق
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>تفاصيل طلب الصيانة</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">رقم الطلب: </span>{request.request_number}</div>
              <div><span className="text-muted-foreground">الأولوية: </span><StatusBadge status={request.priority} label={priorityLabel} /></div>
              <div><span className="text-muted-foreground">الوحدة: </span>{unit?.unit_number || '—'} — {unit?.unit_type || ''}</div>
              <div><span className="text-muted-foreground">المستأجر: </span>{tenant?.full_name || tenant?.company_name || '—'}</div>
              <div><span className="text-muted-foreground">الفئة: </span>{categoryLabel}</div>
              <div><span className="text-muted-foreground">الحالة: </span><StatusBadge status={request.status} label={statusLabel} /></div>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">الوصف</h4>
              <p className="text-sm text-muted-foreground">{request.description}</p>
            </div>
            {request.preferred_visit_time && (
              <div className="flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> الوقت المفضل: {request.preferred_visit_time}</div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>الإجراءات</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200"
              onClick={() => setShowWOModal(true)}
            >
              <Wrench className="h-4 w-4" />
              إنشاء أمر عمل
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate(`/maintenance/requests/${request.id}/edit`)}>
              تحديث الحالة
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/maintenance/work-orders')}>
              عرض أوامر العمل
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Create Work Order Dialog */}
      <Dialog open={showWOModal} onOpenChange={setShowWOModal}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>إنشاء أمر عمل جديد</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>طلب الصيانة</Label>
              <Input value={request.request_number} disabled />
            </div>
            <div>
              <Label>اسم الفني *</Label>
              <Input
                value={woForm.technician_id}
                onChange={(e) => setWoForm({ ...woForm, technician_id: e.target.value })}
                placeholder="اسم الفني"
              />
            </div>
            <div>
              <Label>التاريخ المقرر</Label>
              <Input
                type="date"
                value={woForm.scheduled_date}
                onChange={(e) => setWoForm({ ...woForm, scheduled_date: e.target.value })}
              />
            </div>
            <div>
              <Label>الحالة</Label>
              <Input value="معين للفني" disabled />
            </div>
            <div>
              <Label>وقت البدء</Label>
              <Input
                type="time"
                value={woForm.start_time}
                onChange={(e) => setWoForm({ ...woForm, start_time: e.target.value })}
              />
            </div>
            <div>
              <Label>وقت الانتهاء</Label>
              <Input
                type="time"
                value={woForm.end_time}
                onChange={(e) => setWoForm({ ...woForm, end_time: e.target.value })}
              />
            </div>
            <div>
              <Label>تكلفة العمالة</Label>
              <Input
                type="number"
                value={woForm.labor_cost}
                onChange={(e) => setWoForm({ ...woForm, labor_cost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>تكلفة المواد</Label>
              <Input
                type="number"
                value={woForm.material_cost}
                onChange={(e) => setWoForm({ ...woForm, material_cost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>تكلفة مقاول خارجي</Label>
              <Input
                type="number"
                value={woForm.vendor_cost}
                onChange={(e) => setWoForm({ ...woForm, vendor_cost: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>الإجمالي</Label>
              <Input
                value={(woForm.labor_cost || 0) + (woForm.material_cost || 0) + (woForm.vendor_cost || 0)}
                disabled
              />
            </div>
            <div className="col-span-2">
              <Label>التشخيص المبدئي</Label>
              <Input
                value={woForm.diagnosis}
                onChange={(e) => setWoForm({ ...woForm, diagnosis: e.target.value })}
                placeholder="وصف المشكلة..."
              />
            </div>
            <div className="col-span-2">
              <Label>ملاحظات</Label>
              <Input
                value={woForm.notes}
                onChange={(e) => setWoForm({ ...woForm, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowWOModal(false)}>{t.common.cancel}</Button>
            <Button
              onClick={handleCreateWorkOrder}
              disabled={!woForm.technician_id}
              className="bg-[#3B82F6] hover:bg-blue-600"
            >
              إنشاء أمر العمل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
