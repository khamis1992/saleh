import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Filter, Eye, Pencil, Trash2, Plus, Download, X } from 'lucide-react';
import { postReceiptToInvoice, exportToCSV } from '@/utils/exportUtils';
import { receiptStore, invoiceStore, tenantStore, getTenantName } from '@/services/stores';
import type { Receipt, RentalInvoice } from '@/types';

function getInvoiceNumber(id: string): string {
  const inv = invoiceStore.getById(id);
  return inv?.invoice_number || id;
}

const methodLabels: Record<string, string> = {
  cash: 'نقدي',
  bank_transfer: 'تحويل بنكي',
  cheque: 'شيك',
  card: 'بطاقة',
  online: 'دفع إلكتروني',
};

export default function RentReceiptsPage() {
  const { t } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Receipt | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Partial<Receipt>>({
    receipt_number: '', tenant_id: '', invoice_id: '', payment_date: '',
    payment_method: 'bank_transfer', amount: 0, notes: '',
  });

  const receipts = useMemo(() => {
    const data = receiptStore.getAll();
    const timer = setTimeout(() => setLoading(false), 300);
    return data;
  }, [refresh]);
  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const fmt = (v: number) => formatQAR(v);

  const filtered = useMemo(() => receipts.filter((r) => {
    if (search && !r.receipt_number.includes(search) && !getTenantName(r.tenant_id).includes(search)) return false;
    return true;
  }), [receipts, search]);

  function openCreate() {
    const count = receipts.length + 1;
    setForm({
      receipt_number: `RCP-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
      tenant_id: '', invoice_id: '', payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'bank_transfer', amount: 0, notes: '',
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.receipt_number || !form.invoice_id || !form.amount) return;

    const newReceipt = receiptStore.create({
      ...form,
      company_id: '',
      contract_id: '',
      bank_account_id: '',
      reference_number: '',
      attachment_url: '',
    } as Omit<Receipt, 'id'>);

    const posted = postReceiptToInvoice(form.invoice_id || '', form.amount || 0);
    if (posted) {
      toast.success('تم حفظ السند وتحديث الفاتورة بنجاح');
    } else {
      toast.success('تم حفظ السند ولكن تعذر تحديث الفاتورة');
    }

    setRefresh(r => r + 1);
    setDialogOpen(false);
  }

  const handleDelete = () => {
    if (!deleteTarget) return;
    receiptStore.remove(deleteTarget.id);
    toast.success(`تم حذف سند القبض ${deleteTarget.receipt_number} بنجاح`);
    setDeleteTarget(null);
    setRefresh(r => r + 1);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ رقم السند');
    });
  };

  const handleExport = () => {
    const data = filtered.map((r) => ({
      'رقم السند': r.receipt_number,
      'المستأجر': getTenantName(r.tenant_id),
      'رقم الفاتورة': getInvoiceNumber(r.invoice_id),
      'تاريخ الدفع': r.payment_date,
      'طريقة الدفع': methodLabels[r.payment_method] || r.payment_method,
      'المبلغ': r.amount,
      'ملاحظات': r.notes || '',
    }));
    exportToCSV(data, [
      { key: 'رقم السند', label: 'رقم السند' },
      { key: 'المستأجر', label: 'المستأجر' },
      { key: 'رقم الفاتورة', label: 'رقم الفاتورة' },
      { key: 'تاريخ الدفع', label: 'تاريخ الدفع' },
      { key: 'طريقة الدفع', label: 'طريقة الدفع' },
      { key: 'المبلغ', label: 'المبلغ' },
      { key: 'ملاحظات', label: 'ملاحظات' },
    ], 'سندات_القبض.csv');
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.rentCollection.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} سند — {t.rentCollection.receipts}
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          سند قبض جديد
        </Button>
      </div>

      {/* Search Bar */}
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
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="h-9 w-9 rounded-lg"
            title="تصدير CSV"
          >
            <Download className="h-4 w-4" />
          </Button>
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
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">رقم السند</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.tenant}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">رقم الفاتورة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">تاريخ الدفع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.rentCollection.paymentMethod}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.common.amount}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[100px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <Download className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا توجد سندات قبض</p>
                        <p className="text-xs text-gray-400">لم يتم العثور على أي نتائج</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearch('')}
                          className="h-8 text-xs rounded-lg mt-1"
                        >
                          مسح الفلاتر
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r: any) => (
                  <TableRow
                    key={r.id}
                    className=""
                  >
                    <TableCell className="font-medium text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(r.receipt_number); }}
                            className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {r.receipt_number}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>اضغط للنسخ</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm text-gray-800">{getTenantName(r.tenant_id)}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-600">{getInvoiceNumber(r.invoice_id)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{r.payment_date}</TableCell>
                    <TableCell className="text-sm text-gray-600">{methodLabels[r.payment_method] || r.payment_method}</TableCell>
                    <TableCell className="text-sm text-green-600 font-medium">{fmt(r.amount)}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50">
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
                              onClick={() => setDeleteTarget(r)}
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
              <span className="text-xs text-gray-500">عرض {filtered.length} من {receipts.length} سند</span>
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
              هل أنت متأكد من حذف سند القبض <strong>{deleteTarget?.receipt_number}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Receipt Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>سند قبض جديد</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>رقم السند</Label>
              <Input value={form.receipt_number} onChange={(e) => setForm({ ...form, receipt_number: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>المستأجر</Label>
              <Select value={form.tenant_id || ''} onValueChange={(v) => setForm({ ...form, tenant_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر المستأجر" /></SelectTrigger>
                <SelectContent>
                  {tenantStore.getAll().map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>{t.full_name || t.company_name || t.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>رقم الفاتورة *</Label>
              <Select value={form.invoice_id} onValueChange={(v) => setForm({ ...form, invoice_id: v })}>
                <SelectTrigger><SelectValue placeholder="اختر الفاتورة" /></SelectTrigger>
                <SelectContent>
                  {invoices.filter((i: any) => i.status !== 'paid').map((inv: any) => (
                    <SelectItem key={inv.id} value={inv.id}>{inv.invoice_number} - {fmt(inv.balance)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تاريخ الدفع</Label>
              <Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>طريقة الدفع</Label>
              <Select value={form.payment_method} onValueChange={(v: any) => setForm({ ...form, payment_method: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="cheque">شيك</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="online">دفع إلكتروني</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المبلغ (ر.ق)</Label>
              <Input type="number" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>ملاحظات</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleSave}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
