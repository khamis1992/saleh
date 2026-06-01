import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Upload, Check } from 'lucide-react';
import { StepperForm, type WizardStep } from '@/components/shared/StepperForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { invoiceStore, tenantStore, leaseStore, receiptStore } from '@/services/stores';
import { toast } from 'sonner';
import { formatQARInt } from '@/lib/format';
import { postReceiptToInvoice, logAudit } from '@/utils/exportUtils';

const METHODS = [
  { value: 'cash', label: 'نقدي' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
  { value: 'cheque', label: 'شيك' },
  { value: 'card', label: 'بطاقة' },
  { value: 'online', label: 'دفع إلكتروني' },
];

export default function PaymentWizardPage() {
  const navigate = useNavigate();
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const openInvoices = useMemo(() => invoiceStore.getAll().filter(i => i.status !== 'paid'), []);
  const selected = openInvoices.find(i => i.id === invoiceId);
  const tenant = selected ? tenantStore.getById(selected.tenant_id) : null;
  const lease = selected ? leaseStore.getAll().find(l => l.unit_id === selected.unit_id && l.tenant_id === selected.tenant_id) : null;

  const steps: WizardStep[] = [
    {
      key: 'select', title: 'اختيار الفاتورة',
      render: () => (
        <div className="space-y-4">
          <Label>الفاتورة *</Label>
          <Select value={invoiceId} onValueChange={(v) => {
            setInvoiceId(v);
            const inv = openInvoices.find(i => i.id === v);
            if (inv) setAmount(inv.balance || inv.total || 0);
          }}>
            <SelectTrigger><SelectValue placeholder="اختر فاتورة" /></SelectTrigger>
            <SelectContent>
              {openInvoices.length === 0 && <SelectItem value="__none" disabled>لا توجد فواتير مفتوحة</SelectItem>}
              {openInvoices.map(i => {
                const t = tenantStore.getById(i.tenant_id);
                return <SelectItem key={i.id} value={i.id}>{i.invoice_number} · {t?.full_name} · {formatQARInt(i.balance || i.total)}</SelectItem>;
              })}
            </SelectContent>
          </Select>
          {selected && (
            <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/40 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-muted-foreground">المستأجر:</span> <span className="font-semibold">{tenant?.full_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">إجمالي الفاتورة:</span> <span>{formatQARInt(selected.total)} ر.ق</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">المتبقي:</span> <span className="font-bold text-red-600">{formatQARInt(selected.balance || selected.total)} ر.ق</span></div>
            </div>
          )}
        </div>
      ),
      validate: () => invoiceId ? true : 'اختر فاتورة',
    },
    {
      key: 'amount', title: 'مبلغ الدفعة',
      render: () => (
        <div className="space-y-4">
          <div>
            <Label>المبلغ (ر.ق) *</Label>
            <Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
            {amount > 0 && selected && (
              <div className="mt-2 text-xs space-y-1">
                <p className="text-muted-foreground">المتبقي بعد الدفعة: {formatQARInt(Math.max(0, (selected.balance || selected.total) - amount))} ر.ق</p>
                {amount >= (selected.balance || selected.total) && (
                  <p className="text-emerald-600 font-semibold">✓ ستسدد الفاتورة بالكامل</p>
                )}
              </div>
            )}
          </div>
        </div>
      ),
      validate: () => (amount > 0 ? true : 'حدد المبلغ'),
    },
    {
      key: 'date', title: 'تاريخ الدفعة',
      render: () => (
        <div>
          <Label>تاريخ الدفع</Label>
          <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
        </div>
      ),
    },
    {
      key: 'method', title: 'طريقة الدفع',
      render: () => (
        <div className="space-y-4">
          <Label>الطريقة *</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div>
            <Label>رقم مرجعي (اختياري)</Label>
            <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="رقم الشيك / رقم التحويل" />
          </div>
        </div>
      ),
    },
    {
      key: 'proof', title: 'إثبات الدفع', description: 'يمكنك إرفاق الإيصال لاحقاً',
      render: () => (
        <div className="p-6 rounded-lg border-2 border-dashed border-gray-200 text-center">
          <Upload className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm font-medium">إرفاق إيصال الدفع</p>
          <p className="text-xs text-muted-foreground mt-1">صورة الإيصال أو كشف التحويل</p>
        </div>
      ),
    },
    {
      key: 'confirm', title: 'تأكيد الدفعة',
      render: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">الفاتورة:</span> <span className="font-mono">{selected?.invoice_number}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المستأجر:</span> <span className="font-semibold">{tenant?.full_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المبلغ:</span> <span className="font-bold text-emerald-700">{formatQARInt(amount)} ر.ق</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">الطريقة:</span> <span>{METHODS.find(m => m.value === method)?.label}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">التاريخ:</span> <span>{paymentDate}</span></div>
            {reference && <div className="flex justify-between"><span className="text-muted-foreground">مرجع:</span> <span className="font-mono">{reference}</span></div>}
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
            <div className="text-xs text-emerald-800">
              <p>عند التأكيد سيتم: إنشاء سند قبض + تحديث رصيد الفاتورة + قيد محاسبي + تحديث كشف المستأجر.</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleComplete = () => {
    try {
      const yearCode = new Date().getFullYear();
      const existing = receiptStore.getAll();
      const count = existing.length + 1;
      const receiptNumber = `RCP-${yearCode}-${String(count).padStart(3, '0')}`;

      receiptStore.create({
        receipt_number: receiptNumber, invoice_id: invoiceId, tenant_id: selected?.tenant_id,
        contract_id: lease?.id || '', payment_date: paymentDate, payment_method: method,
        amount, reference_number: reference, notes, status: 'received',
      } as any);

      postReceiptToInvoice(invoiceId, amount);
      logAudit('create', 'receipts', invoiceId, '', `${amount} ر.ق`);

      toast.success(`تم تسجيل الدفعة ${formatQARInt(amount)} ر.ق بنجاح`);
      navigate('/queues/collection');
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ');
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Banknote className="h-6 w-6 text-emerald-600" />
        <div>
          <h1 className="text-xl font-bold">معالج تسجيل دفعة إيجار</h1>
          <p className="text-xs text-muted-foreground">6 خطوات لتسجيل دفعة وتحديث رصيد الفاتورة</p>
        </div>
      </div>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={() => navigate('/queues/collection')}
        completeLabel="تسجيل الدفعة"
      />
    </div>
  );
}
