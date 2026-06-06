import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Filter, Eye, Pencil, Trash2, Plus, Receipt, X, Zap } from 'lucide-react';
import { invoiceStore, tenantStore, unitStore, rentScheduleStore } from '@/services/stores';
import { RentalInvoice, RentSchedule } from '@/types';

export default function RentInvoicesPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<RentalInvoice[]>(() => invoiceStore.getAll());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<RentalInvoice | null>(null);

  // Simulate loading
  useState(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  });

  const refresh = () => setInvoices(invoiceStore.getAll());

  const fmt = (v: number) => formatQAR(v);

  const getTenantName = (tenantId: string) => {
    const t = tenantStore.getById(tenantId);
    return t?.full_name || t?.company_name || '—';
  };

  const getUnitNumber = (unitId: string) => {
    return unitStore.getById(unitId)?.unit_number || '—';
  };

  const filtered = useMemo(() => {
    return invoices.filter((i) => {
      const tenantName = getTenantName(i.tenant_id);
      if (statusFilter !== 'all' && i.status !== statusFilter) return false;
      if (search && !tenantName.includes(search) && !i.invoice_number.includes(search)) return false;
      return true;
    });
  }, [invoices, search, statusFilter]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    invoiceStore.remove(deleteTarget.id);
    refresh();
    toast.success(`تم حذف الفاتورة ${deleteTarget.invoice_number} بنجاح`);
    setDeleteTarget(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ رقم الفاتورة');
    });
  };

  const generateInvoices = () => {
    const schedules = rentScheduleStore.getAll().filter((s: RentSchedule) => s.status === 'due' || s.status === 'upcoming');
    const allInvoices = invoiceStore.getAll();
    let generated = 0;

    const maxInvNum = allInvoices.reduce((max, i) => {
      const m = i.invoice_number?.match(/INV-(\d+)-(\d+)/);
      if (m) { const n = parseInt(m[2]); return n > max ? n : max; }
      return max;
    }, 0);

    let nextNum = maxInvNum + 1;

    for (const sch of schedules) {
      // Check if invoice already exists for this schedule's contract + period
      const exists = allInvoices.some((inv: RentalInvoice) => 
        inv.contract_id === sch.contract_id && 
        inv.invoice_date === sch.due_date
      );
      if (exists) continue;

      // Find the lease for this schedule
      const leasesRaw = localStorage.getItem('erp_leases');
      const leases: any[] = leasesRaw ? JSON.parse(leasesRaw) : [];
      const lease = leases.find((l: any) => l.id === sch.contract_id);
      if (!lease) continue;

      const year = new Date(sch.due_date).getFullYear();
      invoiceStore.create({
        company_id: '',
        invoice_number: `INV-${year}-${String(nextNum).padStart(3, '0')}`,
        tenant_id: lease.tenant_id,
        contract_id: sch.contract_id,
        unit_id: lease.unit_id,
        invoice_date: sch.due_date,
        due_date: sch.due_date,
        rent_amount: sch.rent_amount,
        service_charges: sch.service_charges || 0,
        maintenance_charges: 0,
        penalties: sch.late_fee || 0,
        discounts: 0,
        tax: 0,
        total: sch.total_due,
        paid_amount: sch.paid_amount || 0,
        balance: sch.balance,
        status: 'issued',
      });

      // Update schedule status to 'due'
      const schedulesRaw = localStorage.getItem('erp_rent_schedules');
      if (schedulesRaw) {
        const allScheds: any[] = JSON.parse(schedulesRaw);
        const idx = allScheds.findIndex((s: any) => s.id === sch.id);
        if (idx !== -1) {
          allScheds[idx].status = 'due';
          localStorage.setItem('erp_rent_schedules', JSON.stringify(allScheds));
        }
      }

      nextNum++;
      generated++;
    }

    refresh();
    if (generated > 0) {
      toast.success(`تم إنشاء ${generated} فاتورة جديدة`);
    } else {
      toast.info('لا توجد فواتير جديدة لإنشائها');
    }
  };

  const statusLabel = (s: string) =>
    s === 'paid' ? 'مدفوعة' : s === 'partially_paid' ? 'مدفوعة جزئياً' : s === 'issued' ? 'مصدرة' : s === 'overdue' ? 'متأخرة' : s === 'draft' ? 'مسودة' : s;

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.rentCollection.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} فاتورة — {t.rentCollection.invoices}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={generateInvoices}
            className="gap-2 bg-green-600 hover:bg-green-700 text-white text-sm h-9 rounded-lg px-4 shadow-sm transition-all"
          >
            <Zap className="h-4 w-4" />
            إنشاء فواتير
          </Button>
          <Button
            onClick={() => navigate('/rent-collection/invoices/create')}
            className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
          >
            <Plus className="h-4 w-4" />
            فاتورة جديدة
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t.common.search + '...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder={t.common.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="paid">مدفوعة</SelectItem>
              <SelectItem value="partially_paid">مدفوعة جزئياً</SelectItem>
              <SelectItem value="issued">مصدرة</SelectItem>
              <SelectItem value="overdue">متأخرة</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="cancelled">ملغاة</SelectItem>
            </SelectContent>
          </Select>
          {search && (
            <span className="text-xs text-gray-400">{filtered.length} نتيجة</span>
          )}
        </div>
      </div>

      {/* Table Card */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow >
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.rentCollection.invoiceNumber}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.tenant}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.unit}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">تاريخ الفاتورة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.rentCollection.dueDate}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.common.total}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.rentCollection.paidAmount}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.rentCollection.balance}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.common.status}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[100px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <Receipt className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا توجد فواتير</p>
                        <p className="text-xs text-gray-400">لم يتم العثور على أي نتائج</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSearch(''); setStatusFilter('all'); }}
                          className="h-8 text-xs rounded-lg mt-1"
                        >
                          مسح الفلاتر
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((i) => (
                  <TableRow
                    key={i.id}
                    className=""
                  >
                    <TableCell className="font-medium text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(i.invoice_number); }}
                            className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {i.invoice_number}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>اضغط للنسخ</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm text-gray-800">{getTenantName(i.tenant_id)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{getUnitNumber(i.unit_id)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{i.invoice_date}</TableCell>
                    <TableCell className="text-sm text-gray-600">{i.due_date}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-700">{fmt(i.total)}</TableCell>
                    <TableCell className="text-sm text-green-600">{fmt(i.paid_amount)}</TableCell>
                    <TableCell className={`text-sm ${i.balance > 0 ? 'text-red-600 font-medium' : ''}`}>{fmt(i.balance)}</TableCell>
                    <TableCell><StatusBadge status={i.status} label={statusLabel(i.status)} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/rent-collection/invoices/${i.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => navigate(`/rent-collection/invoices/${i.id}/edit`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>تعديل</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(i)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>حذف</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 0 && (
            <div className="py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs text-gray-500">عرض {filtered.length} من {invoices.length} فاتورة</span>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الفاتورة <strong>{deleteTarget?.invoice_number}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
