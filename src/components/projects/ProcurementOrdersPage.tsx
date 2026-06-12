import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Search, Filter, Eye, Pencil, Trash2, Plus, FileText, Truck, AlertTriangle, X,
  ShoppingCart, TrendingUp, TrendingDown, Clock, CheckCircle2, RotateCcw, Sparkles,
  Send, Ban, DollarSign, Package, Building2, CalendarDays, ArrowRight,
} from 'lucide-react';
import { projectStore, purchaseOrderStore } from '@/services/stores';

const fmt = formatQAR;
const fmtInt = formatQARInt;

interface POItem {
  itemName: string; description: string; quantity: number; unit: string; unitPrice: number; total: number;
}
interface PurchaseOrder {
  id: string; po_number: string; vendor: string; project: string; order_date: string;
  expected_delivery: string; delivery_location: string; total_amount: number;
  receipt_status: string; payment_status: string; items: POItem[]; status: string; notes: string;
}

const statusConfig: Record<string, { dot: string; chip: string }> = {
  draft:       { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-700 ring-1 ring-gray-100' },
  approved:    { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  in_progress: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  completed:   { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  delivered:   { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
};

const receiptConfig: Record<string, { dot: string; chip: string }> = {
  none:    { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  partial: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  full:    { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
};

const paymentConfig: Record<string, { dot: string; chip: string }> = {
  unpaid:         { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
  partially_paid: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  paid:           { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
};

const receiptLabel = (s: string) => s === 'full' ? 'مكتمل' : s === 'partial' ? 'جزئي' : 'لم يستلم';
const paymentLabel = (s: string) => s === 'paid' ? 'مدفوع' : s === 'partially_paid' ? 'مدفوع جزئياً' : 'غير مدفوع';
const statusLabel = (s: string) =>
  s === 'draft' ? 'مسودة' : s === 'approved' ? 'معتمد' : s === 'in_progress' ? 'قيد التنفيذ' : s === 'completed' ? 'مكتمل' : s;

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    teal:   { iconBg: 'bg-teal-50', iconColor: 'text-teal-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    indigo: { iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
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

/* ── PO Card ── */
function POCard({ po, onDelete, onView, onEdit, onReceive }: {
  po: PurchaseOrder; onDelete: (p: PurchaseOrder) => void;
  onView: (p: PurchaseOrder) => void; onEdit: (p: PurchaseOrder) => void;
  onReceive: (p: PurchaseOrder) => void;
}) {
  const stat = statusConfig[po.status] || statusConfig.draft;
  const rec = receiptConfig[po.receipt_status] || receiptConfig.none;
  const pay = paymentConfig[po.payment_status] || paymentConfig.unpaid;
  const navigate = useNavigate();

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${
        po.status === 'completed' ? 'bg-emerald-500' :
        po.status === 'in_progress' ? 'bg-amber-500' :
        po.status === 'approved' ? 'bg-blue-500' : 'bg-gray-300'
      }`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-100 flex items-center justify-center shrink-0">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{po.po_number}</div>
            <div className="text-[11px] text-gray-500 mt-0.5 truncate">{po.vendor}</div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${stat.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
          {statusLabel(po.status)}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3 text-gray-400" />{po.project}</span>
        <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-gray-400" />{po.expected_delivery || '—'}</span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-3.5">
        <div className="text-[10px] text-gray-400 mb-0.5">المبلغ الإجمالي</div>
        <div className="text-lg font-bold text-gray-900 ltr-only tabular-nums">{fmt(po.total_amount)}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">الاستلام</div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${rec.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${rec.dot}`} />
            {receiptLabel(po.receipt_status)}
          </span>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">الدفع</div>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${pay.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${pay.dot}`} />
            {paymentLabel(po.payment_status)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => onView(po)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onEdit(po)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onReceive(po)} className="h-7 px-2 rounded-md text-[10px] font-bold text-teal-600 hover:bg-teal-50 transition-colors flex items-center gap-1">
          <Truck className="h-3 w-3" /> استلام
        </button>
        <button onClick={() => onDelete(po)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── PO List Row ── */
function POListRow({ po, onDelete, onView, onEdit, onReceive }: {
  po: PurchaseOrder; onDelete: (p: PurchaseOrder) => void;
  onView: (p: PurchaseOrder) => void; onEdit: (p: PurchaseOrder) => void;
  onReceive: (p: PurchaseOrder) => void;
}) {
  const stat = statusConfig[po.status] || statusConfig.draft;
  const rec = receiptConfig[po.receipt_status] || receiptConfig.none;
  const pay = paymentConfig[po.payment_status] || paymentConfig.unpaid;
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm">
      <div className="h-10 w-10 rounded-lg bg-teal-50 text-teal-600 ring-1 ring-teal-100 flex items-center justify-center shrink-0">
        <ShoppingCart className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{po.po_number}</div>
          <div className="text-[11px] text-gray-500 truncate">{po.vendor}</div>
        </div>
        <div className="text-xs text-gray-600 truncate">{po.project}</div>
        <div className="text-xs text-gray-600">{po.expected_delivery || '—'}</div>
        <div className="text-xs font-bold text-gray-800 ltr-only tabular-nums">{fmtInt(po.total_amount)}</div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 h-6 px-2 rounded text-[10px] font-bold ${rec.chip}`}>
            <span className={`h-1 w-1 rounded-full ${rec.dot}`} />{receiptLabel(po.receipt_status)}
          </span>
          <span className={`inline-flex items-center gap-1 h-6 px-2 rounded text-[10px] font-bold ${pay.chip}`}>
            <span className={`h-1 w-1 rounded-full ${pay.dot}`} />{paymentLabel(po.payment_status)}
          </span>
          <span className={`inline-flex items-center gap-1 h-6 px-2 rounded text-[10px] font-bold ${stat.chip}`}>
            <span className={`h-1 w-1 rounded-full ${stat.dot}`} />{statusLabel(po.status)}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => onView(po)} className="h-8 w-8 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-4 w-4" /></button>
        <button onClick={() => onEdit(po)} className="h-8 w-8 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => onReceive(po)} className="h-8 px-2.5 rounded-md text-[10px] font-bold text-teal-600 hover:bg-teal-50 transition-colors flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> استلام</button>
        <button onClick={() => onDelete(po)} className="h-8 w-8 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyPOs({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <ShoppingCart className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد أوامر شراء</p>
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
export default function ProcurementOrdersPage() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<PurchaseOrder | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [form, setForm] = useState<Partial<PurchaseOrder>>({
    po_number: '', vendor: '', project: '', order_date: '',
    expected_delivery: '', delivery_location: '', total_amount: 0,
    receipt_status: 'none', payment_status: 'unpaid',
    items: [], status: 'draft', notes: '',
  });
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);

  const data = useMemo(() => purchaseOrderStore.getAll() as PurchaseOrder[], [refresh]);

  const filtered = useMemo(() => {
    return data.filter((po) => {
      if (statusFilter !== 'all' && po.status !== statusFilter) return false;
      if (search && !po.po_number.includes(search) && !po.vendor.includes(search) && !po.project.includes(search)) return false;
      return true;
    });
  }, [data, search, statusFilter]);

  const pendingOrders = data.filter((po: any) => po.status === 'draft' || po.status === 'in_progress').length;
  const deliveredOrders = data.filter((po: any) => po.status === 'delivered' || po.status === 'completed').length;
  const totalPOValue = data.reduce((s: number, po: any) => s + (po.total_amount || 0), 0);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success('تم نسخ رقم الأمر'));
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
      } else setBudgetWarning(null);
    }
    if (editId) {
      purchaseOrderStore.update(editId, { ...form, items: form.items || [], total_amount: total } as any);
      toast.success('تم تحديث أمر الشراء بنجاح');
    } else {
      purchaseOrderStore.create({ ...form, total_amount: total, items: form.items || [] } as any);
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
      if (field === 'quantity' || field === 'unitPrice') item.total = item.quantity * item.unitPrice;
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

  const handleDelete = () => {
    if (!deleteTarget) return;
    purchaseOrderStore.remove(deleteTarget.id);
    toast.success(`تم حذف أمر الشراء ${deleteTarget.po_number} بنجاح`);
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-teal-600">أوامر الشراء</span>
              <span className="text-[13px] font-bold text-gray-900">{data.length} أمر</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block" />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في أوامر الشراء..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>القيمة الإجمالية:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{fmtInt(totalPOValue)}</span>
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
            className="h-8 px-3 gap-1.5 bg-teal-500 hover:bg-teal-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>أمر شراء جديد</span>
          </Button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الأوامر" value={data.length} sub={`${filtered.length} معروض`} icon={ShoppingCart} accent="slate" />
          <KpiCard label="معلقة" value={pendingOrders} sub="بانتظار التسليم" icon={Clock} trend={{ val: pendingOrders > 0 ? 5 : 0, dir: pendingOrders > 0 ? 'down' : 'up' }} accent="amber" />
          <KpiCard label="مسلمة" value={deliveredOrders} sub="تم استلامها" icon={Package} accent="emerald" />
          <KpiCard label="القيمة الإجمالية" value={fmtInt(totalPOValue)} sub="ر.ق" icon={DollarSign} accent="teal" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">أوامر الشراء</h2>
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
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="approved">معتمد</SelectItem>
                <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                <SelectItem value="completed">مكتمل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyPOs onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(po => (
              <POCard key={po.id} po={po} onDelete={setDeleteTarget} onView={setShowDetail} onEdit={openEdit} onReceive={(p) => navigate(`/procurement/receipts?poNumber=${p.po_number}`)} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(po => (
              <POListRow key={po.id} po={po} onDelete={setDeleteTarget} onView={setShowDetail} onEdit={openEdit} onReceive={(p) => navigate(`/procurement/receipts?poNumber=${p.po_number}`)} />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {data.length} أمر</span>
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
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف أمر الشراء <strong className="text-gray-900">{deleteTarget.po_number}</strong>؟</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create/Edit Modal ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل أمر شراء' : 'أمر شراء جديد'}</DialogTitle></DialogHeader>
          {budgetWarning && (
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 rounded-lg p-3 flex items-start gap-2 text-sm">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" /><span>{budgetWarning}</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div><Label>رقم الأمر</Label><Input value={form.po_number} onChange={(e) => setForm({ ...form, po_number: e.target.value })} /></div>
            <div><Label>المورد *</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
            <div><Label>المشروع *</Label><Input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} /></div>
            <div><Label>تاريخ الأمر</Label><Input type="date" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} /></div>
            <div><Label>التسليم المتوقع</Label><Input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} /></div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">مسودة</SelectItem><SelectItem value="approved">معتمد</SelectItem><SelectItem value="in_progress">قيد التنفيذ</SelectItem></SelectContent></Select></div>
            <div className="col-span-3"><Label>موقع التسليم</Label><Input value={form.delivery_location} onChange={(e) => setForm({ ...form, delivery_location: e.target.value })} /></div>
            <div className="col-span-3"><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">بنود الأمر</h4>
              <Button variant="outline" size="sm" onClick={addItem}>+ إضافة بند</Button>
            </div>
            {(!form.items || form.items.length === 0) ? (
              <div className="border rounded-lg p-6 text-center text-muted-foreground text-sm">لا توجد بنود. اضغط "إضافة بند" للإضافة.</div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-right p-2">الصنف</th><th className="text-right p-2">الوصف</th>
                      <th className="text-center p-2 w-24">الكمية</th><th className="text-center p-2 w-20">الوحدة</th>
                      <th className="text-right p-2 w-32">سعر الوحدة</th><th className="text-right p-2 w-32">الإجمالي</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.items || []).map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-1"><Input className="h-8 text-sm" value={item.itemName} onChange={(e) => updateItem(i, 'itemName', e.target.value)} /></td>
                        <td className="p-1"><Input className="h-8 text-sm" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} /></td>
                        <td className="p-1"><Input className="h-8 text-sm text-center" type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} /></td>
                        <td className="p-1"><Input className="h-8 text-sm" value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} /></td>
                        <td className="p-1"><Input className="h-8 text-sm text-right font-mono" type="number" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))} /></td>
                        <td className="p-1 text-right font-mono font-bold px-2">{fmt(item.total)}</td>
                        <td className="p-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => removeItem(i)}>✕</Button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr><td colSpan={5} className="p-2 text-right font-semibold">الإجمالي</td><td className="p-2 text-right font-bold font-mono">{fmt(form.total_amount || 0)}</td><td></td></tr>
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

      {/* ── Detail Modal ── */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>تفاصيل أمر الشراء {showDetail?.po_number}</DialogTitle></DialogHeader>
          {showDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground">المورد: </span><span className="font-medium">{showDetail.vendor}</span></div>
                <div><span className="text-muted-foreground">المشروع: </span><span className="font-medium">{showDetail.project}</span></div>
                <div><span className="text-muted-foreground">تاريخ الأمر: </span><span>{showDetail.order_date}</span></div>
                <div><span className="text-muted-foreground">التسليم المتوقع: </span><span>{showDetail.expected_delivery}</span></div>
                <div><span className="text-muted-foreground">موقع التسليم: </span><span>{showDetail.delivery_location}</span></div>
                <div><span className="text-muted-foreground">الحالة: </span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${(statusConfig[showDetail.status] || statusConfig.draft).chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${(statusConfig[showDetail.status] || statusConfig.draft).dot}`} />
                    {statusLabel(showDetail.status)}
                  </span>
                </div>
              </div>
              {showDetail.notes && (
                <div className="bg-muted rounded p-3 text-sm"><span className="text-muted-foreground">ملاحظات: </span>{showDetail.notes}</div>
              )}
              {showDetail.items && showDetail.items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">بنود الأمر</h4>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-right p-2">الصنف</th><th className="text-right p-2">الوصف</th>
                          <th className="text-center p-2 w-20">الكمية</th><th className="text-center p-2 w-20">الوحدة</th>
                          <th className="text-right p-2 w-28">سعر الوحدة</th><th className="text-right p-2 w-28">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {showDetail.items.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{item.itemName}</td><td className="p-2 text-gray-500">{item.description}</td>
                            <td className="p-2 text-center">{item.quantity}</td><td className="p-2 text-center">{item.unit}</td>
                            <td className="p-2 text-right font-mono">{fmt(item.unitPrice)}</td>
                            <td className="p-2 text-right font-mono font-bold">{fmt(item.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/50">
                        <tr><td colSpan={5} className="p-2 text-right font-semibold">الإجمالي</td><td className="p-2 text-right font-bold font-mono">{fmt(showDetail.total_amount)}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={() => setShowDetail(null)}>إغلاق</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}