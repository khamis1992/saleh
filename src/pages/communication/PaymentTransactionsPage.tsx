import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Filter, Eye, RotateCcw, Download, Send, Receipt,
  CreditCard, CheckCircle2, XCircle, AlertCircle, Clock, RefreshCw,
  TrendingUp, Activity, DollarSign, Smartphone, Banknote, ArrowRight,
  FileText, Copy,
} from 'lucide-react';
import { paymentTransactionStore, paymentGatewayStore, tenantStore, getPaymentGatewayName } from '@/services/stores';
import type { PaymentTransaction, PaymentTransactionStatus, GatewayPaymentMethod } from '@/types';
import { toast } from 'sonner';
import { formatQAR, formatQARInt, formatDate } from '@/lib/format';

const methodLabels: Record<string, { name: string; icon: string; color: string }> = {
  mada: { name: 'Mada', icon: '💳', color: 'bg-emerald-100 text-emerald-700' },
  visa: { name: 'Visa', icon: '💳', color: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]' },
  mastercard: { name: 'Mastercard', icon: '💳', color: 'bg-red-100 text-[#ea2261]' },
  amex: { name: 'Amex', icon: '💳', color: 'bg-cyan-100 text-cyan-700' },
  applepay: { name: 'Apple Pay', icon: '', color: 'bg-gray-100 text-gray-700' },
  stcpay: { name: 'STC Pay', icon: '📱', color: 'bg-violet-100 text-violet-700' },
  benefit: { name: 'Benefit', icon: '💳', color: 'bg-pink-100 text-pink-700' },
  knet: { name: 'KNET', icon: '💳', color: 'bg-amber-100 text-[#9b6829]' },
  omannet: { name: 'OmanNet', icon: '💳', color: 'bg-orange-100 text-orange-700' },
  bank_transfer: { name: 'حوالة بنكية', icon: '🏦', color: 'bg-indigo-100 text-indigo-700' },
};

const statusIcons: Record<PaymentTransactionStatus, React.ElementType> = {
  initiated: Clock,
  awaiting_3ds: AlertCircle,
  authorized: CheckCircle2,
  captured: CheckCircle2,
  settled: CheckCircle2,
  failed: XCircle,
  declined: XCircle,
  refunded: RotateCcw,
  partially_refunded: RotateCcw,
  voided: XCircle,
  expired: Clock,
  disputed: AlertCircle,
};

const statusLabels: Record<PaymentTransactionStatus, string> = {
  initiated: 'بدأت',
  awaiting_3ds: 'بانتظار 3DS',
  authorized: 'مُرخّص',
  captured: 'محصّل',
  settled: 'مُسوّى',
  failed: 'فشل',
  declined: t.hr.rejected || tt('hr.rejected','مرفوض'),
  refunded: 'مُسترجع',
  partially_refunded: 'استرجاع جزئي',
  voided: t.maintenance.statuses.cancelled || tt('maintenance.statuses.cancelled','ملغي'),
  expired: t.leases.statuses.terminated || tt('leases.statuses.terminated','منتهي'),
  disputed: 'متنازع عليه',
};

export default function PaymentTransactionsPage() {
  const { dir } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gatewayFilter, setGatewayFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [view, setView] = useState<PaymentTransaction | null>(null);
  const [refunding, setRefunding] = useState<PaymentTransaction | null>(null);

  const transactions = useMemo(() => {
    const data = paymentTransactionStore.getAll();
    return data.filter(t => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (gatewayFilter !== 'all' && t.gateway_id !== gatewayFilter) return false;
      if (methodFilter !== 'all' && t.method !== methodFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!t.reference.toLowerCase().includes(s) &&
            !t.customer_name.toLowerCase().includes(s) &&
            !t.customer_email.toLowerCase().includes(s) &&
            !t.gateway_reference.toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((a, b) => (b.initiated_at || '').localeCompare(a.initiated_at || ''));
  }, [refresh, search, statusFilter, gatewayFilter, methodFilter]);

  const gateways = useMemo(() => paymentGatewayStore.getAll(), [refresh]);

  const stats = useMemo(() => {
    const all = paymentTransactionStore.getAll();
    const settled = all.filter(t => t.status === 'settled' || t.status === 'captured');
    const failed = all.filter(t => t.status === 'failed' || t.status === 'declined');
    const refunded = all.filter(t => t.status === 'refunded' || t.status === 'partially_refunded');
    return {
      total: all.length,
      settled: settled.length,
      failed: failed.length,
      refunded: refunded.length,
      totalVolume: settled.reduce((s, t) => s + t.amount, 0),
      totalFees: settled.reduce((s, t) => s + t.fee, 0),
      totalNet: settled.reduce((s, t) => s + t.net_amount, 0),
      successRate: all.length > 0 ? Math.round((settled.length / all.length) * 100) : 0,
    };
  }, [refresh]);

  const handleRefund = (t: PaymentTransaction, amount: number, reason: string) => {
    const newStatus: PaymentTransactionStatus = amount >= t.amount ? 'refunded' : 'partially_refunded';
    paymentTransactionStore.update(t.id, {
      status: newStatus,
      refund_amount: amount,
      refund_reason: reason,
      refunded_at: new Date().toISOString(),
    });
    toast.success(`تم استرجاع ${formatQAR(amount)} بنجاح`);
    setRefunding(null); setRefresh(r => r + 1);
  };

  const handleRetry = (t: PaymentTransaction) => {
    paymentTransactionStore.update(t.id, {
      status: 'initiated',
      error_code: '',
      error_message: '',
      initiated_at: new Date().toISOString(),
    });
    toast.success(`تم إعادة محاولة المعاملة ${t.reference}`);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="معاملات الدفع"
        description="تتبع وإدارة جميع معاملات الدفع الإلكتروني"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="إجمالي المعاملات" value={stats.total} icon={<Activity className="h-5 w-5" />} color="blue" />
        <KpiCard label="ناجحة" value={stats.settled} sublabel={`${stats.successRate}%`} icon={<CheckCircle2 className="h-5 w-5" />} color="green" />
        <KpiCard label="فشلت" value={stats.failed} icon={<XCircle className="h-5 w-5" />} color="red" />
        <KpiCard label="حجم التداول" value={`${formatQARInt(stats.totalVolume)} ر.ق`} icon={<TrendingUp className="h-5 w-5" />} color="emerald" />
        <KpiCard label="إجمالي الرسوم" value={`${formatQARInt(stats.totalFees)} ر.ق`} icon={<DollarSign className="h-5 w-5" />} color="orange" />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
                <Input
                  placeholder="بحث بالمرجع، العميل، البريد..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pr-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder={t.legal.status || tt('legal.status','الحالة')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={gatewayFilter} onValueChange={setGatewayFilter}>
              <SelectTrigger><SelectValue placeholder="البوابة" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل البوابات</SelectItem>
                {gateways.map(g => <SelectItem key={g.id} value={g.id}>{g.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger><SelectValue placeholder="وسيلة الدفع" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الوسائل</SelectItem>
                {Object.entries(methodLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f6f9fc] text-[#64748d] text-xs">
                <tr>
                  <th className="text-right p-3">المرجع</th>
                  <th className="text-right p-3">العميل</th>
                  <th className="text-right p-3">{tt('common.amount', 'المبلغ')}</th>
                  <th className="text-right p-3">الوسيلة</th>
                  <th className="text-right p-3">البوابة</th>
                  <th className="text-right p-3">{tt('legal.status', 'الحالة')}</th>
                  <th className="text-right p-3">{tt('common.date', 'التاريخ')}</th>
                  <th className="text-right p-3">{tt('common.actions', 'إجراءات')}</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-12">
                      <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <div className="text-[#64748d]">لا توجد معاملات تطابق البحث</div>
                    </td>
                  </tr>
                ) : transactions.map(t => {
                  const Icon = statusIcons[t.status] || Clock;
                  const method = (methodLabels as any)[t.method] || { name: t.method, icon: '💳', color: 'gray' };
                  return (
                    <tr key={t.id} className="border-t hover:bg-[#f6f9fc]">
                      <td className="p-3">
                        <div>
                          <code className="text-xs font-medium">{t.reference}</code>
                          <div className="text-[12px] text-[#64748d] font-mono">{t.gateway_reference}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{t.customer_name}</div>
                        <div className="text-[12px] text-[#64748d]">{t.customer_email}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold">{formatQAR(t.amount)}</div>
                        {t.fee > 0 && <div className="text-[12px] text-[#64748d]">رسوم: {formatQAR(t.fee)}</div>}
                      </td>
                      <td className="p-3">
                        <Badge className={method?.color}>
                          <span className="ml-1">{method?.icon}</span> {method?.name}
                          {t.card_last4 && <span className="mr-1">••{t.card_last4}</span>}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs">{getPaymentGatewayName(t.gateway_id)}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="gap-1">
                          <Icon className="h-3 w-3" />
                          {statusLabels[t.status]}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs text-[#64748d]">
                        {t.initiated_at ? formatDate(t.initiated_at) : '-'}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setView(t)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {(t.status === 'captured' || t.status === 'settled') && (
                            <Button size="sm" variant="ghost" onClick={() => setRefunding(t)} title="استرجاع">
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {(t.status === 'failed' || t.status === 'declined') && (
                            <Button size="sm" variant="ghost" onClick={() => handleRetry(t)} title="إعادة محاولة">
                              <RefreshCw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {view && <TransactionDialog transaction={view} onClose={() => setView(null)} onRefund={() => { setRefunding(view); setView(null); }} />}
      {refunding && <RefundDialog transaction={refunding} onClose={() => setRefunding(null)} onConfirm={handleRefund} />}
    </div>
  );
}

function TransactionDialog({ transaction, onClose, onRefund }: {
  transaction: PaymentTransaction;
  onClose: () => void;
  onRefund: () => void;
}) {
  const meta = (methodLabels as any)[transaction.method] || { name: transaction.method, icon: '💳', color: 'gray' };
  const timeline: Array<{ label: string; time: string; status: 'done' | 'pending' | 'failed'; icon: React.ElementType }> = [
    { label: 'بدء المعاملة', time: transaction.initiated_at, status: 'done', icon: Activity },
    { label: 'التحقق 3D Secure', time: transaction.authorized_at || transaction.initiated_at, status: transaction.authorized_at ? 'done' : transaction.status === 'awaiting_3ds' ? 'pending' : 'failed', icon: Shield },
    { label: 'الترخيص', time: transaction.authorized_at, status: transaction.authorized_at ? 'done' : 'pending', icon: CheckCircle2 },
    { label: 'التحصيل', time: transaction.captured_at, status: transaction.captured_at ? 'done' : 'pending', icon: CheckCircle2 },
    { label: 'التسوية', time: transaction.settled_at, status: transaction.settled_at ? 'done' : 'pending', icon: Banknote },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            تفاصيل المعاملة
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
            <div>
              <div className="text-xs text-[#64748d]">{tt('common.amount', 'المبلغ')}</div>
              <div className="text-2xl font-bold text-[#533afd]">{formatQAR(transaction.amount)}</div>
            </div>
            <div className="text-left">
              <Badge className={meta?.color}>{meta?.icon} {meta?.name}</Badge>
              {transaction.card_last4 && <div className="text-xs text-[#64748d] mt-1">•••• {transaction.card_last4}</div>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المرجع</span><code className="text-xs">{transaction.reference}</code></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">مرجع البوابة</span><code className="text-xs">{transaction.gateway_reference}</code></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">العميل</span><span className="font-medium">{transaction.customer_name}</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">البريد</span><span className="text-xs">{transaction.customer_email}</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('tenants.phone', 'الهاتف')}</span><span>{transaction.customer_phone}</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">IP</span><code className="text-xs">{transaction.ip_address}</code></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">الرسوم</span><span>{formatQAR(transaction.fee)}</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المبلغ الصافي</span><span className="font-medium">{formatQAR(transaction.net_amount)}</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('maintenance.description', 'الوصف')}</span><span className="text-xs">{transaction.description}</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('legal.status', 'الحالة')}</span><Badge variant="outline">{statusLabels[transaction.status]}</Badge></div>
          </div>

          {transaction.error_message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-xs font-medium text-[#ea2261]">خطأ: {transaction.error_code}</div>
              <div className="text-sm text-[#ea2261]">{transaction.error_message}</div>
            </div>
          )}

          {transaction.refund_amount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm font-medium text-[#9b6829]">استرجاع بمبلغ {formatQAR(transaction.refund_amount)}</div>
              <div className="text-xs text-[#9b6829]">السبب: {transaction.refund_reason}</div>
            </div>
          )}

          {/* Timeline */}
          <div>
            <div className="text-sm font-medium mb-2">المسار الزمني</div>
            <div className="space-y-2">
              {timeline.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      step.status === 'done' ? 'bg-emerald-100 text-emerald-700' :
                      step.status === 'failed' ? 'bg-red-100 text-[#ea2261]' : 'bg-gray-100 text-[#64748d]'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{step.label}</div>
                      <div className="text-[12px] text-[#64748d]">{step.time ? formatDate(step.time) : '-'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          {(transaction.status === 'captured' || transaction.status === 'settled') && (
            <Button onClick={onRefund} className="bg-[#9b6829] hover:bg-amber-600">
              <RotateCcw className="h-4 w-4 ml-1" /> استرجاع
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RefundDialog({ transaction, onClose, onConfirm }: {
  transaction: PaymentTransaction;
  onClose: () => void;
  onConfirm: (t: PaymentTransaction, amount: number, reason: string) => void;
}) {
  const [amount, setAmount] = useState(transaction.amount);
  const [reason, setReason] = useState('');
  const refundable = transaction.amount - transaction.refund_amount;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-amber-500" />
            استرجاع المبلغ
          </DialogTitle>
          <DialogDescription>
            استرجاع مبلغ من المعاملة {transaction.reference}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="p-3 bg-[#f6f9fc] rounded-lg text-sm">
            <div className="flex justify-between"><span>المبلغ الأصلي:</span><span className="font-bold">{formatQAR(transaction.amount)}</span></div>
            <div className="flex justify-between"><span>المسترجع سابقاً:</span><span className="font-bold">{formatQAR(transaction.refund_amount)}</span></div>
            <div className="flex justify-between border-t mt-1 pt-1"><span>القابل للاسترجاع:</span><span className="font-bold text-[#9b6829]">{formatQAR(refundable)}</span></div>
          </div>
          <div>
            <Label>مبلغ الاسترجاع</Label>
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(parseFloat(e.target.value) || 0)}
              max={refundable}
              min={0}
              step="0.01"
              className="mt-1.5"
            />
          </div>
          <div>
            <Label>سبب الاسترجاع</Label>
            <Input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="مثال: إلغاء عقد، خطأ في المبلغ..."
              className="mt-1.5"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tt('common.cancel', 'إلغاء')}</Button>
          <Button
            onClick={() => onConfirm(transaction, amount, reason)}
            disabled={amount <= 0 || amount > refundable || !reason}
            className="bg-[#9b6829] hover:bg-amber-600"
          >
            تأكيد الاسترجاع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Shield } from 'lucide-react';
