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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail, Eye, MousePointerClick, XCircle, CheckCircle2, AlertTriangle, Send,
  Search, Activity, BarChart3, TrendingUp, Users, Globe,
} from 'lucide-react';
import { emailMessageStore, emailProviderStore, emailCampaignStore, getEmailProviderName } from '@/services/stores';
import type { EmailMessage, EmailStatus } from '@/types';
import { formatDate } from '@/lib/format';

const statusMeta: Record<EmailStatus, { label: string; color: string }> = {
  queued: { label: 'قيد الانتظار', color: 'bg-gray-100 text-gray-700' },
  sent: { label: 'مُرسل', color: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]' },
  delivered: { label: 'تم التسليم', color: 'bg-cyan-100 text-cyan-700' },
  opened: { label: 'مفتوح', color: 'bg-emerald-100 text-emerald-700' },
  clicked: { label: 'تم النقر', color: 'bg-green-100 text-green-700' },
  bounced: { label: 'مرتجع', color: 'bg-red-100 text-[#ea2261]' },
  failed: { label: 'فشل', color: 'bg-red-100 text-[#ea2261]' },
  spam: { label: 'بريد مزعج', color: 'bg-orange-100 text-orange-700' },
};

export default function EmailDeliveryLogPage() {
  const { dir } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [view, setView] = useState<EmailMessage | null>(null);

  const messages = useMemo(() => {
    const data = emailMessageStore.getAll();
    return data.filter(m => {
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (providerFilter !== 'all' && m.provider_id !== providerFilter) return false;
      if (search && !m.to_email.toLowerCase().includes(search.toLowerCase()) && !m.to_name.toLowerCase().includes(search.toLowerCase()) && !m.subject.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  }, [refresh, search, statusFilter, providerFilter]);

  const providers = useMemo(() => emailProviderStore.getAll(), [refresh]);

  const stats = useMemo(() => {
    const all = emailMessageStore.getAll();
    return {
      total: all.length, opened: all.filter(m => m.status === 'opened' || m.status === 'clicked').length,
      clicked: all.filter(m => m.clicked_count > 0).length, bounced: all.filter(m => m.status === 'bounced').length,
      avgOpenRate: all.filter(m => m.open_rate > 0).length > 0 ? Math.round(all.filter(m => m.open_rate > 0).reduce((s, m) => s + m.open_rate, 0) / all.filter(m => m.open_rate > 0).length) : 0,
    };
  }, [refresh]);

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader title="سجل إرسال البريد" description="تتبع جميع رسائل البريد الإلكتروني المرسلة" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="إجمالي الرسائل" value={stats.total} icon={<Mail className="h-5 w-5" />} color="blue" />
        <KpiCard label="معدل الفتح" value={`${stats.avgOpenRate}%`} icon={<Eye className="h-5 w-5" />} color="green" />
        <KpiCard label="مفتوحة" value={stats.opened} icon={<Eye className="h-5 w-5" />} color="emerald" />
        <KpiCard label="تم النقر" value={stats.clicked} icon={<MousePointerClick className="h-5 w-5" />} color="violet" />
        <KpiCard label="مرتجع" value={stats.bounced} icon={<AlertTriangle className="h-5 w-5" />} color="red" />
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="بحث بالبريد، الاسم، الموضوع..." value={search} onChange={e => setSearch(e.target.value)} />
            <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger><SelectValue placeholder={t.legal.status || tt('legal.status','الحالة')} /></SelectTrigger><SelectContent><SelectItem value="all">جميع الحالات</SelectItem>{Object.entries(statusMeta).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
            <Select value={providerFilter} onValueChange={setProviderFilter}><SelectTrigger><SelectValue placeholder="المزود" /></SelectTrigger><SelectContent><SelectItem value="all">كل المزودين</SelectItem>{providers.map(p => <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}</SelectContent></Select>
          </div>
        </CardContent>
      </Card>

      <Card><CardContent className="p-0">
        <table className="w-full text-sm"><thead className="bg-[#f6f9fc] text-[#64748d] text-xs"><tr><th className="text-right p-3">المستلم</th><th className="text-right p-3">الموضوع</th><th className="text-right p-3">المزود</th><th className="text-right p-3">{tt('legal.status', 'الحالة')}</th><th className="text-right p-3">فتح/نقر</th><th className="text-right p-3">{tt('common.date', 'التاريخ')}</th><th className="text-right p-3">{tt('common.actions', 'إجراءات')}</th></tr></thead>
        <tbody>
          {messages.length === 0 ? <tr><td colSpan={7} className="text-center p-12"><Mail className="h-12 w-12 text-gray-300 mx-auto mb-2" /><div className="text-[#64748d]">لا توجد رسائل</div></td></tr> :
            messages.map(m => (
              <tr key={m.id} className="border-t hover:bg-[#f6f9fc]">
                <td className="p-3"><div className="font-medium text-xs">{m.to_name}</div><code className="text-xs text-[#64748d]">{m.to_email}</code></td>
                <td className="p-3"><div className="max-w-xs truncate text-xs font-medium">{m.subject}</div></td>
                <td className="p-3 text-xs">{getEmailProviderName(m.provider_id)}</td>
                <td className="p-3"><Badge className={statusMeta[m.status]?.color}>{statusMeta[m.status]?.label}</Badge></td>
                <td className="p-3 text-xs">{m.opened_count} فتح / {m.clicked_count} نقر</td>
                <td className="p-3 text-xs text-[#64748d]">{formatDate(m.created_at)}</td>
                <td className="p-3"><Button size="sm" variant="ghost" onClick={() => setView(m)}><Eye className="h-3.5 w-3.5" /></Button></td>
              </tr>
            ))}
        </tbody></table>
      </CardContent></Card>

      {view && (
        <Dialog open onOpenChange={() => setView(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={dir}>
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />تفاصيل البريد</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('common.to', 'إلى')}</span><span>{view.to_name} &lt;{view.to_email}&gt;</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">نسخة</span><span>{view.cc || '-'}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">الموضوع</span><span className="font-medium">{view.subject}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المزود</span><span>{getEmailProviderName(view.provider_id)}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('legal.status', 'الحالة')}</span><Badge className={statusMeta[view.status]?.color}>{statusMeta[view.status]?.label}</Badge></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">مرات الفتح</span><span>{view.opened_count}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">مرات النقر</span><span>{view.clicked_count}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">معدل الفتح</span><span>{view.open_rate}%</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">مُرسل في</span><span className="text-xs">{formatDate(view.sent_at)}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">فتح في</span><span className="text-xs">{view.opened_at ? formatDate(view.opened_at) : '-'}</span></div>
                {view.error_message && <div className="col-span-2 p-2 bg-red-50 text-[#ea2261] text-xs rounded">{view.error_message}</div>}
              </div>
              <div><div className="font-medium mb-1">المحتوى</div><div className="border rounded-lg p-4 max-h-64 overflow-y-auto" dangerouslySetInnerHTML={{ __html: view.body_html }} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setView(null)}>إغلاق</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
