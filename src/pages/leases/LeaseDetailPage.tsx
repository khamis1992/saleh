import { useMemo } from 'react';
import { formatQAR, formatQARInt } from '@/lib/format';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { WorkflowTimeline } from '@/components/shared/WorkflowTimeline';
import { NextBestAction } from '@/components/shared/NextBestAction';
import { ArrowRight, Pencil, FileText, Receipt, CalendarClock, RefreshCw, Ban, DollarSign, Bell } from 'lucide-react';
import {
  leaseStore, tenantStore, unitStore, propertyStore, invoiceStore, receiptStore, rentScheduleStore,
  getTenantName, getUnitNumber, getPropertyName,
} from '@/services/stores';

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
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">قسم المستندات قيد التطوير</p>
            <p className="text-sm text-muted-foreground mt-1">سيتم إضافة رفع وعرض المستندات قريباً</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
