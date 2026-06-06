// Tenant Portal — My Lease (read-only contract terms)

import { useMemo } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import {
  leaseStore, unitStore, propertyStore, tenantStore, invoiceStore,
} from '@/services/stores';
import { formatQAR, formatDate, formatDateLong } from '@/lib/format';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  FileText, Calendar, DollarSign, Home, User, MapPin, Phone, Mail,
  Building, Hash, FileDown, Shield, AlertCircle, Clock, RefreshCw, Banknote,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';

export default function TenantLeasePage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const tenantId = session?.tenantId;

  const leases = useMemo(
    () => (tenantId ? leaseStore.getAll().filter((l) => l.tenant_id === tenantId) : []),
    [tenantId],
  );
  const activeLease = useMemo(() => leases.find((l) => l.status === 'active') || leases[0], [leases]);
  const unit = useMemo(() => (activeLease ? unitStore.getById(activeLease.unit_id) : null), [activeLease]);
  const property = useMemo(() => (activeLease ? propertyStore.getById(activeLease.property_id) : null), [activeLease]);
  const tenant = useMemo(() => (tenantId ? tenantStore.getById(tenantId) : null), [tenantId]);
  const invoices = useMemo(
    () => (activeLease ? invoiceStore.getAll().filter((i) => i.contract_id === activeLease.id) : []),
    [activeLease],
  );

  if (!activeLease) {
    return (
      <div className="text-center py-16">
        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <p className="text-[#64748d] text-[14px]">لا يوجد عقد إيجار حالياً</p>
      </div>
    );
  }

  const today = new Date();
  const endDate = new Date(activeLease.end_date);
  const daysToEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const monthsToEnd = Math.round(daysToEnd / 30);

  const frequencyLabel = (() => {
    switch (activeLease.payment_frequency) {
      case 'monthly': return 'شهري';
      case 'quarterly': return 'ربع سنوي';
      case 'semi_annual': return 'نصف سنوي';
      case 'annual': return 'سنوي';
      default: return 'مخصص';
    }
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">عقد الإيجار</h1>
          <p className="text-[12px] text-[#64748d] mt-0.5">تفاصيل عقدك الحالي</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 text-[12px]">
            <FileDown className="h-4 w-4 ml-1" />
            تحميل PDF
          </Button>
          <Link to="/portal/tenant/notices">
            <Button size="sm" className="h-9 text-[12px] bg-[#533afd] hover:bg-blue-700">
              <RefreshCw className="h-4 w-4 ml-1" />
              طلب تجديد
            </Button>
          </Link>
        </div>
      </div>

      {/* Status banner */}
      <div className="bg-white rounded-lg border-2 border-blue-100 p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Hash className="h-4 w-4 text-[#64748d]" />
              <span className="text-[12px] text-[#64748d]">{tt('leases.contractNumber', 'رقم العقد')}</span>
              <span className="text-[13px] font-bold text-[#061b31]">{activeLease.contract_number}</span>
            </div>
            <h2 className="text-xl font-bold text-[#061b31]">
              {property?.property_name} — الوحدة {unit?.unit_number}
            </h2>
            <p className="text-[12px] text-[#64748d] mt-1 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {property?.address}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusBadge status={activeLease.status} />
            {daysToEnd > 0 && daysToEnd < 90 && (
              <p className="text-[12px] text-[#9b6829] flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ينتهي بعد {daysToEnd} يوم ({monthsToEnd} شهر)
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lease terms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#533afd]" />
              المدة والتجديد
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#f6f9fc] rounded-lg">
              <span className="text-[12px] text-[#64748d]">تاريخ البدء</span>
              <span className="text-[13px] font-semibold text-[#061b31]">{formatDateLong(activeLease.start_date)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f6f9fc] rounded-lg">
              <span className="text-[12px] text-[#64748d]">{tt('documents.expiryDate', 'تاريخ الانتهاء')}</span>
              <span className="text-[13px] font-semibold text-[#061b31]">{formatDateLong(activeLease.end_date)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f6f9fc] rounded-lg">
              <span className="text-[12px] text-[#64748d]">التجديد التلقائي</span>
              <span className={`text-[13px] font-semibold ${activeLease.auto_renewal_allowed ? 'text-emerald-600' : 'text-[#64748d]'}`}>
                {activeLease.auto_renewal_allowed ? 'مفعّل' : 'غير مفعّل'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f6f9fc] rounded-lg">
              <span className="text-[12px] text-[#64748d]">إشعار التجديد</span>
              <span className="text-[13px] font-semibold text-[#061b31]">{activeLease.renewal_notice_days} يوم قبل الانتهاء</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f6f9fc] rounded-lg">
              <span className="text-[12px] text-[#64748d]">إشعار الإخلاء</span>
              <span className="text-[13px] font-semibold text-[#061b31]">{activeLease.termination_notice_days} يوم</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              الشروط المالية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
              <span className="text-[12px] text-[#64748d]">{tt('leases.rentAmount', 'قيمة الإيجار')}</span>
              <span className="text-[14px] font-bold text-emerald-700">{formatQAR(activeLease.rent_amount)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f6f9fc] rounded-lg">
              <span className="text-[12px] text-[#64748d]">{tt('leases.paymentFrequency', 'دورية الدفع')}</span>
              <span className="text-[13px] font-semibold text-[#061b31]">{frequencyLabel}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f6f9fc] rounded-lg">
              <span className="text-[12px] text-[#64748d]">الضمان</span>
              <span className="text-[13px] font-semibold text-[#061b31]">{formatQAR(activeLease.security_deposit)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f6f9fc] rounded-lg">
              <span className="text-[12px] text-[#64748d]">رسوم إدارية</span>
              <span className="text-[13px] font-semibold text-[#061b31]">{formatQAR(activeLease.admin_fees)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f6f9fc] rounded-lg">
              <span className="text-[12px] text-[#64748d]">العمولة</span>
              <span className="text-[13px] font-semibold text-[#061b31]">{formatQAR(activeLease.commission)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#f6f9fc] rounded-lg">
              <span className="text-[12px] text-[#64748d]">فترة السماح</span>
              <span className="text-[13px] font-semibold text-[#061b31]">{activeLease.grace_period_days} يوم</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unit details + tenant details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
              <Home className="h-4 w-4 text-violet-600" />
              تفاصيل الوحدة
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unit ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-[12px] text-[#64748d] mb-0.5">{tt('units.number', 'رقم الوحدة')}</p>
                  <p className="text-[13px] font-semibold text-[#061b31]">{unit.unit_number}</p>
                </div>
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-[12px] text-[#64748d] mb-0.5">{tt('equipment.equipmentType', 'النوع')}</p>
                  <p className="text-[13px] font-semibold text-[#061b31]">
                    {unit.unit_type === 'apartment' ? 'شقة' :
                     unit.unit_type === 'studio' ? 'استوديو' :
                     unit.unit_type === 'villa' ? 'فيلا' :
                     unit.unit_type === 'office' ? 'مكتب' : unit.unit_type}
                  </p>
                </div>
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-[12px] text-[#64748d] mb-0.5">{tt('units.area', 'المساحة')}</p>
                  <p className="text-[13px] font-semibold text-[#061b31]">{unit.area_sqm} م²</p>
                </div>
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-[12px] text-[#64748d] mb-0.5">{tt('units.bedrooms', 'غرف النوم')}</p>
                  <p className="text-[13px] font-semibold text-[#061b31]">{unit.bedrooms}</p>
                </div>
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-[12px] text-[#64748d] mb-0.5">دورات المياه</p>
                  <p className="text-[13px] font-semibold text-[#061b31]">{unit.bathrooms}</p>
                </div>
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-[12px] text-[#64748d] mb-0.5">رقم الموقف</p>
                  <p className="text-[13px] font-semibold text-[#061b31]">{unit.parking_number || '—'}</p>
                </div>
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-[12px] text-[#64748d] mb-0.5">عداد الكهرباء</p>
                  <p className="text-[13px] font-semibold text-[#061b31]">{unit.electricity_meter || '—'}</p>
                </div>
                <div className="p-3 bg-[#f6f9fc] rounded-lg">
                  <p className="text-[12px] text-[#64748d] mb-0.5">عداد المياه</p>
                  <p className="text-[13px] font-semibold text-[#061b31]">{unit.water_meter || '—'}</p>
                </div>
              </div>
            ) : (
              <p className="text-[#64748d] text-center py-6 text-[13px]">لا توجد بيانات وحدة</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
              <User className="h-4 w-4 text-[#9b6829]" />
              بيانات المستأجر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tenant ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[#f6f9fc] rounded-lg">
                  <User className="h-4 w-4 text-[#64748d]" />
                  <div>
                    <p className="text-[12px] text-[#64748d]">{tt('tenants.name', 'الاسم')}</p>
                    <p className="text-[13px] font-semibold text-[#061b31]">{tenant.full_name || tenant.company_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#f6f9fc] rounded-lg">
                  <Hash className="h-4 w-4 text-[#64748d]" />
                  <div>
                    <p className="text-[12px] text-[#64748d]">{tt('tenants.code', 'كود المستأجر')}</p>
                    <p className="text-[13px] font-semibold text-[#061b31]">{tenant.tenant_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#f6f9fc] rounded-lg">
                  <Phone className="h-4 w-4 text-[#64748d]" />
                  <div>
                    <p className="text-[12px] text-[#64748d]">الجوال</p>
                    <p className="text-[13px] font-semibold text-[#061b31]" dir="ltr">{tenant.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-[#f6f9fc] rounded-lg">
                  <Mail className="h-4 w-4 text-[#64748d]" />
                  <div>
                    <p className="text-[12px] text-[#64748d]">البريد</p>
                    <p className="text-[13px] font-semibold text-[#061b31]" dir="ltr">{tenant.email}</p>
                  </div>
                </div>
                {tenant.national_id && (
                  <div className="flex items-center gap-3 p-3 bg-[#f6f9fc] rounded-lg">
                    <Shield className="h-4 w-4 text-[#64748d]" />
                    <div>
                      <p className="text-[12px] text-[#64748d]">الهوية</p>
                      <p className="text-[13px] font-semibold text-[#061b31]" dir="ltr">{tenant.national_id}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[#64748d] text-center py-6 text-[13px]">{tt('common.noData', 'لا توجد بيانات')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Late fees terms */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#ea2261]" />
            شروط التأخير
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="p-3 bg-[#f6f9fc] rounded-lg">
              <p className="text-[12px] text-[#64748d] mb-0.5">نوع رسوم التأخير</p>
              <p className="text-[13px] font-semibold text-[#061b31]">
                {activeLease.late_fee_type === 'percentage' ? 'نسبة مئوية' :
                 activeLease.late_fee_type === 'fixed' ? 'مبلغ ثابت' : activeLease.late_fee_type}
              </p>
            </div>
            <div className="p-3 bg-[#f6f9fc] rounded-lg">
              <p className="text-[12px] text-[#64748d] mb-0.5">قيمة رسوم التأخير</p>
              <p className="text-[13px] font-semibold text-[#061b31]">
                {activeLease.late_fee_type === 'percentage' ? `${activeLease.late_fee_amount}%` : formatQAR(activeLease.late_fee_amount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
