// Tenant Portal Dashboard — landing page after tenant login
// Shows: hero with greeting, lease summary, balance KPIs, due date, quick actions, recent activity

import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import {
  leaseStore, invoiceStore, receiptStore, maintenanceStore, unitStore, propertyStore, tenantStore,
} from '@/services/stores';
import { formatQAR, formatDate } from '@/lib/format';
import {
  Home, FileText, CreditCard, Wrench, Wallet, Calendar, Bell, AlertCircle,
  CheckCircle2, Clock, Receipt, TrendingUp, Building, Phone, Mail, MapPin,
  ArrowLeft, AlertTriangle, FileSignature, ClipboardList, MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);

export default function TenantDashboardPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const navigate = useNavigate();
  const tenantId = session?.tenantId;

  const tenant = useMemo(() => tenantStore.getAll().find((t) => t.id === tenantId), [tenantId]);

  const leases = useMemo(
    () => (tenantId ? leaseStore.getAll().filter((l) => l.tenant_id === tenantId) : []),
    [tenantId],
  );
  const activeLease = useMemo(() => leases.find((l) => l.status === 'active') || leases[0], [leases]);
  const invoices = useMemo(
    () => (tenantId ? invoiceStore.getAll().filter((i) => i.tenant_id === tenantId) : []),
    [tenantId],
  );
  const receipts = useMemo(
    () => (tenantId ? receiptStore.getAll().filter((r) => r.tenant_id === tenantId) : []),
    [tenantId],
  );
  const maintenance = useMemo(
    () => (tenantId ? maintenanceStore.getAll().filter((m) => m.tenant_id === tenantId) : []),
    [tenantId],
  );

  const unit = useMemo(() => (activeLease ? unitStore.getById(activeLease.unit_id) : null), [activeLease]);
  const property = useMemo(() => (activeLease ? propertyStore.getById(activeLease.property_id) : null), [activeLease]);

  // KPI calculations
  const totalBalance = useMemo(() => invoices.reduce((s, i) => s + i.balance, 0), [invoices]);
  const overdueInvoices = useMemo(() => invoices.filter((i) => i.status === 'overdue'), [invoices]);
  const totalPaid = useMemo(() => receipts.reduce((s, r) => s + r.amount, 0), [receipts]);
  const openMaintenance = useMemo(
    () => maintenance.filter((m) => !['closed', 'completed', 'cancelled'].includes(m.status)),
    [maintenance],
  );
  const nextDue = useMemo(() => {
    const unpaid = invoices.filter((i) => i.balance > 0).sort((a, b) => a.due_date.localeCompare(b.due_date));
    return unpaid[0];
  }, [invoices]);

  const daysToDue = useMemo(() => {
    if (!nextDue) return null;
    const today = new Date();
    const due = new Date(nextDue.due_date);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [nextDue]);

  if (!tenant) {
    return <div className="text-center py-12 text-[#64748d]">لم يتم العثور على بيانات المستأجر</div>;
  }

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    if (h < 18) return 'مساء الخير';
    return 'مساء النور';
  })();

  return (
    <div className="space-y-6">
      {/* Hero greeting */}
      <div className="bg-gradient-to-l from-blue-600 to-blue-500 rounded-lg p-6 lg:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -left-24 -bottom-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-[13px] text-blue-100 mb-1">{greeting} 👋</p>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">{tenant.full_name || tenant.company_name}</h1>
          <p className="text-[13px] text-blue-100 flex items-center gap-2 flex-wrap">
            {property && <><Building className="h-3.5 w-3.5" /><span>{property.property_name}</span></>}
            {unit && <><span>·</span><span>الوحدة {unit.unit_number}</span></>}
          </p>
        </div>
      </div>

      {/* Alert: overdue */}
      {overdueInvoices.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-[#ea2261]" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-red-900">لديك {overdueInvoices.length} فاتورة متأخرة</p>
            <p className="text-[12px] text-[#ea2261] mt-0.5">يرجى سداد المبلغ لتجنب رسوم التأخير الإضافية</p>
          </div>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-9 text-[12px]" onClick={() => navigate('/portal/tenant/pay')}>
            ادفع الآن
          </Button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance */}
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-[#ea2261]" />
              </div>
              <span className="text-[12px] text-[#64748d] font-medium">المستحق</span>
            </div>
            <p className="text-2xl font-bold text-[#061b31]">{fmt(totalBalance)}</p>
            <p className="text-[12px] text-[#64748d] mt-1">
              {totalBalance > 0 ? 'مبلغ مستحق السداد' : 'لا يوجد مستحقات'}
            </p>
          </CardContent>
        </Card>

        {/* Next due date */}
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#9b6829]" />
              </div>
              <span className="text-[12px] text-[#64748d] font-medium">الاستحقاق</span>
            </div>
            <p className="text-lg font-bold text-[#061b31]">
              {nextDue ? formatDate(nextDue.due_date) : 'لا يوجد'}
            </p>
            <p className="text-[12px] text-[#64748d] mt-1">
              {daysToDue === null
                ? '—'
                : daysToDue < 0
                  ? `متأخر ${Math.abs(daysToDue)} يوم`
                  : daysToDue === 0
                    ? 'اليوم'
                    : `بعد ${daysToDue} يوم`}
            </p>
          </CardContent>
        </Card>

        {/* Total paid */}
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-[12px] text-[#64748d] font-medium">إجمالي المدفوع</span>
            </div>
            <p className="text-2xl font-bold text-[#061b31]">{fmt(totalPaid)}</p>
            <p className="text-[12px] text-[#64748d] mt-1">{receipts.length} إيصال دفع</p>
          </CardContent>
        </Card>

        {/* Open maintenance */}
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <Wrench className="h-5 w-5 text-violet-600" />
              </div>
              <span className="text-[12px] text-[#64748d] font-medium">صيانة مفتوحة</span>
            </div>
            <p className="text-2xl font-bold text-[#061b31]">{openMaintenance.length}</p>
            <p className="text-[12px] text-[#64748d] mt-1">طلبات قيد المعالجة</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] bg-white">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#061b31]">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link to="/portal/tenant/pay" className="group">
              <div className="p-4 border-2 border-blue-100 hover:border-blue-300 hover:bg-[rgba(83,58,253,0.06)]/50 rounded-xl transition-all">
                <CreditCard className="h-6 w-6 text-[#533afd] mb-2" />
                <p className="text-[13px] font-semibold text-[#061b31]">ادفع الإيجار</p>
                <p className="text-[12px] text-[#64748d]">سداد الفاتورة</p>
              </div>
            </Link>
            <Link to="/portal/tenant/maintenance" className="group">
              <div className="p-4 border-2 border-violet-100 hover:border-violet-300 hover:bg-violet-50/50 rounded-xl transition-all">
                <Wrench className="h-6 w-6 text-violet-600 mb-2" />
                <p className="text-[13px] font-semibold text-[#061b31]">طلب صيانة</p>
                <p className="text-[12px] text-[#64748d]">فتح طلب جديد</p>
              </div>
            </Link>
            <Link to="/portal/tenant/lease" className="group">
              <div className="p-4 border-2 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-xl transition-all">
                <FileText className="h-6 w-6 text-emerald-600 mb-2" />
                <p className="text-[13px] font-semibold text-[#061b31]">عقد الإيجار</p>
                <p className="text-[12px] text-[#64748d]">عرض التفاصيل</p>
              </div>
            </Link>
            <Link to="/portal/tenant/invoices" className="group">
              <div className="p-4 border-2 border-amber-100 hover:border-amber-300 hover:bg-amber-50/50 rounded-xl transition-all">
                <Receipt className="h-6 w-6 text-[#9b6829] mb-2" />
                <p className="text-[13px] font-semibold text-[#061b31]">{tt('rentCollection.invoices', 'الفواتير')}</p>
                <p className="text-[12px] text-[#64748d]">عرض الكل</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Lease summary */}
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] bg-white lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#061b31]">ملخص عقد الإيجار</CardTitle>
              <CardDescription className="text-[12px]">التفاصيل الرئيسية للعقد الحالي</CardDescription>
            </div>
            <Link to="/portal/tenant/lease">
              <Button variant="ghost" size="sm" className="h-8 text-[12px] text-[#533afd]">
                التفاصيل الكاملة
                <ArrowLeft className="h-3 w-3 mr-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {activeLease ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[12px] text-[#64748d] mb-1">{tt('leases.contractNumber', 'رقم العقد')}</p>
                    <p className="text-[13px] font-semibold text-[#061b31]">{activeLease.contract_number}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#64748d] mb-1">{tt('leases.rentAmount', 'قيمة الإيجار')}</p>
                    <p className="text-[13px] font-semibold text-[#061b31]">{fmt(activeLease.rent_amount)}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#64748d] mb-1">{tt('leases.paymentFrequency', 'دورية الدفع')}</p>
                    <p className="text-[13px] font-semibold text-[#061b31]">
                      {activeLease.payment_frequency === 'monthly' ? 'شهري' :
                       activeLease.payment_frequency === 'quarterly' ? 'ربع سنوي' :
                       activeLease.payment_frequency === 'semi_annual' ? 'نصف سنوي' :
                       activeLease.payment_frequency === 'annual' ? 'سنوي' : 'مخصص'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#64748d] mb-1">تاريخ البدء</p>
                    <p className="text-[13px] font-semibold text-[#061b31]">{formatDate(activeLease.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#64748d] mb-1">{tt('documents.expiryDate', 'تاريخ الانتهاء')}</p>
                    <p className="text-[13px] font-semibold text-[#061b31]">{formatDate(activeLease.end_date)}</p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#64748d] mb-1">حالة العقد</p>
                    <StatusBadge status={activeLease.status} />
                  </div>
                </div>
                <div className="pt-3 border-t border-[#e5edf5] flex items-center justify-between">
                  <p className="text-[12px] text-[#64748d]">
                    <MapPin className="h-3 w-3 inline ml-1" />
                    {property?.address}
                  </p>
                  <div className="flex gap-2">
                    <Link to="/portal/tenant/inspections">
                      <Button variant="outline" size="sm" className="h-8 text-[12px]">
                        <ClipboardList className="h-3.5 w-3.5 ml-1" />
                        فحص الانتقال
                      </Button>
                    </Link>
                    <Link to="/portal/tenant/notices">
                      <Button variant="outline" size="sm" className="h-8 text-[12px]">
                        <FileSignature className="h-3.5 w-3.5 ml-1" />
                        طلب تجديد
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center py-8 text-[#64748d] text-[13px]">لا يوجد عقد إيجار نشط</p>
            )}
          </CardContent>
        </Card>

        {/* Recent maintenance */}
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-[#061b31]">آخر طلبات الصيانة</CardTitle>
            <Link to="/portal/tenant/maintenance">
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-[#533afd]">
                الكل
                <ArrowLeft className="h-3 w-3 mr-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {maintenance.length === 0 ? (
              <div className="text-center py-6 text-[#64748d]">
                <Wrench className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                <p className="text-[12px]">لا توجد طلبات صيانة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {maintenance.slice(0, 4).map((m) => (
                  <div key={m.id} className="p-3 bg-[#f6f9fc] rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[12px] font-semibold text-[#061b31] line-clamp-1">{m.description}</p>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-[12px] text-[#64748d]">{m.request_number} · {m.priority === 'emergency' ? '🚨 طارئ' : m.priority === 'high' ? 'عالية' : m.priority === 'medium' ? 'متوسطة' : 'منخفضة'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Contact support */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] bg-gradient-to-l from-slate-50 to-white">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-[rgba(83,58,253,0.10)] flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-[#533afd]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-[#061b31] mb-1">تحتاج مساعدة؟</p>
              <p className="text-[12px] text-[#64748d] mb-2">فريق إدارة العقار متاح لمساعدتك في أي استفسار</p>
              <div className="flex flex-wrap gap-3 text-[12px]">
                <a href="tel:+97444445555" className="flex items-center gap-1 text-gray-700 hover:text-[#533afd]">
                  <Phone className="h-3 w-3" /> +974 4444 5555
                </a>
                <a href="mailto:support@land2.qa" className="flex items-center gap-1 text-gray-700 hover:text-[#533afd]">
                  <Mail className="h-3 w-3" /> support@land2.qa
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
