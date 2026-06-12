import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Webhook, Activity, CheckCircle2, XCircle, AlertCircle, Eye,
  Copy, RefreshCw, Clock, Hash, Server, Code, FileJson,
} from 'lucide-react';
import { paymentWebhookStore, paymentGatewayStore, getPaymentGatewayName } from '@/services/stores';
import type { PaymentWebhook, PaymentWebhookEvent, PaymentWebhookStatus } from '@/types';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

const eventLabels: Record<PaymentWebhookEvent, string> = {
  'payment.authorized': 'تم ترخيص الدفع',
  'payment.captured': 'تم تحصيل الدفع',
  'payment.failed': 'فشل الدفع',
  'payment.refunded': 'تم استرجاع الدفع',
  'payment.dispute.created': 'فُتح نزاع',
  'payment.dispute.closed': 'أُغلق نزاع',
  'subscription.charged': 'اشتراك محصّل',
  'payout.settled': 'تسوية',
};

const statusLabels: Record<PaymentWebhookStatus, string> = {
  received: 'مستلم',
  verified: 'مُتحقّق منه',
  processed: 'مُعالج',
  failed: 'فشل',
  ignored: 'مُتجاهل',
  retrying: 'إعادة محاولة',
};

const statusColors: Record<PaymentWebhookStatus, string> = {
  received: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  verified: 'bg-cyan-100 text-cyan-700',
  processed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-[#ea2261]',
  ignored: 'bg-gray-100 text-gray-700',
  retrying: 'bg-amber-100 text-[#9b6829]',
};

export default function PaymentWebhooksPage() {
  const { dir } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [view, setView] = useState<PaymentWebhook | null>(null);

  const webhooks = useMemo(() => {
    const data = paymentWebhookStore.getAll();
    return data.filter(w => {
      if (statusFilter !== 'all' && w.status !== statusFilter) return false;
      if (eventFilter !== 'all' && w.event !== eventFilter) return false;
      if (search && !w.payload_json.toLowerCase().includes(search.toLowerCase()) &&
          !w.transaction_id.toLowerCase().includes(search.toLowerCase()) &&
          !w.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => (b.received_at || '').localeCompare(a.received_at || ''));
  }, [refresh, search, statusFilter, eventFilter]);

  const stats = useMemo(() => {
    const all = paymentWebhookStore.getAll();
    return {
      total: all.length,
      processed: all.filter(w => w.status === 'processed').length,
      failed: all.filter(w => w.status === 'failed' || w.status === 'retrying').length,
      invalidSig: all.filter(w => !w.signature_valid).length,
      processedRate: all.length > 0 ? Math.round((all.filter(w => w.status === 'processed').length / all.length) * 100) : 0,
    };
  }, [refresh]);

  const handleRetry = (w: PaymentWebhook) => {
    paymentWebhookStore.update(w.id, {
      status: 'retrying',
      retry_count: w.retry_count + 1,
      last_error: '',
    });
    toast.success(`جاري إعادة محاولة المعالجة #${w.id}`);
    setRefresh(r => r + 1);
  };

  const copyPayload = (w: PaymentWebhook) => {
    navigator.clipboard.writeText(w.payload_json);
    toast.success('تم نسخ الـ Payload');
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="سجل Webhooks الدفع"
        description="تتبع ومعالجة أحداث البوابات (Webhooks)"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="إجمالي الأحداث" value={stats.total} icon={<Webhook className="h-5 w-5" />} color="blue" />
        <KpiCard label="مُعالَجة" value={stats.processed} sublabel={`${stats.processedRate}%`} icon={<CheckCircle2 className="h-5 w-5" />} color="green" />
        <KpiCard label="فشلت" value={stats.failed} icon={<XCircle className="h-5 w-5" />} color="red" />
        <KpiCard label="إعادة محاولة" value={webhooks.filter(w => w.status === 'retrying').length} icon={<RefreshCw className="h-5 w-5" />} color="orange" />
        <KpiCard label="توقيع غير صالح" value={stats.invalidSig} icon={<AlertCircle className="h-5 w-5" />} color="red" />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="بحث في الـ Payload أو المرجع..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder={t.legal.status || tt('legal.status','الحالة')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger><SelectValue placeholder="نوع الحدث" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأحداث</SelectItem>
                {Object.entries(eventLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-[#f6f9fc] text-[#64748d] text-xs">
              <tr>
                <th className="text-right p-3">الحدث</th>
                <th className="text-right p-3">البوابة</th>
                <th className="text-right p-3">{tt('legal.status', 'الحالة')}</th>
                <th className="text-right p-3">التوقيع</th>
                <th className="text-right p-3">المعاملة</th>
                <th className="text-right p-3">المحاولات</th>
                <th className="text-right p-3">استُلم في</th>
                <th className="text-right p-3">{tt('common.actions', 'إجراءات')}</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-12">
                    <Webhook className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                    <div className="text-[#64748d]">لا توجد webhooks</div>
                  </td>
                </tr>
              ) : webhooks.map(w => (
                <tr key={w.id} className="border-t hover:bg-[#f6f9fc]">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded bg-[rgba(83,58,253,0.06)] flex items-center justify-center">
                        <Code className="h-4 w-4 text-[#533afd]" />
                      </div>
                      <div>
                        <div className="font-medium text-xs">{eventLabels[w.event]}</div>
                        <code className="text-xs text-[#64748d]">{w.event}</code>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-xs">{getPaymentGatewayName(w.gateway_id)}</td>
                  <td className="p-3">
                    <Badge className={statusColors[w.status]}>
                      {statusLabels[w.status]}
                    </Badge>
                  </td>
                  <td className="p-3">
                    {w.signature_valid ? (
                      <Badge className="bg-emerald-100 text-emerald-700">✓ صالح</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-[#ea2261]">✗ غير صالح</Badge>
                    )}
                  </td>
                  <td className="p-3"><code className="text-xs">{w.transaction_id}</code></td>
                  <td className="p-3 text-center">{w.retry_count}</td>
                  <td className="p-3 text-xs text-[#64748d]">{formatDate(w.received_at)}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setView(w)} title="عرض">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copyPayload(w)} title="نسخ">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      {(w.status === 'failed' || w.status === 'retrying') && (
                        <Button size="sm" variant="ghost" onClick={() => handleRetry(w)} title="إعادة">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {view && <WebhookDialog webhook={view} onClose={() => setView(null)} onRetry={() => { handleRetry(view); setView(null); }} />}
    </div>
  );
}

function WebhookDialog({ webhook, onClose, onRetry }: {
  webhook: PaymentWebhook;
  onClose: () => void;
  onRetry: () => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            تفاصيل Webhook
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المعرف</span><code className="text-xs">{webhook.id}</code></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">الحدث</span><Badge variant="outline">{eventLabels[webhook.event]}</Badge></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">البوابة</span><span>{getPaymentGatewayName(webhook.gateway_id)}</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('legal.status', 'الحالة')}</span><Badge className={statusColors[webhook.status]}>{statusLabels[webhook.status]}</Badge></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">التوقيع</span><code className="text-xs">{webhook.signature}</code></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">صلاحية التوقيع</span>{webhook.signature_valid ? <Badge className="bg-emerald-100 text-emerald-700">✓</Badge> : <Badge className="bg-red-100 text-[#ea2261]">✗</Badge>}</div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">IP المصدر</span><code className="text-xs">{webhook.ip_address}</code></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المعاملة</span><code className="text-xs">{webhook.transaction_id}</code></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">استُلم في</span><span className="text-xs">{formatDate(webhook.received_at)}</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">عُولج في</span><span className="text-xs">{webhook.processed_at ? formatDate(webhook.processed_at) : '-'}</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المحاولات</span><span>{webhook.retry_count}</span></div>
            {webhook.last_error && (
              <div className="col-span-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-[#ea2261]">
                <strong>آخر خطأ:</strong> {webhook.last_error}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Payload</div>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(webhook.payload_json); toast.success('تم نسخ الـ Payload'); }}>
                <Copy className="h-3.5 w-3.5 ml-1" /> نسخ
              </Button>
            </div>
            <pre className="p-3 bg-gray-900 text-green-400 rounded-lg text-xs overflow-x-auto" dir="ltr">
{JSON.stringify(JSON.parse(webhook.payload_json || '{}'), null, 2)}
            </pre>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          {(webhook.status === 'failed' || webhook.status === 'retrying') && (
            <Button onClick={onRetry} className="bg-[#533afd] hover:bg-[#533afd]">
              <RefreshCw className="h-4 w-4 ml-1" /> إعادة محاولة
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
