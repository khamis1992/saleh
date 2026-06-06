import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import {
  PenTool, Edit, Eye, Plus, Star, Wifi, WifiOff, Settings as SettingsIcon,
  FileText, CheckCircle2, XCircle, Clock, Send, Users, Shield, History,
  RefreshCw, AlertTriangle, Download,
} from 'lucide-react';
import {
  eSignProviderStore, eSignDocumentStore, eSignSignerStore,
  eSignRequestStore, eSignAuditEventStore,
  getESignProviderName, getESignDocumentName,
} from '@/services/stores';
import type { ESignProviderConfig, ESignDocument, ESignSigner, ESignRequest, ESignAuditEvent, ESignProvider } from '@/types';
import { toast } from 'sonner';
import { formatDate } from '@/lib/format';

const providerMeta: Record<ESignProvider, { name: string; logo: string; color: string; description: string }> = {
  docusign: { name: 'DocuSign', logo: '📄', color: 'from-blue-500 to-blue-600', description: 'المعيار الذهبي للتوقيع الإلكتروني' },
  zoho_sign: { name: 'Zoho Sign', logo: '🖊️', color: 'from-emerald-500 to-green-600', description: 'دعم عربي ممتاز - الأفضل في MENA' },
  pandadoc: { name: 'PandaDoc', logo: '🐼', color: 'from-violet-500 to-purple-600', description: 'إدارة العقود والتوقيع' },
  adobe_sign: { name: 'Adobe Sign', logo: '🅰️', color: 'from-red-500 to-rose-600', description: 'منصة Adobe الموثوقة' },
};

const docTypeLabels: Record<string, { name: string; icon: string }> = {
  lease: { name: 'عقد إيجار', icon: '🏠' },
  sale: { name: 'عقد بيع', icon: '💰' },
  service: { name: 'اتفاقية خدمة', icon: '🔧' },
  nda: { name: 'NDA', icon: '🔒' },
  maintenance: { name: 'صيانة', icon: '🛠️' },
  hr: { name: 'موارد بشرية', icon: '👥' },
  general: { name: 'عام', icon: '📋' },
};

export default function ESignaturePage() {
  const { dir } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState('providers');
  const [editing, setEditing] = useState<ESignProviderConfig | null>(null);
  const [viewDoc, setViewDoc] = useState<ESignDocument | null>(null);

  const providers = useMemo(() => eSignProviderStore.getAll(), [refresh]);
  const documents = useMemo(() => eSignDocumentStore.getAll(), [refresh]);
  const signers = useMemo(() => eSignSignerStore.getAll(), [refresh]);
  const requests = useMemo(() => eSignRequestStore.getAll(), [refresh]);
  const auditEvents = useMemo(() => eSignAuditEventStore.getAll(), [refresh]);

  const activeProviders = providers.filter(p => p.status === 'active').length;
  const totalDocs = documents.length;
  const completedDocs = documents.filter(d => d.status === 'completed').length;
  const pendingSignatures = signers.filter(s => s.status === 'sent' || s.status === 'pending').length;
  const completedSignatures = signers.filter(s => s.status === 'signed').length;

  const handleToggle = (p: ESignProviderConfig) => {
    eSignProviderStore.update(p.id, { status: p.status === 'active' ? 'inactive' : 'active' });
    toast.success(`تم ${p.status === 'active' ? 'تعطيل' : 'تفعيل'} ${p.display_name}`);
    setRefresh(r => r + 1);
  };

  const handleSetDefault = (p: ESignProviderConfig) => {
    providers.forEach(x => eSignProviderStore.update(x.id, { is_default: x.id === p.id }));
    toast.success(`${p.display_name} هو المزود الافتراضي`);
    setRefresh(r => r + 1);
  };

  const handleSaveProvider = (p: ESignProviderConfig) => {
    if (p.id && providers.find(x => x.id === p.id)) { eSignProviderStore.update(p.id, p); toast.success(`تم تحديث ${p.display_name}`); }
    else { eSignProviderStore.create({ ...p, id: `es-prov-${Date.now()}` } as any); toast.success(`تم إضافة ${p.display_name}`); }
    setEditing(null); setRefresh(r => r + 1);
  };

  const handleSendRequest = (d: ESignDocument) => {
    eSignDocumentStore.update(d.id, { status: d.status === 'draft' ? 'sent' : 'sent' });
    eSignRequestStore.create({
      id: `esr-${Date.now()}`, company_id: 'comp-1', document_id: d.id,
      subject: `يرجى التوقيع على ${d.document_name}`, message: `مرفق ${d.document_name} للتوقيع`,
      status: 'sent', initiated_by: 'المسؤول',
      sent_at: new Date().toISOString(), completed_at: '', expires_at: d.expires_at, reminder_count: 0,
      last_reminder_at: '', certificate_url: '', audit_trail_url: '', notes: '',
    } as any);
    eSignAuditEventStore.create({
      id: `esae-${Date.now()}`, document_id: d.id, request_id: `esr-${Date.now()}`,
      event_type: 'document_sent', actor_email: 'admin@aqari-erp.com', actor_name: 'المسؤول',
      ip_address: '127.0.0.1', user_agent: 'System', event_at: new Date().toISOString(),
      event_hash: `hash_${Date.now()}`, previous_hash: '000', details: 'تم إرسال الطلب للتوقيع',
    } as any);
    toast.success(`تم إرسال "${d.document_name}" للتوقيع`);
    setRefresh(r => r + 1);
  };

  const handleSimulateSign = (d: ESignDocument, signerId: string) => {
    const signer = signers.find(s => s.id === signerId);
    if (!signer) return;
    eSignSignerStore.update(signerId, { status: 'signed', signed_at: new Date().toISOString(), signature_url: '/signatures/simulated.png' });
    const allSigners = signers.filter(s => s.document_id === d.id);
    const signedCount = allSigners.filter(s => s.status === 'signed').length + 1;
    eSignDocumentStore.update(d.id, { signed_count: signedCount, status: signedCount === d.signer_count ? 'completed' : 'in_progress' });
    eSignAuditEventStore.create({
      id: `esae-${Date.now()}`, document_id: d.id, request_id: '', event_type: 'document_signed',
      actor_email: signer.email, actor_name: signer.name, ip_address: '127.0.0.1', user_agent: 'Simulation',
      event_at: new Date().toISOString(), event_hash: `hash_${Date.now()}`, previous_hash: 'sim_prev', details: `توقيع ${signer.name}`,
    } as any);
    toast.success(`تم توقيع ${signer.name}`);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader title="التوقيع الإلكتروني" description="إدارة التوقيعات الإلكترونية والعقود والموثقين" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard label="مزودون نشطون" value={`${activeProviders} / ${providers.length}`} icon={<Edit className="h-5 w-5" />} color="green" />
        <KpiCard label="مستندات" value={totalDocs} icon={<FileText className="h-5 w-5" />} color="blue" />
        <KpiCard label="مكتملة" value={completedDocs} icon={<CheckCircle2 className="h-5 w-5" />} color="emerald" />
        <KpiCard label="توقيعات معلقة" value={pendingSignatures} icon={<Clock className="h-5 w-5" />} color="orange" />
        <KpiCard label="مكتملة التوقيع" value={completedSignatures} icon={<PenTool className="h-5 w-5" />} color="violet" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="providers">المزودون</TabsTrigger>
          <TabsTrigger value="documents">{tt('documents.title', 'المستندات')}</TabsTrigger>
          <TabsTrigger value="signers">الموثقون</TabsTrigger>
          <TabsTrigger value="audit">{tt('system.auditLog', 'سجل التدقيق')}</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-[#64748d]">{providers.length} مزود</div>
            <Button size="sm" onClick={() => setEditing(null!)} className="bg-[#533afd]"><Plus className="h-4 w-4 ml-1" /> إضافة</Button>
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
                    <div className="flex items-center justify-between text-[12px] text-[#64748d]">
                      <span>يدعم العربية: {p.supports_arabic ? '✅' : '❌'}</span>
                      <span>Account: {p.account_id}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleToggle(p)}>{p.status === 'active' ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}</Button>
                      {!p.is_default && <Button size="sm" variant="ghost" onClick={() => handleSetDefault(p)} className="text-xs"><Star className="h-3 w-3 ml-1" />افتراضي</Button>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="space-y-3">
            {documents.map(d => {
              const dsSigners = signers.filter(s => s.document_id === d.id);
              return (
                <Card key={d.id} className="hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px]">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline">{docTypeLabels[d.document_type]?.icon} {docTypeLabels[d.document_type]?.name}</Badge>
                          {d.status === 'completed' && <Badge className="bg-emerald-100 text-emerald-700">{tt('maintenance.statuses.completed', 'مكتمل')}</Badge>}
                          {d.status === 'in_progress' && <Badge className="bg-[rgba(83,58,253,0.10)] text-[#533afd]">قيد التوقيع</Badge>}
                          {d.status === 'sent' && <Badge className="bg-amber-100 text-[#9b6829]">مُرسل</Badge>}
                          {d.status === 'draft' && <Badge variant="secondary">{tt('hr.draft', 'مسودة')}</Badge>}
                          {d.status === 'declined' && <Badge className="bg-red-100 text-[#ea2261]">{tt('hr.rejected', 'مرفوض')}</Badge>}
                        </div>
                        <h3 className="font-bold">{d.document_name}</h3>
                        <div className="text-xs text-[#64748d] mt-1">{d.page_count} صفحات • {d.file_size_kb} KB • {d.signer_count} موقّع</div>
                        <div className="flex items-center gap-3 text-xs mt-1">
                          <span className="text-emerald-600">✓ {d.signed_count}</span>
                          {d.declined_count > 0 && <span className="text-[#ea2261]">✗ {d.declined_count}</span>}
                          <span className="text-[#64748d]">من {d.signer_count}</span>
                        </div>
                        {d.expires_at && <div className="text-[12px] text-[#64748d] mt-1">تنتهي: {formatDate(d.expires_at)}</div>}
                      </div>
                      <div className="flex items-start gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setViewDoc(d)}><Eye className="h-3.5 w-3.5" /></Button>
                        {(d.status === 'draft') && <Button size="sm" variant="ghost" onClick={() => handleSendRequest(d)}><Send className="h-3.5 w-3.5" /></Button>}
                      </div>
                    </div>
                    {/* Signer list */}
                    {dsSigners.length > 0 && (
                      <div className="mt-3 pt-2 border-t">
                        <div className="text-[12px] text-[#64748d] mb-1">الموقّعون:</div>
                        <div className="space-y-1">
                          {dsSigners.map(s => (
                            <div key={s.id} className="flex items-center justify-between text-xs bg-[#f6f9fc] rounded px-2 py-1">
                              <div className="flex items-center gap-2">
                                <span>{s.name}</span>
                                <span className="text-[#64748d]">{s.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {s.status === 'signed' ? <Badge className="bg-emerald-100 text-emerald-700 text-[12px]">✓ وقّع</Badge> :
                                 s.status === 'declined' ? <Badge className="bg-red-100 text-[#ea2261] text-[12px]">✗ رفض</Badge> :
                                 s.status === 'viewed' ? <Badge className="bg-[rgba(83,58,253,0.10)] text-[#533afd] text-[12px]">👁 شاهد</Badge> :
                                 <Badge variant="outline" className="text-[12px]">⏳ {s.status}</Badge>}
                                {s.status !== 'signed' && s.status !== 'declined' && (d.status === 'sent' || d.status === 'in_progress') && (
                                  <Button size="sm" variant="ghost" className="h-5 text-[12px]" onClick={() => handleSimulateSign(d, s.id)}>محاكاة توقيع</Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="signers">
          <Card><CardContent className="p-0">
            <table className="w-full text-sm"><thead className="bg-[#f6f9fc] text-xs"><tr><th className="text-right p-3">المستند</th><th className="text-right p-3">الموقّع</th><th className="text-right p-3">{tt('users.role', 'الدور')}</th><th className="text-right p-3">{tt('legal.status', 'الحالة')}</th><th className="text-right p-3">وقّع في</th></tr></thead>
              <tbody>{signers.map(s => (
                <tr key={s.id} className="border-t hover:bg-[#f6f9fc]">
                  <td className="p-3 text-xs">{getESignDocumentName(s.document_id)}</td>
                  <td className="p-3"><div className="text-xs font-medium">{s.name}</div><code className="text-[12px] text-[#64748d]">{s.email}</code></td>
                  <td className="p-3 text-xs">{s.role === 'tenant' ? 'مستأجر' : s.role === 'landlord' ? 'مالك' : s.role}</td>
                  <td className="p-3">{s.status === 'signed' ? <Badge className="bg-emerald-100 text-emerald-700">✓ وقّع</Badge> : s.status === 'declined' ? <Badge className="bg-red-100 text-[#ea2261]">✗ رفض</Badge> : s.status === 'viewed' ? <Badge className="bg-[rgba(83,58,253,0.10)] text-[#533afd]">👁 شاهد</Badge> : <Badge variant="outline">{s.status}</Badge>}</td>
                  <td className="p-3 text-xs text-[#64748d]">{s.signed_at ? formatDate(s.signed_at) : '-'}</td>
                </tr>
              ))}</tbody></table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="audit">
          <Card><CardContent className="p-0">
            <table className="w-full text-sm"><thead className="bg-[#f6f9fc] text-xs"><tr><th className="text-right p-3">الحدث</th><th className="text-right p-3">الممثل</th><th className="text-right p-3">IP</th><th className="text-right p-3">التفاصيل</th><th className="text-right p-3">{tt('common.date', 'التاريخ')}</th></tr></thead>
              <tbody>{auditEvents.map(e => {
                const eventLabels: Record<string, string> = {
                  document_created: 'إنشاء المستند', document_sent: 'إرسال المستند', document_viewed: 'فتح المستند',
                  document_signed: 'توقيع المستند', document_completed: 'اكتمال التوقيع', document_declined: 'رفض المستند',
                  document_voided: 'إلغاء المستند', reminder_sent: 'إرسال تذكير', certificate_generated: 'إنشاء شهادة',
                };
                return (
                  <tr key={e.id} className="border-t hover:bg-[#f6f9fc]">
                    <td className="p-3"><Badge variant="outline" className="text-[12px]">{eventLabels[e.event_type] || e.event_type}</Badge></td>
                    <td className="p-3 text-xs">{e.actor_name}<br /><code className="text-[12px] text-[#64748d]">{e.actor_email}</code></td>
                    <td className="p-3"><code className="text-[12px]">{e.ip_address}</code></td>
                    <td className="p-3 text-xs">{e.details}</td>
                    <td className="p-3 text-xs text-[#64748d]">{formatDate(e.event_at)}</td>
                  </tr>
                );
              })}</tbody></table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {viewDoc && (
        <Dialog open onOpenChange={() => setViewDoc(null)}>
          <DialogContent className="max-w-xl" dir={dir}>
            <DialogHeader><DialogTitle>{viewDoc.document_name}</DialogTitle></DialogHeader>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">{tt('equipment.equipmentType', 'النوع')}</span><Badge variant="outline">{docTypeLabels[viewDoc.document_type]?.name}</Badge></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">المزود</span><span>{getESignProviderName(viewDoc.provider_id)}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">الصفحات</span><span>{viewDoc.page_count}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">الحجم</span><span>{viewDoc.file_size_kb} KB</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">الموقّعون</span><span>{viewDoc.signed_count} / {viewDoc.signer_count}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">أنشئ في</span><span className="text-xs">{formatDate(viewDoc.created_at)}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">ينتهي في</span><span className="text-xs">{viewDoc.expires_at ? formatDate(viewDoc.expires_at) : '-'}</span></div>
                <div className="flex justify-between p-2 border-b"><span className="text-[#64748d]">الملف</span><code className="text-xs">{viewDoc.file_url}</code></div>
              </div>
              {viewDoc.notes && <div className="p-2 bg-amber-50 text-[#9b6829] rounded text-xs">{viewDoc.notes}</div>}
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setViewDoc(null)}>إغلاق</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
