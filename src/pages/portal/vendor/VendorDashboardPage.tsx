// Vendor Portal — Dashboard
// Shows: contracts summary, pending claims, payment status, rating, work pipeline

import {
import { useLocale } from '@/providers/LocaleContext'; useMemo } from 'react';
import {
import { useLocale } from '@/providers/LocaleContext'; Link } from 'react-router-dom';
import {
import { useLocale } from '@/providers/LocaleContext'; usePortalAuth } from '@/providers/PortalAuthContext';
import {
import { useLocale } from '@/providers/LocaleContext'; contractorClaimStore, contractorStore, projectStore } from '@/services/stores';
import {
import { useLocale } from '@/providers/LocaleContext'; formatQAR, formatQARInt, formatDate } from '@/lib/format';
import {
import { useLocale } from '@/providers/LocaleContext'; Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
import { useLocale } from '@/providers/LocaleContext'; Button } from '@/components/ui/button';
import {
import { useLocale } from '@/providers/LocaleContext'; StatusBadge } from '@/components/shared/StatusBadge';
import {
import { useLocale } from '@/providers/LocaleContext';
  Briefcase, FileText, DollarSign, Star, TrendingUp, CheckCircle2, Clock,
  Building, Calendar, AlertCircle, Plus, ArrowLeft, Activity, Wrench,
} from 'lucide-react';

const fmt = (v: number) => formatQAR(v);
const fmtInt = (v: number) => formatQARInt(v);

export default function VendorDashboardPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const vendorId = session?.vendorId;

  const vendor = useMemo(() => vendorId ? contractorStore.getById(vendorId) : null, [vendorId]);
  const allClaims = useMemo(() => contractorClaimStore.getAll(), []);
  const allProjects = useMemo(() => projectStore.getAll(), []);

  // Filter claims by vendor (use contractor_id pattern)
  const myClaims = useMemo(() => {
    return allClaims.filter((c) => c.contractor_id === vendorId || c.id.startsWith(`clm-${vendorId}`) || !c.contractor_id);
  }, [allClaims, vendorId]);

  // KPIs
  const totalClaims = myClaims.length;
  const approvedClaims = myClaims.filter((c) => c.status === 'approved').length;
  const pendingClaims = myClaims.filter((c) => ['submitted', 'verified'].includes(c.status)).length;
  const rejectedClaims = myClaims.filter((c) => c.status === 'rejected').length;
  const paidClaims = myClaims.filter((c) => c.status === 'paid').length;
  const totalApprovedValue = myClaims.filter((c) => ['approved', 'paid'].includes(c.status)).reduce((s, c) => s + c.claimed_amount, 0);

  const recentClaims = useMemo(() => {
    return [...myClaims].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
  }, [myClaims]);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-l from-amber-600 to-amber-500 rounded-lg p-6 lg:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -left-24 -bottom-24 w-72 h-72 rounded-full bg-white/5" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[13px] text-amber-100 mb-1">مرحباً 👋</p>
            <h1 className="text-2xl lg:text-3xl font-bold mb-1">{session?.displayName || 'المقاول'}</h1>
            <p className="text-[13px] text-amber-100 flex items-center gap-2 flex-wrap">
              <Briefcase className="h-3.5 w-3.5" />
              {vendor?.specialty || 'تخصص عام'} · {vendor?.classification || 'تصنيف'}
            </p>
          </div>
          {vendor && (
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 flex items-center gap-3">
              <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
              <div>
                <p className="text-xs text-amber-100">{tt('contractors.rating', 'التقييم')}</p>
                <p className="text-base font-bold">{vendor.rating} / 5</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-[rgba(83,58,253,0.06)] flex items-center justify-center">
                <FileText className="h-5 w-5 text-[#533afd]" />
              </div>
              <span className="text-xs text-[#64748d] font-medium">إجمالي</span>
            </div>
            <p className="text-2xl font-bold text-[#061b31]">{totalClaims}</p>
            <p className="text-xs text-[#64748d] mt-1">مطالبات مقدمة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-[#9b6829]" />
              </div>
              <span className="text-xs text-[#64748d] font-medium">قيد المعالجة</span>
            </div>
            <p className="text-2xl font-bold text-[#9b6829]">{pendingClaims}</p>
            <p className="text-xs text-[#64748d] mt-1">{tt('leases.statuses.pending_approval', 'بانتظار الموافقة')}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-xs text-[#64748d] font-medium">{tt('hr.approved', 'معتمد')}</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{approvedClaims + paidClaims}</p>
            <p className="text-xs text-[#64748d] mt-1">مطالبات معتمدة / مدفوعة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-violet-600" />
              </div>
              <span className="text-xs text-[#64748d] font-medium">قيمة معتمدة</span>
            </div>
            <p className="text-lg font-bold text-violet-600">{fmtInt(totalApprovedValue)}</p>
            <p className="text-xs text-[#64748d] mt-1">قيمة المطالبات المعتمدة</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardHeader>
          <CardTitle className="text-base font-bold text-[#061b31]">إجراءات سريعة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Link to="/portal/vendor/quotations" className="group">
              <div className="p-4 border-2 border-amber-100 hover:border-amber-300 hover:bg-amber-50/50 rounded-xl transition-all">
                <FileText className="h-6 w-6 text-[#9b6829] mb-2" />
                <p className="text-[13px] font-semibold text-[#061b31]">تقديم عرض سعر</p>
                <p className="text-xs text-[#64748d]">RFQ جديد</p>
              </div>
            </Link>
            <Link to="/portal/vendor/claims" className="group">
              <div className="p-4 border-2 border-blue-100 hover:border-blue-300 hover:bg-[rgba(83,58,253,0.06)]/50 rounded-xl transition-all">
                <Wrench className="h-6 w-6 text-[#533afd] mb-2" />
                <p className="text-[13px] font-semibold text-[#061b31]">مطالبة جديدة</p>
                <p className="text-xs text-[#64748d]">دفعة مستحقة</p>
              </div>
            </Link>
            <Link to="/portal/vendor/contracts" className="group">
              <div className="p-4 border-2 border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-xl transition-all">
                <Briefcase className="h-6 w-6 text-emerald-600 mb-2" />
                <p className="text-[13px] font-semibold text-[#061b31]">عقودي</p>
                <p className="text-xs text-[#64748d]">{tt('contractors.activeContracts', 'العقود النشطة')}</p>
              </div>
            </Link>
            <Link to="/portal/vendor/payments" className="group">
              <div className="p-4 border-2 border-violet-100 hover:border-violet-300 hover:bg-violet-50/50 rounded-xl transition-all">
                <DollarSign className="h-6 w-6 text-violet-600 mb-2" />
                <p className="text-[13px] font-semibold text-[#061b31]">المدفوعات</p>
                <p className="text-xs text-[#64748d]">حالة السداد</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent claims */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-[#061b31]">آخر المطالبات</CardTitle>
            <CardDescription className="text-xs">آخر المطالبات المقدمة</CardDescription>
          </div>
          <Link to="/portal/vendor/claims">
            <Button variant="ghost" size="sm" className="h-7 text-xs text-[#9b6829]">
              الكل
              <ArrowLeft className="h-3 w-3 mr-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentClaims.length === 0 ? (
            <div className="text-center py-8 text-[#64748d]">
              <FileText className="h-10 w-10 mx-auto text-gray-300 mb-2" />
              <p className="text-xs">لا توجد مطالبات</p>
              <Link to="/portal/vendor/claims">
                <Button size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700 h-8 text-xs">
                  <Plus className="h-3 w-3 ml-1" />
                  تقديم أول مطالبة
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentClaims.map((c) => (
                <div key={c.id} className="p-3 bg-[#f6f9fc] rounded-lg flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-xs font-semibold text-[#061b31]">{c.claim_number}</p>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-xs text-[#64748d] mt-0.5">{c.claim_date}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-[#061b31]">{fmt(c.claimed_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
