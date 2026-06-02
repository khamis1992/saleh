import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ArrowRight, Save, FileText, User, Home, Calendar, Wallet, Hash, Info } from 'lucide-react';
import { formatQAR } from '@/lib/format';
import {
  invoiceStore, leaseStore, tenantStore, unitStore, propertyStore,
  getTenantName, getUnitNumber, getPropertyName, getContractNumber,
} from '@/services/stores';
import type { RentalInvoice, InvoiceStatus } from '@/types';

const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  draft: 'مسودة',
  issued: 'مصدرة',
  partially_paid: 'مدفوعة جزئياً',
  paid: 'مدفوعة',
  overdue: 'متأخرة',
  cancelled: 'ملغاة',
  written_off: 'مشطوبة',
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function RentInvoiceCreatePage() {
  const { t } = useLocale();
  const navigate = useNavigate();

  const allLeases = useMemo(() => leaseStore.getAll(), []);
  const allTenants = useMemo(() => tenantStore.getAll(), []);
  const allUnits = useMemo(() => unitStore.getAll(), []);

  // Only show leases that can be invoiced (active / expiring_soon / approved)
  const eligibleLeases = useMemo(
    () => allLeases.filter((l) => ['active', 'expiring_soon', 'approved'].includes(l.status)),
    [allLeases]
  );

  // Generate next invoice number
  const suggestedInvoiceNumber = useMemo(() => {
    const all = invoiceStore.getAll();
    const year = new Date().getFullYear();
    const maxNum = all.reduce((max, i) => {
      const m = i.invoice_number?.match(/INV-\d{4}-(\d+)/);
      if (m) {
        const n = parseInt(m[1], 10);
        return n > max ? n : max;
      }
      return max;
    }, 0);
    return `INV-${year}-${String(maxNum + 1).padStart(3, '0')}`;
  }, []);

  const [form, setForm] = useState<Partial<RentalInvoice>>({
    company_id: '',
    invoice_number: suggestedInvoiceNumber,
    contract_id: '',
    tenant_id: '',
    unit_id: '',
    invoice_date: todayISO(),
    due_date: addDaysISO(todayISO(), 30),
    rent_amount: 0,
    service_charges: 0,
    maintenance_charges: 0,
    penalties: 0,
    discounts: 0,
    tax: 0,
    paid_amount: 0,
    total: 0,
    balance: 0,
    status: 'issued' as InvoiceStatus,
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Auto-fill tenant + unit + rent from selected contract
  useEffect(() => {
    if (!form.contract_id) return;
    const lease = allLeases.find((l) => l.id === form.contract_id);
    if (!lease) return;
    setForm((prev) => ({
      ...prev,
      tenant_id: lease.tenant_id,
      unit_id: lease.unit_id,
      rent_amount: lease.rent_amount ?? prev.rent_amount ?? 0,
    }));
  }, [form.contract_id, allLeases]);

  // Recompute total + balance whenever amounts change
  useEffect(() => {
    const total =
      (form.rent_amount ?? 0) +
      (form.service_charges ?? 0) +
      (form.maintenance_charges ?? 0) +
      (form.penalties ?? 0) +
      (form.tax ?? 0) -
      (form.discounts ?? 0);
    const balance = total - (form.paid_amount ?? 0);
    setForm((prev) => ({ ...prev, total, balance }));
  }, [
    form.rent_amount, form.service_charges, form.maintenance_charges,
    form.penalties, form.discounts, form.tax, form.paid_amount,
  ]);

  // Resolved display values
  const selectedLease = form.contract_id ? allLeases.find((l) => l.id === form.contract_id) : null;
  const selectedTenant = form.tenant_id ? allTenants.find((tn) => tn.id === form.tenant_id) : null;
  const selectedUnit = form.unit_id ? allUnits.find((u) => u.id === form.unit_id) : null;
  const tenantDisplay = selectedTenant ? getTenantName(form.tenant_id!) : '';
  const unitDisplay = selectedUnit ? `${getUnitNumber(form.unit_id!)} — ${getPropertyName(selectedUnit.property_id)}` : '';
  const contractDisplay = selectedLease ? getContractNumber(form.contract_id!) : '';

  const handleAmount = (field: keyof RentalInvoice, value: string) => {
    const n = value === '' ? 0 : Number(value);
    setForm((prev) => ({ ...prev, [field]: isNaN(n) ? 0 : n }));
  };

  const handleSave = () => {
    if (!form.contract_id) {
      toast.error('يرجى اختيار العقد');
      return;
    }
    if (!form.tenant_id || !form.unit_id) {
      toast.error('بيانات العقد غير مكتملة — لا يوجد مستأجر أو وحدة');
      return;
    }
    if ((form.rent_amount ?? 0) <= 0) {
      toast.error('يرجى إدخال مبلغ الإيجار');
      return;
    }
    if (!form.invoice_date || !form.due_date) {
      toast.error('يرجى تحديد تاريخ الفاتورة وتاريخ الاستحقاق');
      return;
    }
    if (new Date(form.due_date) < new Date(form.invoice_date)) {
      toast.error('تاريخ الاستحقاق يجب أن يكون بعد تاريخ الفاتورة');
      return;
    }

    setSaving(true);
    try {
      const finalNumber = form.invoice_number?.trim() || suggestedInvoiceNumber;
      const created = invoiceStore.create({
        ...form,
        invoice_number: finalNumber,
        company_id: form.company_id || '',
        total: form.total ?? 0,
        paid_amount: form.paid_amount ?? 0,
        balance: form.balance ?? 0,
        status: form.status || 'issued',
      } as Omit<RentalInvoice, 'id'>);

      toast.success(`تم إنشاء الفاتورة ${created.invoice_number} بنجاح`);
      navigate('/rent-collection/invoices');
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <PageHeader
        title="فاتورة إيجار جديدة"
        description="إنشاء فاتورة إيجار جديدة لعقد نشط — يتم احتساب الإجمالي تلقائياً"
      />

      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/rent-collection/invoices')}
          className="text-xs text-gray-500"
        >
          <ArrowRight className="h-4 w-4 ml-1" />
          {t.common.back}
        </Button>
        {contractDisplay && (
          <span className="text-xs text-gray-400">
            العقد: <span className="font-mono text-gray-600">{contractDisplay}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Right column — main form (2/3 width on lg) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Section 1: Contract & Tenant */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-blue-600" />
                العقد والمستأجر
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Contract (required) */}
              <div className="space-y-2 md:col-span-2">
                <Label>العقد *</Label>
                <Select
                  value={form.contract_id || ''}
                  onValueChange={(v) => setForm({ ...form, contract_id: v })}
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                    <SelectValue placeholder="اختر العقد النشط" />
                  </SelectTrigger>
                  <SelectContent>
                    {eligibleLeases.length === 0 && (
                      <SelectItem value="__none__" disabled>
                        لا توجد عقود نشطة
                      </SelectItem>
                    )}
                    {eligibleLeases.map((l) => {
                      const tn = getTenantName(l.tenant_id);
                      const un = getUnitNumber(l.unit_id);
                      return (
                        <SelectItem key={l.id} value={l.id}>
                          {l.contract_number} — {tn} — وحدة {un} — {formatQAR(l.rent_amount)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                {eligibleLeases.length === 0 && (
                  <p className="text-[11px] text-amber-600 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    لا توجد عقود نشطة — أنشئ عقد إيجار أولاً
                  </p>
                )}
              </div>

              {/* Tenant (auto, readonly) */}
              <div className="space-y-2">
                <Label>المستأجر</Label>
                <Input
                  className="h-9 text-sm rounded-lg border-gray-200 bg-gray-50"
                  value={tenantDisplay}
                  disabled
                  placeholder="يتم تعبئته تلقائياً من العقد"
                />
              </div>

              {/* Unit (auto, readonly) */}
              <div className="space-y-2">
                <Label>الوحدة</Label>
                <Input
                  className="h-9 text-sm rounded-lg border-gray-200 bg-gray-50"
                  value={unitDisplay}
                  disabled
                  placeholder="يتم تعبئته تلقائياً من العقد"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Dates & Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-blue-600" />
                التواريخ والحالة
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Invoice Number */}
              <div className="space-y-2">
                <Label>رقم الفاتورة</Label>
                <Input
                  className="h-9 text-sm rounded-lg border-gray-200 font-mono"
                  value={form.invoice_number || ''}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  placeholder={suggestedInvoiceNumber}
                />
                <p className="text-[11px] text-gray-400">اتركه فارغاً للترقيم التلقائي</p>
              </div>

              {/* Invoice Date */}
              <div className="space-y-2">
                <Label>تاريخ الفاتورة *</Label>
                <Input
                  type="date"
                  className="h-9 text-sm rounded-lg border-gray-200"
                  value={form.invoice_date || ''}
                  onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
                />
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <Label>تاريخ الاستحقاق *</Label>
                <Input
                  type="date"
                  className="h-9 text-sm rounded-lg border-gray-200"
                  value={form.due_date || ''}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>

              {/* Status */}
              <div className="space-y-2 md:col-span-3">
                <Label>الحالة</Label>
                <Select
                  value={form.status || 'issued'}
                  onValueChange={(v) => setForm({ ...form, status: v as InvoiceStatus })}
                >
                  <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(invoiceStatusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Amounts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-4 w-4 text-blue-600" />
                تفاصيل المبلغ
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rent Amount */}
              <div className="space-y-2">
                <Label>إيجار *</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-sm rounded-lg border-gray-200 font-mono"
                  value={form.rent_amount ?? ''}
                  onChange={(e) => handleAmount('rent_amount', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Service Charges */}
              <div className="space-y-2">
                <Label>رسوم خدمات</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-sm rounded-lg border-gray-200 font-mono"
                  value={form.service_charges ?? ''}
                  onChange={(e) => handleAmount('service_charges', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Maintenance Charges */}
              <div className="space-y-2">
                <Label>رسوم صيانة</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-sm rounded-lg border-gray-200 font-mono"
                  value={form.maintenance_charges ?? ''}
                  onChange={(e) => handleAmount('maintenance_charges', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Penalties */}
              <div className="space-y-2">
                <Label>غرامات تأخير</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-sm rounded-lg border-gray-200 font-mono"
                  value={form.penalties ?? ''}
                  onChange={(e) => handleAmount('penalties', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Tax */}
              <div className="space-y-2">
                <Label>ضريبة</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-sm rounded-lg border-gray-200 font-mono"
                  value={form.tax ?? ''}
                  onChange={(e) => handleAmount('tax', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Discounts */}
              <div className="space-y-2">
                <Label>خصومات</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-sm rounded-lg border-gray-200 font-mono"
                  value={form.discounts ?? ''}
                  onChange={(e) => handleAmount('discounts', e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {/* Paid Amount */}
              <div className="space-y-2 md:col-span-3">
                <Label>المبلغ المدفوع مقدماً</Label>
                <Input
                  type="number"
                  min={0}
                  className="h-9 text-sm rounded-lg border-gray-200 font-mono"
                  value={form.paid_amount ?? ''}
                  onChange={(e) => handleAmount('paid_amount', e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-[11px] text-gray-400">
                  المبلغ المدفوع مقدماً — يستخدم في حساب الرصيد المتبقي
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2 md:col-span-3">
                <Label>ملاحظات</Label>
                <Textarea
                  className="text-sm rounded-lg border-gray-200 min-h-[80px]"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="ملاحظات اختيارية على الفاتورة..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Left column — summary sidebar (1/3 width on lg) */}
        <div className="space-y-5">
          {/* Live summary card */}
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-blue-600" />
                ملخص الفاتورة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-600">
                  <span>الإيجار</span>
                  <span className="font-mono">{formatQAR(form.rent_amount ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>رسوم خدمات</span>
                  <span className="font-mono">{formatQAR(form.service_charges ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>رسوم صيانة</span>
                  <span className="font-mono">{formatQAR(form.maintenance_charges ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>غرامات</span>
                  <span className="font-mono">{formatQAR(form.penalties ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-gray-600">
                  <span>ضريبة</span>
                  <span className="font-mono">{formatQAR(form.tax ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-green-600">
                  <span>خصومات</span>
                  <span className="font-mono">- {formatQAR(form.discounts ?? 0)}</span>
                </div>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="flex items-center justify-between font-bold text-gray-900">
                  <span>الإجمالي</span>
                  <span className="font-mono text-base">{formatQAR(form.total ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-green-600 text-xs">
                  <span>المدفوع</span>
                  <span className="font-mono">{formatQAR(form.paid_amount ?? 0)}</span>
                </div>
                <div className="flex items-center justify-between text-red-600 font-semibold">
                  <span>الرصيد المتبقي</span>
                  <span className="font-mono">{formatQAR(form.balance ?? 0)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Hash className="h-3.5 w-3.5" />
                  <span>رقم الفاتورة:</span>
                  <span className="font-mono text-gray-700">
                    {form.invoice_number || suggestedInvoiceNumber}
                  </span>
                </div>
                {contractDisplay && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <FileText className="h-3.5 w-3.5" />
                    <span>العقد:</span>
                    <span className="font-mono text-gray-700">{contractDisplay}</span>
                  </div>
                )}
                {tenantDisplay && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <User className="h-3.5 w-3.5" />
                    <span>المستأجر:</span>
                    <span className="text-gray-700">{tenantDisplay}</span>
                  </div>
                )}
                {selectedUnit && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Home className="h-3.5 w-3.5" />
                    <span>الوحدة:</span>
                    <span className="text-gray-700">
                      {getUnitNumber(form.unit_id!)} — {getPropertyName(selectedUnit.property_id)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || !form.contract_id}
              className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-10 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
            >
              <Save className="h-4 w-4" />
              {saving ? 'جارٍ الحفظ...' : 'حفظ الفاتورة'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/rent-collection/invoices')}
              className="h-10 text-sm rounded-lg border-gray-200"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
