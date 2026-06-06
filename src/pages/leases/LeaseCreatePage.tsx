import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Save } from 'lucide-react';
import {
  leaseStore, tenantStore, unitStore, propertyStore,
  getPropertyName, getUnitNumber, getTenantName,
} from '@/services/stores';
import type { LeaseContract, PaymentFrequency, ContractStatus } from '@/types';

const paymentFrequencyLabels: Record<PaymentFrequency, string> = {
  monthly: 'شهري', quarterly: 'ربع سنوي', semi_annual: 'نصف سنوي', annual: 'سنوي', custom: 'مخصص',
};

const contractStatusLabels: Record<ContractStatus, string> = {
  draft: 'مسودة', pending_approval: 'بانتظار الموافقة', approved: 'معتمد',
  pending_signature: 'بانتظار التوقيع', active: 'نشط', expiring_soon: 'ينتهي قريباً',
  renewed: 'مجدد', terminated: 'منتهي', cancelled: 'ملغي', legal: 'قانوني',
};

export default function LeaseCreatePage() {
  const { t } = useLocale();
  const navigate = useNavigate();

  const tenants = useMemo(() => tenantStore.getAll(), []);
  const units = useMemo(() => unitStore.getAll(), []);
  const properties = useMemo(() => propertyStore.getAll(), []);

  const [form, setForm] = useState<Partial<LeaseContract>>({
    company_id: '',
    contract_number: '',
    tenant_id: '',
    property_id: '',
    unit_id: '',
    start_date: '',
    end_date: '',
    rent_amount: 0,
    payment_frequency: 'monthly' as PaymentFrequency,
    security_deposit: 0,
    admin_fees: 0,
    commission: 0,
    grace_period_days: 0,
    late_fee_type: 'fixed',
    late_fee_amount: 0,
    auto_renewal_allowed: false,
    renewal_notice_days: 30,
    termination_notice_days: 60,
    status: 'draft' as ContractStatus,
  });

  const [saving, setSaving] = useState(false);

  // Auto-fill property when unit changes
  const handleUnitChange = (unitId: string) => {
    const unit = unitStore.getById(unitId);
    setForm({
      ...form,
      unit_id: unitId,
      property_id: unit?.property_id || form.property_id,
    });
  };

  // Display selected values
  const selectedUnit = form.unit_id ? unitStore.getById(form.unit_id) : null;
  const selectedProperty = form.property_id ? propertyStore.getById(form.property_id) : null;

  const handleSave = () => {
    if (!form.tenant_id || !form.unit_id || !form.property_id || !form.start_date || !form.end_date) {
      toast.error('يرجى تعبئة جميع الحقول المطلوبة');
      return;
    }
    if ((form.rent_amount ?? 0) <= 0) {
      toast.error('يرجى إدخال مبلغ الإيجار');
      return;
    }
    setSaving(true);
    try {
      const count = leaseStore.getAll().length;
      const year = new Date().getFullYear();
      const contractNumber = form.contract_number || `LSE-${year}-${String(count + 1).padStart(3, '0')}`;
      leaseStore.create({
        ...form,
        contract_number: contractNumber,
        company_id: '',
        status: form.status || 'draft',
      } as Omit<LeaseContract, 'id'>);
      toast.success('تم إنشاء عقد الإيجار بنجاح');
      navigate('/leases');
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      <PageHeader
        title="عقد إيجار جديد"
        description="أدخل بيانات عقد الإيجار — المستأجر، الوحدة، المدة، والمبلغ"
      />

      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/leases')} className="text-xs text-gray-500">
          <ArrowRight className="h-4 w-4 ml-1" />{t.common.back}
        </Button>
      </div>

      {/* Main Info Card */}
      <Card>
        <CardHeader><CardTitle>معلومات العقد</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Contract Number */}
          <div className="space-y-2">
            <Label>{t.leases.contractNumber}</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200"
              placeholder="تلقائي"
              value={form.contract_number || ''}
              onChange={(e) => setForm({ ...form, contract_number: e.target.value })}
            />
          </div>

          {/* Tenant Selector */}
          <div className="space-y-2">
            <Label>{t.leases.tenant} *</Label>
            <Select value={form.tenant_id || ''} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue placeholder="اختر المستأجر" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tn) => (
                  <SelectItem key={tn.id} value={tn.id}>
                    {tn.full_name || tn.company_name || tn.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit Selector */}
          <div className="space-y-2">
            <Label>{t.leases.unit} *</Label>
            <Select value={form.unit_id || ''} onValueChange={handleUnitChange}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue placeholder="اختر الوحدة" />
              </SelectTrigger>
              <SelectContent>
                {units.filter(u => u.status === 'available' || u.status === 'reserved').map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.unit_number} — {getPropertyName(u.property_id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property (auto-filled from unit) */}
          <div className="space-y-2">
            <Label>العقار</Label>
            <Input
              className="h-9 text-sm rounded-lg border-gray-200 bg-gray-50"
              value={selectedProperty?.property_name || ''}
              disabled
              placeholder="يتم تعبئته تلقائياً"
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>{t.leases.startDate} *</Label>
            <Input
              type="date"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.start_date || ''}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>{t.leases.endDate} *</Label>
            <Input
              type="date"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.end_date || ''}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>

          {/* Rent Amount */}
          <div className="space-y-2">
            <Label>{t.leases.rentAmount} *</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.rent_amount || ''}
              onChange={(e) => setForm({ ...form, rent_amount: Number(e.target.value) })}
              min={0}
            />
          </div>

          {/* Payment Frequency */}
          <div className="space-y-2">
            <Label>{t.leases.paymentFrequency}</Label>
            <Select
              value={form.payment_frequency || 'monthly'}
              onValueChange={(v) => setForm({ ...form, payment_frequency: v as PaymentFrequency })}
            >
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentFrequencyLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Security Deposit */}
          <div className="space-y-2">
            <Label>{t.leases.securityDeposit}</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.security_deposit || ''}
              onChange={(e) => setForm({ ...form, security_deposit: Number(e.target.value) })}
              min={0}
            />
          </div>

          {/* Admin Fees */}
          <div className="space-y-2">
            <Label>رسوم إدارية</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.admin_fees || ''}
              onChange={(e) => setForm({ ...form, admin_fees: Number(e.target.value) })}
              min={0}
            />
          </div>

          {/* Commission */}
          <div className="space-y-2">
            <Label>عمولة وسيط</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.commission || ''}
              onChange={(e) => setForm({ ...form, commission: Number(e.target.value) })}
              min={0}
            />
          </div>

          {/* Grace Period */}
          <div className="space-y-2">
            <Label>فترة السماح (أيام)</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.grace_period_days || ''}
              onChange={(e) => setForm({ ...form, grace_period_days: Number(e.target.value) })}
              min={0}
            />
          </div>

          {/* Late Fee Type */}
          <div className="space-y-2">
            <Label>نوع الغرامة</Label>
            <Select value={form.late_fee_type || 'fixed'} onValueChange={(v) => setForm({ ...form, late_fee_type: v })}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                <SelectItem value="percentage">نسبة مئوية</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Late Fee Amount */}
          <div className="space-y-2">
            <Label>قيمة الغرامة</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.late_fee_amount || ''}
              onChange={(e) => setForm({ ...form, late_fee_amount: Number(e.target.value) })}
              min={0}
            />
          </div>

          {/* Auto Renewal */}
          <div className="space-y-2">
            <Label>تجديد تلقائي</Label>
            <Select
              value={form.auto_renewal_allowed ? 'yes' : 'no'}
              onValueChange={(v) => setForm({ ...form, auto_renewal_allowed: v === 'yes' })}
            >
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">نعم — تجديد تلقائي</SelectItem>
                <SelectItem value="no">لا — يدوي</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Renewal Notice Days */}
          <div className="space-y-2">
            <Label>مهلة إشعار التجديد (أيام)</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.renewal_notice_days || ''}
              onChange={(e) => setForm({ ...form, renewal_notice_days: Number(e.target.value) })}
              min={0}
            />
          </div>

          {/* Termination Notice Days */}
          <div className="space-y-2">
            <Label>مهلة إشعار الإنهاء (أيام)</Label>
            <Input
              type="number"
              className="h-9 text-sm rounded-lg border-gray-200"
              value={form.termination_notice_days || ''}
              onChange={(e) => setForm({ ...form, termination_notice_days: Number(e.target.value) })}
              min={0}
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>الحالة</Label>
            <Select value={form.status || 'draft'} onValueChange={(v) => setForm({ ...form, status: v as ContractStatus })}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(contractStatusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 justify-end mt-6">
        <Button variant="outline" onClick={() => navigate('/leases')} className="h-9 text-sm rounded-lg border-gray-200">
          {t.common.cancel}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4"
        >
          <Save className="h-4 w-4" />
          {saving ? 'جارٍ الحفظ...' : t.common.save}
        </Button>
      </div>
    </div>
  );
}
