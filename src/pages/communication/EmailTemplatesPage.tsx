import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Mail, Plus, Edit, Eye, Copy, Trash2, Send, FileText, CheckCircle2, Languages, Tag, Sparkles, Variable } from 'lucide-react';
import { emailTemplateStore, emailMessageStore, emailProviderStore, tenantStore } from '@/services/stores';
import type { EmailTemplate } from '@/types';
import { toast } from 'sonner';

const categoryLabels: Record<string, { name: string; icon: string; color: string }> = {
  invoice: { name: 'فاتورة', icon: '🧾', color: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]' },
  receipt: { name: 'إيصال', icon: '✅', color: 'bg-emerald-100 text-emerald-700' },
  overdue_notice: { name: 'تنبيه تأخير', icon: '⏰', color: 'bg-red-100 text-[#ea2261]' },
  contract_renewal: { name: 'تجديد عقد', icon: '🔄', color: 'bg-violet-100 text-violet-700' },
  lease_welcome: { name: 'ترحيب', icon: '👋', color: 'bg-cyan-100 text-cyan-700' },
  maintenance_update: { name: 'تحديث صيانة', icon: '🔧', color: 'bg-orange-100 text-orange-700' },
  payment_reminder: { name: 'تذكير دفع', icon: '💳', color: 'bg-amber-100 text-[#9b6829]' },
  general: { name: 'عام', icon: '📨', color: 'bg-gray-100 text-gray-700' },
  newsletter: { name: 'نشرة إخبارية', icon: '📢', color: 'bg-pink-100 text-pink-700' },
  verification: { name: 'تحقق', icon: '🔐', color: 'bg-indigo-100 text-indigo-700' },
};

export default function EmailTemplatesPage() {
  const { dir } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [view, setView] = useState<EmailTemplate | null>(null);
  const [sending, setSending] = useState<EmailTemplate | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const templates = useMemo(() => {
    const data = emailTemplateStore.getAll();
    return categoryFilter === 'all' ? data : data.filter(t => t.category === categoryFilter);
  }, [refresh, categoryFilter]);

  const stats = useMemo(() => {
    const all = emailTemplateStore.getAll();
    return { total: all.length, active: all.filter(t => t.status === 'active').length, arabic: all.filter(t => t.language === 'ar' || t.language === 'both').length };
  }, [refresh]);

  const handleSave = (t: EmailTemplate) => {
    const match = t.subject.match(/\{\{([^}]+)\}\}/g) || [];
    const allMatches = [...match, ...(t.body_html.match(/\{\{([^}]+)\}\}/g) || [])];
    const variables = allMatches.map(v => v.replace(/\{\{|\}\}/g, '').trim());
    const cleanT = { ...t, variables: Array.from(new Set(variables)) as string[] };
    if (cleanT.id && templates.find(x => x.id === cleanT.id)) { emailTemplateStore.update(cleanT.id, cleanT as any); toast.success('تم تحديث القالب'); }
    else { emailTemplateStore.create({ ...cleanT, id: `et-${Date.now()}` } as any); toast.success('تم إضافة القالب'); }
    setEditing(null); setCreating(false); setRefresh(r => r + 1);
  };

  const handleDuplicate = (t: EmailTemplate) => {
    emailTemplateStore.create({ ...t, id: `et-${Date.now()}`, name: `${t.name} (نسخة)`, status: 'draft' } as any);
    toast.success('تم نسخ القالب'); setRefresh(r => r + 1);
  };

  const handleDelete = (t: EmailTemplate) => {
    if (confirm(`حذف "${t.name}"؟`)) { emailTemplateStore.remove(t.id); toast.success('تم الحذف'); setRefresh(r => r + 1); }
  };

  const handleSendTest = (t: EmailTemplate, email: string, name: string) => {
    const prov = emailProviderStore.getAll().find(p => p.is_default && p.status === 'active') || emailProviderStore.getAll().find(p => p.status === 'active');
    if (!prov) { toast.error('لا يوجد مزود بريد نشط'); return; }
    let body = t.body_html.replace(/\{\{tenant_name\}\}/g, name).replace(/\{\{amount\}\}/g, '5000').replace(/\{\{invoice_number\}\}/g, 'INV-DEMO').replace(/\{\{unit_number\}\}/g, 'A-101').replace(/\{\{due_date\}\}/g, '2026-06-15').replace(/\{\{payment_link\}\}/g, 'https://pay.aqari.com/demo');
    let subj = t.subject.replace(/\{\{tenant_name\}\}/g, name);
    emailMessageStore.create({ company_id: 'comp-1', provider_id: prov.id, provider: prov.provider, template_id: t.id, campaign_id: '', to_email: email, to_name: name, cc: '', bcc: '', subject: subj, body_html: body, attachments: '[]', status: 'delivered', opened_count: 0, clicked_count: 0, open_rate: 0, gateway_message_id: `sim_${Date.now()}`, sent_at: new Date().toISOString(), delivered_at: new Date().toISOString(), opened_at: '', clicked_at: '', bounced_at: '', error_message: '', direction: 'outbound', related_entity_type: 'template', related_entity_id: t.id, created_at: new Date().toISOString() } as any);
    toast.success(`تم إرسال البريد التجريبي إلى ${name}`);
    setSending(null); setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader title="قوالب البريد الإلكتروني" description="إدارة قوالب البريد مع دعم HTML ومتغيرات" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="إجمالي القوالب" value={stats.total} icon={<FileText className="h-5 w-5" />} color="blue" />
        <KpiCard label="نشطة" value={stats.active} icon={<CheckCircle2 className="h-5 w-5" />} color="green" />
        <KpiCard label="قوالب عربية" value={stats.arabic} icon={<Languages className="h-5 w-5" />} color="violet" />
        <KpiCard label="فئات" value={Object.keys(categoryLabels).length} icon={<Tag className="h-5 w-5" />} color="orange" />
      </div>

      <div className="flex items-center justify-between mb-4 gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-64"><SelectValue placeholder="جميع الفئات" /></SelectTrigger>
          <SelectContent><SelectItem value="all">جميع الفئات</SelectItem>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.icon} {v.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button onClick={() => setCreating(true)} className="bg-[#533afd] hover:bg-[#533afd]"><Plus className="h-4 w-4 ml-2" /> قالب جديد</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.length === 0 ? (
          <Card className="md:col-span-2"><CardContent className="p-12 text-center"><Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" /><div className="text-[#64748d]">لا توجد قوالب</div></CardContent></Card>
        ) : templates.map(t => {
          const cat = categoryLabels[t.category];
          return (
            <Card key={t.id} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={cat?.color}>{cat?.icon} {cat?.name}</Badge>
                    {t.status === 'active' ? <Badge className="bg-emerald-100 text-emerald-700">{tt('leases.statuses.active', 'نشط')}</Badge> : t.status === 'draft' ? <Badge variant="secondary">{tt('hr.draft', 'مسودة')}</Badge> : <Badge variant="secondary">معطل</Badge>}
                  </div>
                </div>
                <h3 className="font-bold mb-1">{t.name}</h3>
                <div className="text-xs text-[#64748d] mb-3 font-medium">{t.subject}</div>
                <div className="p-3 bg-[#f6f9fc] rounded-lg text-xs mb-3 max-h-24 overflow-y-auto" dangerouslySetInnerHTML={{ __html: t.body_html.replace(/<[^>]+>/g, '').substring(0, 200) + '...' }} />
                <div className="flex items-center justify-between text-[12px] text-[#64748d] mb-3">
                  <span>HTML: {t.body_html.length} حرف</span>
                  <span>متغيرات: {t.variables.length}</span>
                </div>
                {t.variables.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {t.variables.slice(0, 6).map((v: string) => <span key={v} className="text-[12px] px-2 py-0.5 bg-[rgba(83,58,253,0.06)] text-[#533afd] rounded">{`{{${v}}}`}</span>)}
                    {t.variables.length > 6 && <span className="text-[12px] text-[#64748d]">+{t.variables.length - 6}</span>}
                  </div>
                )}
                <div className="flex items-center gap-1 pt-2 border-t">
                  <Button size="sm" variant="ghost" onClick={() => setSending(t)} className="flex-1"><Send className="h-3.5 w-3.5 ml-1" /> اختبار</Button>
                  <Button size="sm" variant="ghost" onClick={() => setView(t)}><Eye className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(t)}><Edit className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDuplicate(t)}><Copy className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(t)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(editing || creating) && (<TemplateDialog template={editing} onSave={handleSave} onClose={() => { setEditing(null); setCreating(false); }} />)}
      {view && (<ViewDialog template={view} onClose={() => setView(null)} onEdit={() => { setEditing(view); setView(null); }} />)}
      {sending && (<SendDialog template={sending} onClose={() => setSending(null)} onSend={handleSendTest} />)}
    </div>
  );
}

function TemplateDialog({ template, onSave, onClose }: any) {
  const [form, setForm] = useState<EmailTemplate>(template || {
    id: '', company_id: 'comp-1', name: '', category: 'general', language: 'ar', subject: '', body_html: '', body_text: '', variables: [], status: 'draft',
    created_at: '2026-06-02', updated_at: '2026-06-02', notes: '',
  });
  const insertVar = (v: string) => { setForm(f => ({ ...f, subject: f.subject + `{{${v}}}`, body_html: f.body_html + `{{${v}}}` })); };
  const vars = ['tenant_name','amount','invoice_number','unit_number','due_date','payment_link','receipt_number','contract_number','end_date','notice_days','request_id','status','notes','portal_url'];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader><DialogTitle>{template ? 'تعديل قالب بريد' : 'قالب بريد جديد'}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2"><Label>{tt('tenants.name', 'الاسم')}</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1.5" /></div>
          <div><Label>{tt('inventory.category', 'الفئة')}</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v.icon} {v.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label>اللغة</Label><Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v as any }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ar">عربي</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="both">كلاهما</SelectItem></SelectContent></Select></div>
          <div><Label>{tt('legal.status', 'الحالة')}</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">{tt('leases.statuses.active', 'نشط')}</SelectItem><SelectItem value="inactive">معطل</SelectItem><SelectItem value="draft">{tt('hr.draft', 'مسودة')}</SelectItem></SelectContent></Select></div>
          <div className="col-span-3"><Label>موضوع البريد</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="mt-1.5" /></div>
          <div className="col-span-3"><Label>محتوى HTML</Label><Textarea value={form.body_html} onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))} className="mt-1.5 font-mono text-xs" rows={8} dir="ltr" /></div>
          <div className="col-span-3"><Label>نص بديل (Text)</Label><Textarea value={form.body_text} onChange={e => setForm(f => ({ ...f, body_text: e.target.value }))} className="mt-1.5" rows={3} /></div>
          <div className="col-span-3">
            <Label className="mb-2 block">إدراج متغير</Label>
            <div className="flex flex-wrap gap-1">{vars.map(v => <button key={v} onClick={() => insertVar(v)} className="text-[12px] px-2 py-1 bg-[rgba(83,58,253,0.06)] text-[#533afd] rounded hover:bg-[rgba(83,58,253,0.10)]">+ {`{{${v}}}`}</button>)}</div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>{tt('common.cancel', 'إلغاء')}</Button><Button onClick={() => onSave(form)} className="bg-[#533afd] hover:bg-[#533afd]">{tt('common.save', 'حفظ')}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ViewDialog({ template, onClose, onEdit }: any) {
  return (
    <Dialog open onOpenChange={onClose}><DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir={dir}>
      <DialogHeader><DialogTitle>{template.name}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div className="flex items-center gap-2"><Badge className={categoryLabels[template.category]?.color}>{categoryLabels[template.category]?.name}</Badge>{template.status === 'active' && <Badge className="bg-emerald-100 text-emerald-700">{tt('leases.statuses.active', 'نشط')}</Badge>}</div>
        <div className="p-3 bg-gray-100 rounded"><div className="text-xs font-medium text-[#64748d]">الموضوع:</div><div className="text-sm font-bold">{template.subject}</div></div>
        <div className="border rounded-lg p-4" dangerouslySetInnerHTML={{ __html: template.body_html }} />
        {template.variables.length > 0 && <div><div className="text-sm font-medium mb-1">المتغيرات</div><div className="flex flex-wrap gap-1">{template.variables.map((v: string) => <span key={v} className="text-xs px-2 py-1 bg-[rgba(83,58,253,0.06)] text-[#533afd] rounded">{`{{${v}}}`}</span>)}</div></div>}
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>إغلاق</Button><Button onClick={onEdit} className="bg-[#533afd] hover:bg-[#533afd]">{tt('procurement.edit', 'تعديل')}</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}

function SendDialog({ template, onClose, onSend }: any) {
  const tenants = tenantStore.getAll();
  const [email, setEmail] = useState(tenants[0]?.email || '');
  const [name, setName] = useState(tenants[0]?.full_name || '');

  return (
    <Dialog open onOpenChange={onClose}><DialogContent className="max-w-md" dir={dir}>
      <DialogHeader><DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5" />إرسال اختبار</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div><Label>المستلم</Label><Select value={email} onValueChange={v => { setEmail(v); const t = tenants.find(x => x.email === v); if (t) setName(t.full_name || t.company_name); }}><SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger><SelectContent>{tenants.map(t => <SelectItem key={t.id} value={t.email}>{t.full_name || t.company_name} - {t.email}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>{tt('tenants.name', 'الاسم')}</Label><Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" /></div>
        <div><Label>البريد</Label><Input value={email} onChange={e => setEmail(e.target.value)} className="mt-1.5" dir="ltr" /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>{tt('common.cancel', 'إلغاء')}</Button><Button onClick={() => onSend(template, email, name)} className="bg-[#533afd] hover:bg-[#533afd]"><Send className="h-4 w-4 ml-1" /> إرسال</Button></DialogFooter>
    </DialogContent></Dialog>
  );
}
