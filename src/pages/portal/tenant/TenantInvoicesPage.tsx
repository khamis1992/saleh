// Tenant Portal — My Invoices (list + status + PDF download)

import { useMemo, useState } from 'react';
import { usePortalAuth } from '@/providers/PortalAuthContext';
import { invoiceStore, unitStore, propertyStore } from '@/services/stores';
import { formatQAR, formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Receipt, Download, Search, Calendar, DollarSign, AlertCircle,
  CheckCircle2, Clock, FileText, X, Hash, Building, Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useLocale } from '@/providers/LocaleContext';

const fmt = (v: number) => formatQAR(v);

export default function TenantInvoicesPage() {
  const { t, tt, dir } = useLocale();
  const { session } = usePortalAuth();
  const tenantId = session?.tenantId;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const invoices = useMemo(
    () => (tenantId ? invoiceStore.getAll().filter((i) => i.tenant_id === tenantId) : []),
    [tenantId],
  );

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (search && !i.invoice_number.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));
  }, [invoices, search, statusFilter]);

  const totalUnpaid = useMemo(
    () => filtered.reduce((s, i) => s + i.balance, 0),
    [filtered],
  );

  const handleDownloadPDF = (invoiceNumber: string) => {
    // Simulate PDF download — for the demo, just toast
    toast.success(`جاري تحميل الفاتورة ${invoiceNumber}...`);
  };

  // Status counts
  const statusCounts = useMemo(() => ({
    all: invoices.length,
    paid: invoices.filter((i) => i.status === 'paid').length,
    overdue: invoices.filter((i) => i.status === 'overdue').length,
    issued: invoices.filter((i) => i.status === 'issued' || i.status === 'partially_paid').length,
  }), [invoices]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#061b31]">فواتيري</h1>
          <p className="text-xs text-[#64748d] mt-0.5">جميع الفواتير الصادرة باسمك</p>
        </div>
        {totalUnpaid > 0 && (
          <Link to="/portal/tenant/pay">
            <Button className="bg-[#533afd] hover:bg-blue-700 h-10 text-[13px] font-semibold">
              <DollarSign className="h-4 w-4 ml-1" />
              سداد {fmt(totalUnpaid)}
            </Button>
          </Link>
        )}
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 h-9 rounded-full text-xs font-medium transition-colors ${
            statusFilter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 border border-[#e5edf5] hover:bg-[#f6f9fc]'
          }`}
        >
          الكل ({statusCounts.all})
        </button>
        <button
          onClick={() => setStatusFilter('paid')}
          className={`px-4 h-9 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
            statusFilter === 'paid' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 border border-[#e5edf5] hover:bg-[#f6f9fc]'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          مدفوعة ({statusCounts.paid})
        </button>
        <button
          onClick={() => setStatusFilter('overdue')}
          className={`px-4 h-9 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
            statusFilter === 'overdue' ? 'bg-red-600 text-white' : 'bg-white text-gray-700 border border-[#e5edf5] hover:bg-[#f6f9fc]'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          متأخرة ({statusCounts.overdue})
        </button>
        <button
          onClick={() => setStatusFilter('issued')}
          className={`px-4 h-9 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
            statusFilter === 'issued' ? 'bg-amber-600 text-white' : 'bg-white text-gray-700 border border-[#e5edf5] hover:bg-[#f6f9fc]'
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          مستحقة ({statusCounts.issued})
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748d]" />
        <Input
          placeholder="ابحث برقم الفاتورة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10 h-10 text-[13px] bg-white"
        />
      </div>

      {/* Invoices list */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]">
          <CardContent className="py-12 text-center">
            <Receipt className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-[#64748d] text-sm">لا توجد فواتير تطابق البحث</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((inv) => {
            const unit = unitStore.getById(inv.unit_id);
            const property = propertyStore.getById(unit?.property_id || '');
            const isOverdue = inv.status === 'overdue';
            const isPaid = inv.status === 'paid';
            return (
              <Card key={inv.id} className={`border-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] hover:shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px] transition-shadow ${isOverdue ? 'border-r-4 border-r-red-500' : isPaid ? 'border-r-4 border-r-emerald-500' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="h-9 w-9 rounded-lg bg-[rgba(83,58,253,0.06)] flex items-center justify-center">
                          <FileText className="h-4 w-4 text-[#533afd]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#061b31]">{inv.invoice_number}</p>
                          <p className="text-xs text-[#64748d] flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(inv.invoice_date)}
                            <span>·</span>
                            استحقاق {formatDate(inv.due_date)}
                          </p>
                        </div>
                        <StatusBadge status={inv.status} />
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
                        <div>
                          <p className="text-xs text-[#64748d]">العقار</p>
                          <p className="text-xs font-semibold text-[#061b31]">{property?.property_name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#64748d]">{tt('system.module', 'الوحدة')}</p>
                          <p className="text-xs font-semibold text-[#061b31]">{unit?.unit_number || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#64748d]">إيجار</p>
                          <p className="text-xs font-semibold text-[#061b31]">{fmt(inv.rent_amount)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#64748d]">{tt('common.total', 'الإجمالي')}</p>
                          <p className="text-xs font-bold text-[#061b31]">{fmt(inv.total)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 lg:min-w-[160px]">
                      {inv.balance > 0 ? (
                        <div className="text-left">
                          <p className="text-xs text-[#64748d]">المستحق</p>
                          <p className={`text-base font-bold ${isOverdue ? 'text-[#ea2261]' : 'text-[#9b6829]'}`}>
                            {fmt(inv.balance)}
                          </p>
                        </div>
                      ) : (
                        <div className="text-left">
                          <p className="text-xs text-emerald-600">مدفوع بالكامل</p>
                          <p className="text-base font-bold text-emerald-600">{fmt(inv.paid_amount)}</p>
                        </div>
                      )}
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs flex-1"
                          onClick={() => handleDownloadPDF(inv.invoice_number)}
                        >
                          <Download className="h-3 w-3 ml-1" />
                          PDF
                        </Button>
                        {inv.balance > 0 && (
                          <Link to="/portal/tenant/pay" className="flex-1">
                            <Button size="sm" className="h-8 text-xs w-full bg-[#533afd] hover:bg-blue-700">
                              ادفع
                            </Button>
                          </Link>
                        )}
                      </div>
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
