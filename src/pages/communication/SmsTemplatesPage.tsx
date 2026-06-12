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
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  MessageSquare, Plus, Edit, Eye, Copy, Trash2, Send, Hash,
  CheckCircle2, XCircle, Sparkles, Variable, Languages, Tag,
  FileText, Smartphone, AlertCircle,
} from 'lucide-react';
import { smsTemplateStore, smsMessageStore, smsProviderStore, tenantStore } from '@/services/stores';
import type { SmsTemplate } from '@/types';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

const categoryLabels: Record<string, { name: string; icon: string; color: string }> = {
  rent_due: { name: 'تذكير دفع', icon: '💰', color: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]' },
  rent_overdue: { name: 'إيجار متأخر', icon: '⏰', color: 'bg-red-100 text-[#ea2261]' },
  rent_received: { name: 'استلام دفعة', icon: '✅', color: 'bg-emerald-100 text-emerald-700' },
  lease_signed: { name: 'توقيع عقد', icon: '📝', color: 'bg-violet-100 text-violet-700' },
  lease_renewal: { name: 'تجديد عقد', icon: '🔄', color: 'bg-cyan-100 text-cyan-700' },
  maintenance_update: { name: 'تحديث صيانة', icon: '🔧', color: 'bg-orange-100 text-orange-700' },
  maintenance_completed: { name: 'صيانة مكتملة', icon: '✔️', color: 'bg-emerald-100 text-emerald-700' },
  payment_reminder: { name: 'تذكير دفع', icon: '💳', color: 'bg-amber-100 text-[#9b6829]' },
  general: { name: 'عام', icon: '📨', color: 'bg-gray-100 text-gray-700' },
  verification: { name: 'رمز تحقق', icon: '🔐', color: 'bg-indigo-100 text-indigo-700' },
  marketing: { name: 'تسويق', icon: '📢', color: 'bg-pink-100 text-pink-700' },
};

export default function SmsTemplatesPage() {
  const { dir } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<SmsTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<SmsTemplate | null>(null);
  const [sending, setSending] = useState<SmsTemplate | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const templates = useMemo(() => {
    const data = smsTemplateStore.getAll();
    return categoryFilter === 'all' ? data : data.filter(t => t.category === categoryFilter);
  }, [refresh, categoryFilter]);

  const stats = useMemo(() => {
    const all = smsTemplateStore.getAll();
    const messages = smsMessageStore.getAll();
    return {
      total: all.length,
      active: all.filter(t => t.status === 'active').length,
      arabic: all.filter(t => t.language === 'ar' || t.language === 'both').length,
      totalSent: messages.length,
    };
  }, [refresh]);

  const handleSave = (t: SmsTemplate) => {
    // Extract variables
    const varMatches = t.body.match(/\{\{([^}]+)\}\}/g) || [];
    const variables = varMatches.map(v => v.replace(/[{}]/g, '').trim().replace('{{', '').replace('}}', ''));
    const uniqueVars = Array.from(new Set(variables));
    const cleanT = { ...t, variables: uniqueVars };

    if (cleanT.id && templates.find(x => x.id === cleanT.id)) {
      smsTemplateStore.update(cleanT.id, cleanT);
      toast.success(`تم تحديث القالب`);
    } else {
      smsTemplateStore.create({ ...cleanT, id: `smst-${Date.now()}` } as any);
      toast.success(`تم إضافة القالب`);
    }
    setEditing(null); setCreating(false); setRefresh(r => r + 1);
  };

  const handleDelete = (t: SmsTemplate) => {
    if (confirm(`حذف القالب "${t.name}"؟`)) {
      smsTemplateStore.remove(t.id);
      toast.success('تم الحذف');
      setRefresh(r => r + 1);
    }
  };

  const handleDuplicate = (t: SmsTemplate) => {
    smsTemplateStore.create({
      ...t,
      id: `smst-${Date.now()}`,
      name: `${t.name} (نسخة)`,
      status: 'draft',
    } as any);
    toast.success('تم نسخ القالب');
    setRefresh(r => r + 1);
  };

  const handleSend = (t: SmsTemplate, phone: string, name: string) => {
    const provider = smsProviderStore.getAll().find(p => p.is_default) || smsProviderStore.getAll()[0];
    if (!provider) {
      toast.error('لا يوجد مزود SMS نشط');
      return;
    }
    if (provider.balance < provider.cost_per_sms) {
      toast.error('رصيد المزود غير كافٍ');
      return;
    }
    // Render template
    let body = t.body;
    body = body.replace(/\{\{tenant_name\}\}/g, name);
    body = body.replace(/\{\{amount\}\}/g, '5000');
    body = body.replace(/\{\{due_date\}\}/g, '2026-06-15');
    body = body.replace(/\{\{unit_number\}\}/g, 'A-101');
    body = body.replace(/\{\{days_overdue\}\}/g, '30');
    body = body.replace(/\{\{contract_number\}\}/g, 'LSE-2025-001');
    body = body.replace(/\{\{start_date\}\}/g, '2026-07-01');
    body = body.replace(/\{\{end_date\}\}/g, '2027-01-01');
    body = body.replace(/\{\{request_id\}\}/g, 'MNT-2026-014');
    body = body.replace(/\{\{status\}\}/g, t.leases.statuses.pending_approval || tt('leases.statuses.pending_approval','بانتظار الموافقة'));
    body = body.replace(/\{\{notes\}\}/g, 'سيتم الصيانة قريباً');
    body = body.replace(/\{\{receipt_number\}\}/g, 'RCP-2026-001');
    body = body.replace(/\{\{code\}\}/g, '482913');

    const segments = Math.ceil(body.length / 70);
    const cost = segments * provider.cost_per_sms;

    smsMessageStore.create({
      company_id: 'comp-1', provider_id: provider.id, provider: provider.provider,
      template_id: t.id, campaign_id: '',
      to_phone: phone, to_name: name, body, status: 'sent',
      segments, cost, sender_id: provider.sender_id,
      gateway_message_id: `sim_${Date.now()}`,
      sent_at: new Date().toISOString(), delivered_at: '', failed_at: '',
      error_code: '', error_message: '', direction: 'outbound',
      related_entity_type: 'template', related_entity_id: t.id,
      created_at: new Date().toISOString(),
    } as any);

    smsProviderStore.update(provider.id, { balance: provider.balance - cost });
    toast.success(`تم إرسال الرسالة إلى ${name} (${segments} مقاطع، ${cost.toFixed(3)} ر.ق)`);
    setSending(null); setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="قوالب SMS"
        description="إدارة قوالب الرسائل النصية القصيرة مع دعم المتغيرات"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="إجمالي القوالب" value={stats.total} icon={<FileText className="h-5 w-5" />} color="blue" />
        <KpiCard label="نشطة" value={stats.active} icon={<CheckCircle2 className="h-5 w-5" />} color="green" />
        <KpiCard label="قوالب عربية" value={stats.arabic} icon={<Languages className="h-5 w-5" />} color="violet" />
        <KpiCard label="رسائل مرسلة" value={stats.totalSent} icon={<Send className="h-5 w-5" />} color="orange" />
      </div>

      <div className="flex items-center justify-between mb-4 gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-64"><SelectValue placeholder="جميع الفئات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الفئات</SelectItem>
            {Object.entries(categoryLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.icon} {v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)} className="bg-[#533afd] hover:bg-[#533afd]">
          <Plus className="h-4 w-4 ml-2" /> قالب جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.length === 0 ? (
          <Card className="md:col-span-2">
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <div className="text-[#64748d]">لا توجد قوالب في هذه الفئة</div>
            </CardContent>
          </Card>
        ) : templates.map(t => {
          const cat = categoryLabels[t.category];
          const segments = Math.ceil(t.body.length / 70);
          return (
            <Card key={t.id} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={cat?.color}>{cat?.icon} {cat?.name}</Badge>
                    {t.language === 'ar' && <Badge variant="outline">🇸🇦 عربي</Badge>}
                    {t.language === 'en' && <Badge variant="outline">🇬🇧 English</Badge>}
                    {t.language === 'both' && <Badge variant="outline">🌐 ثنائي</Badge>}
                    {t.status === 'active' ? (
                      <Badge className="bg-emerald-100 text-emerald-700">{tt('leases.statuses.active', 'نشط')}</Badge>
                    ) : t.status === 'draft' ? (
                      <Badge variant="secondary">{tt('hr.draft', 'مسودة')}</Badge>
                    ) : (
                      <Badge variant="secondary">معطل</Badge>
                    )}
                  </div>
                </div>
                <h3 className="font-bold mb-2">{t.name}</h3>
                <div className="p-3 bg-gray-900 text-green-400 rounded-lg text-xs mb-3 font-mono" dir={dir} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {t.body}
                </div>
                <div className="flex items-center justify-between text-xs text-[#64748d] mb-3">
                  <span>{t.body.length} حرف</span>
                  <span>{segments} مقاطع SMS</span>
                  <span>{t.variables.length} متغير</span>
                </div>
                {t.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.variables.map(v => (
                      <span key={v} className="text-xs px-2 py-0.5 bg-[rgba(83,58,253,0.06)] text-[#533afd] rounded">
                        <Variable className="h-2.5 w-2.5 inline ml-0.5" />{`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1 pt-2 border-t">
                  <Button size="sm" variant="ghost" onClick={() => setSending(t)} className="flex-1">
                    <Send className="h-3.5 w-3.5 ml-1" /> إرسال
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setView(t)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(t)}>
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicate(t)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(t)} className="text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(editing || creating) && (
        <TemplateDialog
          template={editing}
          onSave={handleSave}
          onClose={() => { setEditing(null); setCreating(false); }}
        />
      )}

      {view && <ViewDialog template={view} onClose={() => setView(null)} onEdit={() => { setEditing(view); setView(null); }} />}

      {sending && <SendDialog template={sending} onClose={() => setSending(null)} onSend={handleSend} />}
    </div>
  );
}

function TemplateDialog({ template, onSave, onClose }: any) {
  const [form, setForm] = useState<SmsTemplate>(template || {
    id: '', company_id: 'comp-1', name: '',
    category: 'general', language: 'ar', body: '',
    variables: [], status: 'draft',
    created_at: '2026-06-02', updated_at: '2026-06-02', notes: '',
  });
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({
    tenant_name: 'أحمد محمد', amount: '5000', due_date: '2026-06-15',
    unit_number: 'A-101', days_overdue: '30', contract_number: 'LSE-2025-001',
    start_date: '2026-07-01', end_date: '2027-01-01', request_id: 'MNT-2026-014',
    status: t.leases.statuses.pending_approval || tt('leases.statuses.pending_approval','بانتظار الموافقة'), notes: 'سيتم الصيانة قريباً',
    receipt_number: 'RCP-2026-001', code: '482913',
  });

  const previewBody = useMemo(() => {
    let p = form.body;
    Object.entries(previewVars).forEach(([k, v]) => {
      p = p.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
    });
    return p;
  }, [form.body, previewVars]);

  const insertVariable = (name: string) => {
    setForm(f => ({ ...f, body: f.body + `{{${name}}}` }));
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle>{template ? 'تعديل قالب' : 'قالب SMS جديد'}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <Label>اسم القالب</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5" />
          </div>
          <div>
            <Label>{tt('inventory.category', 'الفئة')}</Label>
            <Select value={form.category} onValueChange={(v) => setForm(f => ({ ...f, category: v as any }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.icon} {v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>اللغة</Label>
            <Select value={form.language} onValueChange={(v) => setForm(f => ({ ...f, language: v as any }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">عربي</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="both">كلاهما</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{tt('legal.status', 'الحالة')}</Label>
            <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v as any }))}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{tt('leases.statuses.active', 'نشط')}</SelectItem>
                <SelectItem value="inactive">معطل</SelectItem>
                <SelectItem value="draft">{tt('hr.draft', 'مسودة')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3">
            <Label>محتوى الرسالة (يدعم المتغيرات مثل {`{{tenant_name}}`})</Label>
            <Textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              className="mt-1.5"
              rows={5}
              dir={dir}
            />
            <div className="text-xs text-[#64748d] mt-1 flex justify-between">
              <span>{form.body.length} حرف - {Math.ceil(form.body.length / 70)} مقاطع</span>
              <span>المتغيرات: {(form.body.match(/\{\{([^}]+)\}\}/g) || []).length}</span>
            </div>
          </div>

          <div className="col-span-3">
            <Label className="mb-2 block">إدراج متغير</Label>
            <div className="flex flex-wrap gap-1">
              {Object.keys(previewVars).map(v => (
                <button key={v} onClick={() => insertVariable(v)} className="text-xs px-2 py-1 bg-[rgba(83,58,253,0.06)] text-[#533afd] rounded hover:bg-[rgba(83,58,253,0.10)]">
                  + {`{{${v}}}`}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-3">
            <Label className="mb-2 block">معاينة</Label>
            <div className="p-3 bg-gray-900 text-green-400 rounded-lg text-sm font-mono" dir={dir}>
              {previewBody || 'معاينة ستظهر هنا...'}
            </div>
          </div>

          <div className="col-span-3">
            <Label>{tt('common.notes', 'ملاحظات')}</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1.5" />
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

function ViewDialog({ template, onClose, onEdit }: any) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg" dir={dir}>
        <DialogHeader>
          <DialogTitle>{template.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={categoryLabels[template.category]?.color}>{categoryLabels[template.category]?.name}</Badge>
            {template.status === 'active' && <Badge className="bg-emerald-100 text-emerald-700">{tt('leases.statuses.active', 'نشط')}</Badge>}
            {template.status === 'draft' && <Badge variant="secondary">{tt('hr.draft', 'مسودة')}</Badge>}
          </div>
          <div className="p-4 bg-gray-900 text-green-400 rounded-lg text-sm font-mono" dir={dir} style={{ whiteSpace: 'pre-wrap' }}>
            {template.body}
          </div>
          {template.variables.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-1">المتغيرات ({template.variables.length})</div>
              <div className="flex flex-wrap gap-1">
                {template.variables.map((v: string) => (
                  <span key={v} className="text-xs px-2 py-1 bg-[rgba(83,58,253,0.06)] text-[#533afd] rounded">{`{{${v}}}`}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button onClick={onEdit} className="bg-[#533afd] hover:bg-[#533afd]">{tt('procurement.edit', 'تعديل')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SendDialog({ template, onClose, onSend }: any) {
  const tenants = tenantStore.getAll();
  const [phone, setPhone] = useState(tenants[0]?.phone || '');
  const [name, setName] = useState(tenants[0]?.full_name || tenants[0]?.company_name || '');

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            إرسال قالب "{template.name}"
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>المستلم</Label>
            <Select value={phone} onValueChange={(v) => {
              setPhone(v);
              const t = tenants.find(x => x.phone === v);
              if (t) setName(t.full_name || t.company_name);
            }}>
              <SelectTrigger className="mt-1.5"><SelectValue placeholder="اختر مستأجر" /></SelectTrigger>
              <SelectContent>
                {tenants.map(t => (
                  <SelectItem key={t.id} value={t.phone}>{t.full_name || t.company_name} - {t.phone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{tt('tenants.name', 'الاسم')}</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>الجوال</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1.5" dir="ltr" />
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-[#9b6829]">
            <AlertCircle className="h-3.5 w-3.5 inline ml-1" />
            سيتم خصم تكلفة الرسالة من رصيد المزود الافتراضي
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tt('common.cancel', 'إلغاء')}</Button>
          <Button onClick={() => onSend(template, phone, name)} className="bg-[#533afd] hover:bg-[#533afd]">
            <Send className="h-4 w-4 ml-1" /> إرسال
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
