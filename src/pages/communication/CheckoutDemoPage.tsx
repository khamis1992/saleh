import { useState } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard, Lock, Shield, CheckCircle2, ArrowRight, ArrowLeft,
  Smartphone, Banknote, AlertCircle, Loader2, Receipt, X,
  Mail, Phone, User, Calendar, Hash, Wallet,
} from 'lucide-react';
import { paymentGatewayStore, tenantStore, paymentLinkStore, paymentTransactionStore } from '@/services/stores';
import { toast } from 'sonner';
import { formatQAR, formatDate } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';

type Step = 'form' | 'method' | 'card' | '3ds' | 'processing' | 'success' | 'failed';

export default function CheckoutDemoPage() {
  const { dir } = useLocale();
  const navigate = useNavigate();
  const gateways = paymentGatewayStore.getAll().filter(g => g.status === 'active');
  const defaultGateway = gateways.find(g => g.is_default) || gateways[0];

  const [step, setStep] = useState<Step>('form');
  const [data, setData] = useState({
    gateway_id: defaultGateway?.id || '',
    amount: 5000,
    currency: 'QAR',
    customer_name: 'أحمد محمد العمري',
    customer_email: 'ahmed@email.com',
    customer_phone: '+974****1122',
    description: 'دفعة إيجار شهر يونيو 2026 - A-101',
    payment_method: 'card' as 'card' | 'applepay' | 'stcpay' | 'bank_transfer',
    card_number: '4242 4242 4242 4242',
    card_holder: 'AHMED M ALOMARI',
    card_expiry: '12/27',
    card_cvc: '123',
    save_card: false,
  });

  const handleStart = () => {
    if (!data.amount || data.amount <= 0) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }
    if (!data.customer_name || !data.customer_email) {
      toast.error('يرجى إدخال بيانات العميل');
      return;
    }
    setStep('method');
  };

  const handleSelectMethod = (m: 'card' | 'applepay' | 'stcpay' | 'bank_transfer') => {
    setData(d => ({ ...d, payment_method: m }));
    if (m === 'applepay' || m === 'stcpay') {
      setStep('processing');
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success
        if (success) {
          setStep('3ds');
          setTimeout(() => setStep('success'), 1500);
        } else {
          setStep('failed');
        }
      }, 2000);
    } else {
      setStep('card');
    }
  };

  const handleSubmitCard = () => {
    setStep('3ds');
    setTimeout(() => setStep('processing'), 2000);
    setTimeout(() => {
      const success = Math.random() > 0.15; // 85% success
      if (success) {
        setStep('success');
        // Create transaction
        const ref = `INV-${new Date().getFullYear()}-DEMO`;
        paymentTransactionStore.create({
          company_id: 'comp-1', gateway_id: data.gateway_id,
          gateway_provider: defaultGateway?.provider || 'hyperpay',
          reference: ref, gateway_reference: `demo_${Date.now()}`,
          invoice_id: '', tenant_id: '',
          amount: data.amount, currency: data.currency,
          fee: Math.round(data.amount * 0.024 * 100) / 100,
          net_amount: data.amount - Math.round(data.amount * 0.024 * 100) / 100,
          method: data.payment_method as any,
          card_last4: data.card_number.replace(/\s/g, '').slice(-4),
          card_brand: 'visa', status: 'settled',
          customer_name: data.customer_name, customer_email: data.customer_email,
          customer_phone: data.customer_phone, description: data.description,
          ip_address: '127.0.0.1', error_code: '', error_message: '',
          initiated_at: new Date().toISOString(), authorized_at: new Date().toISOString(),
          captured_at: new Date().toISOString(), settled_at: new Date().toISOString(),
          refunded_at: '', refund_amount: 0, refund_reason: '', metadata: '{}',
        } as any);
      } else {
        setStep('failed');
      }
    }, 2500);
  };

  const reset = () => {
    setStep('form');
    setData(d => ({ ...d, card_number: '4242 4242 4242 4242', card_cvc: '123' }));
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="تجربة الدفع الإلكتروني (Checkout Demo)"
        description="محاكاة كاملة لبوابة الدفع المستضافة - لاختبار تجربة الدفع قبل ربط الإنتاج"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main checkout area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-emerald-600" />
                  صفحة دفع آمنة (Hosted Checkout)
                </CardTitle>
                <Badge variant="outline" className="text-[12px]">SSL/TLS 1.3</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {step === 'form' && (
                <FormStep data={data} setData={setData} gateways={gateways} onNext={handleStart} onCancel={() => navigate('/communication/payment-transactions')} />
              )}
              {step === 'method' && (
                <MethodStep onSelect={handleSelectMethod} onBack={() => setStep('form')} />
              )}
              {step === 'card' && (
                <CardStep data={data} setData={setData} onSubmit={handleSubmitCard} onBack={() => setStep('method')} />
              )}
              {step === '3ds' && <Step3DS />}
              {step === 'processing' && <ProcessingStep />}
              {step === 'success' && <SuccessStep data={data} onClose={() => navigate('/communication/payment-transactions')} onReset={reset} />}
              {step === 'failed' && <FailedStep onRetry={() => setStep('card')} onCancel={reset} />}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: summary + info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                ملخص الطلب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748d]">{tt('common.amount', 'المبلغ')}</span>
                <span className="font-bold text-lg">{formatQAR(data.amount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748d]">رسوم البوابة (2.4%)</span>
                <span>{formatQAR(data.amount * 0.024)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="text-[#64748d]">المبلغ الصافي</span>
                <span className="font-medium">{formatQAR(data.amount - data.amount * 0.024)}</span>
              </div>
              <div className="text-xs text-[#64748d] border-t pt-2 space-y-1">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {data.customer_name}
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {data.customer_email}
                </div>
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {data.customer_phone}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                الأمان والحماية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <Lock className="h-3.5 w-3.5 text-emerald-600 mt-0.5" />
                <span>تشفير 256-bit SSL</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5" />
                <span>متوافق مع PCI DSS Level 1</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5" />
                <span>مصادقة 3D Secure 2.0</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5" />
                <span>حماية من الاحتيال (ML-based)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5" />
                <span>SAMA / CBB معتمد</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">خطوات الدفع</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className={`flex items-center gap-2 ${step === 'form' ? 'text-[#533afd] font-bold' : 'text-[#64748d]'}`}>
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${step === 'form' ? 'bg-[#533afd] text-white' : 'bg-gray-200'}`}>1</span>
                  بيانات الدفع
                </li>
                <li className={`flex items-center gap-2 ${step === 'method' ? 'text-[#533afd] font-bold' : 'text-[#64748d]'}`}>
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${step === 'method' ? 'bg-[#533afd] text-white' : 'bg-gray-200'}`}>2</span>
                  وسيلة الدفع
                </li>
                <li className={`flex items-center gap-2 ${step === 'card' || step === '3ds' || step === 'processing' ? 'text-[#533afd] font-bold' : 'text-[#64748d]'}`}>
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${step === 'card' || step === '3ds' ? 'bg-[#533afd] text-white' : 'bg-gray-200'}`}>3</span>
                  المصادقة 3DS
                </li>
                <li className={`flex items-center gap-2 ${step === 'success' || step === 'failed' ? (step === 'success' ? 'text-emerald-600 font-bold' : 'text-[#ea2261] font-bold') : 'text-[#64748d]'}`}>
                  <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${step === 'success' || step === 'failed' ? (step === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white') : 'bg-gray-200'}`}>4</span>
                  النتيجة
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FormStep({ data, setData, gateways, onNext, onCancel }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label>اختر بوابة الدفع</Label>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          {gateways.map((g: any) => (
            <label key={g.id} className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${data.gateway_id === g.id ? 'border-[#533afd] bg-[rgba(83,58,253,0.06)]' : 'border-[#e5edf5] hover:border-[#e5edf5]'}`}>
              <input
                type="radio"
                name="gateway"
                value={g.id}
                checked={data.gateway_id === g.id}
                onChange={() => setData((d: any) => ({ ...d, gateway_id: g.id }))}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#533afd]" />
                <span className="font-medium text-sm">{g.display_name}</span>
              </div>
              <div className="text-[12px] text-[#64748d] mt-1">{g.supported_methods.length} وسائل دفع</div>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>المبلغ (ر.ق)</Label>
          <Input type="number" value={data.amount} onChange={(e: any) => setData((d: any) => ({ ...d, amount: parseFloat(e.target.value) || 0 }))} className="mt-1.5" />
        </div>
        <div>
          <Label>العملة</Label>
          <Input value={data.currency} disabled className="mt-1.5" />
        </div>
      </div>

      <div>
        <Label>{tt('maintenance.description', 'الوصف')}</Label>
        <Input value={data.description} onChange={(e: any) => setData((d: any) => ({ ...d, description: e.target.value }))} className="mt-1.5" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>اسم العميل</Label>
          <Input value={data.customer_name} onChange={(e: any) => setData((d: any) => ({ ...d, customer_name: e.target.value }))} className="mt-1.5" />
        </div>
        <div>
          <Label>{tt('hr.email', 'البريد الإلكتروني')}</Label>
          <Input type="email" value={data.customer_email} onChange={(e: any) => setData((d: any) => ({ ...d, customer_email: e.target.value }))} className="mt-1.5" />
        </div>
      </div>

      <div>
        <Label>{tt('hr.phone', 'رقم الجوال')}</Label>
        <Input value={data.customer_phone} onChange={(e: any) => setData((d: any) => ({ ...d, customer_phone: e.target.value }))} className="mt-1.5" />
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onCancel}><X className="h-4 w-4 ml-1" />{tt('common.cancel', 'إلغاء')}</Button>
        <Button onClick={onNext} className="bg-[#533afd] hover:bg-[#533afd]">
          المتابعة لوسيلة الدفع
          <ArrowLeft className="h-4 w-4 mr-1" />
        </Button>
      </div>
    </div>
  );
}

function MethodStep({ onSelect, onBack }: any) {
  return (
    <div className="space-y-3">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold">اختر وسيلة الدفع</h3>
        <p className="text-sm text-[#64748d]">جميع المعاملات آمنة ومشفرة</p>
      </div>
      <button onClick={() => onSelect('card')} className="w-full p-4 border-2 rounded-lg hover:border-[#533afd] hover:bg-[rgba(83,58,253,0.06)] transition-all flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <div className="text-right flex-1">
          <div className="font-bold">بطاقة بنكية</div>
          <div className="text-xs text-[#64748d]">Visa, Mastercard, Mada, Amex</div>
        </div>
        <ArrowLeft className="h-4 w-4 text-[#64748d]" />
      </button>
      <button onClick={() => onSelect('applepay')} className="w-full p-4 border-2 rounded-lg hover:border-[#533afd] hover:bg-[rgba(83,58,253,0.06)] transition-all flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-black flex items-center justify-center text-white text-xl"></div>
        <div className="text-right flex-1">
          <div className="font-bold">Apple Pay</div>
          <div className="text-xs text-[#64748d]">دفع سريع بالبصمة</div>
        </div>
        <ArrowLeft className="h-4 w-4 text-[#64748d]" />
      </button>
      <button onClick={() => onSelect('stcpay')} className="w-full p-4 border-2 rounded-lg hover:border-[#533afd] hover:bg-[rgba(83,58,253,0.06)] transition-all flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
          <Smartphone className="h-6 w-6 text-white" />
        </div>
        <div className="text-right flex-1">
          <div className="font-bold">STC Pay</div>
          <div className="text-xs text-[#64748d]">محفظة رقمية سعودية</div>
        </div>
        <ArrowLeft className="h-4 w-4 text-[#64748d]" />
      </button>
      <button onClick={() => onSelect('bank_transfer')} className="w-full p-4 border-2 rounded-lg hover:border-[#533afd] hover:bg-[rgba(83,58,253,0.06)] transition-all flex items-center gap-3">
        <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
          <Banknote className="h-6 w-6 text-white" />
        </div>
        <div className="text-right flex-1">
          <div className="font-bold">{tt('rentCollection.methods.bank_transfer', 'تحويل بنكي')}</div>
          <div className="text-xs text-[#64748d]">عبر SADAD أو IBAN</div>
        </div>
        <ArrowLeft className="h-4 w-4 text-[#64748d]" />
      </button>
      <Button variant="outline" onClick={onBack} className="w-full">عودة</Button>
    </div>
  );
}

function CardStep({ data, setData, onSubmit, onBack }: any) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs">بطاقة ائتمان</div>
          <CreditCard className="h-6 w-6" />
        </div>
        <div className="text-lg font-mono tracking-wider mb-2">{data.card_number || '•••• •••• •••• ••••'}</div>
        <div className="flex justify-between text-xs">
          <span>{data.card_holder || 'CARD HOLDER NAME'}</span>
          <span>{data.card_expiry || 'MM/YY'}</span>
        </div>
      </div>

      <div>
        <Label>رقم البطاقة</Label>
        <Input value={data.card_number} onChange={(e: any) => setData((d: any) => ({ ...d, card_number: e.target.value }))} placeholder="4242 4242 4242 4242" className="mt-1.5" dir="ltr" />
      </div>
      <div>
        <Label>الاسم على البطاقة</Label>
        <Input value={data.card_holder} onChange={(e: any) => setData((d: any) => ({ ...d, card_holder: e.target.value }))} className="mt-1.5" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{tt('documents.expiryDate', 'تاريخ الانتهاء')}</Label>
          <Input value={data.card_expiry} onChange={(e: any) => setData((d: any) => ({ ...d, card_expiry: e.target.value }))} placeholder="MM/YY" className="mt-1.5" dir="ltr" />
        </div>
        <div>
          <Label>CVC</Label>
          <Input value={data.card_cvc} onChange={(e: any) => setData((d: any) => ({ ...d, card_cvc: e.target.value }))} placeholder="123" className="mt-1.5" dir="ltr" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={data.save_card} onChange={(e: any) => setData((d: any) => ({ ...d, save_card: e.target.checked }))} />
        حفظ البطاقة للمشتريات المستقبلية
      </label>
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>عودة</Button>
        <Button onClick={onSubmit} className="bg-[#533afd] hover:bg-[#533afd]">
          ادفع {formatQAR(data.amount)}
          <Lock className="h-4 w-4 mr-1" />
        </Button>
      </div>
    </div>
  );
}

function Step3DS() {
  return (
    <div className="py-12 text-center">
      <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-[rgba(83,58,253,0.10)] flex items-center justify-center">
        <Shield className="h-8 w-8 text-[#533afd] animate-pulse" />
      </div>
      <h3 className="text-lg font-bold mb-2">التحقق من الهوية 3D Secure</h3>
      <p className="text-sm text-[#64748d] mb-4">جاري إرسال رمز التحقق إلى جوالك المسجل</p>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-[#9b6829] inline-block">
        💡 في الإنتاج: يتم إرسال OTP إلى رقم جوال العميل المرتبط بالبطاقة
      </div>
    </div>
  );
}

function ProcessingStep() {
  return (
    <div className="py-12 text-center">
      <Loader2 className="h-16 w-16 mx-auto mb-4 text-[#533afd] animate-spin" />
      <h3 className="text-lg font-bold mb-2">جاري معالجة الدفع...</h3>
      <p className="text-sm text-[#64748d]">يرجى عدم إغلاق هذه الصفحة</p>
    </div>
  );
}

function SuccessStep({ data, onClose, onReset }: any) {
  const ref = `INV-${new Date().getFullYear()}-DEMO`;
  return (
    <div className="py-12 text-center">
      <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
      </div>
      <h3 className="text-2xl font-bold text-emerald-700 mb-2">تمت العملية بنجاح!</h3>
      <p className="text-sm text-[#64748d] mb-6">شكراً لكم، تم استلام الدفع بنجاح</p>
      <div className="max-w-md mx-auto p-4 bg-[#f6f9fc] rounded-lg text-sm space-y-2">
        <div className="flex justify-between"><span className="text-[#64748d]">{tt('common.amount', 'المبلغ')}</span><span className="font-bold">{formatQAR(data.amount)}</span></div>
        <div className="flex justify-between"><span className="text-[#64748d]">مرجع المعاملة</span><code className="text-xs">{ref}</code></div>
        <div className="flex justify-between"><span className="text-[#64748d]">{tt('common.date', 'التاريخ')}</span><span>{formatDate(new Date().toISOString())}</span></div>
        <div className="flex justify-between"><span className="text-[#64748d]">البوابة</span><span>HyperPay</span></div>
      </div>
      <div className="flex gap-2 justify-center mt-6">
        <Button onClick={onReset} variant="outline">تجربة جديدة</Button>
        <Button onClick={onClose} className="bg-[#533afd] hover:bg-[#533afd]">
          عرض في سجل المعاملات
          <ArrowRight className="h-4 w-4 mr-1" />
        </Button>
      </div>
    </div>
  );
}

function FailedStep({ onRetry, onCancel }: any) {
  return (
    <div className="py-12 text-center">
      <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
        <AlertCircle className="h-12 w-12 text-[#ea2261]" />
      </div>
      <h3 className="text-2xl font-bold text-[#ea2261] mb-2">فشلت العملية</h3>
      <p className="text-sm text-[#64748d] mb-2">لم نتمكن من إكمال المعاملة</p>
      <div className="max-w-md mx-auto p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-[#ea2261] mb-4">
        <strong>السبب:</strong> تم رفض البطاقة من قبل البنك المُصدر. يرجى المحاولة بوسيلة دفع أخرى أو التواصل مع البنك.
      </div>
      <div className="flex gap-2 justify-center">
        <Button onClick={onCancel} variant="outline">{tt('common.cancel', 'إلغاء')}</Button>
        <Button onClick={onRetry} className="bg-[#533afd] hover:bg-[#533afd]">إعادة المحاولة</Button>
      </div>
    </div>
  );
}
