import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Sparkles, UserRound, DoorOpen, Calendar, Banknote, Upload, Check } from 'lucide-react';
import { StepperForm, type WizardStep } from '@/components/shared/StepperForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { tenantStore, unitStore, leaseStore, invoiceStore, propertyStore } from '@/services/stores';
import { toast } from 'sonner';
import { formatQARInt } from '@/lib/format';
import { activateLeaseContract, generateJournalEntry } from '@/utils/exportUtils';

export default function LeaseWizardPage() {
  const navigate = useNavigate();
  const [tenantId, setTenantId] = useState('');
  const [unitId, setUnitId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [rentAmount, setRentAmount] = useState(0);
  const [deposit, setDeposit] = useState(0);
  const [paymentFrequency, setPaymentFrequency] = useState('monthly');
  const [notes, setNotes] = useState('');
  const [createNewTenant, setCreateNewTenant] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');

  const tenants = tenantStore.getAll();
  const units = unitStore.getAll();
  const properties = propertyStore.getAll();

  const availableUnits = useMemo(() => units.filter(u => u.status === 'available'), [units]);
  const selectedUnit = units.find(u => u.id === unitId);

  const months = useMemo(() => {
    if (!startDate || !endDate) return 12;
    const ms = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(1, Math.round(ms / (30 * 86400000)));
  }, [startDate, endDate]);

  const totalContractValue = rentAmount * months;
  const firstDueDate = useMemo(() => {
    if (!startDate) return '';
    const d = new Date(startDate);
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  }, [startDate]);

  const steps: WizardStep[] = [
    {
      key: 'tenant', title: 'اختيار المستأجر',
      render: () => (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="newTenant" checked={createNewTenant} onChange={e => setCreateNewTenant(e.target.checked)} className="rounded" />
            <Label htmlFor="newTenant" className="cursor-pointer">إنشاء مستأجر جديد</Label>
          </div>
          {createNewTenant ? (
            <div className="space-y-3 p-4 rounded-lg border border-blue-100 bg-blue-50/40">
              <div>
                <Label>الاسم الكامل *</Label>
                <Input value={newTenantName} onChange={e => setNewTenantName(e.target.value)} placeholder="أحمد محمد العمري" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>الهاتف</Label>
                  <Input value={newTenantPhone} onChange={e => setNewTenantPhone(e.target.value)} placeholder="+974 5555 1234" />
                </div>
                <div>
                  <Label>البريد</Label>
                  <Input value={newTenantEmail} onChange={e => setNewTenantEmail(e.target.value)} placeholder="ahmed@example.com" />
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Label>المستأجر *</Label>
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger><SelectValue placeholder="اختر مستأجر" /></SelectTrigger>
                <SelectContent>
                  {tenants.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      ),
      validate: () => (createNewTenant ? (newTenantName ? true : 'اسم المستأجر مطلوب') : (tenantId ? true : 'اختر مستأجر')),
    },
    {
      key: 'unit', title: 'اختيار الوحدة',
      render: () => (
        <div className="space-y-4">
          <Label>الوحدة *</Label>
          <Select value={unitId} onValueChange={(v) => {
            setUnitId(v);
            const u = units.find(x => x.id === v);
            if (u && !rentAmount) setRentAmount(u.actual_rent || 0);
          }}>
            <SelectTrigger><SelectValue placeholder="اختر وحدة متاحة" /></SelectTrigger>
            <SelectContent>
              {availableUnits.length === 0 && <SelectItem value="__none" disabled>لا توجد وحدات متاحة</SelectItem>}
              {availableUnits.map(u => {
                const p = properties.find(x => x.id === u.property_id);
                return <SelectItem key={u.id} value={u.id}>{u.unit_code} · {p?.property_name || '-'} · {u.area_sqm}م²</SelectItem>;
              })}
            </SelectContent>
          </Select>
          {selectedUnit && (
            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/40 text-sm">
              <p className="text-xs text-muted-foreground">الوحدة المختارة</p>
              <p className="font-semibold">{selectedUnit.unit_code} · {selectedUnit.unit_type}</p>
            </div>
          )}
        </div>
      ),
      validate: () => unitId ? true : 'اختر وحدة',
    },
    {
      key: 'dates', title: 'تواريخ العقد',
      render: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>تاريخ البدء *</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>تاريخ الانتهاء *</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm">
            <p className="text-muted-foreground">مدة العقد</p>
            <p className="text-lg font-bold text-blue-900">{months} شهر</p>
          </div>
        </div>
      ),
      validate: () => (startDate && endDate && new Date(endDate) > new Date(startDate)) ? true : 'تواريخ غير صحيحة',
    },
    {
      key: 'financials', title: 'القيمة المالية',
      render: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>الإيجار الشهري (ر.ق) *</Label>
              <Input type="number" value={rentAmount} onChange={e => setRentAmount(Number(e.target.value))} />
            </div>
            <div>
              <Label>التأمين (ر.ق)</Label>
              <Input type="number" value={deposit} onChange={e => setDeposit(Number(e.target.value))} />
            </div>
          </div>
          <div>
            <Label>دورية الدفع</Label>
            <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">شهري</SelectItem>
                <SelectItem value="quarterly">ربع سنوي</SelectItem>
                <SelectItem value="semi_annual">نصف سنوي</SelectItem>
                <SelectItem value="annual">سنوي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-1">
            <div className="flex justify-between text-sm">
              <span>إجمالي قيمة العقد:</span>
              <span className="font-bold">{formatQARInt(totalContractValue)} ر.ق</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>التأمين:</span>
              <span className="font-bold">{formatQARInt(deposit)} ر.ق</span>
            </div>
            <div className="flex justify-between text-sm pt-1 border-t border-emerald-200">
              <span>أول استحقاق:</span>
              <span className="font-bold">{firstDueDate}</span>
            </div>
          </div>
        </div>
      ),
      validate: () => (rentAmount > 0 ? true : 'حدد الإيجار الشهري'),
    },
    {
      key: 'schedule', title: 'جدول الدفعات', description: 'سيتم إنشاء جدول دفعات تلقائياً بناءً على دورية الدفع',
      render: () => {
        const intervalMonths = paymentFrequency === 'monthly' ? 1 : paymentFrequency === 'quarterly' ? 3 : paymentFrequency === 'semi_annual' ? 6 : 12;
        const numPeriods = Math.max(1, Math.ceil(months / intervalMonths));
        const perPeriod = paymentFrequency === 'annual' ? rentAmount * 12 : Math.round(rentAmount * intervalMonths);
        const previewItems: { id: number; date: string; amount: number }[] = [];
        for (let i = 0; i < Math.min(numPeriods, 12); i++) {
          const d = new Date(startDate);
          d.setMonth(d.getMonth() + i * intervalMonths);
          previewItems.push({ id: i + 1, date: d.toISOString().split('T')[0], amount: perPeriod });
        }
        return (
          <div className="space-y-3">
            <p className="text-sm">سيتم إنشاء <strong>{numPeriods}</strong> دفعة بقيمة <strong>{formatQARInt(perPeriod)} ر.ق</strong> لكل دفعة</p>
            <div className="p-3 rounded-lg border border-gray-100 max-h-48 overflow-y-auto text-xs space-y-1">
              {previewItems.map(p => (
                <div key={p.id} className="flex justify-between p-1.5 rounded bg-gray-50/50">
                  <span>دفعة #{p.id} · {p.date}</span>
                  <span className="font-bold">{formatQARInt(p.amount)} ر.ق</span>
                </div>
              ))}
              {numPeriods > 12 && <p className="text-muted-foreground">+ {numPeriods - 12} دفعة أخرى</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'documents', title: 'المستندات', description: 'يمكنك إرفاق المستندات لاحقاً من صفحة العقد',
      render: () => (
        <div className="space-y-3">
          <div className="p-6 rounded-lg border-2 border-dashed border-gray-200 text-center">
            <Upload className="h-10 w-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-medium">إرفاق المستندات</p>
            <p className="text-xs text-muted-foreground mt-1">هوية المستأجر، عقد التوقيع، صورة الشيك</p>
            <p className="text-[10px] text-muted-foreground mt-2">(متاح لاحقاً من /documents)</p>
          </div>
        </div>
      ),
    },
    {
      key: 'review', title: 'مراجعة وتفعيل',
      render: () => {
        const tenant = tenants.find(t => t.id === tenantId);
        return (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">المستأجر:</span> <span className="font-semibold">{createNewTenant ? newTenantName : tenant?.full_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الوحدة:</span> <span className="font-mono">{selectedUnit?.unit_code}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">من:</span> <span>{startDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">إلى:</span> <span>{endDate}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الإيجار الشهري:</span> <span className="font-bold">{formatQARInt(rentAmount)} ر.ق</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">إجمالي العقد:</span> <span className="font-bold text-blue-700">{formatQARInt(totalContractValue)} ر.ق</span></div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
              <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
              <div className="text-xs text-emerald-800 space-y-0.5">
                <p>عند التأكيد سيتم:</p>
                <ul className="list-disc pr-4">
                  <li>إنشاء العقد وتفعيله</li>
                  <li>تحديث حالة الوحدة إلى "مؤجرة"</li>
                  <li>إنشاء جدول الدفعات</li>
                  <li>إصدار أول فاتورة</li>
                  <li>تسجيل التأمين</li>
                  <li>إنشاء قيد محاسبي</li>
                </ul>
              </div>
            </div>
          </div>
        );
      },
    },
  ];

  const handleComplete = () => {
    try {
      let finalTenantId = tenantId;
      if (createNewTenant) {
        const newTenant = tenantStore.create({
          full_name: newTenantName, phone: newTenantPhone, email: newTenantEmail,
          tenant_type: 'individual', tenant_code: `T-${Date.now().toString(36).toUpperCase()}`,
          status: 'active',
        } as any);
        finalTenantId = newTenant.id;
      }
      const tenant = tenantStore.getById(finalTenantId);
      const unit = unitStore.getById(unitId);

      const yearCode = new Date().getFullYear();
      const existingLeases = leaseStore.getAll();
      const count = existingLeases.length + 1;
      const contractNumber = `LSE-${yearCode}-${String(count).padStart(3, '0')}`;

      const lease = leaseStore.create({
        contract_number: contractNumber, tenant_id: finalTenantId, tenant_name: tenant?.full_name,
        unit_id: unitId, unit_code: unit?.unit_code,
        property_id: unit?.property_id, start_date: startDate, end_date: endDate,
        rent_amount: rentAmount, payment_frequency: paymentFrequency, deposit_amount: deposit,
        status: 'draft', notes,
      } as any);

      // activate → creates schedule + invoice + JE
      activateLeaseContract(unitId, lease.id);

      toast.success(`تم إنشاء العقد ${contractNumber} وتفعيله بنجاح`);
      navigate(`/leases/${lease.id}`);
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء إنشاء العقد');
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold">معالج إنشاء عقد إيجار</h1>
          <p className="text-xs text-muted-foreground">7 خطوات لإنشاء عقد إيجار كامل وتفعيله</p>
        </div>
      </div>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={() => navigate('/leases')}
        completeLabel="إنشاء وتفعيل العقد"
      />
    </div>
  );
}
