// Landlord Portal — Portfolio overview
// Shows: portfolio KPIs, properties, occupancy, revenue, expiring leases

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import {
  propertyStore, unitStore, leaseStore, invoiceStore, receiptStore, maintenanceStore,
} from '@/services/stores';
import { formatQAR, formatQARInt, formatDate } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Building2, Home, DollarSign, TrendingUp, Users, Wrench, Calendar, AlertTriangle,
  ArrowLeft, MapPin, TrendingDown, CheckCircle2, BarChart3, Wallet, FileText,
} from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);
const fmtInt = (v: number) => formatQARInt(v);

export default function LandlordDashboardPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const propertyId = session?.propertyId;

  const properties = useMemo(() => {
    // Landlord can see all properties (in real app, filtered by ownership)
    // but we'll highlight the one matching their login
    const all = propertyStore.getAll();
    return all;
  }, []);

  const property = useMemo(() => (propertyId ? propertyStore.getById(propertyId) : null), [propertyId]);

  const allUnits = useMemo(() => unitStore.getAll(), []);
  const allLeases = useMemo(() => leaseStore.getAll(), []);
  const allInvoices = useMemo(() => invoiceStore.getAll(), []);
  const allReceipts = useMemo(() => receiptStore.getAll(), []);
  const allMaintenance = useMemo(() => maintenanceStore.getAll(), []);

  // Filter by properties
  const units = useMemo(
    () => (propertyId ? allUnits.filter((u) => u.property_id === propertyId) : allUnits),
    [allUnits, propertyId],
  );
  const leases = useMemo(
    () => units.length > 0 ? allLeases.filter((l) => units.some((u) => u.id === l.unit_id)) : allLeases,
    [allLeases, units],
  );

  // KPIs
  const totalUnits = units.length;
  const leasedUnits = units.filter((u) => u.status === 'leased').length;
  const availableUnits = units.filter((u) => u.status === 'available').length;
  const occupancyRate = totalUnits > 0 ? (leasedUnits / totalUnits) * 100 : 0;

  const monthlyRevenue = leases
    .filter((l) => l.status === 'active')
    .reduce((s, l) => {
      // Convert annual/quarterly to monthly equivalent
      switch (l.payment_frequency) {
        case 'monthly': return s + l.rent_amount;
        case 'quarterly': return s + l.rent_amount / 3;
        case 'semi_annual': return s + l.rent_amount / 6;
        case 'annual': return s + l.rent_amount / 12;
        default: return s + l.rent_amount / 12;
      }
    }, 0);

  const annualRevenue = monthlyRevenue * 12;

  const totalReceivables = allInvoices.reduce((s, i) => s + i.balance, 0);
  const collectedThisYear = allReceipts
    .filter((r) => new Date(r.payment_date).getFullYear() === new Date().getFullYear())
    .reduce((s, r) => s + r.amount, 0);

  const openMaintenance = allMaintenance.filter((m) => !['closed', 'completed', 'cancelled'].includes(m.status)).length;
  const expiringSoon = leases.filter((l) => {
    const daysToEnd = Math.ceil((new Date(l.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return l.status === 'active' && daysToEnd > 0 && daysToEnd < 90;
  });

  // Property performance chart
  const propertyPerformance = useMemo(() => {
    return properties.map((p) => {
      const propUnits = allUnits.filter((u) => u.property_id === p.id);
      const leased = propUnits.filter((u) => u.status === 'leased').length;
      const occ = propUnits.length > 0 ? (leased / propUnits.length) * 100 : 0;
      const propLeases = allLeases.filter((l) => propUnits.some((u) => u.id === l.unit_id) && l.status === 'active');
      const rent = propLeases.reduce((s, l) => s + l.rent_amount / 12, 0); // monthly
      return { name: p.property_name, occupancy: occ, monthly: rent };
    });
  }, [properties, allUnits, allLeases]);

  const COLORS = ['#10B981', '#533afd', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-l from-emerald-600 to-emerald-500 rounded-lg p-6 lg:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -left-24 -bottom-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="relative">
          <p className="text-[13px] text-emerald-100 mb-1">مرحباً 👋</p>
          <h1 className="text-2xl lg:text-3xl font-bold mb-1">{session?.displayName || 'محفظتك العقارية'}</h1>
          <p className="text-[13px] text-emerald-100 flex items-center gap-2 flex-wrap">
            <Building2 className="h-3.5 w-3.5" />
            {property?.address || 'نظرة شاملة على محفظتك العقارية'}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-[rgba(83,58,253,0.06)] flex items-center justify-center">
                <Home className="h-5 w-5 text-[#533afd]" />
              </div>
              <span className="text-[12px] text-[#64748d] font-medium">إجمالي</span>
            </div>
            <p className="text-2xl font-bold text-[#061b31]">{totalUnits}</p>
            <p className="text-[12px] text-[#64748d] mt-1">وحدة · {leasedUnits} مؤجرة · {availableUnits} متاحة</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-[12px] text-[#64748d] font-medium">الإشغال</span>
            </div>
            <p className="text-2xl font-bold text-[#061b31]">{occupancyRate.toFixed(0)}%</p>
            <p className="text-[12px] text-[#64748d] mt-1">نسبة الإشغال الحالية</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-[#9b6829]" />
              </div>
              <span className="text-[12px] text-[#64748d] font-medium">{tt('leases.frequencies.monthly', 'شهري')}</span>
            </div>
            <p className="text-lg font-bold text-[#061b31]">{fmt(monthlyRevenue)}</p>
            <p className="text-[12px] text-[#64748d] mt-1">إيراد شهري (سنوي: {fmtInt(annualRevenue)})</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-[#ea2261]" />
              </div>
              <span className="text-[12px] text-[#64748d] font-medium">مستحقات</span>
            </div>
            <p className="text-lg font-bold text-[#061b31]">{fmt(totalReceivables)}</p>
            <p className="text-[12px] text-[#64748d] mt-1">إجمالي المستحقات غير المحصلة</p>
          </CardContent>
        </Card>
      </div>

      {/* Property performance + expiring leases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
              أداء العقارات
            </CardTitle>
            <CardDescription className="text-[12px]">الإيراد الشهري المتوقع لكل عقار</CardDescription>
          </CardHeader>
          <CardContent>
            {propertyPerformance.length === 0 ? (
              <p className="text-center text-[#64748d] py-8 text-[13px]">{tt('common.noData', 'لا توجد بيانات')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={propertyPerformance} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    formatter={(v: any) => fmt(v as number)}
                  />
                  <Bar dataKey="monthly" radius={[8, 8, 0, 0]}>
                    {propertyPerformance.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-[#061b31] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#9b6829]" />
              عقود تنتهي قريباً
            </CardTitle>
            <Link to="/portal/landlord/renewals">
              <Button variant="ghost" size="sm" className="h-7 text-[12px] text-emerald-600">
                الكل
                <ArrowLeft className="h-3 w-3 mr-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {expiringSoon.length === 0 ? (
              <p className="text-center text-[#64748d] py-6 text-[12px]">لا توجد عقود تنتهي قريباً</p>
            ) : (
              <div className="space-y-2">
                {expiringSoon.slice(0, 4).map((l) => {
                  const days = Math.ceil((new Date(l.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={l.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] font-semibold text-[#061b31]">{l.contract_number}</p>
                        <span className="text-[12px] px-2 py-0.5 rounded-full bg-amber-100 text-[#9b6829] font-medium">
                          {days} يوم
                        </span>
                      </div>
                      <p className="text-[12px] text-[#64748d] mt-0.5">ينتهي {formatDate(l.end_date)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-violet-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <p className="text-[12px] text-[#64748d]">{tt('tenants.title', 'المستأجرون')}</p>
                <p className="text-[18px] font-bold text-[#061b31]">{leases.filter((l) => l.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-[12px] text-[#64748d]">محصل هذا العام</p>
                <p className="text-[14px] font-bold text-[#061b31]">{fmt(collectedThisYear)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-orange-50 flex items-center justify-center">
                <Wrench className="h-4 w-4 text-[#9b6829]" />
              </div>
              <div>
                <p className="text-[12px] text-[#64748d]">صيانة مفتوحة</p>
                <p className="text-[18px] font-bold text-[#061b31]">{openMaintenance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-rose-50 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <p className="text-[12px] text-[#64748d]">معدل التحصيل</p>
                <p className="text-[18px] font-bold text-[#061b31]">
                  {totalReceivables + collectedThisYear > 0
                    ? Math.round((collectedThisYear / (collectedThisYear + totalReceivables)) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties list */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[#061b31]">عقاراتي</CardTitle>
            <CardDescription className="text-[12px]">جميع العقارات في محفظتك</CardDescription>
          </div>
          <Link to="/portal/landlord/performance">
            <Button variant="ghost" size="sm" className="h-7 text-[12px] text-emerald-600">
              التفاصيل
              <ArrowLeft className="h-3 w-3 mr-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {properties.map((p) => {
              const propUnits = allUnits.filter((u) => u.property_id === p.id);
              const leased = propUnits.filter((u) => u.status === 'leased').length;
              const occ = propUnits.length > 0 ? Math.round((leased / propUnits.length) * 100) : 0;
              return (
                <div key={p.id} className={`p-4 border-2 rounded-xl ${propertyId === p.id ? 'border-emerald-300 bg-emerald-50/30' : 'border-[#e5edf5]'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[13px] font-bold text-[#061b31]">{p.property_name}</h3>
                    {propertyId === p.id && (
                      <span className="text-[12px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">الحالي</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[#64748d] flex items-center gap-1 mb-3">
                    <MapPin className="h-3 w-3" />
                    {p.address}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[12px] text-[#64748d]">{tt('units.title', 'الوحدات')}</p>
                      <p className="text-[14px] font-bold text-[#061b31]">{propUnits.length}</p>
                    </div>
                    <div>
                      <p className="text-[12px] text-[#64748d]">الإشغال</p>
                      <p className="text-[14px] font-bold text-emerald-600">{occ}%</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
