import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
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
  Search, Filter, Eye, Pencil, Trash2, Plus, FileText, Warehouse, PackageCheck, CheckCircle, X,
} from 'lucide-react';
import { createStore } from '@/services/dataService';
import { stockTransactionStore, purchaseOrderStore } from '@/services/stores';
import { logAudit, generateJournalEntry } from '@/utils/exportUtils';

interface GRItem {
  itemName: string;
  description: string;
  orderedQty: number;
  receivedQty: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface GoodsReceipt {
  id: string;
  gr_number: string;
  po_number: string;
  vendor: string;
  project: string;
  warehouse: string;
  receipt_date: string;
  received_by: string;
  items: GRItem[];
  total_amount: number;
  status: string;
  notes: string;
  quality_inspection?: 'pending' | 'passed' | 'failed';
}

// Mock POs available for receipt
const mockPOs = [
  { po_number: 'PO-2024-001', vendor: 'شركة مواد البناء المتحدة', project: 'مشروع أبراج النخيل', total_amount: 850000,
    items: [
      { itemName: 'حديد تسليح', description: 'حديد تسليح 16 ملم', orderedQty: 500, unit: 'طن', unitPrice: 1200 },
      { itemName: 'أسمنت', description: 'أسمنت بورتلاندي', orderedQty: 1000, unit: 'كيس', unitPrice: 15 },
      { itemName: 'طابوق', description: 'طابوق أحمر', orderedQty: 50000, unit: 'حبة', unitPrice: 4.7 },
    ],
  },
  { po_number: 'PO-2024-002', vendor: 'شركة الكهرباء السعودية', project: 'مشروع فلل الياسمين', total_amount: 350000,
    items: [
      { itemName: 'كابلات', description: 'كابل نحاس 4×16 ملم', orderedQty: 2000, unit: 'متر', unitPrice: 120 },
      { itemName: 'لوحات توزيع', description: 'لوحة توزيع رئيسية', orderedQty: 5, unit: 'وحدة', unitPrice: 22000 },
    ],
  },
  { po_number: 'PO-2024-003', vendor: 'مصنع الرياض للحديد', project: 'مشروع مركز الرياض التجاري', total_amount: 620000,
    items: [
      { itemName: 'حديد تسليح', description: 'حديد تسليح 20 ملم', orderedQty: 300, unit: 'طن', unitPrice: 1300 },
      { itemName: 'ألواح صاج', description: 'صاج حديد 2 ملم', orderedQty: 200, unit: 'لوح', unitPrice: 1150 },
    ],
  },
  { po_number: 'PO-2024-004', vendor: 'مؤسسة الخليج للمقاولات', project: 'مشروع أبراج النخيل', total_amount: 1200000,
    items: [
      { itemName: 'وحدات تكييف', description: 'وحدات تكييف مركزية 30 طن', orderedQty: 8, unit: 'وحدة', unitPrice: 150000 },
    ],
  },
];

const warehouses = ['مستودع الشركة الرئيسي', 'مستودع المشاريع - الرياض', 'مستودع المشاريع - جدة', 'مستودع المواد الخام'];

const initialGRs: GoodsReceipt[] = [
  {
    id: 'gr1', gr_number: 'GR-2024-001', po_number: 'PO-2024-001', vendor: 'شركة مواد البناء المتحدة',
    project: 'مشروع أبراج النخيل', warehouse: 'مستودع المشاريع - الرياض',
    receipt_date: '2024-06-10', received_by: 'م. فيصل الشهري',
    items: [
      { itemName: 'حديد تسليح', description: 'حديد تسليح 16 ملم', orderedQty: 500, receivedQty: 250, unit: 'طن', unitPrice: 1200, total: 300000 },
      { itemName: 'أسمنت', description: 'أسمنت بورتلاندي', orderedQty: 1000, receivedQty: 1000, unit: 'كيس', unitPrice: 15, total: 15000 },
      { itemName: 'طابوق', description: 'طابوق أحمر', orderedQty: 50000, receivedQty: 25000, unit: 'حبة', unitPrice: 4.7, total: 117500 },
    ],
    total_amount: 432500, status: 'partial', notes: 'استلام جزئي - باقي الشحنة الأسبوع القادم',
  },
  {
    id: 'gr2', gr_number: 'GR-2024-002', po_number: 'PO-2024-002', vendor: 'شركة الكهرباء السعودية',
    project: 'مشروع فلل الياسمين', warehouse: 'مستودع المشاريع - جدة',
    receipt_date: '2024-05-18', received_by: 'أ. سارة القحطاني',
    items: [
      { itemName: 'كابلات', description: 'كابل نحاس 4×16 ملم', orderedQty: 2000, receivedQty: 2000, unit: 'متر', unitPrice: 120, total: 240000 },
      { itemName: 'لوحات توزيع', description: 'لوحة توزيع رئيسية', orderedQty: 5, receivedQty: 5, unit: 'وحدة', unitPrice: 22000, total: 110000 },
    ],
    total_amount: 350000, status: 'full', notes: 'تم استلام كامل الشحنة',
  },
];

export default function GoodsReceiptsPage() {
  const { t } = useLocale();
  const [receipts, setReceipts] = useState<GoodsReceipt[]>(initialGRs);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<GoodsReceipt | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState('');
  const [form, setForm] = useState<Partial<GoodsReceipt>>({
    gr_number: '', po_number: '', vendor: '', project: '',
    warehouse: '', receipt_date: new Date().toISOString().split('T')[0],
    received_by: '', items: [], total_amount: 0, status: 'partial', notes: '',
    quality_inspection: 'pending',
  });

  const fmt = (v: number) => formatQAR(v);

  const data = useMemo(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return receipts;
  }, [receipts]);

  const filtered = useMemo(() => {
    return data.filter((gr) => {
      if (statusFilter !== 'all' && gr.status !== statusFilter) return false;
      if (search && !gr.gr_number.includes(search) && !gr.po_number.includes(search) && !gr.vendor.includes(search)) return false;
      return true;
    });
  }, [data, search, statusFilter]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ رقم السند');
    });
  };

  const openCreate = () => {
    setSelectedPO('');
    setForm({
      gr_number: `GR-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(3, '0')}`,
      po_number: '', vendor: '', project: '',
      warehouse: '', receipt_date: new Date().toISOString().split('T')[0],
      received_by: '', items: [], total_amount: 0, status: 'partial', notes: '',
      quality_inspection: 'pending',
    });
    setShowModal(true);
  };

  const selectPO = (poNumber: string) => {
    setSelectedPO(poNumber);
    const po = mockPOs.find((p) => p.po_number === poNumber);
    if (po) {
      setForm((prev) => ({
        ...prev,
        po_number: po.po_number,
        vendor: po.vendor,
        project: po.project,
        items: po.items.map((it) => ({
          ...it,
          receivedQty: it.orderedQty,
          total: it.orderedQty * it.unitPrice,
        })),
        total_amount: po.total_amount,
      }));
    }
  };

  const updateReceivedQty = (index: number, qty: number) => {
    setForm((prev) => {
      const items = [...(prev.items || [])];
      const ordered = items[index].orderedQty;
      const finalQty = qty;
      // Warn if received exceeds ordered, but allow override
      if (qty > ordered) {
        toast.warning(`تحذير: الكمية المستلمة (${qty}) تتجاوز الكمية المطلوبة (${ordered}) للصنف "${items[index].itemName}"`, { duration: 5000 });
      }
      items[index] = { ...items[index], receivedQty: finalQty, total: finalQty * items[index].unitPrice };
      const total = items.reduce((s, i) => s + i.total, 0);
      return { ...prev, items, total_amount: total };
    });
  };

  const saveReceipt = () => {
    if (!form.po_number || !form.warehouse) return;
    const newGR: GoodsReceipt = {
      id: Date.now().toString(36),
      gr_number: form.gr_number || '',
      po_number: form.po_number || '',
      vendor: form.vendor || '',
      project: form.project || '',
      warehouse: form.warehouse || '',
      receipt_date: form.receipt_date || '',
      received_by: form.received_by || '',
      items: form.items || [],
      total_amount: form.total_amount || 0,
      status: form.status || 'partial',
      notes: form.notes || '',
      quality_inspection: form.quality_inspection || 'pending',
    };
    setReceipts((prev) => [newGR, ...prev]);
    toast.success('تم إنشاء سند الاستلام بنجاح');
    setShowModal(false);
  };

  // --- Wire: post goods receipt → create stock transactions ---
  function handlePost(gr: GoodsReceipt) {
    if (gr.status === 'posted') {
      toast.error('تم ترحيل السند مسبقاً');
      return;
    }
    // Create stock_transactions for each line item
    let created = 0;
    for (const item of gr.items) {
      if (item.receivedQty > 0) {
        stockTransactionStore.create({
          company_id: '',
          transaction_number: `STK-${gr.gr_number}-${Date.now().toString(36)}`,
          transaction_type: 'purchase_receipt',
          warehouse_id: gr.warehouse,
          project_id: gr.project,
          property_id: '',
          work_order_id: '',
          inventory_item_id: item.itemName,
          quantity: item.receivedQty,
          unit_cost: item.unitPrice,
          total_cost: item.total,
          transaction_date: gr.receipt_date,
          reference_type: 'goods_receipt',
          reference_id: gr.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);
        created++;
      }
    }

    // Update GR status to posted
    setReceipts((prev) => prev.map((r) => r.id === gr.id ? { ...r, status: 'posted' } : r));
    logAudit('post', 'goods_receipt', gr.id, gr.status, 'posted');

    // Generate JE: Debit Inventory (acc-7), Credit Supplier Payables (acc-8)
    if (gr.total_amount > 0) {
      generateJournalEntry(
        `استلام بضائع — ${gr.gr_number} من ${gr.vendor}`,
        'مشتريات',
        gr.id,
        [
          { account_id: 'acc-7', debit: gr.total_amount, credit: 0, description: 'مخزون — استلام بضائع' },
          { account_id: 'acc-8', debit: 0, credit: gr.total_amount, description: 'ذمم موردين — GR/IR' },
        ],
      );
    }

    // Update the related PO receipt_status
    const allPOs = purchaseOrderStore.getAll();
    const relatedPO = allPOs.find((po: any) => po.po_number === gr.po_number);
    if (relatedPO) {
      let allFullyReceived = true;
      for (const item of gr.items) {
        const poItem = relatedPO.items?.find((pi: any) => pi.itemName === item.itemName);
        const ordered = poItem?.quantity || item.orderedQty;
        if (item.receivedQty < ordered) { allFullyReceived = false; break; }
      }
      purchaseOrderStore.update(relatedPO.id, {
        receipt_status: allFullyReceived ? 'full' : 'partial',
      });
    }

    toast.success(`تم ترحيل السند وإنشاء ${created} حركة مخزنية`);
  }

  const statusLabel = (s: string) => s === 'full' ? 'مكتمل' : s === 'partial' ? 'جزئي' : s === 'posted' ? 'مرحل' : s;

  const handleDelete = () => {
    if (!deleteTarget) return;
    setReceipts((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success(`تم حذف سند الاستلام ${deleteTarget.gr_number} بنجاح`);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">سندات استلام البضائع</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} سند — إدارة استلام البضائع والمخازن
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          سند استلام جديد
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
              <SelectItem value="full">مكتمل</SelectItem>
              <SelectItem value="partial">جزئي</SelectItem>
              <SelectItem value="posted">مرحل</SelectItem>
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
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">رقم السند</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">أمر الشراء</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المورد</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المشروع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المستودع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">تاريخ الاستلام</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المبلغ</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الحالة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[120px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <PackageCheck className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا توجد سندات استلام</p>
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
                {filtered.map((gr) => (
                  <TableRow
                    key={gr.id}
                    className=""
                  >
                    <TableCell className="font-medium text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(gr.gr_number); }}
                            className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {gr.gr_number}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>اضغط للنسخ</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm font-mono text-gray-600">{gr.po_number}</TableCell>
                    <TableCell className="text-sm text-gray-800">{gr.vendor}</TableCell>
                    <TableCell className="text-sm text-gray-600">{gr.project}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Warehouse className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{gr.warehouse}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{gr.receipt_date}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-700">{fmt(gr.total_amount)}</TableCell>
                    <TableCell>
                      <StatusBadge status={gr.status} label={statusLabel(gr.status)} />
                    </TableCell>
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
                        {gr.status !== 'posted' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50" onClick={() => handlePost(gr)}>
                                <CheckCircle className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>ترحيل</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(gr)}
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
              هل أنت متأكد من حذف سند الاستلام <strong>{deleteTarget?.gr_number}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Goods Receipt Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>سند استلام جديد</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>رقم السند</Label>
              <Input value={form.gr_number} onChange={(e) => setForm({ ...form, gr_number: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>أمر الشراء *</Label>
              <Select value={selectedPO} onValueChange={selectPO}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر أمر الشراء..." />
                </SelectTrigger>
                <SelectContent>
                  {mockPOs.map((po) => (
                    <SelectItem key={po.po_number} value={po.po_number}>
                      {po.po_number} - {po.vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPO && (
              <>
                <div>
                  <Label>المورد</Label>
                  <Input value={form.vendor} disabled />
                </div>
                <div>
                  <Label>المشروع</Label>
                  <Input value={form.project} disabled />
                </div>
                <div>
                  <Label>تاريخ الاستلام</Label>
                  <Input type="date" value={form.receipt_date} onChange={(e) => setForm({ ...form, receipt_date: e.target.value })} />
                </div>
                <div>
                  <Label>المستودع *</Label>
                  <Select value={form.warehouse} onValueChange={(v) => setForm({ ...form, warehouse: v })}>
                    <SelectTrigger><SelectValue placeholder="اختر المستودع..." /></SelectTrigger>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>المستلم</Label>
                  <Input value={form.received_by} onChange={(e) => setForm({ ...form, received_by: e.target.value })} />
                </div>
                <div>
                  <Label>فحص الجودة</Label>
                  <Select value={form.quality_inspection || 'pending'} onValueChange={(v: 'pending' | 'passed' | 'failed') => setForm({ ...form, quality_inspection: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">بانتظار الفحص</SelectItem>
                      <SelectItem value="passed">✅ اجتاز الفحص</SelectItem>
                      <SelectItem value="failed">❌ لم يجتز الفحص</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label>ملاحظات</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </>
            )}
          </div>

          {selectedPO && (form.items || []).length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">الكميات المستلمة</h4>
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-right p-2">الصنف</th>
                      <th className="text-right p-2">الوصف</th>
                      <th className="text-center p-2 w-24">الكمية المطلوبة</th>
                      <th className="text-center p-2 w-24">الكمية المستلمة</th>
                      <th className="text-center p-2 w-20">الوحدة</th>
                      <th className="text-right p-2 w-32">سعر الوحدة</th>
                      <th className="text-right p-2 w-32">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.items || []).map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-1">{item.itemName}</td>
                        <td className="p-1 text-muted-foreground">{item.description}</td>
                        <td className="p-1 text-center">{item.orderedQty}</td>
                        <td className="p-1">
                          <Input
                            className="h-8 text-sm text-center"
                            type="number"
                            min={0}
                            max={item.orderedQty}
                            value={item.receivedQty}
                            onChange={(e) => updateReceivedQty(i, Number(e.target.value))}
                          />
                        </td>
                        <td className="p-1 text-center">{item.unit}</td>
                        <td className="p-1 text-right font-mono">{fmt(item.unitPrice)}</td>
                        <td className="p-1 text-right font-mono font-bold">{fmt(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <td colSpan={6} className="p-2 text-right font-semibold">إجمالي المستلم</td>
                      <td className="p-2 text-right font-bold font-mono">{fmt(form.total_amount || 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  الحالة: {statusLabel(form.status || 'partial')}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button onClick={saveReceipt} disabled={!selectedPO}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
