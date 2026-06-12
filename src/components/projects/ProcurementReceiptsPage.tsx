import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Filter, Eye, Pencil, Trash2, Plus, FileText, Warehouse, PackageCheck, CheckCircle, X,
  ShoppingCart, TrendingUp, TrendingDown, Clock, RotateCcw, Sparkles, Truck, Building2,
  CalendarDays, DollarSign, AlertTriangle, Send, Ban, Package,
} from 'lucide-react';
import { stockTransactionStore, purchaseOrderStore, inventoryStore } from '@/services/stores';
import { logAudit, generateJournalEntry } from '@/utils/exportUtils';

const fmt = formatQAR;
const fmtInt = formatQARInt;

interface GRItem {
  itemName: string; description: string; orderedQty: number; receivedQty: number;
  unit: string; unitPrice: number; total: number;
}
interface GoodsReceipt {
  id: string; gr_number: string; po_number: string; vendor: string; project: string;
  warehouse: string; receipt_date: string; received_by: string; items: GRItem[];
  total_amount: number; status: string; notes: string;
  quality_inspection?: 'pending' | 'passed' | 'failed';
}

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
  { id: 'gr1', gr_number: 'GR-2024-001', po_number: 'PO-2024-001', vendor: 'شركة مواد البناء المتحدة',
    project: 'مشروع أبراج النخيل', warehouse: 'مستودع المشاريع - الرياض',
    receipt_date: '2024-06-10', received_by: 'م. فيصل الشهري',
    items: [
      { itemName: 'حديد تسليح', description: 'حديد تسليح 16 ملم', orderedQty: 500, receivedQty: 250, unit: 'طن', unitPrice: 1200, total: 300000 },
      { itemName: 'أسمنت', description: 'أسمنت بورتلاندي', orderedQty: 1000, receivedQty: 1000, unit: 'كيس', unitPrice: 15, total: 15000 },
      { itemName: 'طابوق', description: 'طابوق أحمر', orderedQty: 50000, receivedQty: 25000, unit: 'حبة', unitPrice: 4.7, total: 117500 },
    ],
    total_amount: 432500, status: 'partial', notes: 'استلام جزئي - باقي الشحنة الأسبوع القادم',
  },
  { id: 'gr2', gr_number: 'GR-2024-002', po_number: 'PO-2024-002', vendor: 'شركة الكهرباء السعودية',
    project: 'مشروع فلل الياسمين', warehouse: 'مستودع المشاريع - جدة',
    receipt_date: '2024-05-18', received_by: 'أ. سارة القحطاني',
    items: [
      { itemName: 'كابلات', description: 'كابل نحاس 4×16 ملم', orderedQty: 2000, receivedQty: 2000, unit: 'متر', unitPrice: 120, total: 240000 },
      { itemName: 'لوحات توزيع', description: 'لوحة توزيع رئيسية', orderedQty: 5, receivedQty: 5, unit: 'وحدة', unitPrice: 22000, total: 110000 },
    ],
    total_amount: 350000, status: 'full', notes: 'تم استلام كامل الشحنة',
  },
];

const statusConfig: Record<string, { dot: string; chip: string }> = {
  full:    { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  partial: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  posted:  { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  draft:   { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};

const statusLabel = (s: string) => s === 'full' ? 'مكتمل' : s === 'partial' ? 'جزئي' : s === 'posted' ? 'مرحل' : s;

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    orange: { iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
  };
  const a = accentMap[accent] || accentMap.slate;
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${a.iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {trend.dir === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend.val)}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── GR Card ── */
function GRCard({ gr, onDelete, onPost }: {
  gr: GoodsReceipt; onDelete: (g: GoodsReceipt) => void; onPost: (g: GoodsReceipt) => void;
}) {
  const stat = statusConfig[gr.status] || statusConfig.draft;
  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${
        gr.status === 'full' ? 'bg-emerald-500' : gr.status === 'partial' ? 'bg-amber-500' : gr.status === 'posted' ? 'bg-blue-500' : 'bg-gray-300'
      }`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100 flex items-center justify-center shrink-0">
            <PackageCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{gr.gr_number}</div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">{gr.vendor}</div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${stat.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
          {statusLabel(gr.status)}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><Truck className="h-3 w-3 text-gray-400" />{gr.po_number}</span>
        <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3 text-gray-400" />{gr.project}</span>
        <span className="flex items-center gap-1.5"><Warehouse className="h-3 w-3 text-gray-400" />{gr.warehouse}</span>
        <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-gray-400" />{gr.receipt_date}</span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-3.5">
        <div className="text-[10px] text-gray-400 mb-0.5">المبلغ المستلم</div>
        <div className="text-lg font-bold text-gray-900 ltr-only tabular-nums">{fmt(gr.total_amount)}</div>
      </div>

      {gr.items && gr.items.length > 0 && (
        <div className="text-[11px] text-gray-500 mb-3.5 flex items-center gap-1.5">
          <Package className="h-3 w-3 text-gray-400" />
          {gr.items.length} صنف · {gr.items.reduce((s, i) => s + i.receivedQty, 0)} وحدة مستلمة
        </div>
      )}

      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {gr.status !== 'posted' && (
          <button onClick={() => onPost(gr)} className="h-7 px-2.5 rounded-md text-[10px] font-bold text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> ترحيل
          </button>
        )}
        <button onClick={() => onDelete(gr)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── GR List Row ── */
function GRListRow({ gr, onDelete, onPost }: {
  gr: GoodsReceipt; onDelete: (g: GoodsReceipt) => void; onPost: (g: GoodsReceipt) => void;
}) {
  const stat = statusConfig[gr.status] || statusConfig.draft;
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm">
      <div className="h-10 w-10 rounded-lg bg-orange-50 text-orange-600 ring-1 ring-orange-100 flex items-center justify-center shrink-0">
        <PackageCheck className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{gr.gr_number}</div>
          <div className="text-[11px] text-gray-500 truncate">{gr.vendor}</div>
        </div>
        <div className="text-xs text-gray-600 truncate">{gr.po_number}</div>
        <div className="text-xs text-gray-600 truncate">{gr.warehouse}</div>
        <div className="text-xs text-gray-600">{gr.receipt_date}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-800 ltr-only tabular-nums">{fmtInt(gr.total_amount)}</span>
          <span className={`inline-flex items-center gap-1 h-6 px-2 rounded text-[10px] font-bold ${stat.chip}`}>
            <span className={`h-1 w-1 rounded-full ${stat.dot}`} />{statusLabel(gr.status)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <button className="h-8 w-8 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-4 w-4" /></button>
        <button className="h-8 w-8 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
        {gr.status !== 'posted' && (
          <button onClick={() => onPost(gr)} className="h-8 px-2.5 rounded-md text-[10px] font-bold text-orange-600 hover:bg-orange-50 transition-colors flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> ترحيل</button>
        )}
        <button onClick={() => onDelete(gr)} className="h-8 w-8 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyGRs({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <PackageCheck className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد سندات استلام</p>
        <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج تطابق فلاتر البحث</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1">
        <RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ProcurementReceiptsPage() {
  const { t, dir } = useLocale();
  const [receipts, setReceipts] = useState<GoodsReceipt[]>(initialGRs);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<GoodsReceipt | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [form, setForm] = useState<Partial<GoodsReceipt>>({
    gr_number: '', po_number: '', vendor: '', project: '',
    warehouse: '', receipt_date: new Date().toISOString().split('T')[0],
    received_by: '', items: [], total_amount: 0, status: 'partial', notes: '',
    quality_inspection: 'pending',
  });

  const data = useMemo(() => receipts, [receipts]);

  const filtered = useMemo(() => {
    return data.filter((gr) => {
      if (statusFilter !== 'all' && gr.status !== statusFilter) return false;
      if (search && !gr.gr_number.includes(search) && !gr.po_number.includes(search) && !gr.vendor.includes(search)) return false;
      return true;
    });
  }, [data, search, statusFilter]);

  const receiptCount = data.length;
  const receivedValue = data.reduce((s: number, gr: any) => s + (gr.total_amount || 0), 0);
  const pendingReceipts = data.filter((gr: any) => gr.status === 'draft' || gr.status === 'in_transit').length;
  const completedReceipts = data.filter((gr: any) => gr.status === 'completed' || gr.status === 'received').length;

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
        po_number: po.po_number, vendor: po.vendor, project: po.project,
        items: po.items.map((it) => ({ ...it, receivedQty: it.orderedQty, total: it.orderedQty * it.unitPrice })),
        total_amount: po.total_amount,
      }));
    }
  };

  const updateReceivedQty = (index: number, qty: number) => {
    setForm((prev) => {
      const items = [...(prev.items || [])];
      const ordered = items[index].orderedQty;
      if (qty > ordered) {
        toast.warning(`تحذير: الكمية المستلمة (${qty}) تتجاوز الكمية المطلوبة (${ordered}) للصنف "${items[index].itemName}"`, { duration: 5000 });
      }
      items[index] = { ...items[index], receivedQty: qty, total: qty * items[index].unitPrice };
      const total = items.reduce((s, i) => s + i.total, 0);
      return { ...prev, items, total_amount: total };
    });
  };

  const saveReceipt = () => {
    if (!form.po_number || !form.warehouse) return;
    const newGR: GoodsReceipt = {
      id: Date.now().toString(36), gr_number: form.gr_number || '',
      po_number: form.po_number || '', vendor: form.vendor || '', project: form.project || '',
      warehouse: form.warehouse || '', receipt_date: form.receipt_date || '',
      received_by: form.received_by || '', items: form.items || [],
      total_amount: form.total_amount || 0, status: form.status || 'partial',
      notes: form.notes || '', quality_inspection: form.quality_inspection || 'pending',
    };
    setReceipts((prev) => [newGR, ...prev]);
    toast.success('تم إنشاء سند الاستلام بنجاح');
    setShowModal(false);
  };

  function handlePost(gr: GoodsReceipt) {
    if (gr.status === 'posted') { toast.error('تم ترحيل السند مسبقاً'); return; }
    const allInventory = inventoryStore.getAll();
    function findItemId(itemName: string): string {
      const match = allInventory.find((inv: any) =>
        inv.name_ar.includes(itemName) || itemName.includes(inv.name_ar) ||
        inv.name_en?.toLowerCase().includes(itemName.toLowerCase()) ||
        itemName.toLowerCase().includes(inv.name_en?.toLowerCase() || '')
      );
      return match?.id || itemName;
    }
    let created = 0;
    for (const item of gr.items) {
      if (item.receivedQty > 0) {
        stockTransactionStore.create({
          company_id: '', transaction_number: `STK-${gr.gr_number}-${Date.now().toString(36)}`,
          transaction_type: 'purchase_receipt', warehouse_id: gr.warehouse, project_id: gr.project,
          property_id: '', work_order_id: '', inventory_item_id: findItemId(item.itemName),
          quantity: item.receivedQty, unit_cost: item.unitPrice, total_cost: item.total,
          transaction_date: gr.receipt_date, reference_type: 'goods_receipt', reference_id: gr.id,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        } as any);
        created++;
      }
    }
    setReceipts((prev) => prev.map((r) => r.id === gr.id ? { ...r, status: 'posted' } : r));
    logAudit('post', 'goods_receipt', gr.id, gr.status, 'posted');
    try {
      const existingAssets = JSON.parse(localStorage.getItem('erp_assets') || '[]');
      const assetCategories = ['hvac', 'plumbing', 'electrical', 'mechanical', 'fire_safety', 'elevator'];
      for (const item of gr.items) {
        const itemName = (item.itemName || '').toLowerCase();
        if (assetCategories.some(cat => itemName.includes(cat) || itemName.includes('وحدة') || itemName.includes('مضخة') || itemName.includes('مولد'))) {
          existingAssets.push({
            id: `a-${gr.id}-${item.itemName.slice(0, 3)}`,
            asset_code: `AST-${Date.now().toString(36).toUpperCase()}`,
            asset_name: item.itemName,
            category: assetCategories.find(cat => itemName.includes(cat)) || 'mechanical',
            property_name: gr.project, manufacturer: gr.vendor, model: '-',
            serial_number: '-', status: 'operational', service_frequency_months: 6,
            last_service_date: gr.receipt_date,
          });
        }
      }
      localStorage.setItem('erp_assets', JSON.stringify(existingAssets));
    } catch {}
    if (gr.total_amount > 0) {
      generateJournalEntry(`استلام بضائع — ${gr.gr_number} من ${gr.vendor}`, 'مشتريات', gr.id, [
        { account_id: 'acc-7', debit: gr.total_amount, credit: 0, description: 'مخزون — استلام بضائع' },
        { account_id: 'acc-8', debit: 0, credit: gr.total_amount, description: 'ذمم موردين — GR/IR' },
      ]);
    }
    const allPOs = purchaseOrderStore.getAll();
    const relatedPO = allPOs.find((po: any) => po.po_number === gr.po_number);
    if (relatedPO) {
      let allFullyReceived = true;
      for (const item of gr.items) {
        const poItem = relatedPO.items?.find((pi: any) => pi.itemName === item.itemName);
        const ordered = poItem?.quantity || item.orderedQty;
        if (item.receivedQty < ordered) { allFullyReceived = false; break; }
      }
      purchaseOrderStore.update(relatedPO.id, { receipt_status: allFullyReceived ? 'full' : 'partial' });
    }
    toast.success(`تم ترحيل السند وإنشاء ${created} حركة مخزنية`);
  }

  const handleDelete = () => {
    if (!deleteTarget) return;
    setReceipts((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success(`تم حذف سند الاستلام ${deleteTarget.gr_number} بنجاح`);
    setDeleteTarget(null);
  };

  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-sm">
              <PackageCheck className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-orange-600">استلام البضائع</span>
              <span className="text-[13px] font-bold text-gray-900">{receiptCount} سند</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block" />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في سندات الاستلام..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>القيمة المستلمة:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{fmtInt(receivedValue)}</span>
          </div>

          <div className="me-auto" />

          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'list', label: 'قائمة', icon: FileText },
              { key: 'grid', label: 'بطاقات', icon: Sparkles },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} role="tab" aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}>
                <v.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          <Button onClick={openCreate}
            className="h-8 px-3 gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>سند استلام جديد</span>
          </Button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي السندات" value={receiptCount} sub={`${filtered.length} معروض`} icon={PackageCheck} accent="slate" />
          <KpiCard label="معلقة" value={pendingReceipts} sub="بانتظار الاستلام" icon={Clock} trend={{ val: pendingReceipts > 0 ? 3 : 0, dir: pendingReceipts > 0 ? 'down' : 'up' }} accent="amber" />
          <KpiCard label="مكتملة" value={completedReceipts} sub="تم استلامها" icon={Package} accent="emerald" />
          <KpiCard label="القيمة المستلمة" value={fmtInt(receivedValue)} sub="ر.ق" icon={DollarSign} accent="orange" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">سندات استلام البضائع</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}
                className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                <RotateCcw className="h-3.5 w-3.5" /> إعادة
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="full">مكتمل</SelectItem>
                <SelectItem value="partial">جزئي</SelectItem>
                <SelectItem value="posted">مرحل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyGRs onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(gr => (
              <GRCard key={gr.id} gr={gr} onDelete={setDeleteTarget} onPost={handlePost} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(gr => (
              <GRListRow key={gr.id} gr={gr} onDelete={setDeleteTarget} onPost={handlePost} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {receiptCount} سند</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            مفلتر محلياً
          </span>
        </div>
      </div>

      {/* ── Delete Dialog ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3>
                <p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف سند الاستلام <strong className="text-gray-900">{deleteTarget.gr_number}</strong>؟</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create GR Modal ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>سند استلام جديد</DialogTitle></DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            <div><Label>رقم السند</Label><Input value={form.gr_number} onChange={(e) => setForm({ ...form, gr_number: e.target.value })} /></div>
            <div className="col-span-2"><Label>أمر الشراء *</Label><Select value={selectedPO} onValueChange={selectPO}><SelectTrigger><SelectValue placeholder="اختر أمر الشراء..." /></SelectTrigger><SelectContent>{mockPOs.map((po) => (<SelectItem key={po.po_number} value={po.po_number}>{po.po_number} - {po.vendor}</SelectItem>))}</SelectContent></Select></div>
            {selectedPO && (
              <>
                <div><Label>المورد</Label><Input value={form.vendor} disabled /></div>
                <div><Label>المشروع</Label><Input value={form.project} disabled /></div>
                <div><Label>تاريخ الاستلام</Label><Input type="date" value={form.receipt_date} onChange={(e) => setForm({ ...form, receipt_date: e.target.value })} /></div>
                <div><Label>المستودع *</Label><Select value={form.warehouse} onValueChange={(v) => setForm({ ...form, warehouse: v })}><SelectTrigger><SelectValue placeholder="اختر المستودع..." /></SelectTrigger><SelectContent>{warehouses.map((w) => (<SelectItem key={w} value={w}>{w}</SelectItem>))}</SelectContent></Select></div>
                <div><Label>المستلم</Label><Input value={form.received_by} onChange={(e) => setForm({ ...form, received_by: e.target.value })} /></div>
                <div><Label>فحص الجودة</Label><Select value={form.quality_inspection || 'pending'} onValueChange={(v: 'pending' | 'passed' | 'failed') => setForm({ ...form, quality_inspection: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pending">بانتظار الفحص</SelectItem><SelectItem value="passed">اجتاز الفحص</SelectItem><SelectItem value="failed">لم يجتز الفحص</SelectItem></SelectContent></Select></div>
                <div className="col-span-3"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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
                      <th className="text-right p-2">الصنف</th><th className="text-right p-2">الوصف</th>
                      <th className="text-center p-2 w-24">الكمية المطلوبة</th><th className="text-center p-2 w-24">الكمية المستلمة</th>
                      <th className="text-center p-2 w-20">الوحدة</th><th className="text-right p-2 w-32">سعر الوحدة</th>
                      <th className="text-right p-2 w-32">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.items || []).map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-1">{item.itemName}</td>
                        <td className="p-1 text-muted-foreground">{item.description}</td>
                        <td className="p-1 text-center">{item.orderedQty}</td>
                        <td className="p-1"><Input className="h-8 text-sm text-center" type="number" min={0} value={item.receivedQty} onChange={(e) => updateReceivedQty(i, Number(e.target.value))} /></td>
                        <td className="p-1 text-center">{item.unit}</td>
                        <td className="p-1 text-right font-mono">{fmt(item.unitPrice)}</td>
                        <td className="p-1 text-right font-mono font-bold">{fmt(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr><td colSpan={6} className="p-2 text-right font-semibold">إجمالي المستلم</td><td className="p-2 text-right font-bold font-mono">{fmt(form.total_amount || 0)}</td></tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <PackageCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">الحالة: {statusLabel(form.status || 'partial')}</span>
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