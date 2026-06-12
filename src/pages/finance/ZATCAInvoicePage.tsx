import { useLocale } from '@/providers/LocaleContext';
import { useState, useMemo } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Receipt, Plus, Eye, FileText, QrCode, Shield, Link2, Send, CheckCircle2, XCircle, Clock,
  AlertCircle, Hash, Key, Building2, Calendar, Download, RefreshCw, Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { zatcaInvoiceStore, zatcaCsidStore, companyStore } from '@/services/stores';
import {
  generateUblXml, generateZatcaQR, generateUUIDv4, nextInvoiceNumber, runComplianceChecks,
  ZATCA_STATUS_LABELS_AR, ZATCA_TYPE_LABELS_AR, ZATCA_SUBTYPE_LABELS_AR,
  buildHashChain, canonicalXmlHash, isCsidActive, daysUntilExpiry,
} from '@/utils/zatca';
import type { ZatcaInvoiceRecord, ZatcaLineItem, ZatcaClearanceStatus, ZatcaInvoiceType, ZatcaInvoiceSubtype, ZatcaCsidRecord } from '@/types';

const formatSAR = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const formatSARInt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(v);

const today = () => new Date().toISOString().split('T')[0];
const nowTime = () => new Date().toTimeString().slice(0, 8);

const STATUS_VARIANT: Record<ZatcaClearanceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  queued: 'bg-amber-100 text-[#9b6829]',
  cleared: 'bg-emerald-100 text-emerald-700',
  reported: 'bg-[rgba(83,58,253,0.10)] text-[#533afd]',
  rejected: 'bg-red-100 text-[#ea2261]',
};

export default function ZATCAInvoicePage() {
  const { dir } = useLocale();
  const [invoices, setInvoices] = useState<ZatcaInvoiceRecord[]>(() => zatcaInvoiceStore.getAll());
  const [csids, setCsids] = useState(() => zatcaCsidStore.getAll());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<ZatcaInvoiceRecord | null>(null);

  const company = companyStore.getAll()[0];
  const activeCsid = csids.find(c => c.phase === 'production' && c.status === 'active') || csids.find(c => c.phase === 'compliance' && c.status === 'active');

  const refresh = () => {
    setInvoices(zatcaInvoiceStore.getAll());
    setCsids(zatcaCsidStore.getAll());
  };

  // ── KPI calculations ──
  const kpis = useMemo(() => {
    const cleared = invoices.filter(i => i.clearance_status === 'cleared' || i.clearance_status === 'reported');
    const totalRevenue = cleared.reduce((s, i) => s + i.total_incl_vat, 0);
    const totalVat = cleared.reduce((s, i) => s + i.total_vat, 0);
    const totalBase = cleared.reduce((s, i) => s + i.total_excl_vat, 0);
    const clearedCount = invoices.filter(i => i.clearance_status === 'cleared').length;
    return {
      totalInvoices: invoices.length,
      clearedRate: invoices.length > 0 ? (clearedCount / invoices.length) : 0,
      totalRevenue,
      totalVat,
      totalBase,
      draftCount: invoices.filter(i => i.clearance_status === 'draft').length,
      rejectedCount: invoices.filter(i => i.clearance_status === 'rejected').length,
    };
  }, [invoices]);

  const filtered = useMemo(() => {
    return invoices.filter(i => {
      if (statusFilter !== 'all' && i.clearance_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return i.invoice_number.toLowerCase().includes(q) || i.buyer_name.toLowerCase().includes(q) || i.uuid.includes(q);
      }
      return true;
    }).sort((a, b) => b.issue_date.localeCompare(a.issue_date));
  }, [invoices, search, statusFilter]);

  const handleCreate = (data: {
    buyerName: string;
    buyerVat: string;
    subtype: 'standard' | 'simplified';
    invoiceType: 'invoice' | 'credit_note' | 'debit_note';
    relatedId: string;
    lines: ZatcaLineItem[];
  }) => {
    if (data.lines.length === 0) { toast.error('أضف بنداً واحداً على الأقل'); return; }
    if (!activeCsid) { toast.error('لا يوجد CSID فعّال — لا يمكن إنشاء فاتورة'); return; }

    // Build invoice
    const lastInv = invoices[0];
    const invNumber = nextInvoiceNumber(lastInv?.invoice_number || 'INV-SA-2026-00000');
    const counter = (lastInv?.counter || 0) + 1;
    const previousHash = lastInv?.chain_hash || '0';
    const uuid = generateUUIDv4();
    const { date, time } = { date: today(), time: nowTime() };

    const totalExcl = data.lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const totalVat = data.lines.reduce((s, l) => s + (l.vat_category === 'S' ? l.quantity * l.unit_price * l.vat_rate : 0), 0);

    const draftXml = generateUblXml({
      id: uuid, invoice_number: invNumber, uuid, issue_date: date, issue_time: time,
      invoice_type: data.invoiceType, subtype: data.subtype,
      seller_name: company.name_ar, seller_vat_number: company.tax_number, seller_cr_number: company.cr_number,
      buyer_name: data.buyerName, buyer_vat_number: data.buyerVat,
      line_items: data.lines, previous_invoice_hash: previousHash, counter, csid_serial: activeCsid.serial,
    } as ZatcaInvoiceRecord);
    const xmlHash = canonicalXmlHash(draftXml);
    const chainHash = buildHashChain(previousHash, draftXml);
    const qrPayload = generateZatcaQR({
      sellerName: company.name_ar,
      vatNumber: company.tax_number,
      timestampISO: `${date}T${time}Z`,
      totalWithVat: totalExcl + totalVat,
      vatAmount: totalVat,
    });

    const newInv: ZatcaInvoiceRecord = {
      id: `zatca-${Date.now().toString(36)}`,
      company_id: 'comp-1', invoice_number: invNumber, uuid,
      issue_date: date, issue_time: time,
      invoice_type: data.invoiceType, subtype: data.subtype,
      seller_name: company.name_ar, seller_vat_number: company.tax_number, seller_cr_number: company.cr_number,
      buyer_name: data.buyerName, buyer_vat_number: data.buyerVat,
      counter, previous_invoice_hash: previousHash,
      xml_hash: xmlHash, chain_hash: chainHash,
      qr_payload: qrPayload, xml_content: draftXml,
      csid_serial: activeCsid.serial,
      clearance_status: 'queued', cleared_at: '',
      total_excl_vat: round2(totalExcl), total_vat: round2(totalVat), total_incl_vat: round2(totalExcl + totalVat),
      line_items: data.lines,
      related_invoice_id: data.relatedId, rejection_reason: '',
      created_at: new Date().toISOString(),
    };
    zatcaInvoiceStore.create(newInv);
    refresh();
    setCreateOpen(false);
    toast.success(`تم إنشاء الفاتورة ${invNumber} وإضافتها لقائمة الإرسال`);
  };

  const handleSimulateClearance = (inv: ZatcaInvoiceRecord) => {
    // Demo: simulate Fatoora clearance API response
    const next = inv.clearance_status === 'queued' ? 'cleared' : 'reported';
    zatcaInvoiceStore.update(inv.id, {
      clearance_status: next,
      cleared_at: new Date().toISOString(),
      rejection_reason: '',
    });
    refresh();
    setDetailInvoice(zatcaInvoiceStore.getById(inv.id) || null);
    toast.success(next === 'cleared' ? 'تم اعتماد الفاتورة من Fatoora ✓' : 'تم تبليغ الفاتورة (B2C) لـ Fatoora');
  };

  const handleReject = (inv: ZatcaInvoiceRecord, reason: string) => {
    zatcaInvoiceStore.update(inv.id, { clearance_status: 'rejected', rejection_reason: reason });
    refresh();
    setDetailInvoice(zatcaInvoiceStore.getById(inv.id) || null);
    toast.error('تم رفض الفاتورة');
  };

  const handleRevokeCsid = (csidId: string) => {
    zatcaCsidStore.update(csidId, { status: 'revoked' });
    refresh();
    toast.success('تم إلغاء تنشيط الـ CSID');
  };

  return (
    <div className="min-h-full bg-[#f6f9fc] p-6" dir={dir}>
      <PageHeader
        title="الفوترة الإلكترونية - ZATCA (السعودية)"
        description="إنشاء وإرسال فواتير متوافقة مع هيئة الزكاة والضريبة والجمارك (ZATCA) - المرحلة الثانية"
      />

      {/* ZATCA Status Banner */}
      <Card className={`mb-6 ${activeCsid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Building2 className={`h-8 w-8 ${activeCsid ? 'text-emerald-600' : 'text-[#ea2261]'}`} />
              <div>
                <h3 className="font-bold text-lg">{company.name_ar}</h3>
                <p className="text-sm text-[#64748d]">
                  السجل التجاري: {company.cr_number} • الرقم الضريبي: {company.tax_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeCsid ? (
                <Badge className="bg-emerald-600 text-white text-base px-3 py-1">
                  <CheckCircle2 className="h-4 w-4 ml-1" /> متصل بـ Fatoora ({activeCsid.phase === 'production' ? 'إنتاج' : 'مطابقة'})
                </Badge>
              ) : (
                <Badge className="bg-red-600 text-white text-base px-3 py-1">
                  <XCircle className="h-4 w-4 ml-1" /> غير متصل
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[rgba(83,58,253,0.06)] flex items-center justify-center">
                <Receipt className="h-5 w-5 text-[#533afd]" />
              </div>
              <div>
                <p className="text-xs text-[#64748d]">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-[#061b31]">{kpis.totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-[#64748d]">نسبة الاعتماد</p>
                <p className="text-2xl font-bold text-emerald-600">{(kpis.clearedRate * 100).toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#9b6829]" />
              </div>
              <div>
                <p className="text-xs text-[#64748d]">إجمالي المبيعات (شامل الضريبة)</p>
                <p className="text-2xl font-bold text-[#061b31]">{formatSARInt(kpis.totalRevenue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <Shield className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-[#64748d]">ضريبة محصلة (15%)</p>
                <p className="text-2xl font-bold text-violet-600">{formatSARInt(kpis.totalVat)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" dir={dir}>
        <TabsList className="mb-4">
          <TabsTrigger value="invoices">{tt('rentCollection.invoices', 'الفواتير')}</TabsTrigger>
          <TabsTrigger value="csid">إدارة CSID ({csids.length})</TabsTrigger>
          <TabsTrigger value="chain">سلسلة الهاش</TabsTrigger>
          <TabsTrigger value="compliance">فحوصات المطابقة</TabsTrigger>
        </TabsList>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" /> فواتير ZATCA
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث برقم الفاتورة أو UUID" className="h-9 pr-9 w-64" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    {(Object.keys(ZATCA_STATUS_LABELS_AR) as ZatcaClearanceStatus[]).map(s => (
                      <SelectItem key={s} value={s}>{ZATCA_STATUS_LABELS_AR[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setCreateOpen(true)} className="gap-2 bg-[#533afd] hover:bg-[#533afd]" disabled={!activeCsid}>
                  <Plus className="h-4 w-4" /> فاتورة جديدة
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{tt('rentCollection.invoiceNumber', 'رقم الفاتورة')}</TableHead>
                    <TableHead>{tt('common.date', 'التاريخ')}</TableHead>
                    <TableHead>{tt('equipment.equipmentType', 'النوع')}</TableHead>
                    <TableHead>المشتري</TableHead>
                    <TableHead>{tt('common.total', 'الإجمالي')}</TableHead>
                    <TableHead>الضريبة</TableHead>
                    <TableHead>{tt('legal.status', 'الحالة')}</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div>
                          <p className="font-mono text-xs font-semibold">{inv.invoice_number}</p>
                          <p className="text-xs text-[#64748d] mt-0.5 font-mono">{inv.uuid.slice(0, 8)}…</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {inv.issue_date}
                        <span className="block text-xs text-[#64748d]">{inv.issue_time}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs">{ZATCA_TYPE_LABELS_AR[inv.invoice_type]}</span>
                          <span className="text-xs text-[#64748d]">{ZATCA_SUBTYPE_LABELS_AR[inv.subtype]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {inv.buyer_name || <span className="text-[#64748d]">— بيع مباشر —</span>}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{formatSAR(inv.total_incl_vat)}</TableCell>
                      <TableCell className="text-xs text-violet-600 font-semibold">{formatSAR(inv.total_vat)}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_VARIANT[inv.clearance_status]}>
                          {ZATCA_STATUS_LABELS_AR[inv.clearance_status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setDetailInvoice(inv)} className="h-7 w-7 p-0">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          {inv.clearance_status === 'queued' && (
                            <Button variant="ghost" size="sm" onClick={() => handleSimulateClearance(inv)} className="h-7 px-2 text-xs text-emerald-600">
                              <Send className="h-3 w-3 ml-1" /> اعتماد
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="p-12 text-center">
                        <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-[#64748d]">لا توجد فواتير</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSID Management */}
        <TabsContent value="csid">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {csids.map(csid => {
              const active = isCsidActive(csid);
              const days = daysUntilExpiry(csid);
              return (
                <Card key={csid.id} className="bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Key className={`h-5 w-5 ${active ? 'text-emerald-600' : 'text-[#ea2261]'}`} />
                      CSID — {csid.phase === 'compliance' ? 'مطابقة' : 'إنتاج'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748d]">الرقم التسلسلي</span>
                      <span className="font-mono text-xs font-semibold">{csid.serial}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748d]">تاريخ الإصدار</span>
                      <span className="text-xs">{csid.issued_at.split('T')[0]}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748d]">{tt('documents.expiryDate', 'تاريخ الانتهاء')}</span>
                      <span className="text-xs">{(csid as any).expiry_date?.split('T')[0] || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748d]">الأيام المتبقية</span>
                      <span className={`text-xs font-bold ${days < 30 ? 'text-[#ea2261]' : days < 90 ? 'text-[#9b6829]' : 'text-emerald-600'}`}>
                        {days > 0 ? `${days} يوم` : t.leases.statuses.terminated || tt('leases.statuses.terminated','منتهي')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748d]">{tt('legal.status', 'الحالة')}</span>
                      <Badge className={active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-[#ea2261]'}>
                        {active ? 'فعّال' : csid.status === 'revoked' ? 'مُلغى' : t.leases.statuses.terminated || tt('leases.statuses.terminated','منتهي')}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#64748d] pt-2 border-t">{csid.notes}</p>
                    {active && (
                      <Button variant="outline" size="sm" onClick={() => handleRevokeCsid(csid.id)} className="w-full text-[#ea2261] hover:bg-red-50">
                        إلغاء التنشيط
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Hash Chain */}
        <TabsContent value="chain">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" /> سلسلة الهاش (Hash Chain)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-[rgba(83,58,253,0.06)] border border-blue-200 rounded-lg text-sm">
                <p><strong>كيف تعمل السلسلة:</strong> كل فاتورة تحتوي على هاش الفاتورة السابقة (PIH). أي تعديل بأثر رجعي يكسر السلسلة ويفشل التحقق في Fatoora.</p>
              </div>
              <div className="space-y-3">
                {[...invoices].sort((a, b) => a.counter - b.counter).map((inv, idx, arr) => {
                  const prev = idx > 0 ? arr[idx - 1] : null;
                  return (
                    <div key={inv.id} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-[#533afd] text-white text-xs font-bold flex items-center justify-center">
                          {inv.counter}
                        </div>
                        {idx < arr.length - 1 && <div className="w-0.5 h-12 bg-gray-200 mt-1" />}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-mono text-xs font-semibold">{inv.invoice_number}</p>
                          <Badge className={STATUS_VARIANT[inv.clearance_status as keyof typeof STATUS_VARIANT]}>
                            {ZATCA_STATUS_LABELS_AR[inv.clearance_status as keyof typeof ZATCA_STATUS_LABELS_AR]}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs font-mono">
                          <div className="bg-[#f6f9fc] p-2 rounded">
                            <p className="text-[#64748d]">XML Hash</p>
                            <p className="break-all">{inv.xml_hash.slice(0, 32)}…</p>
                          </div>
                          <div className="bg-[#f6f9fc] p-2 rounded">
                            <p className="text-[#64748d]">Chain Hash</p>
                            <p className="break-all">{inv.chain_hash.slice(0, 32)}…</p>
                          </div>
                        </div>
                        {prev && (
                          <p className="text-xs text-[#64748d] mt-1">
                            ↑ يشير إلى: <span className="font-mono">{prev.chain_hash.slice(0, 16)}…</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" /> فحوصات المطابقة (Compliance Checks)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#64748d] mb-4">
                10 فحوصات مطلوبة من ZATCA. تُجرى تلقائياً على كل فاتورة قبل الإرسال.
              </p>
              <div className="space-y-2">
                {runComplianceChecks(invoices[0] || ({} as ZatcaInvoiceRecord)).checks.map(check => (
                  <div key={check.id} className={`flex items-center justify-between p-3 rounded-lg border ${check.passed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center gap-3">
                      {check.passed ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-[#ea2261]" />}
                      <div>
                        <p className="text-sm font-medium">{check.id} - {check.label}</p>
                        {check.hint && <p className="text-xs text-[#64748d]">{check.hint}</p>}
                      </div>
                    </div>
                    <Badge className={check.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-[#ea2261]'}>
                      {check.passed ? 'مطابق' : 'غير مطابق'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Invoice Dialog */}
      <CreateInvoiceDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
        nextCounter={(invoices[0]?.counter || 0) + 1}
        nextInvoiceNumber={nextInvoiceNumber(invoices[0]?.invoice_number || 'INV-SA-2026-00000')}
        existingInvoices={invoices}
      />

      {/* Detail Drawer (as a Dialog) */}
      {detailInvoice && (
        <InvoiceDetailDialog
          invoice={detailInvoice}
          onClose={() => setDetailInvoice(null)}
          onClear={() => handleSimulateClearance(detailInvoice)}
          onReject={(r) => handleReject(detailInvoice, r)}
        />
      )}
    </div>
  );
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ── Create Invoice Dialog ─────────────────────────────────────────
function CreateInvoiceDialog({ open, onClose, onCreate, nextCounter, nextInvoiceNumber, existingInvoices }: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    buyerName: string;
    buyerVat: string;
    subtype: 'standard' | 'simplified';
    invoiceType: 'invoice' | 'credit_note' | 'debit_note';
    relatedId: string;
    lines: ZatcaLineItem[];
  }) => void;
  nextCounter: number;
  nextInvoiceNumber: string;
  existingInvoices: ZatcaInvoiceRecord[];
}) {
  const [subtype, setSubtype] = useState<'standard' | 'simplified'>('standard');
  const [invoiceType, setInvoiceType] = useState<'invoice' | 'credit_note' | 'debit_note'>('invoice');
  const [buyerName, setBuyerName] = useState('');
  const [buyerVat, setBuyerVat] = useState('');
  const [relatedId, setRelatedId] = useState('');
  const [lines, setLines] = useState<ZatcaLineItem[]>([
    { id: '1', description: '', quantity: 1, unit_price: 0, vat_rate: 0.15, vat_category: 'S' },
  ]);

  const total = useMemo(() => {
    const excl = lines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const vat = lines.reduce((s, l) => s + (l.vat_category === 'S' ? l.quantity * l.unit_price * l.vat_rate : 0), 0);
    return { excl: round2(excl), vat: round2(vat), incl: round2(excl + vat) };
  }, [lines]);

  const reset = () => {
    setSubtype('standard');
    setInvoiceType('invoice');
    setBuyerName('');
    setBuyerVat('');
    setRelatedId('');
    setLines([{ id: '1', description: '', quantity: 1, unit_price: 0, vat_rate: 0.15, vat_category: 'S' }]);
  };

  const handleSubmit = () => {
    if (subtype === 'standard' && (!buyerName || !buyerVat)) {
      toast.error('الفاتورة المفصلة تتطلب اسم المشتري ورقمه الضريبي');
      return;
    }
    onCreate({ buyerName, buyerVat, subtype, invoiceType, relatedId, lines });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { reset(); onClose(); } }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-[#533afd]" /> إنشاء فاتورة ZATCA جديدة
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>رقم الفاتورة (تلقائي)</Label>
              <Input value={nextInvoiceNumber} disabled className="mt-1.5 font-mono" />
            </div>
            <div>
              <Label>العداد (ICV)</Label>
              <Input value={nextCounter} disabled className="mt-1.5 font-mono" />
            </div>
            <div>
              <Label>نوع الفاتورة</Label>
              <Select value={invoiceType} onValueChange={(v) => setInvoiceType(v as typeof invoiceType)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ZATCA_TYPE_LABELS_AR) as Array<keyof typeof ZATCA_TYPE_LABELS_AR>).map(t => (
                    <SelectItem key={t} value={t}>{ZATCA_TYPE_LABELS_AR[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>نوع الإصدار</Label>
              <Select value={subtype} onValueChange={(v) => setSubtype(v as 'standard' | 'simplified')}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">مفصلة (B2B) - 388</SelectItem>
                  <SelectItem value="simplified">مبسطة (B2C) - 381</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {subtype === 'standard' ? (
              <>
                <div>
                  <Label>اسم المشتري *</Label>
                  <Input value={buyerName} onChange={e => setBuyerName(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>الرقم الضريبي للمشتري *</Label>
                  <Input value={buyerVat} onChange={e => setBuyerVat(e.target.value)} maxLength={15} className="mt-1.5 font-mono" />
                </div>
              </>
            ) : null}
            {invoiceType !== 'invoice' && (
              <div>
                <Label>الفاتورة المرتبطة</Label>
                <Select value={relatedId || 'none'} onValueChange={v => setRelatedId(v === 'none' ? '' : v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="اختر الفاتورة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— لا شيء —</SelectItem>
                    {existingInvoices.filter(i => i.invoice_type === 'invoice').map(i => (
                      <SelectItem key={i.id} value={i.id}>{i.invoice_number} — {i.buyer_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>بنود الفاتورة</Label>
              <Button variant="outline" size="sm" onClick={() => setLines([...lines, { id: String(lines.length + 1), description: '', quantity: 1, unit_price: 0, vat_rate: 0.15, vat_category: 'S' }])}>
                <Plus className="h-3 w-3 ml-1" /> بند
              </Button>
            </div>
            <div className="space-y-2">
              {lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2 bg-[#f6f9fc] rounded">
                  <div className="col-span-5">
                    {idx === 0 && <Label className="text-xs">{tt('maintenance.description', 'الوصف')}</Label>}
                    <Input value={line.description} onChange={e => { const nl = [...lines]; nl[idx] = { ...nl[idx], description: e.target.value }; setLines(nl); }} className="h-8 text-sm" placeholder="وصف البند" />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <Label className="text-xs">{tt('inventory.quantity', 'الكمية')}</Label>}
                    <Input type="number" value={line.quantity} onChange={e => { const nl = [...lines]; nl[idx] = { ...nl[idx], quantity: parseFloat(e.target.value) || 0 }; setLines(nl); }} className="h-8 text-sm" />
                  </div>
                  <div className="col-span-3">
                    {idx === 0 && <Label className="text-xs">السعر (قبل الضريبة)</Label>}
                    <Input type="number" value={line.unit_price} onChange={e => { const nl = [...lines]; nl[idx] = { ...nl[idx], unit_price: parseFloat(e.target.value) || 0 }; setLines(nl); }} className="h-8 text-sm" />
                  </div>
                  <div className="col-span-2">
                    {idx === 0 && <Label className="text-xs">التصنيف</Label>}
                    <Select value={line.vat_category} onValueChange={(v: 'S' | 'Z' | 'E' | 'O') => { const nl = [...lines]; nl[idx] = { ...nl[idx], vat_category: v }; setLines(nl); }}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="S">خاضع 15%</SelectItem>
                        <SelectItem value="Z">صفر%</SelectItem>
                        <SelectItem value="E">معفى</SelectItem>
                        <SelectItem value="O">خارج النطاق</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-[rgba(83,58,253,0.06)] border border-blue-200 rounded-lg p-3 grid grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-[#64748d]">الإجمالي قبل الضريبة</p>
              <p className="font-bold text-lg">{formatSAR(total.excl)}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748d]">الضريبة (15%)</p>
              <p className="font-bold text-lg text-violet-600">{formatSAR(total.vat)}</p>
            </div>
            <div>
              <p className="text-xs text-[#64748d]">الإجمالي شامل</p>
              <p className="font-bold text-lg text-[#533afd]">{formatSAR(total.incl)}</p>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={() => { reset(); onClose(); }}>{tt('common.cancel', 'إلغاء')}</Button>
          <Button onClick={handleSubmit} className="bg-[#533afd] hover:bg-[#533afd] gap-2">
            <Send className="h-4 w-4" /> إرسال لـ Fatoora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Invoice Detail Dialog ─────────────────────────────────────────
function InvoiceDetailDialog({ invoice, onClose, onClear, onReject }: {
  invoice: ZatcaInvoiceRecord;
  onClose: () => void;
  onClear: () => void;
  onReject: (reason: string) => void;
}) {
  const [tab, setTab] = useState('overview');
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir={dir}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-[#533afd]" /> {invoice.invoice_number}
            <Badge className={STATUS_VARIANT[invoice.clearance_status as keyof typeof STATUS_VARIANT]}>
              {ZATCA_STATUS_LABELS_AR[invoice.clearance_status as keyof typeof ZATCA_STATUS_LABELS_AR]}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={setTab} dir={dir}>
          <TabsList className="mb-3">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="lines">البنود</TabsTrigger>
            <TabsTrigger value="xml">XML</TabsTrigger>
            <TabsTrigger value="qr">QR</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Field label="UUID" value={invoice.uuid} mono />
              <Field label="نوع الفاتورة" value={`${ZATCA_TYPE_LABELS_AR[invoice.invoice_type as keyof typeof ZATCA_TYPE_LABELS_AR]} — ${ZATCA_SUBTYPE_LABELS_AR[invoice.subtype as keyof typeof ZATCA_SUBTYPE_LABELS_AR]}`} />
              <Field label="تاريخ الإصدار" value={`${invoice.issue_date} ${invoice.issue_time}`} />
              <Field label="المشتري" value={invoice.buyer_name || '— بيع مباشر —'} />
              <Field label="رقم ضريبي المشتري" value={invoice.buyer_vat_number || '—'} mono />
              <Field label="العداد (ICV)" value={String(invoice.counter)} mono />
            </div>
            <div className="grid grid-cols-3 gap-3 p-3 bg-[rgba(83,58,253,0.06)] border border-blue-200 rounded-lg">
              <div><p className="text-xs text-[#64748d]">قبل الضريبة</p><p className="font-bold">{formatSAR(invoice.total_excl_vat)}</p></div>
              <div><p className="text-xs text-[#64748d]">الضريبة</p><p className="font-bold text-violet-600">{formatSAR(invoice.total_vat)}</p></div>
              <div><p className="text-xs text-[#64748d]">{tt('common.total', 'الإجمالي')}</p><p className="font-bold text-[#533afd]">{formatSAR(invoice.total_incl_vat)}</p></div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-[#64748d] font-mono">XML Hash (SHA-256): {invoice.xml_hash}</p>
              <p className="text-xs text-[#64748d] font-mono">Chain Hash: {invoice.chain_hash}</p>
              <p className="text-xs text-[#64748d] font-mono">CSID: {invoice.csid_serial}</p>
              <p className="text-xs text-[#64748d] font-mono">Previous: {invoice.previous_invoice_hash}</p>
            </div>
            {invoice.clearance_status === 'queued' && !rejectMode && (
              <div className="flex gap-2 pt-2">
                <Button onClick={onClear} className="flex-1 bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <CheckCircle2 className="h-4 w-4" /> محاكاة الاعتماد
                </Button>
                <Button onClick={() => setRejectMode(true)} variant="outline" className="flex-1 text-[#ea2261] border-red-200 hover:bg-red-50 gap-2">
                  <XCircle className="h-4 w-4" /> رفض
                </Button>
              </div>
            )}
            {rejectMode && (
              <div className="space-y-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Label>سبب الرفض</Label>
                <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="مثال: خطأ في الرقم الضريبي للمشتري" className="bg-white" />
                <div className="flex gap-2">
                  <Button onClick={() => { onReject(rejectReason); setRejectMode(false); }} className="bg-red-600 hover:bg-red-700">تأكيد الرفض</Button>
                  <Button variant="outline" onClick={() => setRejectMode(false)}>{tt('common.cancel', 'إلغاء')}</Button>
                </div>
              </div>
            )}
            {invoice.clearance_status === 'rejected' && invoice.rejection_reason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-[#ea2261]">
                <strong>سبب الرفض:</strong> {invoice.rejection_reason}
              </div>
            )}
          </TabsContent>

          <TabsContent value="lines">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>{tt('maintenance.description', 'الوصف')}</TableHead>
                  <TableHead>{tt('inventory.quantity', 'الكمية')}</TableHead>
                  <TableHead>السعر</TableHead>
                  <TableHead>التصنيف</TableHead>
                  <TableHead>الضريبة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.line_items.map((line: any) => (
                  <TableRow key={line.id}>
                    <TableCell className="text-xs">{line.id}</TableCell>
                    <TableCell className="text-xs">{line.description}</TableCell>
                    <TableCell className="text-xs">{line.quantity}</TableCell>
                    <TableCell className="text-xs">{formatSAR(line.unit_price)}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline">{line.vat_category} ({(line.vat_rate * 100).toFixed(0)}%)</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{formatSAR(line.quantity * line.unit_price * (line.vat_category === 'S' ? line.vat_rate : 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="xml">
            <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-96" dir="ltr">
              {invoice.xml_content}
            </pre>
            <Button onClick={() => { navigator.clipboard.writeText(invoice.xml_content); toast.success('تم نسخ XML'); }} variant="outline" size="sm" className="mt-2">
              نسخ XML
            </Button>
          </TabsContent>

          <TabsContent value="qr">
            <div className="space-y-3">
              <div className="flex flex-col items-center p-6 bg-white border-2 border-[#e5edf5] rounded-lg">
                <QrCode className="h-32 w-32 text-[#273951]" />
                <p className="mt-3 text-xs text-[#64748d]">QR Code (مشفّر بـ TLV 5-tags، base64-url)</p>
              </div>
              <div className="bg-[#f6f9fc] p-3 rounded-lg">
                <p className="text-xs text-[#64748d] mb-1 font-semibold">الـ Payload الخام (Base64-URL):</p>
                <p className="text-xs font-mono break-all">{invoice.qr_payload}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-[#64748d]">{label}</p>
      <p className={`text-xs font-semibold ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
