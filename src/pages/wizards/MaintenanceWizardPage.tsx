import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Check, Camera, ClipboardCheck } from 'lucide-react';
import { StepperForm, type WizardStep } from '@/components/shared/StepperForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { maintenanceStore } from '@/services/stores';
import { toast } from 'sonner';
import { logAudit } from '@/utils/exportUtils';

export default function MaintenanceWizardPage() {
  const navigate = useNavigate();
  const [requestId, setRequestId] = useState('');
  const [technician, setTechnician] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [workDone, setWorkDone] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [laborCost, setLaborCost] = useState(0);
  const [materialCost, setMaterialCost] = useState(0);
  const [beforePhoto, setBeforePhoto] = useState('');
  const [afterPhoto, setAfterPhoto] = useState('');
  const [tenantConfirmed, setTenantConfirmed] = useState(false);
  const [notes, setNotes] = useState('');

  const openRequests = useMemo(() => maintenanceStore.getAll().filter(r => r.status !== 'closed' && r.status !== 'completed'), []);
  const selected = openRequests.find(r => r.id === requestId);

  const steps: WizardStep[] = [
    {
      key: 'request', title: 'اختيار الطلب',
      render: () => (
        <div className="space-y-4">
          <Label>طلب الصيانة *</Label>
          <Select value={requestId} onValueChange={setRequestId}>
            <SelectTrigger><SelectValue placeholder="اختر طلب" /></SelectTrigger>
            <SelectContent>
              {openRequests.length === 0 && <SelectItem value="__none" disabled>لا توجد طلبات مفتوحة</SelectItem>}
              {openRequests.map(r => <SelectItem key={r.id} value={r.id}>{r.request_number} · {r.description || r.description}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      ),
      validate: () => requestId ? true : 'اختر طلب',
    },
    {
      key: 'technician', title: 'تعيين فني',
      render: () => (
        <div className="space-y-4">
          <Label>الفني المعين *</Label>
          <Input value={technician} onChange={e => setTechnician(e.target.value)} placeholder="فني أحمد" />
        </div>
      ),
      validate: () => technician ? true : 'حدد الفني',
    },
    {
      key: 'diagnosis', title: 'التشخيص',
      render: () => (
        <div>
          <Label>التشخيص *</Label>
          <Textarea value={diagnosis} onChange={e => setDiagnosis(e.target.value)} placeholder="تلف في صمام المياه الرئيسي بسبب التقادم" rows={3} />
        </div>
      ),
      validate: () => diagnosis ? true : 'اكتب التشخيص',
    },
    {
      key: 'work', title: 'العمل المنجز',
      render: () => (
        <div className="space-y-4">
          <div>
            <Label>وصف العمل المنجز *</Label>
            <Textarea value={workDone} onChange={e => setWorkDone(e.target.value)} placeholder="تم استبدال الصمام وإصلاح التسرب واختبار الضغط" rows={3} />
          </div>
          <div>
            <Label>المواد المستخدمة</Label>
            <Textarea value={materialsUsed} onChange={e => setMaterialsUsed(e.target.value)} placeholder="صمام مياه 2 بوصة، شريط تفلون، وصلات نحاس" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>تكلفة العمالة (ر.ق)</Label>
              <Input type="number" value={laborCost} onChange={e => setLaborCost(Number(e.target.value))} />
            </div>
            <div>
              <Label>تكلفة المواد (ر.ق)</Label>
              <Input type="number" value={materialCost} onChange={e => setMaterialCost(Number(e.target.value))} />
            </div>
          </div>
        </div>
      ),
      validate: () => workDone ? true : 'صف العمل المنجز',
    },
    {
      key: 'photos', title: 'الصور', description: 'يمكنك إضافة الصور لاحقاً',
      render: () => (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-6 rounded-lg border-2 border-dashed border-gray-200 text-center">
            <Camera className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium">صورة قبل</p>
            <Input value={beforePhoto} onChange={e => setBeforePhoto(e.target.value)} placeholder="URL الصورة" className="mt-2 text-xs" />
          </div>
          <div className="p-6 rounded-lg border-2 border-dashed border-gray-200 text-center">
            <Camera className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium">صورة بعد</p>
            <Input value={afterPhoto} onChange={e => setAfterPhoto(e.target.value)} placeholder="URL الصورة" className="mt-2 text-xs" />
          </div>
        </div>
      ),
    },
    {
      key: 'tenant', title: 'تأكيد المستأجر',
      render: () => (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="tc" checked={tenantConfirmed} onChange={e => setTenantConfirmed(e.target.checked)} className="rounded" />
            <Label htmlFor="tc" className="cursor-pointer">المستأجر أكد رضاه عن العمل</Label>
          </div>
          <p className="text-xs text-muted-foreground">بدون تأكيد المستأجر لا يمكن إغلاق الطلب نهائياً.</p>
        </div>
      ),
    },
    {
      key: 'review', title: 'إغلاق الطلب',
      render: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">الطلب:</span> <span className="font-mono">{selected?.request_number}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">الفني:</span> <span>{technician}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">التشخيص:</span> <span className="text-xs truncate max-w-[60%]">{diagnosis}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">إجمالي التكلفة:</span> <span className="font-bold">{(laborCost + materialCost).toLocaleString('en-US')} ر.ق</span></div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
            <ClipboardCheck className="h-4 w-4 text-emerald-600 mt-0.5" />
            <p className="text-xs text-emerald-800">سيتم إغلاق الطلب وتحديث المخزون وتسجيل التكلفة على العقار.</p>
          </div>
        </div>
      ),
    },
  ];

  const handleComplete = () => {
    if (!tenantConfirmed) {
      toast.error('يجب تأكيد المستأجر أولاً');
      return;
    }
    try {
      const requests = maintenanceStore.getAll() as any[];
      const idx = requests.findIndex((r: any) => r.id === requestId);
      if (idx === -1) return;
      requests[idx] = {
        ...requests[idx], status: 'closed', closed_at: new Date().toISOString(),
        diagnosis, work_done: workDone, materials_used: materialsUsed,
        labor_cost: laborCost, material_cost: materialCost, total_cost: laborCost + materialCost,
        tenant_signature_url: afterPhoto, technician_name: technician, notes,
      };
      localStorage.setItem('erp_maintenance', JSON.stringify(requests));
      logAudit('close', 'maintenance', requestId, '', `تكلفة ${laborCost + materialCost}`);

      toast.success('تم إغلاق طلب الصيانة بنجاح');
      navigate('/maintenance/requests');
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ');
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Wrench className="h-6 w-6 text-orange-600" />
        <div>
          <h1 className="text-xl font-bold">معالج إغلاق طلب صيانة</h1>
          <p className="text-xs text-muted-foreground">7 خطوات لإكمال العمل وإغلاق الطلب</p>
        </div>
      </div>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={() => navigate('/maintenance/requests')}
        completeLabel="إغلاق الطلب"
      />
    </div>
  );
}
