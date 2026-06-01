import { useMemo } from 'react';
import { formatQAR, formatQARInt } from '@/lib/format';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Pencil, Image, FileText, Home, Users, Receipt, Wrench, DollarSign, ClipboardCheck } from 'lucide-react';
import { unitStore, propertyStore, leaseStore, invoiceStore, maintenanceStore, tenantStore, getPropertyName, getUnitNumber, getTenantName } from '@/services/stores';
import { WorkflowTimeline } from '@/components/shared/WorkflowTimeline';
import { NextBestAction } from '@/components/shared/NextBestAction';

const fmt = (v: number) => formatQAR(v);

const unitTypeLabels: Record<string, string> = {
  villa: 'فيلا', apartment: 'شقة', studio: 'استوديو', office: 'مكتب',
  shop: 'محل', warehouse: 'مستودع', room: 'غرفة',
};

const contractStatusLabels: Record<string, string> = {
  draft: 'مسودة', pending_approval: 'بانتظار الموافقة', approved: 'معتمد', pending_signature: 'بانتظار التوقيع',
  active: 'نشط', expiring_soon: 'قارب الانتهاء', renewed: 'مجدد', terminated: 'منتهي', cancelled: 'ملغي', legal: 'قانوني',
};

const invoiceStatusLabels: Record<string, string> = {
  draft: 'مسودة', issued: 'صادر', partially_paid: 'مدفوع جزئياً', paid: 'مدفوع',
  overdue: 'متأخر', cancelled: 'ملغي', written_off: 'مشطوب',
};

const maintenanceStatusLabels: Record<string, string> = {
  submitted: 'مقدم', under_review: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض',
  assigned: 'معين', in_progress: 'قيد التنفيذ', waiting_parts: 'بانتظار القطع',
  completed: 'مكتمل', tenant_confirmed: 'مؤكد من المستأجر', closed: 'مغلق', cancelled: 'ملغي',
};

export default function UnitDetailPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();

  const unit = useMemo(() => unitStore.getById(id || ''), [id]);
  const property = useMemo(() => unit ? propertyStore.getById(unit.property_id) : undefined, [unit]);

  const unitLeases = useMemo(() => {
    if (!id) return [];
    return leaseStore.getAll().filter(l => l.unit_id === id);
  }, [id]);

  const activeLease = useMemo(() => unitLeases.find(l => l.status === 'active'), [unitLeases]);
  const currentTenant = useMemo(() => activeLease ? tenantStore.getById(activeLease.tenant_id) : undefined, [activeLease]);

  const unitInvoices = useMemo(() => {
    if (!id) return [];
    return invoiceStore.getAll().filter(i => i.unit_id === id);
  }, [id]);

  const unitMaintenance = useMemo(() => {
    if (!id) return [];
    return maintenanceStore.getAll().filter(m => m.unit_id === id);
  }, [id]);

  const financialSummary = useMemo(() => {
    const totalInvoiced = unitInvoices.reduce((s, i) => s + i.total, 0);
    const totalPaid = unitInvoices.reduce((s, i) => s + i.paid_amount, 0);
    const totalBalance = unitInvoices.reduce((s, i) => s + i.balance, 0);
    return { totalInvoiced, totalPaid, totalBalance };
  }, [unitInvoices]);

  if (!unit) return <div className="text-center py-12">الوحدة غير موجودة</div>;

  return (
    <div dir="rtl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/units')}><ArrowRight className="h-4 w-4 ml-2" />{t.common.back}</Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{unit.unit_code} - {unit.unit_number}</h1>
          <p className="text-sm text-muted-foreground">{property?.property_name || ''}</p>
        </div>
        <Button variant="outline"><Pencil className="h-4 w-4 ml-2" />{t.common.edit}</Button>
      </div>

      {/* ── Command Center: workflow timeline + next best action ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">دورة حياة الوحدة</p>
        <WorkflowTimeline
          steps={(() => {
            const hasLease = unitLeases.length > 0;
            const hasActiveLease = !!activeLease;
            const hasOpenMnt = unitMaintenance.some((m: any) => !['closed', 'completed', 'cancelled'].includes(m.status));
            const hasOverdueInvoice = unitInvoices.some((i: any) => i.status !== 'paid' && i.due_date && new Date(i.due_date) < new Date());
            return [
              { key: 'ready', label: 'جاهزة', status: 'completed' as const },
              { key: 'lease', label: hasActiveLease ? 'مؤجرة' : hasLease ? 'مؤجرة سابقاً' : 'شاغرة', status: hasActiveLease ? 'completed' as const : hasLease ? 'rejected' as const : 'pending' as const },
              { key: 'pay', label: hasOverdueInvoice ? 'متأخرة السداد' : hasActiveLease ? 'السداد منتظم' : '—', status: hasOverdueInvoice ? 'rejected' as const : hasActiveLease ? 'completed' as const : 'pending' as const },
              { key: 'mnt', label: hasOpenMnt ? 'صيانة جارية' : 'لا صيانة', status: hasOpenMnt ? 'current' as const : 'pending' as const },
            ];
          })()}
        />
      </div>

      {/* Next best action */}
      {unit.status === 'available' && (
        <NextBestAction
          title="الوحدة متاحة للتأجير"
          description="هذه الوحدة جاهزة. أنشئ عقد إيجار جديد لتأجيرها."
          actionLabel="إنشاء عقد إيجار"
          actionTo="/wizards/lease"
          variant="success"
          className="mb-4"
        />
      )}
      {unit.status === 'under_maintenance' && (
        <NextBestAction
          title="الوحدة تحت الصيانة"
          description="الوحدة حالياً في وضع الصيانة. أكمل طلب الصيانة وأعدها للتأجير."
          actionLabel="إدارة الصيانة"
          actionTo="/maintenance/requests"
          variant="warning"
          className="mb-4"
        />
      )}

      {/* Quick actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-2">إجراءات سريعة:</span>
        {unit.status === 'available' && (
          <Button variant="outline" size="sm" onClick={() => navigate('/wizards/lease')} className="h-8 text-xs gap-1">
            <FileText className="h-3.5 w-3.5" /> عقد إيجار
          </Button>
        )}
        {activeLease && (
          <Button variant="outline" size="sm" onClick={() => navigate('/wizards/payment')} className="h-8 text-xs gap-1">
            <DollarSign className="h-3.5 w-3.5" /> تسجيل دفعة
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => navigate('/maintenance/requests')} className="h-8 text-xs gap-1">
          <Wrench className="h-3.5 w-3.5" /> طلب صيانة
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate(`/maintenance/inspections`)} className="h-8 text-xs gap-1">
          <ClipboardCheck className="h-3.5 w-3.5" /> معاينة
        </Button>
      </div>

      <Tabs dir="rtl" defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="leases">سجل الإيجار</TabsTrigger>
          <TabsTrigger value="tenant">المستأجر الحالي</TabsTrigger>
          <TabsTrigger value="invoices">الفواتير</TabsTrigger>
          <TabsTrigger value="maintenance">سجل الصيانة</TabsTrigger>
          <TabsTrigger value="financial">الملخص المالي</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">الإيجار الشهري</div><div className="text-xl font-bold">{fmt(unit.expected_monthly_rent)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">التأمين المطلوب</div><div className="text-xl font-bold">{fmt(unit.security_deposit_required)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">المساحة</div><div className="text-xl font-bold">{unit.area_sqm} م²</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">عدد عقود الإيجار</div><div className="text-xl font-bold">{unitLeases.length}</div></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>تفاصيل الوحدة</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">العقار: </span>{property?.property_name || '-'}</div>
              <div><span className="text-muted-foreground">رقم الوحدة: </span>{unit.unit_number}</div>
              <div><span className="text-muted-foreground">النوع: </span>{unitTypeLabels[unit.unit_type] || unit.unit_type}</div>
              <div><span className="text-muted-foreground">المساحة: </span>{unit.area_sqm} م²</div>
              <div><span className="text-muted-foreground">غرف النوم: </span>{unit.bedrooms}</div>
              <div><span className="text-muted-foreground">الحمامات: </span>{unit.bathrooms}</div>
              <div><span className="text-muted-foreground">رقم المواقف: </span>{unit.parking_number || '-'}</div>
              <div><span className="text-muted-foreground">عداد الكهرباء: </span>{unit.electricity_meter || '-'}</div>
              <div><span className="text-muted-foreground">عداد المياه: </span>{unit.water_meter || '-'}</div>
              <div><span className="text-muted-foreground">حالة التأثيث: </span>{unit.furnished_status}</div>
              <div><span className="text-muted-foreground">الحالة: </span>{unit.condition}</div>
              <div><span className="text-muted-foreground">الإيجار الفعلي: </span>{unit.actual_rent > 0 ? fmt(unit.actual_rent * 12) : '-'}</div>
              <div><span className="text-muted-foreground">الإيجار السوقي: </span>{fmt(unit.market_monthly_rent)} / شهري</div>
              <div><span className="text-muted-foreground">حالة الوحدة: </span><StatusBadge status={unit.status} label={unit.status === 'leased' ? 'مؤجرة' : unit.status === 'available' ? 'متاحة' : unit.status === 'under_maintenance' ? 'تحت الصيانة' : unit.status} /></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leases">
          {unitLeases.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">لا يوجد سجل إيجار لهذه الوحدة</p>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم العقد</TableHead><TableHead>المستأجر</TableHead>
                    <TableHead>تاريخ البداية</TableHead><TableHead>تاريخ النهاية</TableHead>
                    <TableHead>قيمة الإيجار</TableHead><TableHead>التأمين</TableHead><TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitLeases.map(l => (
                    <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/leases/${l.id}`)}>
                      <TableCell className="font-medium">{l.contract_number}</TableCell>
                      <TableCell>{getTenantName(l.tenant_id)}</TableCell>
                      <TableCell>{l.start_date}</TableCell>
                      <TableCell>{l.end_date}</TableCell>
                      <TableCell>{fmt(l.rent_amount)}</TableCell>
                      <TableCell>{fmt(l.security_deposit)}</TableCell>
                      <TableCell><StatusBadge status={l.status} label={contractStatusLabels[l.status] || l.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="tenant">
          {!activeLease || !currentTenant ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا يوجد مستأجر حالي</p>
              <p className="text-sm text-muted-foreground mt-1">الوحدة {unit.status === 'available' ? 'متاحة للإيجار' : 'غير مؤجرة حالياً'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle>بيانات المستأجر</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div><span className="text-muted-foreground">الاسم: </span>{currentTenant.full_name || currentTenant.company_name}</div>
                  <div><span className="text-muted-foreground">كود المستأجر: </span>{currentTenant.tenant_code}</div>
                  <div><span className="text-muted-foreground">النوع: </span>{currentTenant.tenant_type === 'individual' ? 'فرد' : currentTenant.tenant_type === 'company' ? 'شركة' : 'جهة حكومية'}</div>
                  <div><span className="text-muted-foreground">الهاتف: </span>{currentTenant.phone}</div>
                  <div><span className="text-muted-foreground">البريد الإلكتروني: </span>{currentTenant.email}</div>
                  <div><span className="text-muted-foreground">العنوان: </span>{currentTenant.address}</div>
                  {currentTenant.national_id && <div><span className="text-muted-foreground">رقم الهوية: </span>{currentTenant.national_id}</div>}
                  {currentTenant.employer && <div><span className="text-muted-foreground">جهة العمل: </span>{currentTenant.employer}</div>}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>تفاصيل العقد الحالي</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div><span className="text-muted-foreground">رقم العقد: </span>{activeLease.contract_number}</div>
                  <div><span className="text-muted-foreground">تاريخ البداية: </span>{activeLease.start_date}</div>
                  <div><span className="text-muted-foreground">تاريخ النهاية: </span>{activeLease.end_date}</div>
                  <div><span className="text-muted-foreground">قيمة الإيجار: </span>{fmt(activeLease.rent_amount)} ({activeLease.payment_frequency === 'annual' ? 'سنوي' : activeLease.payment_frequency === 'quarterly' ? 'ربع سنوي' : 'شهري'})</div>
                  <div><span className="text-muted-foreground">التأمين: </span>{fmt(activeLease.security_deposit)}</div>
                  <div><span className="text-muted-foreground">فترة السماح: </span>{activeLease.grace_period_days} يوم</div>
                  <div><span className="text-muted-foreground">تجديد تلقائي: </span>{activeLease.auto_renewal_allowed ? 'نعم' : 'لا'}</div>
                  <div><span className="text-muted-foreground">الحالة: </span><StatusBadge status={activeLease.status} label={contractStatusLabels[activeLease.status]} /></div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices">
          {unitInvoices.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">لا توجد فواتير لهذه الوحدة</p>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الفاتورة</TableHead><TableHead>المستأجر</TableHead><TableHead>تاريخ الإصدار</TableHead>
                    <TableHead>المبلغ</TableHead><TableHead>المدفوع</TableHead><TableHead>الرصيد</TableHead><TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitInvoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{getTenantName(inv.tenant_id)}</TableCell>
                      <TableCell>{inv.invoice_date}</TableCell>
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

        <TabsContent value="maintenance">
          {unitMaintenance.length === 0 ? (
            <div className="text-center py-12">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">لا يوجد سجل صيانة</p>
            </div>
          ) : (
            <Card><CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الطلب</TableHead><TableHead>المستأجر</TableHead><TableHead>الفئة</TableHead>
                    <TableHead>الأولوية</TableHead><TableHead>الوصف</TableHead><TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unitMaintenance.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.request_number}</TableCell>
                      <TableCell>{getTenantName(m.tenant_id)}</TableCell>
                      <TableCell>{m.category === 'plumbing' ? 'سباكة' : m.category === 'ac' ? 'تكييف' : m.category === 'electrical' ? 'كهرباء' : m.category}</TableCell>
                      <TableCell><Badge variant={m.priority === 'emergency' ? 'destructive' : 'outline'}>{m.priority === 'emergency' ? 'طارئ' : m.priority === 'high' ? 'عالي' : m.priority === 'medium' ? 'متوسط' : 'منخفض'}</Badge></TableCell>
                      <TableCell className="max-w-[200px] truncate">{m.description}</TableCell>
                      <TableCell><StatusBadge status={m.status} label={maintenanceStatusLabels[m.status] || m.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent></Card>
          )}
        </TabsContent>

        <TabsContent value="financial">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">إجمالي الفواتير</div><div className="text-xl font-bold">{fmt(financialSummary.totalInvoiced)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">إجمالي المحصل</div><div className="text-xl font-bold text-green-600">{fmt(financialSummary.totalPaid)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-sm text-muted-foreground">الرصيد المستحق</div><div className={`text-xl font-bold ${financialSummary.totalBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(financialSummary.totalBalance)}</div></CardContent></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>تفاصيل الإيرادات</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">الإيجار الشهري المتوقع</span><span className="font-bold">{fmt(unit.expected_monthly_rent)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الإيجار السوقي</span><span>{fmt(unit.market_monthly_rent)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الإيجار السنوي المتوقع</span><span className="font-bold">{fmt(unit.expected_monthly_rent * 12)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">التأمين المطلوب</span><span>{fmt(unit.security_deposit_required)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">عدد الفواتير</span><span>{unitInvoices.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الفواتير المدفوعة</span><span>{unitInvoices.filter(i => i.status === 'paid').length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الفواتير المتأخرة</span><span className="text-red-600">{unitInvoices.filter(i => i.status === 'overdue').length}</span></div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
