import { useMemo } from 'react';
import { formatQAR, formatQARInt } from '@/lib/format';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Pencil, Phone, Mail, MapPin, FileText, Home, Receipt, Wrench, Scale, User, Banknote, Bell, AlertTriangle } from 'lucide-react';
import { tenantStore, leaseStore, invoiceStore, receiptStore, maintenanceStore, unitStore, propertyStore, getUnitNumber, getPropertyName } from '@/services/stores';
import { WorkflowTimeline } from '@/components/shared/WorkflowTimeline';
import { NextBestAction } from '@/components/shared/NextBestAction';
import { toast } from 'sonner';

const fmt = (v: number) => formatQAR(v);

const invoiceStatusLabels: Record<string, string> = { draft: 'مسودة', issued: 'صادر', partially_paid: 'مدفوع جزئياً', paid: 'مدفوع', overdue: 'متأخر', cancelled: 'ملغي', written_off: 'مشطوب' };
const contractStatusLabels: Record<string, string> = { draft: 'مسودة', pending_approval: 'بانتظار الموافقة', approved: 'معتمد', pending_signature: 'بانتظار التوقيع', active: 'نشط', expiring_soon: 'قارب الانتهاء', renewed: 'مجدد', terminated: 'منتهي', cancelled: 'ملغي', legal: 'قانوني' };
const maintenanceStatusLabels: Record<string, string> = { submitted: 'مقدم', under_review: 'قيد المراجعة', approved: 'معتمد', rejected: 'مرفوض', assigned: 'معين', in_progress: 'قيد التنفيذ', waiting_parts: 'بانتظار القطع', completed: 'مكتمل', tenant_confirmed: 'مؤكد من المستأجر', closed: 'مغلق', cancelled: 'ملغي' };
const paymentMethodLabels: Record<string, string> = { cash: 'نقدي', bank_transfer: 'تحويل بنكي', cheque: 'شيك', card: 'بطاقة', online: 'عبر الإنترنت' };

export default function TenantDetailPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const tenant = useMemo(() => tenantStore.getById(id || ''), [id]);

  const leases = useMemo(() => id ? leaseStore.getAll().filter(l => l.tenant_id === id) : [], [id]);
  const invoices = useMemo(() => id ? invoiceStore.getAll().filter(i => i.tenant_id === id) : [], [id]);
  const receipts = useMemo(() => id ? receiptStore.getAll().filter(r => r.tenant_id === id) : [], [id]);
  const maintenance = useMemo(() => id ? maintenanceStore.getAll().filter(m => m.tenant_id === id) : [], [id]);
  const tenantUnits = useMemo(() => [...new Set(leases.map(l => l.unit_id))], [leases]);
  const activeLease = useMemo(() => leases.find(l => l.status === 'active'), [leases]);

  const balanceSummary = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
    const totalPaid = invoices.reduce((s, i) => s + i.paid_amount, 0);
    const totalBalance = invoices.reduce((s, i) => s + i.balance, 0);
    return { totalInvoiced, totalPaid, totalBalance };
  }, [invoices]);

  if (!tenant) return <div className="text-center py-12 text-gray-500">المستأجر غير موجود</div>;

  return (
    <div className="bg-gray-50 min-h-full" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/tenants')} className="text-xs text-gray-500">
            <ArrowRight className="h-4 w-4 ml-1" />{t.common.back}
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{tenant.tenant_code} — {tenant.full_name || tenant.company_name}</h1>
            <p className="text-xs text-gray-500 mt-0.5">تفاصيل المستأجر وسجلاته</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/tenants/${tenant.id}/edit`)} className="h-9 text-sm rounded-lg">
          <Pencil className="h-4 w-4 ml-2" />{t.common.edit}
        </Button>
      </div>

      {/* ── Command Center: Workflow timeline + Next best action ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">دورة علاقة التأجير</p>
        <WorkflowTimeline
          steps={(() => {
            const hasLease = leases.length > 0;
            const hasActiveLease = !!activeLease;
            const hasOverdue = balanceSummary.totalBalance > 0;
            const hasOpenMaintenance = maintenance.some(m => !['closed', 'completed', 'cancelled'].includes(m.status));
            const leaseStep = (() => {
              if (!hasLease) return { status: 'pending' as const, key: 'lease', label: 'إنشاء عقد' };
              if (hasActiveLease) return { status: 'completed' as const, key: 'lease', label: 'عقد نشط' };
              return { status: 'completed' as const, key: 'lease', label: 'عقد منتهي' };
            })();
            const paymentStep = hasOverdue
              ? { status: 'rejected' as const, key: 'pay', label: 'متأخر السداد' }
              : hasActiveLease
                ? { status: 'completed' as const, key: 'pay', label: 'السداد منتظم' }
                : { status: 'pending' as const, key: 'pay', label: 'السداد' };
            const maintenanceStep = hasOpenMaintenance
              ? { status: 'current' as const, key: 'mnt', label: 'صيانة مفتوحة' }
              : hasActiveLease
                ? { status: 'completed' as const, key: 'mnt', label: 'لا توجد صيانة' }
                : { status: 'pending' as const, key: 'mnt', label: 'الصيانة' };
            return [leaseStep, paymentStep, maintenanceStep];
          })()}
        />
      </div>

      {/* ── Next best action ── */}
      {balanceSummary.totalBalance > 0 && (
        <NextBestAction
          title="رصيد مستحق التحصيل"
          description={`المستأجر عليه ${fmt(balanceSummary.totalBalance)}. سجّل دفعة أو أرسل تذكير.`}
          actionLabel="تسجيل دفعة"
          actionTo="/wizards/payment"
          variant="warning"
          className="mb-4"
        />
      )}
      {!activeLease && (
        <NextBestAction
          title="لا يوجد عقد نشط"
          description="المستأجر ليس لديه عقد إيجار نشط حالياً. أنشئ عقد جديد لتأجير وحدة."
          actionLabel="إنشاء عقد إيجار"
          actionTo="/wizards/lease"
          variant="info"
          className="mb-4"
        />
      )}

      {/* ── Quick actions ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-2">إجراءات سريعة:</span>
        <Button variant="outline" size="sm" onClick={() => navigate('/wizards/payment')} className="h-8 text-xs gap-1">
          <Banknote className="h-3.5 w-3.5" /> تسجيل دفعة
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/wizards/lease')} className="h-8 text-xs gap-1">
          <FileText className="h-3.5 w-3.5" /> عقد جديد
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/maintenance/requests')} className="h-8 text-xs gap-1">
          <Wrench className="h-3.5 w-3.5" /> طلب صيانة
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast.info('تم تسجيل التذكير')} className="h-8 text-xs gap-1">
          <Bell className="h-3.5 w-3.5" /> تذكير
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">إجمالي الفواتير</div><div className="text-xl font-bold text-gray-800 mt-1 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(balanceSummary.totalInvoiced)}</div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">المدفوع</div><div className="text-xl font-bold text-emerald-600 mt-1 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(balanceSummary.totalPaid)}</div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">الرصيد المستحق</div><div className={`text-xl font-bold mt-1 ltr-only ${balanceSummary.totalBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(balanceSummary.totalBalance)}</div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">العقود</div><div className="text-xl font-bold text-gray-800 mt-1 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{leases.length}</div></div>
      </div>

      {/* Tabs — RTL pill bar */}
      <Tabs dir="rtl" defaultValue="profile">
        <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6 w-fit">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger value="profile" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="contracts" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">العقود</TabsTrigger>
            <TabsTrigger value="units" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">الوحدات</TabsTrigger>
            <TabsTrigger value="invoices" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">الفواتير</TabsTrigger>
            <TabsTrigger value="receipts" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">سندات القبض</TabsTrigger>
            <TabsTrigger value="maintenance" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">الصيانة</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">المستندات</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="profile">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center space-y-3">
                <div className="h-20 w-20 rounded-full bg-blue-50 mx-auto flex items-center justify-center text-2xl font-bold text-blue-600">
                  {(tenant.full_name || tenant.company_name).charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{tenant.full_name || tenant.company_name}</h3>
                  <p className="text-xs text-gray-400">{tenant.tenant_code}</p>
                </div>
                <StatusBadge status={tenant.status} label={tenant.status === 'active' ? 'نشط' : tenant.status === 'inactive' ? 'غير نشط' : 'قائمة سوداء'} />
                <div className="space-y-2 text-sm text-gray-500 pt-2">
                  {tenant.phone && <div className="flex items-center gap-2 justify-center"><Phone className="h-4 w-4 text-gray-400" />{tenant.phone}</div>}
                  {tenant.email && <div className="flex items-center gap-2 justify-center"><Mail className="h-4 w-4 text-gray-400" />{tenant.email}</div>}
                  {tenant.address && <div className="flex items-center gap-2 justify-center"><MapPin className="h-4 w-4 text-gray-400" />{tenant.address}</div>}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center"><User className="h-5 w-5 text-blue-600" /></div>
                  <h2 className="text-base font-semibold text-gray-800">معلومات المستأجر</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-400">نوع المستأجر: </span>{tenant.tenant_type === 'individual' ? 'فرد' : tenant.tenant_type === 'company' ? 'شركة' : 'جهة حكومية'}</div>
                  {tenant.national_id && <div><span className="text-gray-400">رقم الهوية: </span><span className="text-gray-700">{tenant.national_id}</span></div>}
                  {tenant.passport_number && <div><span className="text-gray-400">رقم الجواز: </span><span className="text-gray-700">{tenant.passport_number}</span></div>}
                  {tenant.cr_number && <div><span className="text-gray-400">السجل التجاري: </span><span className="text-gray-700">{tenant.cr_number}</span></div>}
                  {tenant.nationality && <div><span className="text-gray-400">الجنسية: </span><span className="text-gray-700">{tenant.nationality}</span></div>}
                  {tenant.employer && <div><span className="text-gray-400">جهة العمل: </span><span className="text-gray-700">{tenant.employer}</span></div>}
                  {tenant.authorized_person && <div><span className="text-gray-400">الشخص المخول: </span><span className="text-gray-700">{tenant.authorized_person}</span></div>}
                  <div><span className="text-gray-400">العقود النشطة: </span><span className="text-gray-700">{leases.filter(l => l.status === 'active').length}</span></div>
                  {activeLease && (
                    <div><span className="text-gray-400">الوحدة الحالية: </span><span className="text-gray-700">{getUnitNumber(activeLease.unit_id)} — {getPropertyName(activeLease.property_id)}</span></div>
                  )}
                  {tenant.emergency_contact_name && <div><span className="text-gray-400">جهة اتصال الطوارئ: </span><span className="text-gray-700">{tenant.emergency_contact_name} ({tenant.emergency_contact_phone})</span></div>}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="contracts">
          {leases.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-16">
              <FileText className="h-14 w-14 mx-auto text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-500">لا توجد عقود إيجار</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Table><TableHeader><TableRow>
                <TableHead className="text-xs font-semibold text-gray-500">رقم العقد</TableHead><TableHead className="text-xs font-semibold text-gray-500">الوحدة</TableHead><TableHead className="text-xs font-semibold text-gray-500">العقار</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">البداية</TableHead><TableHead className="text-xs font-semibold text-gray-500">النهاية</TableHead><TableHead className="text-xs font-semibold text-gray-500">الإيجار</TableHead><TableHead className="text-xs font-semibold text-gray-500">الحالة</TableHead>
              </TableRow></TableHeader><TableBody>
                {leases.map(l => (
                  <TableRow key={l.id} className="cursor-pointer hover:bg-blue-50/30" onClick={() => navigate(`/leases/${l.id}`)}>
                    <TableCell className="font-medium text-sm">{l.contract_number}</TableCell>
                    <TableCell className="text-sm">{getUnitNumber(l.unit_id)}</TableCell>
                    <TableCell className="text-sm">{getPropertyName(l.property_id)}</TableCell>
                    <TableCell className="text-sm">{l.start_date}</TableCell>
                    <TableCell className="text-sm">{l.end_date}</TableCell>
                    <TableCell className="text-sm ltr-only">{fmt(l.rent_amount)}</TableCell>
                    <TableCell><StatusBadge status={l.status} label={contractStatusLabels[l.status] || l.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="units">
          {tenantUnits.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-16">
              <Home className="h-14 w-14 mx-auto text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-500">لا توجد وحدات مرتبطة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tenantUnits.map(uid => {
                const unit = unitStore.getById(uid);
                const unitLease = leases.find(l => l.unit_id === uid);
                if (!unit) return null;
                return (
                  <div key={uid} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-2 hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/units/${uid}`)}>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-blue-500" />
                      <span className="font-bold text-gray-800">{unit.unit_number}</span>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${unit.status === 'leased' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{unit.status === 'leased' ? 'مؤجرة' : unit.status}</span>
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div>العقار: {getPropertyName(unit.property_id)}</div>
                      <div>المساحة: {unit.area_sqm} م²</div>
                      {unitLease && <div>العقد: <span className="text-blue-600">{unitLease.contract_number}</span></div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices">
          {invoices.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-16">
              <Receipt className="h-14 w-14 mx-auto text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-500">لا توجد فواتير</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Table><TableHeader><TableRow>
                <TableHead className="text-xs font-semibold text-gray-500">رقم الفاتورة</TableHead><TableHead className="text-xs font-semibold text-gray-500">تاريخ الإصدار</TableHead><TableHead className="text-xs font-semibold text-gray-500">الاستحقاق</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">المبلغ</TableHead><TableHead className="text-xs font-semibold text-gray-500">المدفوع</TableHead><TableHead className="text-xs font-semibold text-gray-500">الرصيد</TableHead><TableHead className="text-xs font-semibold text-gray-500">الحالة</TableHead>
              </TableRow></TableHeader><TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id} className="hover:bg-blue-50/30">
                    <TableCell className="font-medium text-sm">{inv.invoice_number}</TableCell>
                    <TableCell className="text-sm">{inv.invoice_date}</TableCell>
                    <TableCell className="text-sm">{inv.due_date}</TableCell>
                    <TableCell className="text-sm ltr-only">{fmt(inv.total)}</TableCell>
                    <TableCell className="text-sm ltr-only">{fmt(inv.paid_amount)}</TableCell>
                    <TableCell className={`text-sm font-semibold ltr-only ${inv.balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(inv.balance)}</TableCell>
                    <TableCell><StatusBadge status={inv.status} label={invoiceStatusLabels[inv.status] || inv.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="receipts">
          {receipts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-16">
              <Receipt className="h-14 w-14 mx-auto text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-500">لا توجد سندات قبض</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Table><TableHeader><TableRow>
                <TableHead className="text-xs font-semibold text-gray-500">رقم السند</TableHead><TableHead className="text-xs font-semibold text-gray-500">تاريخ الدفع</TableHead><TableHead className="text-xs font-semibold text-gray-500">الطريقة</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">المبلغ</TableHead><TableHead className="text-xs font-semibold text-gray-500">المرجع</TableHead><TableHead className="text-xs font-semibold text-gray-500">ملاحظات</TableHead>
              </TableRow></TableHeader><TableBody>
                {receipts.map(r => (
                  <TableRow key={r.id} className="hover:bg-blue-50/30">
                    <TableCell className="font-medium text-sm">{r.receipt_number}</TableCell>
                    <TableCell className="text-sm">{r.payment_date}</TableCell>
                    <TableCell><span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">{paymentMethodLabels[r.payment_method] || r.payment_method}</span></TableCell>
                    <TableCell className="font-semibold text-emerald-600 text-sm ltr-only">{fmt(r.amount)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{r.reference_number || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-500">{r.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="maintenance">
          {maintenance.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-16">
              <Wrench className="h-14 w-14 mx-auto text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-500">لا توجد طلبات صيانة</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Table><TableHeader><TableRow>
                <TableHead className="text-xs font-semibold text-gray-500">رقم الطلب</TableHead><TableHead className="text-xs font-semibold text-gray-500">الفئة</TableHead><TableHead className="text-xs font-semibold text-gray-500">الأولوية</TableHead>
                <TableHead className="text-xs font-semibold text-gray-500">الوصف</TableHead><TableHead className="text-xs font-semibold text-gray-500">الوحدة</TableHead><TableHead className="text-xs font-semibold text-gray-500">الحالة</TableHead>
              </TableRow></TableHeader><TableBody>
                {maintenance.map(m => (
                  <TableRow key={m.id} className="hover:bg-blue-50/30">
                    <TableCell className="font-medium text-sm">{m.request_number}</TableCell>
                    <TableCell className="text-sm">{m.category}</TableCell>
                    <TableCell><span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${m.priority === 'emergency' ? 'bg-red-50 text-red-600' : m.priority === 'high' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>{m.priority === 'emergency' ? 'طارئ' : m.priority === 'high' ? 'عالي' : m.priority === 'medium' ? 'متوسط' : 'منخفض'}</span></TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{m.description}</TableCell>
                    <TableCell className="text-sm">{getUnitNumber(m.unit_id)}</TableCell>
                    <TableCell><StatusBadge status={m.status} label={maintenanceStatusLabels[m.status] || m.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 text-center py-16">
            <FileText className="h-14 w-14 mx-auto text-gray-200 mb-4" />
            <p className="text-sm font-medium text-gray-500">المستندات قيد التطوير</p>
            <p className="text-xs text-gray-400 mt-1">سيتم إضافة رفع وعرض المستندات قريباً</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
