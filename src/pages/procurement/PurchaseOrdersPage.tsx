import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { LineItemsTable } from '@/components/shared/Phase2Components';
import type { LineItem } from '@/components/shared/Phase2Components';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Filter, Eye, Pencil, Trash2, Plus, FileText, Truck, AlertTriangle, X, ShoppingCart, TrendingUp, Clock, CheckCircle2,
} from 'lucide-react';
import { projectStore, purchaseOrderStore } from '@/services/stores';
import { KpiCard } from '@/components/shared/DesignSystem';

interface POItem {
  itemName: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface PurchaseOrder {
  id: string;
  po_number: string;
  vendor: string;
  project: string;
  order_date: string;
  expected_delivery: string;
  delivery_location: string;
  total_amount: number;
  receipt_status: string;
  payment_status: string;
  items: POItem[];
  status: string;
  notes: string;
}

export default function PurchaseOrdersPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState<Partial<PurchaseOrder>>({
    po_number: '', vendor: '', project: '', order_date: '',
    expected_delivery: '', delivery_location: '', total_amount: 0,
    receipt_status: 'none', payment_status: 'unpaid',
    items: [], status: 'draft', notes: '',
  });
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);

  const fmt = (v: number) => formatQAR(v);

  const data = useMemo(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return purchaseOrderStore.getAll() as PurchaseOrder[];
  }, [refresh]);

  const filtered = useMemo(() => {
    return data.filter((po) => {
      if (statusFilter !== 'all' && po.status !== statusFilter) return false;
      if (search && !po.po_number.includes(search) && !po.vendor.includes(search) && !po.project.includes(search)) return false;
      return true;
    });
  }, [data, search, statusFilter]);

  // KPI computations
  const pendingOrders = data.filter((po: any) => po.status === 'draft' || po.status === 'in_progress').length;
  const deliveredOrders = data.filter((po: any) => po.status === 'delivered' || po.status === 'completed').length;
  const totalPOValue = data.reduce((s: number, po: any) => s + (po.total_amount || 0), 0);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ رقم الأمر');
    });
  };

  const openCreate = () => {
    setEditId(null);
    const allPOs = purchaseOrderStore.getAll() as PurchaseOrder[];
    setForm({
      po_number: `PO-${new Date().getFullYear()}-${String(allPOs.length + 1).padStart(3, '0')}`,
      vendor: '', project: '', order_date: new Date().toISOString().split('T')[0],
      expected_delivery: '', delivery_location: '', total_amount: 0,
      receipt_status: 'none', payment_status: 'unpaid',
      items: [], status: 'draft', notes: '',
    });
    setShowModal(true);
  };
  const savePO = () => {
    if (!form.po_number || !form.vendor || !form.project) return;
    const total = (form.items || []).reduce((s, i) => s + i.total, 0);
    const projects = projectStore.getAll();
    const prj = projects.find((p: any) => p.project_name === form.project || p.id === form.project);
    if (prj) {
      const remaining = (prj.approved_budget || 0) - (prj.actual_cost || 0);
      if (total > remaining) {
        const warnMsg = `تحذير: إجمالي أمر الشراء (${fmt(total)}) يتجاوز الميزانية المتبقية للمشروع (${fmt(remaining)})`;
        setBudgetWarning(warnMsg);
        toast.warning(warnMsg);
      } else {
        setBudgetWarning(null);
      }
    }

    if (editId) {
      purchaseOrderStore.update(editId, { ...form, items: form.items || [], total_amount: total } as any);
      toast.success('تم تحديث أمر الشراء بنجاح');
    } else {
      const newPO: Omit<PurchaseOrder, 'id'> = { ...form, total_amount: total } as any;
      purchaseOrderStore.create({ ...newPO, items: form.items || [] } as any);
      toast.success('تم إنشاء أمر الشراء بنجاح');
    }
    setRefresh(r => r + 1); setShowModal(false); setEditId(null);
  };

  const openEdit = (po: PurchaseOrder) => {
    setEditId(po.id);
    setForm({
      po_number: po.po_number, vendor: po.vendor, project: po.project,
      order_date: po.order_date, expected_delivery: po.expected_delivery,
      delivery_location: po.delivery_location, total_amount: po.total_amount,
      receipt_status: po.receipt_status, payment_status: po.payment_status,
      items: po.items || [], status: po.status, notes: po.notes || '',
    });
    setShowModal(true);
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...(prev.items || []), { itemName: '', description: '', quantity: 1, unit: 'حبة', unitPrice: 0, total: 0 }],
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setForm((prev) => {
      const items = [...(prev.items || [])];
      const item = { ...items[index], [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        item.total = item.quantity * item.unitPrice;
      }
      items[index] = item;
      const total = items.reduce((s, i) => s + i.total, 0);
      return { ...prev, items, total_amount: total };
    });
  };

  const removeItem = (index: number) => {
    setForm((prev) => {
      const items = (prev.items || []).filter((_, i) => i !== index);
      const total = items.reduce((s, i) => s + i.total, 0);
      return { ...prev, items, total_amount: total };
    });
  };

  const receiptLabel = (s: string) => s === 'full' ? 'مكتمل' : s === 'partial' ? 'جزئي' : 'لم يستلم';
  const paymentLabel = (s: string) => s === 'paid' ? 'مدفوع' : s === 'partially_paid' ? 'مدفوع جزئياً' : 'غير مدفوع';
  const statusLabel = (s: string) =>
    s === 'draft' ? 'مسودة' : s === 'approved' ? 'معتمد' : s === 'in_progress' ? 'قيد التنفيذ' : s === 'completed' ? 'مكتمل' : s;

  const handleDelete = () => {
    if (!deleteTarget) return;
    purchaseOrderStore.remove(deleteTarget.id);
    toast.success(`تم حذف أمر الشراء ${deleteTarget.po_number} بنجاح`);
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="أوامر الشراء" value={data.length} subtitle={`${filtered.length} أمر`} icon={ShoppingCart} moduleOverride="procurement" />
        <KpiCard title="معلقة" value={pendingOrders} subtitle="بانتظار التسليم" icon={Clock} trend={pendingOrders > 0 ? { value: pendingOrders } : undefined} moduleOverride="procurement" />
        <KpiCard title="مسلمة" value={deliveredOrders} subtitle="تم استلامها" icon={Truck} moduleOverride="procurement" />
        <KpiCard title="القيمة الإجمالية" value={formatQARInt(totalPOValue)} subtitle="ر.ق" icon={TrendingUp} moduleOverride="procurement" />
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">أوامر الشراء</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} أمر — إدارة أوامر الشراء والتوريد
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          أمر شراء جديد
        </Button>
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
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="approved">معتمد</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
            </SelectContent>
          </Select>
          {(search || statusFilter !== 'all') && (
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
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">رقم الأمر</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المورد</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المشروع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">التسليم المتوقع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المبلغ الإجمالي</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">حالة الاستلام</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">حالة الدفع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الحالة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[100px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <Truck className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا توجد أوامر شراء</p>
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
                {filtered.map((po) => (
                  <TableRow
                    key={po.id}
                    className=""
                  >
                    <TableCell className="font-medium text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(po.po_number); }}
                            className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {po.po_number}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>اضغط للنسخ</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm text-gray-800">{po.vendor}</TableCell>
                    <TableCell className="text-sm text-gray-600">{po.project}</TableCell>
                    <TableCell className="text-sm text-gray-600">{po.expected_delivery}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-700">{fmt(po.total_amount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={po.receipt_status} label={receiptLabel(po.receipt_status)} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={po.payment_status} label={paymentLabel(po.payment_status)} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={po.status} label={statusLabel(po.status)} />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => setShowDetail(po)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض</TooltipContent>
                        </Tooltip>
                        {/* GR Link */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-50 font-semibold gap-1" onClick={() => navigate(`/procurement/receipts?poNumber=${po.po_number}`)}>
                              <Truck className="h-3 w-3" />استلام
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>استلام بضائع</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => openEdit(po)}>
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
                              onClick={() => setDeleteTarget(po)}
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
              <span className="text-xs text-gray-500">عرض {filtered.length} من {data.length} أمر</span>
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
              هل أنت متأكد من حذف أمر الشراء <strong>{deleteTarget?.po_number}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create PO Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>أمر شراء جديد</DialogTitle>
          </DialogHeader>
          {budgetWarning && (
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 rounded-lg p-3 flex items-start gap-2 text-sm">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{budgetWarning}</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>رقم الأمر</Label>
              <Input value={form.po_number} onChange={(e) => setForm({ ...form, po_number: e.target.value })} />
            </div>
            <div>
              <Label>المورد *</Label>
              <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
            </div>
            <div>
              <Label>المشروع *</Label>
              <Input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} />
            </div>
            <div>
              <Label>تاريخ الأمر</Label>
              <Input type="date" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} />
            </div>
            <div>
              <Label>التسليم المتوقع</Label>
              <Input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} />
            </div>
            <div>
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">مسودة</SelectItem>
                  <SelectItem value="approved">معتمد</SelectItem>
                  <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Label>موقع التسليم</Label>
              <Input value={form.delivery_location} onChange={(e) => setForm({ ...form, delivery_location: e.target.value })} />
            </div>
            <div className="col-span-3">
              <Label>ملاحظات</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">بنود الأمر</h4>
              <Button variant="outline" size="sm" onClick={addItem}>+ إضافة بند</Button>
            </div>
            {(!form.items || form.items.length === 0) ? (
              <div className="border rounded-lg p-6 text-center text-muted-foreground text-sm">
                لا توجد بنود. اضغط "إضافة بند" للإضافة.
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-right p-2">الصنف</th>
                      <th className="text-right p-2">الوصف</th>
                      <th className="text-center p-2 w-24">الكمية</th>
                      <th className="text-center p-2 w-20">الوحدة</th>
                      <th className="text-right p-2 w-32">سعر الوحدة</th>
                      <th className="text-right p-2 w-32">الإجمالي</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.items || []).map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-1">
                          <Input className="h-8 text-sm" value={item.itemName} onChange={(e) => updateItem(i, 'itemName', e.target.value)} />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-sm" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-sm text-center" type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-sm" value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-sm text-right font-mono" type="number" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))} />
                        </td>
                        <td className="p-1 text-right font-mono font-bold px-2">{fmt(item.total)}</td>
                        <td className="p-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => removeItem(i)}>✕</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <td colSpan={5} className="p-2 text-right font-semibold">الإجمالي</td>
                      <td className="p-2 text-right font-bold font-mono">{fmt(form.total_amount || 0)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button onClick={savePO}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل أمر الشراء {showDetail?.po_number}</DialogTitle>
          </DialogHeader>
          {showDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">المورد: </span><span className="font-medium">{showDetail.vendor}</span></div>
                <div><span className="text-muted-foreground">المشروع: </span><span className="font-medium">{showDetail.project}</span></div>
                <div><span className="text-muted-foreground">تاريخ الأمر: </span><span>{showDetail.order_date}</span></div>
                <div><span className="text-muted-foreground">التسليم المتوقع: </span><span>{showDetail.expected_delivery}</span></div>
                <div><span className="text-muted-foreground">موقع التسليم: </span><span>{showDetail.delivery_location}</span></div>
                <div><span className="text-muted-foreground">الحالة: </span>
                  <StatusBadge status={showDetail.status} label={statusLabel(showDetail.status)} />
                </div>
              </div>
              {showDetail.notes && (
                <div className="bg-muted rounded p-3 text-sm">
                  <span className="text-muted-foreground">ملاحظات: </span>{showDetail.notes}
                </div>
              )}
              <LineItemsTable
                items={(showDetail.items || []).map((it) => ({ ...it, id: it.itemName }))}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetail(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
