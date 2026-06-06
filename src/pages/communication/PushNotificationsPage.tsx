import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Bell, Send, Smartphone, Globe, Users, CheckCircle2, XCircle, Eye, Edit, Plus, Star, Activity, Monitor, Phone, BarChart3 } from 'lucide-react';
import { pushProviderStore, pushSubscriberStore, pushCampaignStore, getPushProviderName } from '@/services/stores';
import type { PushProviderConfig, PushSubscriber, PushCampaign, PushProvider } from '@/types';
import { toast } from 'sonner';
import { formatDate, formatQARInt } from '@/lib/format';

const providerMeta: Record<PushProvider, { name: string; logo: string; color: string; description: string }> = {
  onesignal: { name: 'OneSignal', logo: '🔔', color: 'from-red-500 to-rose-600', description: 'Web Push (مجاني)' },
  fcm: { name: 'Firebase', logo: '🔥', color: 'from-amber-500 to-orange-600', description: 'Android & iOS' },
  apns: { name: 'Apple APNs', logo: '🍎', color: 'from-gray-500 to-gray-600', description: 'iOS فقط' },
  whatsapp_business: { name: 'WhatsApp', logo: '💬', color: 'from-emerald-500 to-green-600', description: 'Business API' },
};

export default function PushNotificationsPage() {
  const { dir } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState('providers');

  const providers = useMemo(() => pushProviderStore.getAll(), [refresh]);
  const subscribers = useMemo(() => pushSubscriberStore.getAll(), [refresh]);
  const campaigns = useMemo(() => pushCampaignStore.getAll(), [refresh]);

  const activeProviders = providers.filter(p => p.status === 'active').length;
  const totalSubs = subscribers.length;
  const activeSubs = subscribers.filter(s => s.subscribed).length;
  const totalCampaigns = campaigns.length;
  const totalSent = campaigns.filter(c => c.status === 'completed').reduce((s, c) => s + c.delivered_count, 0);

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader title="الإشعارات Push" description="إعدادات Web Push و Mobile Push و WhatsApp Business" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="مزودون نشطون" value={`${activeProviders} / ${providers.length}`} icon={<Bell className="h-5 w-5" />} color="green" />
        <KpiCard label="المشتركون" value={`${activeSubs} / ${totalSubs}`} icon={<Users className="h-5 w-5" />} color="blue" />
        <KpiCard label="الحملات" value={totalCampaigns} icon={<Send className="h-5 w-5" />} color="emerald" />
        <KpiCard label="إجمالي مرسل" value={totalSent} icon={<Activity className="h-5 w-5" />} color="violet" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="providers">المزودون</TabsTrigger>
          <TabsTrigger value="subscribers">المشتركون</TabsTrigger>
          <TabsTrigger value="campaigns">الحملات</TabsTrigger>
          <TabsTrigger value="send">إرسال جديد</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-[#64748d]">{providers.length} مزود</div>
            <Button size="sm" onClick={() => { /* add provider */ }} className="bg-[#533afd]"><Plus className="h-4 w-4 ml-1" /> إضافة</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map(p => {
              const meta = providerMeta[p.provider];
              return (
                <Card key={p.id} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px]">
                  <div className={`h-1.5 bg-gradient-to-r ${meta.color}`} />
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3"><div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-xl`}>{meta.logo}</div><div><h3 className="font-bold text-sm">{p.display_name}{p.is_default && <Star className="h-3 w-3 text-amber-500 fill-amber-500 inline ml-1" />}</h3><p className="text-[12px] text-[#64748d]">{meta.description}</p></div></div>
                      {p.status === 'active' ? <Badge className="bg-emerald-100 text-emerald-700">{tt('leases.statuses.active', 'نشط')}</Badge> : <Badge variant="secondary">معطل</Badge>}
                    </div>
                    <div className="text-[12px] text-[#64748d]">App ID: {p.app_id}{p.whatsapp_phone_number ? ` • ${p.whatsapp_phone_number}` : ''}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="subscribers">
          <Card><CardContent className="p-0">
            <table className="w-full text-sm"><thead className="bg-[#f6f9fc] text-xs"><tr><th className="text-right p-3">{tt('system.user', 'المستخدم')}</th><th className="text-right p-3">الجهاز</th><th className="text-right p-3">اللغة</th><th className="text-right p-3">{tt('legal.status', 'الحالة')}</th><th className="text-right p-3">مستلم/مفتوح</th><th className="text-right p-3">آخر ظهور</th></tr></thead>
              <tbody>{subscribers.map(s => (
                <tr key={s.id} className="border-t hover:bg-[#f6f9fc]"><td className="p-3"><div className="font-medium text-xs">{s.name}</div><code className="text-[12px] text-[#64748d]">{s.email}</code></td><td className="p-3 text-xs">{s.device_model}</td><td className="p-3 text-xs">{s.language === 'ar' ? 'عربي' : 'English'}</td><td className="p-3">{s.subscribed ? <Badge className="bg-emerald-100 text-emerald-700">مشترك</Badge> : <Badge variant="secondary">غير مشترك</Badge>}</td><td className="p-3 text-xs">{s.total_received} / {s.total_opened}</td><td className="p-3 text-xs text-[#64748d]">{formatDate(s.last_seen_at)}</td></tr>
              ))}</tbody></table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <div className="space-y-3">
            {campaigns.map(c => (
              <Card key={c.id}><CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-[rgba(83,58,253,0.10)] flex items-center justify-center"><Send className="h-5 w-5 text-[#533afd]" /></div><div><h3 className="font-bold text-sm">{c.name}</h3><p className="text-[12px] text-[#64748d]">{c.provider} • {c.audience_count} مشترك</p></div></div>
                  {c.status === 'completed' ? <Badge className="bg-emerald-100 text-emerald-700">مكتملة</Badge> : c.status === 'scheduled' ? <Badge className="bg-amber-100 text-[#9b6829]">مجدولة</Badge> : <Badge variant="secondary">{c.status}</Badge>}
                </div>
                <div className="p-2 bg-[#f6f9fc] rounded text-xs">{c.title}: {c.body}</div>
                <div className="flex justify-between text-[12px] text-[#64748d] mt-2">
                  <span>تم التوصيل: {c.delivered_count}</span><span>مفتوحة: {c.opened_count}</span><span>فشل: {c.failed_count}</span>
                  {c.scheduled_at && <span>مجدولة: {formatDate(c.scheduled_at)}</span>}
                </div>
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="send">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="h-5 w-5" />إرسال إشعار جديد</CardTitle></CardHeader>
            <CardContent>
              <CampaignForm onDone={() => { setRefresh(r => r + 1); setActiveTab('campaigns'); }} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CampaignForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ name: '', provider: 'onesignal' as PushProvider, audience_type: 'all' as PushCampaign['audience_type'], title: '', body: '', action_url: '', scheduled_at: '' });
  const providers = pushProviderStore.getAll().filter(p => p.status === 'active');
  const subs = pushSubscriberStore.getAll().filter(s => s.subscribed);

  const handleSend = () => {
    if (!form.title || !form.body) { toast.error('يرجى تعبئة العنوان والمحتوى'); return; }
    const audience_tags = form.audience_type === 'tag_segment' ? 'tenant=true' : '';
    pushCampaignStore.create({
      id: `pc-${Date.now()}`, company_id: 'comp-1', name: form.name || 'حملة جديدة', provider: form.provider,
      audience_type: form.audience_type, audience_tags, audience_count: form.audience_type === 'all' ? subs.length : subs.length,
      title: form.title, body: form.body, icon_url: '', image_url: '', action_url: form.action_url,
      scheduled_at: form.scheduled_at, sent_at: form.scheduled_at ? '' : new Date().toISOString(),
      status: form.scheduled_at ? 'scheduled' : 'completed',
      delivered_count: form.scheduled_at ? 0 : subs.length, opened_count: 0, failed_count: 0,
      created_by: 'المسؤول', created_at: new Date().toISOString(), notes: '',
    } as any);
    toast.success(form.scheduled_at ? 'تم جدولة الحملة' : 'تم إرسال الحملة');
    onDone();
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div><Label>اسم الحملة</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5" /></div>
      <div><Label>المزود</Label><Select value={form.provider} onValueChange={v => setForm(f => ({ ...f, provider: v as PushProvider }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{providers.map(p => <SelectItem key={p.id} value={p.provider}>{p.display_name}</SelectItem>)}</SelectContent></Select></div>
      <div><Label>الجمهور</Label><Select value={form.audience_type} onValueChange={v => setForm(f => ({ ...f, audience_type: v as any }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">الكل</SelectItem><SelectItem value="web_only">Web فقط</SelectItem><SelectItem value="mobile_only">تطبيق الجوال فقط</SelectItem><SelectItem value="whatsapp_only">WhatsApp فقط</SelectItem><SelectItem value="tag_segment">شريحة محددة</SelectItem><SelectItem value="custom_list">قائمة مخصصة</SelectItem></SelectContent></Select></div>
      <div className="col-span-2"><Label>{tt('properties.address', 'العنوان')}</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1.5" /></div>
      <div className="col-span-2"><Label>المحتوى</Label><Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} className="mt-1.5" rows={2} /></div>
      <div><Label>رابط الإجراء (اختياري)</Label><Input value={form.action_url} onChange={e => setForm(f => ({ ...f, action_url: e.target.value }))} className="mt-1.5" /></div>
      <div><Label>جدولة (اختياري)</Label><Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} className="mt-1.5" /></div>
      <div className="col-span-2 flex justify-end pt-2">
        <Button onClick={handleSend} className="bg-[#533afd] hover:bg-[#533afd]"><Send className="h-4 w-4 ml-1" />{form.scheduled_at ? 'جدولة' : 'إرسال'}</Button>
      </div>
    </div>
  );
}
