// Tenant Portal — Payment History
// Shows all receipts and payment proofs

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { receiptStore, invoiceStore } from '@/services/stores';
import { formatQAR, formatDate } from '@/lib/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Receipt, Search, Calendar, Download, FileText, Banknote,
  CreditCard, Building, Hash, TrendingUp, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);

const METHOD_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  cash: { label: 'نقدي', icon: Banknote, color: 'emerald' },
  bank_transfer: { label: 'تحويل بنكي', icon: Building, color: 'blue' },
  cheque: { label: 'شيك', icon: FileText, color: 'amber' },
  card: { label: 'بطاقة', icon: CreditCard, color: 'violet' },
  online: { label: 'دفع إلكتروني', icon: CreditCard, color: 'blue' },
};

export default function TenantPaymentsPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const tenantId = session?.tenantId;
  const [search, setSearch] = useState('');

  const receipts = useMemo(
    () => (tenantId ? receiptStore.getAll().filter((r) => r.tenant_id === tenantId) : []),
    [tenantId],
  );

  const filtered = useMemo(() => {
    return receipts
      .filter((r) => {
        if (search && !r.receipt_number.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.payment_date.localeCompare(a.payment_date));
  }, [receipts, search]);

  const totalPaid = useMemo(() => filtered.reduce((s, r) => s + r.amount, 0), [filtered]);

  const handleDownload = (receiptNumber: string) => {
    toast.success(`جاري تحميل الإيصال ${receiptNumber}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">سجل المدفوعات</h1>
          <p className="text-[12px] text-[#64748d] mt-0.5">جميع الإيصالات والمدفوعات السابقة</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-emerald-600" />
          <div>
            <p className="text-[12px] text-emerald-600">إجمالي المدفوع</p>
            <p className="text-[15px] font-bold text-emerald-700">{fmt(totalPaid)}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
        <Input
          placeholder="ابحث برقم الإيصال..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 h-10 text-[13px] bg-white"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-[#64748d] text-[14px]">لا توجد مدفوعات</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const inv = invoiceStore.getById(r.invoice_id);
            const methodInfo = METHOD_LABELS[r.payment_method] || METHOD_LABELS.online;
            const Icon = methodInfo.icon;
            return (
              <Card key={r.id} className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`h-11 w-11 rounded-xl bg-${methodInfo.color}-50 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`h-5 w-5 text-${methodInfo.color}-600`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-[14px] font-bold text-[#061b31]">{r.receipt_number}</p>
                          <span className={`text-[12px] px-2 py-0.5 rounded-full bg-${methodInfo.color}-50 text-${methodInfo.color}-700 font-medium`}>
                            {methodInfo.label}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#64748d] flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(r.payment_date)}
                          </span>
                          {inv && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                فاتورة {inv.invoice_number}
                              </span>
                            </>
                          )}
                          {r.reference_number && (
                            <>
                              <span>·</span>
                              <span className="flex items-center gap-1" dir="ltr">
                                <Hash className="h-3 w-3" />
                                {r.reference_number}
                              </span>
                            </>
                          )}
                        </p>
                        {r.notes && (
                          <p className="text-[12px] text-[#64748d] mt-1 italic">{r.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 lg:flex-col lg:items-end">
                      <div className="text-left">
                        <p className="text-[12px] text-[#64748d]">{tt('common.amount', 'المبلغ')}</p>
                        <p className="text-[18px] font-bold text-emerald-600">{fmt(r.amount)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(r.receipt_number)}
                        className="h-8 text-[12px]"
                      >
                        <Download className="h-3 w-3 ml-1" />
                        إيصال
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
