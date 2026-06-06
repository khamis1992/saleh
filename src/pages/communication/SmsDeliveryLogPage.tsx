import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  MessageSquare, Send, CheckCircle2, XCircle, Clock, Eye, Smartphone,
  Search, Filter, Hash, AlertTriangle, RefreshCw, ArrowDownToLine, Phone,
} from 'lucide-react';
import { smsMessageStore, smsProviderStore, getSmsProviderName } from '@/services/stores';
import type { SmsMessage, SmsStatus } from '@/types';
import { formatDate, formatQAR } from '@/lib/format';

const statusMeta: Record<SmsStatus, { label: string; icon: React.ElementType; color: string }> = {
  queued: { label: 'قيد الانتظار', icon: Clock, color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'مُرسل', icon: Send, color: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]' },
  delivered: { label: 'تم التسليم', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
  failed: { label: 'فشل', icon: XCircle, color: 'bg-red-100 text-[#ea2261]' },
  undelivered: { label: 'لم يُسلم', icon: AlertTriangle, color: 'bg-amber-100 text-[#9b6829]' },
  rejected: { label: t.hr.rejected || tt('hr.rejected','مرفوض'), icon: XCircle, color: 'bg-red-100 text-[#ea2261]' },
};

export default function SmsDeliveryLogPage() {
  const { dir } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [view, setView] = useState<SmsMessage | null>(null);

  const messages = useMemo(() => {
    const data = smsMessageStore.getAll();
    return data.filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (providerFilter !== 'all' && m.provider_id !== providerFilter) return false;
      if (search && !m.to_phone.includes(search) && !m.to_name.toLowerCase().includes(search.toLowerCase()) && !m.body.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [refresh, search, statusFilter, providerFilter]);

  const providers = useMemo(() => smsProviderStore.getAll(), [refresh]);

  const stats = useMemo(() => {
    const all = smsMessageStore.getAll();
    const delivered = all.filter(m => m.status === 'delivered');
    const failed = all.filter(m => m.status === 'failed' || m.status === 'undelivered' || m.status === 'rejected');
    return {
      total: all.length, delivered: delivered.length, failed: failed.length,
      totalCost: all.reduce((s, m) => s + m.cost, 0),
      deliveryRate: all.length > 0 ? Math.round((delivered.length / all.length) * 100) : 0,
    };
  }, [refresh]);

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader title="سجل إرسال SMS" description="تتبع جميع الرسائل النصية المرسلة وفشل التسليم" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="إجمالي الرسائل" value={stats.total} icon={<MessageSquare className="h-5 w-5" />} color="blue" />
        <KpiCard label="تم التسليم" value={stats.delivered} sublabel={`${stats.deliveryRate}%`} icon={<CheckCircle2 className="h-5 w-5" />} color="green" />
        <KpiCard label="فشل" value={stats.failed} icon={<XCircle className="h-5 w-5" />} color="red" />
        <KpiCard label="بالمتوسط" value="0.045  ر.ق" icon={<Hash className="h-5 w-5" />} color="violet" />
        <KpiCard label="تكلفة إجمالية" value={`${stats.totalCost.toFixed(2)} ر.ق`} icon={<ArrowDownToLine className="h-5 w-5" />} color="orange" />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="بحث بالرقم، الاسم، أو المحتوى..." value={search} onChange={e => setSearch(e.target.value)} />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder={t.legal.status || tt('legal.status','الحالة')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(statusMeta).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger><SelectValue placeholder="المزود" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المزودين</SelectItem>
                {providers.map(p => <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm"><thead className="bg-[#f6f9fc] text-[#64748d] text-xs">
            <tr><th className="text-right p-3">المستلم</th><th className="text-right p-3">المحتوى</th><th className="text-right p-3">المزود</th><th className="text-right p-3">{tt('legal.status', 'الحالة')}</th><th className="text-right p-3">{tt('maintenance.cost', 'التكلفة')}</th><th className="text-right p-3">{tt('common.date', 'التاريخ')}</th><th className="text-right p-3">{tt('common.actions', 'إجراءات')}</th></tr></thead>
            <tbody>
              {messages.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-12"><MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-2" /><div className="text-[#64748d]">لا توجد رسائل</div></td></tr>
              ) : messages.map(m => {
                const meta = statusMeta[m.status];
                const Icon = meta.icon;
                return (
                  <tr key={m.id} className="border-t hover:bg-[#f6f9fc]">
                    <td className="p-3"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center"><Smartphone className="h-4 w-4 text-violet-600" /></div><div><div className="font-medium text-xs">{m.to_name}</div><code className="text-[12px] text-[#64748d]">{m.to_phone}</code></div></div></td>
                    <td className="p-3"><div className="max-w-xs truncate text-xs">{m.body}</div></td>
                    <td className="p-3 text-xs">{getSmsProviderName(m.provider_id)}</td>
                    <td className="p-3"><Badge className={meta.color}><Icon className="h-3 w-3 ml-1" />{meta.label}</Badge>{m.error_message && <div className="text-[12px] text-[#ea2261] mt-1">{m.error_message}</div>}</td>
                    <td className="p-3 text-xs">{formatQAR(m.cost)}</td>
                    <td className="p-3 text-xs text-[#64748d]">{formatDate(m.created_at)}</td>
                    <td className="p-3"><Button size="sm" variant="ghost" onClick={() => setView(m)}><Eye className="h-3.5 w-3.5" /></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {view && (
        <Dialog open onOpenChange={() => setView(null)}>
          <DialogContent className="max-w-lg" dir={dir}>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5" />تفاصيل الرسالة</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="p-4 bg-[#f6f9fc] rounded-lg text-xs" style={{ whiteSpace: 'pre-wrap' }}>{view.body}</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المستلم</span><span>{view.to_name}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">الرقم</span><code className="text-xs">{view.to_phone}</code></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المزود</span><span>{getSmsProviderName(view.provider_id)}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">Sender ID</span><code className="text-xs">{view.sender_id}</code></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المقاطع</span><span>{view.segments}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('maintenance.cost', 'التكلفة')}</span><span>{formatQAR(view.cost)}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('legal.status', 'الحالة')}</span><Badge className={statusMeta[view.status]?.color}>{statusMeta[view.status]?.label}</Badge></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">مُرسل في</span><span className="text-xs">{formatDate(view.sent_at)}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">تم التسليم في</span><span className="text-xs">{view.delivered_at ? formatDate(view.delivered_at) : '-'}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">مرجع البوابة</span><code className="text-xs">{view.gateway_message_id}</code></div>
                {view.error_message && <div className="col-span-2 p-2 bg-red-50 text-[#ea2261] text-xs rounded">{view.error_code}: {view.error_message}</div>}
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setView(null)}>إغلاق</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
