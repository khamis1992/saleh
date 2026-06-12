import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare, Plus, Edit, Eye, Wifi, WifiOff, Send, Wallet,
  CheckCircle2, XCircle, Star, Globe, Smartphone, Phone, Settings as SettingsIcon,
} from 'lucide-react';
import { smsProviderStore, smsMessageStore } from '@/services/stores';
import type { SmsProviderConfig, SmsProvider } from '@/types';
import { toast } from 'sonner';
import { formatQARInt } from '@/lib/format';

const providerMeta: Record<SmsProvider, { name: string; logo: string; color: string; description: string; countries: string[] }> = {
  unifonic: { name: 'Unifonic', logo: '🟣', color: 'from-violet-500 to-violet-600', description: 'الأفضل في MENA - دعم عربي قوي', countries: ['SA', 'AE', 'KW', 'BH', 'OM', 'QA', 'JO', 'EG'] },
  twilio: { name: 'Twilio', logo: '🔴', color: 'from-red-500 to-red-600', description: 'الزعيم العالمي - موثوقية عالية', countries: ['عالمي'] },
  msegat: { name: 'Msegat', logo: '🟢', color: 'from-emerald-500 to-emerald-600', description: 'متخصص في السعودية', countries: ['SA'] },
  cequens: { name: 'CEQUENS', logo: '🔵', color: 'from-blue-500 to-blue-600', description: 'بوابة مصرية موثوقة', countries: ['EG', 'SA', 'AE'] },
};

export default function SmsSettingsPage() {
  const { dir } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<SmsProviderConfig | null>(null);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<SmsProviderConfig | null>(null);

  const providers = useMemo(() => smsProviderStore.getAll(), [refresh]);
  const messages = useMemo(() => smsMessageStore.getAll(), [refresh]);

  const activeCount = providers.filter(p => p.status === 'active').length;
  const totalBalance = providers.reduce((s, p) => s + p.balance, 0);
  const totalSent = messages.length;
  const totalCost = messages.reduce((s, m) => s + m.cost, 0);

  const handleSave = (p: SmsProviderConfig) => {
    if (p.id && providers.find(x => x.id === p.id)) {
      smsProviderStore.update(p.id, p);
      toast.success(`تم تحديث ${p.display_name}`);
    } else {
      smsProviderStore.create({ ...p, id: `sms-prov-${Date.now()}` } as any);
      toast.success(`تم إضافة ${p.display_name}`);
    }
    setEditing(null); setCreating(false); setRefresh(r => r + 1);
  };

  const handleToggle = (p: SmsProviderConfig) => {
    const next = p.status === 'active' ? 'inactive' : 'active';
    smsProviderStore.update(p.id, { status: next });
    toast.success(`تم ${next === 'active' ? 'تفعيل' : 'تعطيل'} ${p.display_name}`);
    setRefresh(r => r + 1);
  };

  const handleSetDefault = (p: SmsProviderConfig) => {
    providers.forEach(x => smsProviderStore.update(x.id, { is_default: x.id === p.id }));
    toast.success(`${p.display_name} هو المزود الافتراضي الآن`);
    setRefresh(r => r + 1);
  };

  const handleTopUp = (p: SmsProviderConfig, amount: number) => {
    smsProviderStore.update(p.id, { balance: p.balance + amount });
    toast.success(`تم شحن ${amount} ر.ق في ${p.display_name}`);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="إعدادات مزودي SMS"
        description="إدارة مزودي خدمة الرسائل النصية وأرصدة الحسابات"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="المزودون النشطون" value={`${activeCount} / ${providers.length}`} icon={<Wifi className="h-5 w-5" />} color="green" />
        <KpiCard label="إجمالي الرصيد" value={`${formatQARInt(totalBalance)} ر.ق`} icon={<Wallet className="h-5 w-5" />} color="blue" />
        <KpiCard label="رسائل مرسلة" value={totalSent} icon={<Send className="h-5 w-5" />} color="emerald" />
        <KpiCard label="تكلفة إجمالية" value={`${formatQARInt(totalCost)} ر.ق`} icon={<MessageSquare className="h-5 w-5" />} color="orange" />
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-[#64748d]">إدارة المزودين والصلاحيات</div>
        <Button onClick={() => setCreating(true)} className="bg-[#533afd] hover:bg-[#533afd]">
          <Plus className="h-4 w-4 ml-2" /> إضافة مزود
        </Button>
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
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px]`}>
                      {meta.logo}
                    </div>
                    <div>
                      <h3 className="font-bold text-base flex items-center gap-2">
                        {p.display_name}
                        {p.is_default && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                      </h3>
                      <p className="text-xs text-[#64748d]">{meta.description}</p>
                    </div>
                  </div>
                  {p.status === 'active' ? (
                    <Badge className="bg-emerald-100 text-emerald-700">{tt('leases.statuses.active', 'نشط')}</Badge>
                  ) : (
                    <Badge variant="secondary">معطل</Badge>
                  )}
                </div>

                <div className="space-y-2 my-4 p-3 bg-[#f6f9fc] rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748d]">Sender ID</span>
                    <code className="text-xs font-bold">{p.sender_id}</code>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748d]">{tt('common.balance', 'الرصيد')}</span>
                    <span className="font-bold text-emerald-600">{formatQARInt(p.balance)} {p.balance_currency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748d]">تكلفة الرسالة</span>
                    <span className="font-medium">{p.cost_per_sms.toFixed(3)} ر.ق</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#64748d]">Unicode</span>
                    {p.unicode_supported ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-[#64748d]" />}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Button size="sm" variant="outline" onClick={() => setView(p)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleToggle(p)}>
                    {p.status === 'active' ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {!p.is_default && p.status === 'active' && (
                    <Button size="sm" variant="ghost" onClick={() => handleSetDefault(p)} className="flex-1 text-xs">
                      <Star className="h-3 w-3 ml-1" /> اجعله افتراضي
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleTopUp(p, 1000)} className="flex-1 text-xs">
                    <Wallet className="h-3 w-3 ml-1" /> شحن 1000
                  </Button>
                </div>

                {sentCount > 0 && (
                  <div className="text-xs text-[#64748d] text-center mt-2 border-t pt-2">
                    {sentCount} رسالة مرسلة عبر هذا المزود
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(editing || creating) && (
        <ProviderDialog
          provider={editing}
          onSave={handleSave}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}

      {view && (
        <ViewDialog
          provider={view}
          onClose={() => setView(null)}
          onEdit={() => { setEditing(view); setView(null); }}
        />
      )}
    </div>
  );
}

function ProviderDialog({ provider, onSave, onClose }: any) {
  const [form, setForm] = useState<SmsProviderConfig>(provider || {
    id: '', company_id: 'comp-1', provider: 'unifonic', display_name: '',
    sender_id: '', status: 'inactive', api_key_masked: '', balance: 0, balance_currency: 'QAR',
    cost_per_sms: 0.045, is_default: false, unicode_supported: true,
    created_at: '2026-06-02', updated_at: '2026-06-02',
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl" dir={dir}>
        <DialogHeader>
          <DialogTitle>{provider ? 'تعديل مزود SMS' : 'إضافة مزود SMS جديد'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>المزود</Label>
            <Select value={form.provider} onValueChange={(v) => setForm((f: any) => ({ ...f, provider: v, display_name: f.display_name || providerMeta[v as SmsProvider].name }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(providerMeta)).map(([k, m]) => (
                  <SelectItem key={k} value={k}>{m.logo} {m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الاسم المعروض</Label>
            <Input value={form.display_name} onChange={e => setForm((f: any) => ({ ...f, display_name: e.target.value }))} className="mt-1.5" />
          </div>
          <div>
            <Label>Sender ID</Label>
            <Input value={form.sender_id} onChange={e => setForm((f: any) => ({ ...f, sender_id: e.target.value }))} placeholder="AQARI-ERP" className="mt-1.5" />
          </div>
          <div>
            <Label>API Key</Label>
            <Input value={form.api_key_masked} onChange={e => setForm((f: any) => ({ ...f, api_key_masked: e.target.value }))} placeholder="••••••••" className="mt-1.5" />
          </div>
          <div>
            <Label>{tt('common.balance', 'الرصيد')}</Label>
            <Input type="number" value={form.balance} onChange={e => setForm((f: any) => ({ ...f, balance: parseFloat(e.target.value) || 0 }))} className="mt-1.5" />
          </div>
          <div>
            <Label>تكلفة الرسالة</Label>
            <Input type="number" step="0.001" value={form.cost_per_sms} onChange={e => setForm((f: any) => ({ ...f, cost_per_sms: parseFloat(e.target.value) || 0 }))} className="mt-1.5" />
          </div>
          <div>
            <Label>العملة</Label>
            <Input value={form.balance_currency} onChange={e => setForm((f: any) => ({ ...f, balance_currency: e.target.value }))} className="mt-1.5" />
          </div>
          <div className="col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.status === 'active'} onCheckedChange={c => setForm((f: any) => ({ ...f, status: c ? 'active' : 'inactive' }))} />
              نشط
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.is_default} onCheckedChange={c => setForm((f: any) => ({ ...f, is_default: c }))} />
              افتراضي
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={form.unicode_supported} onCheckedChange={c => setForm((f: any) => ({ ...f, unicode_supported: c }))} />
              دعم Unicode
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tt('common.cancel', 'إلغاء')}</Button>
          <Button onClick={() => onSave(form)} className="bg-[#533afd] hover:bg-[#533afd]">{tt('common.save', 'حفظ')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewDialog({ provider, onClose, onEdit }: any) {
  const meta = providerMeta[provider.provider as SmsProvider];
  const msgs = smsMessageStore.getAll().filter(m => m.provider_id === provider.id);
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-xl`}>{meta.logo}</div>
            {provider.display_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المزود</span><span>{meta.name}</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">Sender ID</span><code className="text-xs">{provider.sender_id}</code></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('common.balance', 'الرصيد')}</span><span className="font-bold text-emerald-600">{formatQARInt(provider.balance)} {provider.balance_currency}</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">تكلفة الرسالة</span><span>{provider.cost_per_sms.toFixed(3)} ر.ق</span></div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('legal.status', 'الحالة')}</span>{provider.status === 'active' ? <Badge className="bg-emerald-100 text-emerald-700">{tt('leases.statuses.active', 'نشط')}</Badge> : <Badge variant="secondary">معطل</Badge>}</div>
            <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">Unicode</span>{provider.unicode_supported ? <Badge>مدعوم</Badge> : <Badge variant="secondary">غير مدعوم</Badge>}</div>
            <div className="col-span-2 flex justify-between p-2 border-b"><span className="text-[#64748d]">الدول المدعومة</span><span className="text-xs">{meta.countries.join(', ')}</span></div>
            <div className="col-span-2 flex justify-between p-2 border-b"><span className="text-[#64748d]">API Key</span><code className="text-xs">{provider.api_key_masked}</code></div>
            <div className="col-span-2 p-2 bg-[rgba(83,58,253,0.06)] rounded text-xs">
              <strong>إحصائيات:</strong> {msgs.length} رسالة مرسلة من هذا المزود بتكلفة إجمالية {formatQARInt(msgs.reduce((s, m) => s + m.cost, 0))} ر.ق
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button onClick={onEdit} className="bg-[#533afd] hover:bg-[#533afd]">{tt('procurement.edit', 'تعديل')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
