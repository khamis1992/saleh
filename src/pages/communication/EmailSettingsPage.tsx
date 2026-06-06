import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Mail, Plus, Edit, Eye, Wifi, WifiOff, Star, Send, Activity, BarChart3, Globe, Settings as SettingsIcon } from 'lucide-react';
import { emailProviderStore, emailMessageStore } from '@/services/stores';
import type { EmailProviderConfig, EmailProvider } from '@/types';
import { toast } from 'sonner';
import { formatQARInt } from '@/lib/format';

const providerMeta: Record<EmailProvider, { name: string; logo: string; color: string; description: string }> = {
  resend: { name: 'Resend', logo: '✉️', color: 'from-blue-500 to-blue-600', description: 'حديث، React Email، موثوق' },
  sendgrid: { name: 'SendGrid', logo: '📨', color: 'from-cyan-500 to-cyan-600', description: 'الدرجة المؤسسية' },
  mailgun: { name: 'Mailgun', logo: '📧', color: 'from-red-500 to-red-600', description: 'احتياطي للمطورين' },
  ses: { name: 'AWS SES', logo: '☁️', color: 'from-orange-500 to-orange-600', description: 'اقتصادي - حجم عالي' },
};

export default function EmailSettingsPage() {
  const { dir } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<EmailProviderConfig | null>(null);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<EmailProviderConfig | null>(null);

  const providers = useMemo(() => emailProviderStore.getAll(), [refresh]);
  const messages = useMemo(() => emailMessageStore.getAll(), [refresh]);

  const activeCount = providers.filter(p => p.status === 'active').length;
  const totalSent = messages.length;
  const totalOpened = messages.filter(m => m.status === 'opened' || m.status === 'clicked').length;
  const avgOpenRate = messages.filter(m => m.open_rate > 0).length > 0
    ? Math.round(messages.filter(m => m.open_rate > 0).reduce((s, m) => s + m.open_rate, 0) / messages.filter(m => m.open_rate > 0).length)
    : 0;

  const handleSave = (p: EmailProviderConfig) => {
    if (p.id && providers.find(x => x.id === p.id)) {
      emailProviderStore.update(p.id, p);
      toast.success(`تم تحديث ${p.display_name}`);
    } else {
      emailProviderStore.create({ ...p, id: `email-prov-${Date.now()}` } as any);
      toast.success(`تم إضافة ${p.display_name}`);
    }
    setEditing(null); setCreating(false); setRefresh(r => r + 1);
  };

  const handleToggle = (p: EmailProviderConfig) => {
    emailProviderStore.update(p.id, { status: p.status === 'active' ? 'inactive' : 'active' });
    toast.success(`تم ${p.status === 'active' ? 'تعطيل' : 'تفعيل'} ${p.display_name}`);
    setRefresh(r => r + 1);
  };

  const handleSetDefault = (p: EmailProviderConfig) => {
    providers.forEach(x => emailProviderStore.update(x.id, { is_default: x.id === p.id }));
    toast.success(`${p.display_name} هو المزود الافتراضي`);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader title="إعدادات مزودي البريد الإلكتروني" description="إدارة مزودي خدمة البريد الإلكتروني والحصص اليومية" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="المزودون النشطون" value={`${activeCount} / ${providers.length}`} icon={<Wifi className="h-5 w-5" />} color="green" />
        <KpiCard label="رسائل مرسلة" value={totalSent} icon={<Send className="h-5 w-5" />} color="blue" />
        <KpiCard label="معدل الفتح" value={`${avgOpenRate}%`} icon={<Activity className="h-5 w-5" />} color="emerald" />
        <KpiCard label="مفتوحة" value={totalOpened} icon={<Eye className="h-5 w-5" />} color="violet" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-[#64748d]">إدارة المزودين</div>
        <Button onClick={() => setCreating(true)} className="bg-[#533afd] hover:bg-[#533afd]"><Plus className="h-4 w-4 ml-2" /> إضافة مزود</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map(p => {
          const meta = providerMeta[p.provider];
          const sentCount = messages.filter(m => m.provider_id === p.id).length;
          return (
            <Card key={p.id} className="overflow-hidden hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
              <div className={`h-2 bg-gradient-to-r ${meta.color}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px]`}>{meta.logo}</div>
                    <div><h3 className="font-bold text-base flex items-center gap-2">{p.display_name}{p.is_default && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}</h3><p className="text-xs text-[#64748d]">{meta.description}</p></div>
                  </div>
                  {p.status === 'active' ? <Badge className="bg-emerald-100 text-emerald-700">{tt('leases.statuses.active', 'نشط')}</Badge> : <Badge variant="secondary">معطل</Badge>}
                </div>
                <div className="space-y-2 my-4 p-3 bg-[#f6f9fc] rounded-lg">
                  <div className="flex justify-between text-sm"><span className="text-[#64748d]">من</span><code className="text-xs">{p.from_address}</code></div>
                  <div className="flex justify-between text-sm"><span className="text-[#64748d]">الحصة اليومية</span><span className="font-medium">{p.daily_sent} / {p.daily_quota}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#64748d]">تتبع الفتح</span><span>{p.track_opens ? '✅' : '❌'}</span></div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  <Button size="sm" variant="outline" onClick={() => setView(p)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggle(p)}>{p.status === 'active' ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}</Button>
                </div>
                {!p.is_default && p.status === 'active' && (
                  <Button size="sm" variant="ghost" onClick={() => handleSetDefault(p)} className="w-full text-xs"><Star className="h-3 w-3 ml-1" /> اجعله افتراضي</Button>
                )}
                {sentCount > 0 && <div className="text-[12px] text-[#64748d] text-center mt-2 border-t pt-2">{sentCount} رسالة مرسلة</div>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(editing || creating) && (
        <Dialog open onOpenChange={() => { setEditing(null); setCreating(false); }}>
          <DialogContent className="max-w-xl" dir={dir}>
            <DialogHeader><DialogTitle>{editing ? 'تعديل مزود بريد' : 'إضافة مزود بريد'}</DialogTitle></DialogHeader>
            <ProviderForm provider={editing} onSave={handleSave} onClose={() => { setEditing(null); setCreating(false); }} />
          </DialogContent>
        </Dialog>
      )}

      {view && (
        <Dialog open onOpenChange={() => setView(null)}>
          <DialogContent className="max-w-lg" dir={dir}>
            <DialogHeader><DialogTitle className="flex items-center gap-3"><div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${providerMeta[view.provider].color} flex items-center justify-center text-xl`}>{providerMeta[view.provider].logo}</div>{view.display_name}</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المزود</span><span>{providerMeta[view.provider].name}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">من</span><span>{view.from_name} &lt;{view.from_address}&gt;</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">الرد إلى</span><span>{view.reply_to}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">API Key</span><code className="text-xs">{view.api_key_masked}</code></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">الحصة</span><span>{view.daily_sent}/{view.daily_quota}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('legal.status', 'الحالة')}</span>{view.status === 'active' ? <Badge className="bg-emerald-100 text-emerald-700">{tt('leases.statuses.active', 'نشط')}</Badge> : <Badge variant="secondary">معطل</Badge>}</div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setView(null)}>إغلاق</Button>
              <Button onClick={() => { setEditing(view); setView(null); }} className="bg-[#533afd] hover:bg-[#533afd]">{tt('procurement.edit', 'تعديل')}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function ProviderForm({ provider, onSave, onClose }: any) {
  const [form, setForm] = useState<EmailProviderConfig>(provider || {
    id: '', company_id: 'comp-1', provider: 'resend', display_name: '', from_address: '', from_name: 'عقاري ERP', reply_to: '',
    status: 'inactive', api_key_masked: '', daily_quota: 1000, daily_sent: 0, is_default: false,
    track_opens: true, track_clicks: true, created_at: '2026-06-02', updated_at: '2026-06-02',
  });
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>المزود</Label>
          <Select value={form.provider} onValueChange={(v) => setForm((f: any) => ({ ...f, provider: v, display_name: f.display_name || providerMeta[v as EmailProvider].name }))}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(providerMeta).map(([k, m]) => <SelectItem key={k} value={k}>{m.logo} {m.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>الاسم المعروض</Label><Input value={form.display_name} onChange={e => setForm((f: any) => ({ ...f, display_name: e.target.value }))} className="mt-1.5" /></div>
        <div><Label>اسم المرسل</Label><Input value={form.from_name} onChange={e => setForm((f: any) => ({ ...f, from_name: e.target.value }))} className="mt-1.5" /></div>
        <div><Label>بريد المرسل</Label><Input value={form.from_address} onChange={e => setForm((f: any) => ({ ...f, from_address: e.target.value }))} className="mt-1.5" /></div>
        <div><Label>بريد الرد</Label><Input value={form.reply_to} onChange={e => setForm((f: any) => ({ ...f, reply_to: e.target.value }))} className="mt-1.5" /></div>
        <div><Label>API Key</Label><Input value={form.api_key_masked} onChange={e => setForm((f: any) => ({ ...f, api_key_masked: e.target.value }))} className="mt-1.5" /></div>
        <div><Label>الحصة اليومية</Label><Input type="number" value={form.daily_quota} onChange={e => setForm((f: any) => ({ ...f, daily_quota: parseInt(e.target.value) || 0 }))} className="mt-1.5" /></div>
        <div className="col-span-2 flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.status === 'active'} onCheckedChange={c => setForm((f: any) => ({ ...f, status: c ? 'active' : 'inactive' }))} />{tt('leases.statuses.active', 'نشط')}</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.is_default} onCheckedChange={c => setForm((f: any) => ({ ...f, is_default: c }))} />افتراضي</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.track_opens} onCheckedChange={c => setForm((f: any) => ({ ...f, track_opens: c }))} />تتبع الفتح</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={form.track_clicks} onCheckedChange={c => setForm((f: any) => ({ ...f, track_clicks: c }))} />تتبع النقر</label>
        </div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>{tt('common.cancel', 'إلغاء')}</Button><Button onClick={() => onSave(form)} className="bg-[#533afd] hover:bg-[#533afd]">{tt('common.save', 'حفظ')}</Button></DialogFooter>
    </>
  );
}
