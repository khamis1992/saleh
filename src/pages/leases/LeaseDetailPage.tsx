import { useMemo, useState, useCallback } from 'react';
import { formatQAR, formatQARInt } from '@/lib/format';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WorkflowTimeline } from '@/components/shared/WorkflowTimeline';
import { NextBestAction } from '@/components/shared/NextBestAction';
import {
  ArrowRight, Pencil, FileText, Receipt, CalendarClock, RefreshCw, Ban, DollarSign, Bell,
  Upload, Download, Trash2, Eye, Archive, Plus, X, FileCheck, FileWarning,
} from 'lucide-react';
import {
  leaseStore, tenantStore, unitStore, propertyStore, invoiceStore, receiptStore, rentScheduleStore,
  documentStore, getTenantName, getUnitNumber, getPropertyName,
} from '@/services/stores';
import type { StoredDocument } from '@/services/stores';

const fmt = (v: number) => formatQAR(v);

const scheduleStatusLabels: Record<string, string> = {
  upcoming: 'قادم', due: 'مستحق', partially_paid: 'مدفوع جزئياً', paid: 'مدفوع',
  overdue: 'متأخر', cancelled: 'ملغي',
};

const invoiceStatusLabels: Record<string, string> = {
  draft: 'مسودة', issued: 'صادر', partially_paid: 'مدفوع جزئياً', paid: 'مدفوع',
  overdue: 'متأخر', cancelled: 'ملغي', written_off: 'مشطوب',
};

const paymentMethodLabels: Record<string, string> = {
  cash: 'نقدي', bank_transfer: 'تحويل بنكي', cheque: 'شيك', card: 'بطاقة', online: 'عبر الإنترنت',
};

const paymentFrequencyLabels: Record<string, string> = {
  monthly: 'شهري', quarterly: 'ربع سنوي', semi_annual: 'نصف سنوي', annual: 'سنوي', custom: 'مخصص',
};

const docFileTypeLabels: Record<string, string> = {
  land_deed: 'صك أرض', contract: 'عقد', drawing: 'مخطط', report: 'تقرير',
  photo: 'صورة', invoice: 'فاتورة', other: 'أخرى',
};

// Lease-context document types (contracts, ID copies, payment proofs, etc.)
const leaseDocTypes: { value: string; label: string }[] = [
  { value: 'contract', label: 'العقد الأصلي' },
  { value: 'contract', label: 'ملحق العقد' },
  { value: 'photo', label: 'صورة هوية المستأجر' },
  { value: 'photo', label: 'صورة شيك الضمان' },
  { value: 'invoice', label: 'إيصال استلام' },
  { value: 'report', label: 'تقرير حالة الوحدة' },
  { value: 'drawing', label: 'مخطط / خريطة' },
  { value: 'other', label: 'أخرى' },
];

export default function LeaseDetailPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();

  const lease = useMemo(() => leaseStore.getById(id || ''), [id]);
  const tenant = useMemo(() => lease ? tenantStore.getById(lease.tenant_id) : undefined, [lease]);
  const unit = useMemo(() => lease ? unitStore.getById(lease.unit_id) : undefined, [lease]);
  const property = useMemo(() => lease ? propertyStore.getById(lease.property_id) : undefined, [lease]);

  const schedules = useMemo(() => {
    if (!id) return [];
    return rentScheduleStore.getAll().filter(s => s.contract_id === id);
  }, [id]);

  const invoices = useMemo(() => {
    if (!id) return [];
    return invoiceStore.getAll().filter(i => i.contract_id === id);
  }, [id]);

  const receipts = useMemo(() => {
    if (!id) return [];
    return receiptStore.getAll().filter(r => r.contract_id === id);
  }, [id]);

  // ── Documents state ──
  const [docs, setDocs] = useState<StoredDocument[]>(() =>
    documentStore.getAll().filter(d => d.entity_type === 'contract' && d.entity_id === id)
  );
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoredDocument | null>(null);
  const [uploadForm, setUploadForm] = useState({
    file_name: '',
    file_type: 'contract',
    file_base64: '',
    notes: '',
  });

  const refreshDocs = () => {
    setDocs(documentStore.getAll().filter(d => d.entity_type === 'contract' && d.entity_id === id));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const inferredType = file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'photo'
        : file.name.match(/\.(pdf)$/i) ? 'contract'
        : file.name.match(/\.(xlsx|xls|csv)$/i) ? 'invoice'
        : file.name.match(/\.(dwg|dxf|skp)$/i) ? 'drawing'
        : 'other';
      setUploadForm(prev => ({
        ...prev,
        file_name: file.name,
        file_type: inferredType,
        file_base64: base64,
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleUpload = () => {
    if (!uploadForm.file_name || !uploadForm.file_base64) {
      toast.error('يرجى اختيار ملف للرفع');
      return;
    }
    const user = (() => {
      try {
        const u = localStorage.getItem('erp_auth_user');
        return u ? JSON.parse(u).email || 'مستخدم' : 'مستخدم';
      } catch { return 'مستخدم'; }
    })();

    documentStore.create({
      entity_type: 'contract',
      entity_id: id || '',
      file_name: uploadForm.file_name,
      file_type: uploadForm.file_type,
      file_url: uploadForm.file_base64,
      uploaded_by: user,
      uploaded_at: new Date().toISOString().slice(0, 10),
      notes: uploadForm.notes,
    });
    refreshDocs();
    toast.success('تم رفع المستند بنجاح');
    setShowUpload(false);
    setUploadForm({ file_name: '', file_type: 'contract', file_base64: '', notes: '' });
  };

  const handleDownload = (doc: StoredDocument) => {
    if (!doc.file_url) {
      toast.error('لا يوجد ملف مرفق');
      return;
    }
    try {
      let mimeType = 'application/octet-stream';
      if (doc.file_name.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (doc.file_name.match(/\.(jpg|jpeg)$/i)) mimeType = 'image/jpeg';
      else if (doc.file_name.endsWith('.png')) mimeType = 'image/png';
      else if (doc.file_name.endsWith('.xlsx')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (doc.file_name.endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (doc.file_name.endsWith('.txt')) mimeType = 'text/plain';

      const byteString = atob(doc.file_url);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
      const blob = new Blob([ab], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('تم تحميل الملف');
    } catch {
      toast.error('فشل تحميل الملف');
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    documentStore.remove(deleteTarget.id);
    refreshDocs();
    toast.success('تم حذف المستند بنجاح');
    setDeleteTarget(null);
  };

  // Quick KPIs for the documents tab
  const docsWithFile = docs.filter(d => d.file_url).length;
  const docsWithoutFile = docs.length - docsWithFile;
  const totalSizeBytes = docs.reduce((sum, d) => sum + (d.file_url ? Math.floor(d.file_url.length * 0.75) : 0), 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} م.ب`;
  };

  if (!lease) return <div className="text-center py-12">العقد غير موجود</div>;

  return (
    <div dir="rtl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/leases')}><ArrowRight className="h-4 w-4 ml-2" />{t.common.back}</Button>
        <div className="flex-1"><h1 className="text-2xl font-bold">{lease.contract_number}</h1></div>
        <Button variant="outline"><Pencil className="h-4 w-4 ml-2" />{t.common.edit}</Button>
        {(lease.status === 'active' || lease.status === 'expiring_soon') && (
          <>
            <Button variant="outline" className="text-green-600 hover:bg-green-50 border-green-200" onClick={() => navigate(`/leases/${lease.id}/renew`)}>
              <RefreshCw className="h-4 w-4 ml-2" />تجديد
            </Button>
            <Button variant="outline" className="text-red-600 hover:bg-red-50 border-red-200" onClick={() => navigate(`/leases/${lease.id}/terminate`)}>
              <Ban className="h-4 w-4 ml-2" />إنهاء
            </Button>
          </>
        )}
      </div>

      {/* ── Workflow timeline ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">دورة حياة العقد</p>
        <WorkflowTimeline
          steps={(() => {
            const order = [
              { key: 'draft', label: 'مسودة' },
              { key: 'pending_approval', label: 'بانتظار الموافقة' },
              { key: 'approved', label: 'معتمد' },
              { key: 'active', label: 'نشط' },
              { key: 'expiring_soon', label: 'قارب الانتهاء' },
              { key: 'renewed', label: 'مجدد' },
            ];
            const map: Record<string, 'completed' | 'current' | 'pending' | 'rejected'> = {
              draft: 'current', pending_signature: 'current', pending_approval: 'current',
              approved: 'completed', active: 'completed', expiring_soon: 'current',
              renewed: 'completed', terminated: 'rejected', cancelled: 'rejected', legal: 'rejected',
            };
            return order.map(o => ({ ...o, status: map[lease.status] || 'pending' }));
          })()}
        />
      </div>

      {/* Next best action */}
      {lease.status === 'expiring_soon' && (
        <NextBestAction
          title="العقد قارب على الانتهاء"
          description="جدّد العقد الآن لتجنب فترة فراغ."
          actionLabel="تجديد العقد"
          actionTo={`/leases/${lease.id}/renew`}
          variant="warning"
          className="mb-4"
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">قيمة الإيجار</div><div className="text-xl font-bold">{fmt(lease.rent_amount)}</div><span className="text-xs text-muted-foreground">{paymentFrequencyLabels[lease.payment_frequency]}</span></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">التأمين</div><div className="text-xl font-bold">{fmt(lease.security_deposit)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">تاريخ البداية</div><div className="text-xl font-bold">{lease.start_date}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">تاريخ النهاية</div><div className="text-xl font-bold">{lease.end_date}</div></CardContent></Card>
      </div>

      <Tabs dir="rtl" defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="schedule">جدول الدفعات</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="receipts">سندات القبض</TabsTrigger>
          <TabsTrigger value="documents">المستندات</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>أطراف العقد</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">المستأجر: </span>
                  {tenant ? (
                    <span className="cursor-pointer hover:underline text-primary" onClick={() => navigate(`/tenants/${tenant.id}`)}>{tenant.full_name || tenant.company_name}</span>
                  ) : '-'}
                </div>
                <div><span className="text-muted-foreground">كود المستأجر: </span>{tenant?.tenant_code || '-'}</div>
                <div><span className="text-muted-foreground">هاتف المستأجر: </span>{tenant?.phone || '-'}</div>
                <div><span className="text-muted-foreground">الوحدة: </span>
                  {unit ? (
                    <span className="cursor-pointer hover:underline text-primary" onClick={() => navigate(`/units/${unit.id}`)}>{unit.unit_number}</span>
                  ) : '-'}
                </div>
                <div><span className="text-muted-foreground">العقار: </span>
                  {property ? (
                    <span className="cursor-pointer hover:underline text-primary" onClick={() => navigate(`/properties/${property.id}`)}>{property.property_name}</span>
                  ) : '-'}
                </div>
                <div><span className="text-muted-foreground">الحالة: </span><StatusBadge status={lease.status} label={lease.status === 'active' ? 'نشط' : lease.status === 'draft' ? 'مسودة' : lease.status === 'expiring_soon' ? 'قارب الانتهاء' : lease.status === 'terminated' ? 'منتهي' : lease.status} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>شروط العقد</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground">قيمة الإيجار: </span>{fmt(lease.rent_amount)}</div>
                <div><span className="text-muted-foreground">دورية الدفع: </span>{paymentFrequencyLabels[lease.payment_frequency]}</div>
                <div><span className="text-muted-foreground">التأمين: </span>{fmt(lease.security_deposit)}</div>
                <div><span className="text-muted-foreground">رسوم إدارية: </span>{fmt(lease.admin_fees)}</div>
                {lease.commission > 0 && <div><span className="text-muted-foreground">العمولة: </span>{fmt(lease.commission)}</div>}
                <div><span className="text-muted-foreground">فترة السماح: </span>{lease.grace_period_days} يوم</div>
                <div><span className="text-muted-foreground">غرامة التأخير: </span>{lease.late_fee_type === 'percentage' ? `${lease.late_fee_amount}%` : fmt(lease.late_fee_amount)}</div>
                <div><span className="text-muted-foreground">تجديد تلقائي: </span>{lease.auto_renewal_allowed ? 'نعم' : 'لا'}</div>
                {lease.auto_renewal_allowed && <div><span className="text-muted-foreground">إشعار التجديد: </span>{lease.renewal_notice_days} يوم</div>}
                <div><span className="text-muted-foreground">إشعار الإنهاء: </span>{lease.termination_notice_days} يوم</div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">إجمالي المدفوعات المجدولة</div><div className="text-xl font-bold">{fmt(schedules.reduce((s, sc) => s + sc.total_due, 0))}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">إجمالي المدفوع</div><div className="text-xl font-bold text-green-600">{fmt(schedules.reduce((s, sc) => s + sc.paid_amount, 0))}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">الرصيد المتبقي</div><div className={`text-xl font-bold ${schedules.reduce((s, sc) => s + sc.balance, 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(schedules.reduce((s, sc) => s + sc.balance, 0))}</div></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="schedule">
          {schedules.length === 0 ? (
            <div className="text-center py-12"><CalendarClock className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">لا يوجد جدول دفعات</p></div>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>تاريخ الاستحقاق</TableHead><TableHead>الفترة</TableHead>
                    <TableHead>الإيجار</TableHead><TableHead>رسوم الخدمات</TableHead>
                    <TableHead>رسوم أخرى</TableHead><TableHead>غرامة تأخير</TableHead>
                    <TableHead>إجمالي المستحق</TableHead><TableHead>المدفوع</TableHead><TableHead>الرصيد</TableHead><TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.due_date}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.period_start} - {s.period_end}</TableCell>
                      <TableCell>{fmt(s.rent_amount)}</TableCell>
                      <TableCell>{s.service_charges > 0 ? fmt(s.service_charges) : '-'}</TableCell>
                      <TableCell>{s.other_charges > 0 ? fmt(s.other_charges) : '-'}</TableCell>
                      <TableCell className={s.late_fee > 0 ? 'text-red-600' : ''}>{s.late_fee > 0 ? fmt(s.late_fee) : '-'}</TableCell>
                      <TableCell className="font-bold">{fmt(s.total_due)}</TableCell>
                      <TableCell className="text-green-600">{fmt(s.paid_amount)}</TableCell>
                      <TableCell className={s.balance > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{fmt(s.balance)}</TableCell>
                      <TableCell><StatusBadge status={s.status} label={scheduleStatusLabels[s.status] || s.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="invoices">
          {invoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">لا توجد فواتير</p>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead><TableHead>تاريخ الإصدار</TableHead><TableHead>تاريخ الاستحقاق</TableHead>
                    <TableHead>المبلغ</TableHead><TableHead>المدفوع</TableHead><TableHead>الرصيد</TableHead><TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.invoice_date}</TableCell>
                      <TableCell>{inv.due_date}</TableCell>
                      <TableCell>{fmt(inv.total)}</TableCell>
                      <TableCell>{fmt(inv.paid_amount)}</TableCell>
                      <TableCell className={inv.balance > 0 ? 'text-red-600 font-bold' : 'text-green-600'}>{fmt(inv.balance)}</TableCell>
                      <TableCell><StatusBadge status={inv.status} label={invoiceStatusLabels[inv.status] || inv.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="receipts">
          {receipts.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">لا توجد سندات قبض</p>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم السند</TableHead><TableHead>تاريخ الدفع</TableHead><TableHead>طريقة الدفع</TableHead>
                    <TableHead>المبلغ</TableHead><TableHead>رقم المرجع</TableHead><TableHead>ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.receipt_number}</TableCell>
                      <TableCell>{r.payment_date}</TableCell>
                      <TableCell><Badge variant="outline">{paymentMethodLabels[r.payment_method] || r.payment_method}</Badge></TableCell>
                      <TableCell className="font-bold text-green-600">{fmt(r.amount)}</TableCell>
                      <TableCell>{r.reference_number || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{r.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="documents">
          {/* KPI strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">إجمالي المستندات</div>
                    <div className="text-2xl font-bold mt-1">{docs.length}</div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">ملفات مرفقة</div>
                    <div className="text-2xl font-bold mt-1 text-green-600">{docsWithFile}</div>
                    {docsWithoutFile > 0 && (
                      <div className="text-[11px] text-amber-600 mt-0.5">{docsWithoutFile} بدون ملف</div>
                    )}
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                    <FileCheck className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">الحجم التقريبي</div>
                    <div className="text-2xl font-bold mt-1 text-gray-700">{formatSize(totalSizeBytes)}</div>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Archive className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Header + Upload button */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">مستندات العقد</h3>
              <p className="text-xs text-gray-500 mt-0.5">العقد الأصلي، الملاحق، الهويات، الإيصالات</p>
            </div>
            <Button
              onClick={() => setShowUpload(true)}
              className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20"
            >
              <Upload className="h-4 w-4" />
              رفع مستند
            </Button>
          </div>

          {/* Documents table */}
          <Card>
            <CardContent className="p-0">
              {docs.length === 0 ? (
                <div className="text-center py-16">
                  <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-7 w-7 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">لا توجد مستندات</p>
                  <p className="text-xs text-gray-400 mt-1">ابدأ برفع العقد الأصلي والمستندات المتعلقة بهذا العقد</p>
                  <Button
                    onClick={() => setShowUpload(true)}
                    variant="outline"
                    size="sm"
                    className="mt-4 h-8 text-xs rounded-lg gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    رفع أول مستند
                  </Button>
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[11px] font-bold text-[#64748B] h-9">اسم المستند</TableHead>
                        <TableHead className="text-[11px] font-bold text-[#64748B] h-9">النوع</TableHead>
                        <TableHead className="text-[11px] font-bold text-[#64748B] h-9">رافع المستند</TableHead>
                        <TableHead className="text-[11px] font-bold text-[#64748B] h-9">تاريخ الرفع</TableHead>
                        <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الحالة</TableHead>
                        <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[120px]">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {docs.map((d) => (
                        <TableRow key={d.id} className="hover:bg-blue-50/30">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${d.file_url ? 'bg-blue-50' : 'bg-gray-100'}`}>
                                <FileText className={`h-4 w-4 ${d.file_url ? 'text-blue-600' : 'text-gray-400'}`} />
                              </div>
                              <div>
                                <div className="font-medium text-sm text-gray-900">{d.file_name}</div>
                                {d.notes && <div className="text-[11px] text-gray-500 mt-0.5">{d.notes}</div>}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[11px]">
                              {docFileTypeLabels[d.file_type] || d.file_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-700">{d.uploaded_by}</TableCell>
                          <TableCell className="text-sm text-gray-600 font-mono">{d.uploaded_at}</TableCell>
                          <TableCell>
                            {d.file_url ? (
                              <Badge className="bg-green-50 text-green-700 border-green-200 text-[10px] gap-1">
                                <FileCheck className="h-3 w-3" />
                                مرفق
                              </Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] gap-1">
                                <FileWarning className="h-3 w-3" />
                                لا يوجد ملف
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              {d.file_url ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                      onClick={() => handleDownload(d)}
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>تحميل</TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-block h-7 w-7 p-0 text-gray-300 cursor-not-allowed flex items-center justify-center">
                                      <Download className="h-3.5 w-3.5" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>لا يوجد ملف مرفق</TooltipContent>
                                </Tooltip>
                              )}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => setDeleteTarget(d)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>حذف</TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Dialog */}
          <Dialog open={showUpload} onOpenChange={setShowUpload}>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  رفع مستند للعقد {lease.contract_number}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div>
                  <Label>نوع المستند</Label>
                  <Select
                    value={uploadForm.file_type}
                    onValueChange={(v) => setUploadForm({ ...uploadForm, file_type: v })}
                  >
                    <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200 mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(docFileTypeLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الملف *</Label>
                  <div
                    {...getRootProps()}
                    className={`mt-1.5 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {uploadForm.file_name ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-700 font-medium">{uploadForm.file_name}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); setUploadForm({ ...uploadForm, file_name: '', file_base64: '' }); }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : isDragActive ? (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-blue-500" />
                        <p className="text-sm text-blue-600 font-medium">أفلت الملف هنا</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-8 w-8 text-gray-300" />
                        <p className="text-sm text-gray-500">اسحب وأفلت الملف هنا، أو اضغط للتصفح</p>
                        <p className="text-xs text-gray-400">PDF، صور، Word، Excel — حتى 10 ميجابايت</p>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>ملاحظات</Label>
                  <Input
                    className="h-9 text-sm rounded-lg border-gray-200 mt-1.5"
                    value={uploadForm.notes}
                    onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                    placeholder="مثال: العقد الأصلي الموقع من الطرفين"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 mt-2">
                <Button variant="outline" onClick={() => setShowUpload(false)} className="h-9 text-sm rounded-lg">
                  إلغاء
                </Button>
                <Button
                  onClick={handleUpload}
                  className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white h-9 text-sm rounded-lg"
                >
                  <Upload className="h-4 w-4" />
                  رفع المستند
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete confirmation */}
          <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف المستند <strong>{deleteTarget?.file_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  حذف المستند
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
