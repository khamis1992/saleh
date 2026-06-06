// Vendor Portal — Payment Status
// Shows payment history from claims, with bank info

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { contractorStore } from '@/services/stores';
import { formatQAR, formatDate, formatDateLong } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  DollarSign, CheckCircle2, Clock, AlertCircle, Calendar, Building, Hash,
  Banknote, Download, FileText, CreditCard, TrendingUp,
} from 'lucide-react';
import { seedContractorClaims } from '@/pages/construction/ContractorClaimsPage';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);

const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  paid: { label: 'مدفوع', color: 'emerald' },
  partially_paid: { label: 'مدفوع جزئياً', color: 'violet' },
  unpaid: { label: 'غير مدفوع', color: 'red' },
};

export default function VendorPaymentsPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const vendorId = session?.vendorId;
  const vendor = useMemo(() => vendorId ? contractorStore.getById(vendorId) : null, [vendorId]);

  const myClaims = useMemo(
    () => seedContractorClaims.filter((c) => c.contractor_id === vendorId),
    [vendorId],
  );

  // KPIs
  const totalClaimed = myClaims.reduce((s, c) => s + c.claimed_amount, 0);
  const totalApproved = myClaims.filter((c) => ['approved', 'paid', 'partially_paid'].includes(c.status)).reduce((s, c) => s + c.net_payable, 0);
  const totalPaid = myClaims.filter((c) => c.status === 'paid').reduce((s, c) => s + c.net_payable, 0);
  const totalPending = myClaims.filter((c) => ['submitted', 'verified', 'approved'].includes(c.status)).reduce((s, c) => s + c.net_payable, 0);

  // Sort by claim date desc
  const sorted = useMemo(
    () => [...myClaims].sort((a, b) => b.claim_date.localeCompare(a.claim_date)),
    [myClaims],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061b31]">حالة المدفوعات</h1>
        <p className="text-[12px] text-[#64748d] mt-0.5">تتبع مدفوعات مستحقاتك من المطالبات</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-[#64748d]">إجمالي المطالبات</p>
            <p className="text-xl font-bold text-[#061b31]">{fmt(totalClaimed)}</p>
            <p className="text-[12px] text-[#64748d] mt-1">{myClaims.length} مطالبة</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-emerald-600">المدفوع</p>
            <p className="text-xl font-bold text-emerald-600">{fmt(totalPaid)}</p>
            <p className="text-[12px] text-emerald-600 mt-1">تم استلامه</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-[#533afd]">معتمد بانتظار الدفع</p>
            <p className="text-xl font-bold text-[#533afd]">{fmt(totalPending)}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <p className="text-[12px] text-[#9b6829]">إجمالي معتمد</p>
            <p className="text-xl font-bold text-[#9b6829]">{fmt(totalApproved)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Bank info */}
      {vendor && (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Banknote className="h-4 w-4 text-[#9b6829]" />
              <h2 className="text-[14px] font-bold text-[#061b31]">بيانات الحساب البنكي</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#f6f9fc] rounded-lg">
                <p className="text-[12px] text-[#64748d]">البنك</p>
                <p className="text-[13px] font-semibold text-[#061b31]">{vendor.bank_name || '—'}</p>
              </div>
              <div className="p-3 bg-[#f6f9fc] rounded-lg">
                <p className="text-[12px] text-[#64748d]">رقم الحساب</p>
                <p className="text-[13px] font-semibold text-[#061b31]" dir="ltr">{vendor.account_number || '—'}</p>
              </div>
              <div className="p-3 bg-[#f6f9fc] rounded-lg">
                <p className="text-[12px] text-[#64748d]">رقم IBAN</p>
                <p className="text-[13px] font-semibold text-[#061b31]" dir="ltr">{vendor.iban || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment timeline */}
      <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
        <CardContent className="p-0">
          <div className="p-4 border-b border-[#e5edf5]">
            <h2 className="text-[14px] font-bold text-[#061b31]">سجل المدفوعات</h2>
            <p className="text-[12px] text-[#64748d]">آخر المطالبات وحالة سدادها</p>
          </div>
          {sorted.length === 0 ? (
            <div className="py-12 text-center text-[#64748d]">
              <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-[14px]">لا توجد مدفوعات</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {sorted.map((c) => {
                const ps = PAYMENT_STATUS_LABELS[c.payment_status] || PAYMENT_STATUS_LABELS.unpaid;
                return (
                  <div key={c.id} className="p-4 hover:bg-[#f6f9fc] transition-colors">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-10 w-10 rounded-xl bg-${ps.color}-50 flex items-center justify-center flex-shrink-0`}>
                          {c.payment_status === 'paid' ? (
                            <CheckCircle2 className={`h-5 w-5 text-${ps.color}-600`} />
                          ) : c.payment_status === 'unpaid' ? (
                            <AlertCircle className={`h-5 w-5 text-${ps.color}-600`} />
                          ) : (
                            <Clock className={`h-5 w-5 text-${ps.color}-600`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <p className="text-[13px] font-semibold text-[#061b31]">{c.claim_number}</p>
                            <span className={`text-[12px] px-2 py-0.5 rounded-full font-medium bg-${ps.color}-50 text-${ps.color}-700`}>
                              {ps.label}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#64748d]">
                            {formatDate(c.claim_date)} · {c.work_completed_percentage}% إنجاز
                          </p>
                        </div>
                      </div>
                      <div className="text-left flex items-center gap-3">
                        <div>
                          <p className="text-[12px] text-[#64748d]">صافي</p>
                          <p className="text-[14px] font-bold text-[#061b31]">{fmt(c.net_payable)}</p>
                        </div>
                        {c.payment_status !== 'paid' && (
                          <Button size="sm" variant="outline" className="h-8 text-[12px]" onClick={() => toast.info('تذكير بالإدارة')}>
                            تذكير
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
