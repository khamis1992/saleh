// Tenant Portal — Pay Rent (stub for HyperPay/Moyasar/Tap Payments)
// Real payment gateway integration is deferred per project convention (skip Supabase/payment backend)
// This page shows a full payment flow simulation with method selection, amount confirmation, success state

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { invoiceStore, receiptStore } from '@/services/stores';
import { generateId } from '@/services/dataService';
import { formatQAR } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  CreditCard, Wallet, Building, Smartphone, CheckCircle2, ArrowRight, Lock, ShieldCheck,
  Receipt, AlertCircle, Calendar, Hash, X, FileText, Banknote, Loader2, CircleDot,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);

const PAYMENT_METHODS = [
  { value: 'card', label: 'بطاقة ائتمان / مدى', icon: CreditCard, gateway: 'HyperPay', color: 'blue' },
  { value: 'apple_pay', label: 'Apple Pay', icon: Smartphone, gateway: 'HyperPay', color: 'gray' },
  { value: 'bank_transfer', label: 'تحويل بنكي', icon: Building, gateway: 'Moyasar', color: 'emerald' },
  { value: 'mada', label: 'مدى', icon: CreditCard, gateway: 'Moyasar', color: 'purple' },
];

type Step = 'select-invoice' | 'select-method' | 'enter-details' | 'processing' | 'success';

export default function TenantPayRentPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const tenantId = session?.tenantId;

  const [step, setStep] = useState<Step>('select-invoice');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');

  const invoices = useMemo(
    () => (tenantId ? invoiceStore.getAll().filter((i) => i.tenant_id === tenantId && i.balance > 0) : []),
    [tenantId],
  );
  const selectedInvoice = useMemo(
    () => invoices.find((i) => i.id === selectedInvoiceId),
    [invoices, selectedInvoiceId],
  );

  const payAmount = customAmount ? Number(customAmount) : (selectedInvoice?.balance || 0);

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setCustomAmount('');
    setStep('select-method');
  };

  const handleSelectMethod = (method: string) => {
    setSelectedMethod(method);
    setStep('enter-details');
  };

  const handlePay = () => {
    if (!selectedInvoice) return;
    setStep('processing');
    // Simulate processing delay
    setTimeout(() => {
      // 1. Update invoice balance
      const newPaid = selectedInvoice.paid_amount + payAmount;
      const newBalance = Math.max(0, selectedInvoice.balance - payAmount);
      const newStatus = newBalance === 0 ? 'paid' : 'partially_paid';
      invoiceStore.update(selectedInvoice.id, {
        paid_amount: newPaid,
        balance: newBalance,
        status: newStatus as any,
      });
      // 2. Create a receipt
      receiptStore.create({
        company_id: '',
        receipt_number: `RCP-${new Date().getFullYear()}-${String(receiptStore.getAll().length + 1).padStart(3, '0')}`,
        tenant_id: selectedInvoice.tenant_id,
        invoice_id: selectedInvoice.id,
        contract_id: selectedInvoice.contract_id,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: (selectedMethod === 'bank_transfer' ? 'bank_transfer' : 'online') as any,
        amount: payAmount,
        bank_account_id: '',
        reference_number: `TXN-${Date.now().toString(36).toUpperCase()}`,
        notes: `دفع إلكتروني عبر ${PAYMENT_METHODS.find((m) => m.value === selectedMethod)?.gateway || 'البوابة'}`,
        attachment_url: '',
      });
      setStep('success');
      toast.success('تم الدفع بنجاح!');
    }, 1800);
  };

  const handleStartOver = () => {
    setSelectedInvoiceId('');
    setSelectedMethod('');
    setCustomAmount('');
    setStep('select-invoice');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#061b31]">دفع الإيجار</h1>
        <p className="text-xs text-[#64748d] mt-0.5">ادفع فاتورتك بأمان عبر بوابات الدفع المعتمدة</p>
      </div>

      {/* Step indicator */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between" dir="ltr">
            {[
              { key: 'select-invoice', label: 'اختر الفاتورة' },
              { key: 'select-method', label: 'وسيلة الدفع' },
              { key: 'enter-details', label: 'التأكيد' },
              { key: 'success', label: 'تم الدفع' },
            ].map((s, i, arr) => {
              const stepKeys: Step[] = ['select-invoice', 'select-method', 'enter-details', 'success'];
              const currentIndex = stepKeys.indexOf(step);
              const thisIndex = stepKeys.indexOf(s.key as Step);
              const isActive = currentIndex === thisIndex;
              const isDone = currentIndex > thisIndex;
              return (
                <div key={s.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-[#533afd] text-white' : 'bg-gray-200 text-[#64748d]'
                    }`}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <p className="text-xs text-[#64748d] mt-1 whitespace-nowrap">{s.label}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 transition-colors ${
                      isDone ? 'bg-emerald-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Select invoice */}
      {step === 'select-invoice' && (
        <div className="space-y-3">
          {invoices.length === 0 ? (
            <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-3" />
                <p className="text-gray-700 text-sm font-semibold">لا توجد فواتير مستحقة</p>
                <p className="text-[#64748d] text-xs mt-1">جميع فواتيرك مدفوعة</p>
              </CardContent>
            </Card>
          ) : (
            invoices.map((inv) => (
              <Card key={inv.id} className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow cursor-pointer" onClick={() => handleSelectInvoice(inv.id)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-[#ea2261]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#061b31]">{inv.invoice_number}</p>
                        <p className="text-xs text-[#64748d] mt-0.5">استحقاق {new Date(inv.due_date).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-[#64748d]">المستحق</p>
                      <p className="text-[18px] font-bold text-[#ea2261]">{fmt(inv.balance)}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-[#64748d]" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Step 2: Select method */}
      {step === 'select-method' && selectedInvoice && (
        <div className="space-y-4">
          <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] bg-[rgba(83,58,253,0.06)]/50">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#64748d]">الفاتورة المختارة</p>
                <p className="text-[13px] font-bold text-[#061b31]">{selectedInvoice.invoice_number}</p>
              </div>
              <div className="text-left">
                <p className="text-xs text-[#64748d]">المستحق</p>
                <p className="text-base font-bold text-[#533afd]">{fmt(selectedInvoice.balance)}</p>
              </div>
            </CardContent>
          </Card>

          <div>
            <Label className="text-[13px] font-semibold text-[#061b31] mb-3 block">اختر وسيلة الدفع</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    onClick={() => handleSelectMethod(m.value)}
                    className="p-4 bg-white border-2 border-[#e5edf5] hover:border-blue-400 rounded-xl text-right transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-lg bg-${m.color}-50 flex items-center justify-center`}>
                        <Icon className={`h-5 w-5 text-${m.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-[13px] font-semibold text-[#061b31]">{m.label}</p>
                        <p className="text-xs text-[#64748d]">عبر {m.gateway}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => setStep('select-invoice')} className="text-xs">
            <ArrowRight className="h-3.5 w-3.5 ml-1 rotate-180" />
            تغيير الفاتورة
          </Button>
        </div>
      )}

      {/* Step 3: Enter details / confirm */}
      {step === 'enter-details' && selectedInvoice && (
        <div className="space-y-4">
          <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
            <CardHeader>
              <CardTitle className="text-base font-bold text-[#061b31]">تأكيد الدفع</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">المبلغ (ر.ق)</Label>
                <Input
                  type="number"
                  value={customAmount || selectedInvoice.balance}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="h-11 text-sm font-bold"
                  dir="ltr"
                />
                <p className="text-xs text-[#64748d]">اتركه كما هو لدفع كامل المبلغ</p>
              </div>

              <div className="p-4 bg-[#f6f9fc] rounded-xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748d]">وسيلة الدفع</span>
                  <span className="font-semibold text-[#061b31]">
                    {PAYMENT_METHODS.find((m) => m.value === selectedMethod)?.label}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#64748d]">الفاتورة</span>
                  <span className="font-semibold text-[#061b31]">{selectedInvoice.invoice_number}</span>
                </div>
                <div className="border-t border-[#e5edf5] pt-2 flex justify-between">
                  <span className="text-[13px] font-semibold text-[#061b31]">المبلغ الإجمالي</span>
                  <span className="text-base font-bold text-[#533afd]">{fmt(payAmount)}</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700">
                  الدفع آمن ومشفر عبر بوابة {PAYMENT_METHODS.find((m) => m.value === selectedMethod)?.gateway}. لن يتم تخزين بيانات بطاقتك.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('select-method')}>
                  <ArrowRight className="h-4 w-4 ml-1 rotate-180" />
                  رجوع
                </Button>
                <Button className="flex-1 bg-[#533afd] hover:bg-blue-700" onClick={handlePay}>
                  <Lock className="h-4 w-4 ml-1" />
                  ادفع {fmt(payAmount)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4: Processing */}
      {step === 'processing' && (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-16 text-center">
            <Loader2 className="h-12 w-12 mx-auto text-[#533afd] animate-spin mb-4" />
            <p className="text-sm font-semibold text-[#061b31]">جاري معالجة الدفع...</p>
            <p className="text-xs text-[#64748d] mt-1">يرجى عدم إغلاق هذه النافذة</p>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Success */}
      {step === 'success' && selectedInvoice && (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-[#061b31] mb-1">تم الدفع بنجاح!</h2>
            <p className="text-xs text-[#64748d] mb-6">شكراً لك. تم تسجيل الدفع وتحديث الفاتورة</p>

            <div className="max-w-sm mx-auto p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2 text-right">
              <div className="flex justify-between text-xs">
                <span className="text-[#64748d]">{tt('rentCollection.invoiceNumber', 'رقم الفاتورة')}</span>
                <span className="font-semibold text-[#061b31]">{selectedInvoice.invoice_number}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748d]">{tt('rentCollection.paidAmount', 'المبلغ المدفوع')}</span>
                <span className="font-bold text-emerald-600">{fmt(payAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#64748d]">رقم المعاملة</span>
                <span className="font-semibold text-[#061b31]" dir="ltr">TXN-{Date.now().toString(36).toUpperCase().slice(0, 8)}</span>
              </div>
            </div>

            <div className="flex gap-2 justify-center mt-6">
              <Button variant="outline" className="h-10 text-xs" onClick={handleStartOver}>
                <Receipt className="h-4 w-4 ml-1" />
                فاتورة أخرى
              </Button>
              <Button className="h-10 text-xs bg-[#533afd] hover:bg-blue-700" onClick={() => (window.location.href = '/portal/tenant/payments')}>
                <FileText className="h-4 w-4 ml-1" />
                سجل المدفوعات
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
