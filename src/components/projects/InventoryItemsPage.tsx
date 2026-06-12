import { formatQAR, formatQARInt, formatThousand } from '@/lib/format';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Filter, Pencil, Trash2, AlertTriangle, Package, X, TrendingDown,
  TrendingUp, BarChart3, DollarSign, Layers, Warehouse, Eye, Grid3X3, List,
  Download, Plus, ShoppingCart, ArrowUpDown, ArrowUp, ArrowDown, History,
  RotateCcw, Sparkles, Award, Activity, Clock, CheckCircle2, Users,
} from 'lucide-react';
import { inventoryStore, stockTransactionStore, warehouseStore } from '@/services/stores';

const fmt = formatQAR;
const fmtInt = formatQARInt;
const fmtNum = formatThousand;

const categoryLabels: Record<string, string> = {
  cement: 'أسمنت', steel: 'حديد', blocks: 'بلوك', wood: 'خشب',
  electrical: 'كهرباء', plumbing: 'سباكة', hvac: 'تكييف', finishing: 'تشطيبات',
  paint: 'دهانات', tools: 'أدوات', safety: 'سلامة', spare_parts: 'قطع غيار', other: 'أخرى',
};

const categoryConfig: Record<string, { dot: string; chip: string }> = {
  cement:  { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-700 ring-1 ring-gray-100' },
  steel:   { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  blocks:  { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  wood:    { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  electrical: { dot: 'bg-yellow-500', chip: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-100' },
  plumbing:   { dot: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100' },
  hvac:    { dot: 'bg-sky-500', chip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100' },
  finishing: { dot: 'bg-pink-500', chip: 'bg-pink-50 text-pink-700 ring-1 ring-pink-100' },
  paint:   { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  tools:   { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  safety:  { dot: 'bg-lime-500', chip: 'bg-lime-50 text-lime-700 ring-1 ring-lime-100' },
  spare_parts: { dot: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' },
  other:   { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};

const typeMeta: Record<string, { label: string; color: string }> = {
  purchase_receipt: { label: 'استلام', color: 'text-emerald-600' },
  transfer_in: { label: 'تحويل وارد', color: 'text-emerald-600' },
  return_from_project: { label: 'مرتجع', color: 'text-emerald-600' },
  issue_to_project: { label: 'صرف لمشروع', color: 'text-blue-600' },
  issue_to_maintenance: { label: 'صرف لصيانة', color: 'text-amber-600' },
  transfer_out: { label: 'تحويل صادر', color: 'text-orange-600' },
  adjustment: { label: 'تسوية', color: 'text-purple-600' },
  damage: { label: 'تالف', color: 'text-red-600' },
  write_off: { label: 'إعدام', color: 'text-red-600' },
};

function getCurrentStock(itemId: string): number {
  const txs = stockTransactionStore.getAll().filter((t: any) => t.inventory_item_id === itemId);
  let stock = 0;
  for (const tx of txs) {
    switch (tx.transaction_type) {
      case 'purchase_receipt': case 'transfer_in': case 'return_from_project': stock += tx.quantity; break;
      case 'issue_to_project': case 'issue_to_maintenance': case 'transfer_out': case 'damage': case 'write_off': stock -= tx.quantity; break;
      case 'adjustment': stock += tx.quantity; break;
    }
  }
  return stock;
}

function getWeightedAverageCost(itemId: string): number {
  const txs = stockTransactionStore.getAll().filter((t: any) => t.inventory_item_id === itemId && t.transaction_type === 'purchase_receipt');
  if (txs.length === 0) return 0;
  let totalQty = 0, totalCost = 0;
  for (const tx of txs) { totalQty += tx.quantity; totalCost += tx.quantity * tx.unit_cost; }
  return totalQty > 0 ? totalCost / totalQty : 0;
}

function getABCClass(itemId: string): string {
  const stock = getCurrentStock(itemId);
  const item = inventoryStore.getById(itemId) as any;
  const value = stock * (item?.average_cost || 0);
  if (value >= 50000) return 'A';
  if (value >= 10000) return 'B';
  return 'C';
}

const emptyForm = {
  item_code: '', name_ar: '', name_en: '', category: 'other' as const,
  unit_of_measure: '', warehouse_id: '', supplier_name: '',
  minimum_stock: 0, maximum_stock: 0, reorder_level: 0, average_cost: 0,
  status: 'active', notes: '',
};

const PAGE_SIZE = 10;
type SortField = 'item_code' | 'name_ar' | 'category' | 'stock' | 'stock_value' | 'status';
type SortDir = 'asc' | 'desc';

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    lime:   { iconBg: 'bg-lime-50', iconColor: 'text-lime-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    violet: { iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  };
  const a = accentMap[accent] || accentMap.slate;
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${a.iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
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

/* ── Inventory Card ── */
function InventoryCard({ it, onView, onEdit, onDelete, onCreatePR }: {
  it: any; onView: (i: any) => void; onEdit: (i: any) => void; onDelete: (i: any) => void; onCreatePR: (i: any) => void;
}) {
  const stock = getCurrentStock(it.id);
  const isLow = stock <= it.minimum_stock && stock > 0;
  const isOut = stock <= 0;
  const pct = it.maximum_stock > 0 ? Math.min(Math.round((stock / it.maximum_stock) * 100), 100) : 0;
  const abc = getABCClass(it.id);
  const catCfg = categoryConfig[it.category] || categoryConfig.other;
  const statusColor = isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] cursor-pointer" onClick={() => onView(it)}>
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl ${statusColor} opacity-60`} />

      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-lime-50 text-lime-600 ring-1 ring-lime-100 flex items-center justify-center shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{it.name_ar}</div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{it.item_code}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${catCfg.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${catCfg.dot}`} />
            {categoryLabels[it.category] || it.category}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><Warehouse className="h-3 w-3 text-gray-400" />{it.warehouse_id || '—'}</span>
        <span className="flex items-center gap-1.5"><Award className="h-3 w-3 text-gray-400" />ABC: {abc}</span>
      </div>

      <div className="bg-gray-50 rounded-lg p-3 mb-3.5">
        <div className="text-[10px] text-gray-400 mb-0.5">الرصيد الحالي</div>
        <div className={`text-lg font-bold tabular-nums ltr-only ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
          {stock} <span className="text-xs font-normal text-gray-500">{it.unit_of_measure}</span>
        </div>
      </div>

      <div className="mb-3.5">
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="font-semibold text-gray-600">نسبة المخزون</span>
          <span className="font-bold text-gray-800">{pct}%</span>
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-gradient-to-l from-lime-500 to-lime-400'}`}
            style={{ width: `${Math.abs(pct)}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">القيمة</div>
          <div className="text-xs font-bold text-gray-800 ltr-only tabular-nums">{fmt(stock * it.average_cost)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">التكلفة</div>
          <div className="text-xs font-bold text-gray-800 ltr-only tabular-nums">{fmt(it.average_cost)}</div>
        </div>
      </div>

      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => onEdit(it)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {isLow && (
          <button onClick={() => onCreatePR(it)} className="h-7 px-2 rounded-md text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1">
            <ShoppingCart className="h-3 w-3" /> طلب شراء
          </button>
        )}
        <button onClick={() => onDelete(it)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyItems({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <Package className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد أصناف</p>
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
export default function InventoryItemsPage() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('item_code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showTxHistory, setShowTxHistory] = useState(false);

  const items = useMemo(() => inventoryStore.getAll(), [refresh]);
  const warehouses = useMemo(() => warehouseStore.getAll(), [refresh]);

  const filtered = useMemo(() => {
    let result = items.filter((it: any) => {
      if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;
      if (search && !it.name_ar.includes(search) && !it.item_code.includes(search)) return false;
      return true;
    });
    result = [...result].sort((a: any, b: any) => {
      let va: any, vb: any;
      switch (sortField) {
        case 'item_code': va = a.item_code; vb = b.item_code; break;
        case 'name_ar': va = a.name_ar; vb = b.name_ar; break;
        case 'category': va = categoryLabels[a.category] || a.category; vb = categoryLabels[b.category] || b.category; break;
        case 'stock': va = getCurrentStock(a.id); vb = getCurrentStock(b.id); break;
        case 'stock_value': va = getCurrentStock(a.id) * a.average_cost; vb = getCurrentStock(b.id) * b.average_cost; break;
        case 'status': { const sa = getCurrentStock(a.id), sb = getCurrentStock(b.id); va = sa <= 0 ? 2 : sa <= a.minimum_stock ? 1 : 0; vb = sb <= 0 ? 2 : sb <= b.minimum_stock ? 1 : 0; break; }
        default: return 0;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb, 'ar') : vb.localeCompare(va, 'ar');
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return result;
  }, [items, search, categoryFilter, sortField, sortDir]);

  useEffect(() => { setPage(1); }, [search, categoryFilter, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalItems = items.length;
  const totalStockValue = useMemo(() => items.reduce((s, it: any) => s + getCurrentStock(it.id) * it.average_cost, 0), [items]);
  const lowStockCount = items.filter((it: any) => getCurrentStock(it.id) <= it.minimum_stock).length;
  const outOfStock = items.filter((it: any) => getCurrentStock(it.id) <= 0).length;
  const stockHealth = totalItems > 0 ? Math.round(((totalItems - lowStockCount) / totalItems) * 100) : 0;

  const getWarehouseName = (whId: string) => {
    if (!whId) return '—';
    const wh = warehouses.find((w: any) => w.id === whId);
    return wh?.warehouse_name || whId;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-40" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 inline ml-1" /> : <ArrowDown className="h-3 w-3 inline ml-1" />;
  };

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (it: any) => {
    setEditId(it.id);
    setForm({
      item_code: it.item_code, name_ar: it.name_ar, name_en: it.name_en || '',
      category: it.category, unit_of_measure: it.unit_of_measure,
      warehouse_id: it.warehouse_id || '', supplier_name: it.supplier_name || '',
      minimum_stock: it.minimum_stock, maximum_stock: it.maximum_stock,
      reorder_level: it.reorder_level, average_cost: it.average_cost,
      status: it.status || 'active', notes: it.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.item_code || !form.name_ar) return;
    const data = { company_id: '', ...form, minimum_stock: Number(form.minimum_stock), maximum_stock: Number(form.maximum_stock), reorder_level: Number(form.reorder_level), average_cost: Number(form.average_cost), default_supplier_id: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (editId) { inventoryStore.update(editId, data as any); toast.success(`تم تحديث ${form.name_ar}`); }
    else { inventoryStore.create(data as any); toast.success(`تم إضافة ${form.name_ar}`); }
    setModalOpen(false); setRefresh(r => r + 1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    inventoryStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.name_ar}`);
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  const handleExportCSV = () => {
    const headers = ['الكود', 'اسم الصنف', 'الفئة', 'الوحدة', 'المستودع', 'الرصيد', 'الحد الأدنى', 'الحد الأقصى', 'متوسط التكلفة', 'قيمة المخزون', 'تصنيف ABC', 'الحالة'];
    const rows = filtered.map((it: any) => {
      const stock = getCurrentStock(it.id);
      const abc = getABCClass(it.id);
      const isOut = stock <= 0; const isLow = stock <= it.minimum_stock && stock > 0;
      return [it.item_code, it.name_ar, categoryLabels[it.category] || it.category, it.unit_of_measure, getWarehouseName(it.warehouse_id), stock, it.minimum_stock, it.maximum_stock, it.average_cost, stock * it.average_cost, abc, isOut ? 'نفذ' : isLow ? 'منخفض' : 'متوفر'];
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `المخزون_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('تم تصدير الملف بنجاح');
  };

  const handleCreatePR = (item: any) => {
    navigate(`/procurement?tab=requests&item=${item.id}&name=${encodeURIComponent(item.name_ar)}`);
  };

  const getItemTransactions = (itemId: string) => {
    return stockTransactionStore.getAll()
      .filter((tx: any) => tx.inventory_item_id === itemId)
      .sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
  };

  const resetFilters = () => { setSearch(''); setCategoryFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-lime-500 to-lime-600 flex items-center justify-center shadow-sm">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-lime-600">المخزون</span>
              <span className="text-[13px] font-bold text-gray-900">{totalItems} صنف</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block" />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="بحث باسم الصنف أو الكود..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>قيمة المخزون:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{fmtInt(totalStockValue)}</span>
          </div>

          <div className="me-auto" />

          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'list', label: 'قائمة', icon: List },
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

          <Button onClick={handleExportCSV}
            className="h-8 px-3 gap-1.5 text-[11px] font-bold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </Button>

          <Button onClick={openCreate}
            className="h-8 px-3 gap-1.5 bg-lime-500 hover:bg-lime-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>إضافة صنف</span>
          </Button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الأصناف" value={totalItems} sub={`${lowStockCount} منخفض`} icon={Package} accent="slate" />
          <KpiCard label="قيمة المخزون" value={fmtInt(totalStockValue)} sub="التكلفة الإجمالية" icon={DollarSign} accent="lime" />
          <KpiCard label="نفاد المخزون" value={outOfStock} sub="أصناف بدون رصيد" icon={AlertTriangle} trend={{ val: Math.round((outOfStock / Math.max(1, totalItems)) * 100), dir: 'down' }} accent="rose" />
          <KpiCard label="صحة المخزون" value={`${stockHealth}%`} sub="أصناف بمستوى آمن" icon={Activity} accent="emerald" />
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">المواد والمخزون</h2>
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Content ── */}
        {filtered.length === 0 ? (
          <EmptyItems onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {paged.map((it: any) => (
              <InventoryCard key={it.id} it={it} onView={setViewItem} onEdit={openEdit} onDelete={setDeleteTarget} onCreatePR={handleCreatePR} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('item_code')}>الكود<SortIcon field="item_code" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('name_ar')}>اسم الصنف<SortIcon field="name_ar" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('category')}>الفئة<SortIcon field="category" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المستودع</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('stock')}>الرصيد<SortIcon field="stock" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">نسبة المخزون</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('stock_value')}>متوسط التكلفة<SortIcon field="stock_value" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">ABC</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right cursor-pointer select-none" onClick={() => handleSort('status')}>الحالة<SortIcon field="status" /></th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[130px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paged.map((it: any) => {
                    const stock = getCurrentStock(it.id);
                    const isLow = stock <= it.minimum_stock && stock > 0;
                    const isOut = stock <= 0;
                    const pct = it.maximum_stock > 0 ? Math.min(Math.round((stock / it.maximum_stock) * 100), 100) : 0;
                    const abc = getABCClass(it.id);
                    const wac = getWeightedAverageCost(it.id);
                    const displayCost = wac > 0 ? wac : it.average_cost;
                    const catCfg = categoryConfig[it.category] || categoryConfig.other;
                    return (
                      <tr key={it.id} className="cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => setViewItem(it)}>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-blue-600 ltr-only">{it.item_code}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-bold text-gray-900">{it.name_ar}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${catCfg.chip}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${catCfg.dot}`} />
                            {categoryLabels[it.category] || it.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-600">{getWarehouseName(it.warehouse_id)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-sm font-bold ltr-only tabular-nums ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>
                            {fmtNum(stock)}
                            <span className="text-[11px] font-normal text-gray-400">{it.unit_of_measure}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-1.5 rounded-full ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-gradient-to-r from-lime-500 to-lime-400'}`}
                                style={{ width: `${Math.abs(pct)}%` }} />
                            </div>
                            <span className="text-[10px] text-gray-400 ltr-only tabular-nums">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-gray-700 ltr-only">{fmt(displayCost)}</span>
                          {displayCost !== it.average_cost && <span className="text-[9px] text-gray-400 block">(ثابت: {fmt(it.average_cost)})</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center h-6 w-6 rounded text-[10px] font-bold ${
                            abc === 'A' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' :
                            abc === 'B' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' :
                            'bg-gray-100 text-gray-600 ring-1 ring-gray-200'
                          }`}>{abc}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${
                            isOut ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' :
                            isLow ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' :
                            'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            {isOut ? 'نفذ' : isLow ? 'منخفض' : 'متوفر'}
                          </span>
                        </td>
                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {isLow && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={() => handleCreatePR(it)} className="h-7 w-7 rounded-md text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors flex items-center justify-center">
                                    <ShoppingCart className="h-3.5 w-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>طلب شراء</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip><TooltipTrigger asChild><button onClick={() => setViewItem(it)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>عرض</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><button onClick={() => openEdit(it)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
                            <Tooltip><TooltipTrigger asChild><button onClick={() => setDeleteTarget(it)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between flex-wrap gap-2">
              <span className="text-[12px] text-gray-500">عرض {paged.length} من {filtered.length} صنف (صفحة {page} من {totalPages})</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-xs px-2 border-gray-200" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                  <span key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-300 mx-0.5">…</span>}
                    <Button variant={p === page ? 'default' : 'outline'} size="sm"
                      className={`h-7 w-7 text-xs p-0 ${p === page ? 'bg-lime-500 hover:bg-lime-600 text-white' : 'border-gray-200'}`}
                      onClick={() => setPage(p)}>{p}</Button>
                  </span>
                ))}
                <Button variant="outline" size="sm" className="h-7 text-xs px-2 border-gray-200" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Result meta ── */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {totalItems} صنف</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            مفلتر محلياً
          </span>
        </div>
      </div>

      {/* ── View Detail Dialog ── */}
      <Dialog open={!!viewItem} onOpenChange={() => { setViewItem(null); setShowTxHistory(false); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-lime-600" />تفاصيل الصنف</DialogTitle></DialogHeader>
          {viewItem && (() => {
            const stock = getCurrentStock(viewItem.id);
            const isOut = stock <= 0; const isLow = stock <= viewItem.minimum_stock && stock > 0;
            const abc = getABCClass(viewItem.id);
            const wac = getWeightedAverageCost(viewItem.id);
            const txns = getItemTransactions(viewItem.id);
            return (
              <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto">
                <div className="text-center py-3 bg-gray-50 rounded-xl">
                  <div className="text-3xl mb-1">📦</div>
                  <h2 className="text-lg font-bold text-gray-800">{viewItem.name_ar}</h2>
                  <p className="text-xs text-gray-400">{viewItem.item_code}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">الرصيد</div>
                    <div className={`text-lg font-bold ltr-only tabular-nums ${isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>{stock} {viewItem.unit_of_measure}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">القيمة</div>
                    <div className="text-lg font-bold ltr-only tabular-nums text-gray-900">{fmt(stock * viewItem.average_cost)}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">الحد الأدنى</div>
                    <div className="text-sm font-semibold ltr-only tabular-nums text-gray-700">{viewItem.minimum_stock}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400">نقطة إعادة الطلب</div>
                    <div className="text-sm font-semibold ltr-only tabular-nums text-gray-700">{viewItem.reorder_level}</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm"><span className="text-gray-400">متوسط التكلفة (ثابت)</span><span className="ltr-only font-medium tabular-nums">{fmt(viewItem.average_cost)}</span></div>
                  {wac > 0 && <div className="flex justify-between text-sm"><span className="text-gray-400">متوسط التكلفة (مرجح)</span><span className="ltr-only font-medium text-blue-600 tabular-nums">{fmt(wac)}</span></div>}
                  <div className="flex justify-between text-sm"><span className="text-gray-400">الفئة</span><span>{categoryLabels[viewItem.category] || viewItem.category}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">الوحدة</span><span>{viewItem.unit_of_measure}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">الحد الأقصى</span><span className="ltr-only tabular-nums">{viewItem.maximum_stock}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">المستودع</span><span>{getWarehouseName(viewItem.warehouse_id)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">المورد</span><span>{viewItem.supplier_name || '—'}</span></div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">تصنيف ABC</span>
                    <span className={`inline-flex items-center justify-center h-6 w-6 rounded text-[10px] font-bold ${abc === 'A' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : abc === 'B' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'}`}>{abc}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">الحالة</span>
                    <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${isOut ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : isLow ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isOut ? 'bg-rose-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      {viewItem.status === 'inactive' ? 'غير نشط' : isOut ? 'نفذ' : isLow ? 'منخفض' : 'متوفر'}
                    </span>
                  </div>
                  {viewItem.notes && <div className="flex justify-between text-sm"><span className="text-gray-400">ملاحظات</span><span className="text-xs text-gray-500 max-w-[200px] text-left">{viewItem.notes}</span></div>}
                </div>
                {/* Transaction History */}
                <div className="border-t pt-3">
                  <button type="button" onClick={() => setShowTxHistory(h => !h)} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-lime-600 transition-colors w-full">
                    <History className="h-4 w-4" />
                    سجل الحركات ({txns.length})
                    <span className={`text-xs transition-transform ${showTxHistory ? 'rotate-180' : ''}`}>▼</span>
                  </button>
                  {showTxHistory && (
                    <div className="mt-2 space-y-1.5 max-h-[200px] overflow-y-auto">
                      {txns.length === 0 ? <p className="text-xs text-gray-400 text-center py-3">لا توجد حركات سابقة</p> :
                        txns.slice(0, 15).map((tx: any) => (
                          <div key={tx.id} className="flex items-center justify-between text-xs py-1.5 px-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2">
                              <span className={typeMeta[tx.transaction_type]?.color || 'text-gray-500'}>{typeMeta[tx.transaction_type]?.label || tx.transaction_type}</span>
                              <span className="text-gray-400">{tx.transaction_date?.slice(0, 10)}</span>
                            </div>
                            <span className={`ltr-only font-medium tabular-nums ${['purchase_receipt', 'transfer_in', 'return_from_project', 'adjustment'].includes(tx.transaction_type) ? 'text-emerald-600' : 'text-red-600'}`}>
                              {['purchase_receipt', 'transfer_in', 'return_from_project', 'adjustment'].includes(tx.transaction_type) ? '+' : '-'}{tx.quantity} {viewItem.unit_of_measure}
                            </span>
                          </div>
                        ))}
                      {txns.length > 15 && <p className="text-[10px] text-gray-400 text-center">+ {txns.length - 15} حركة أخرى</p>}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1 border-gray-200" onClick={() => { setViewItem(null); openEdit(viewItem); }}><Pencil className="h-3.5 w-3.5 ml-1" />تعديل</Button>
                  {isLow && (
                    <Button size="sm" className="flex-1 bg-lime-500 hover:bg-lime-600 text-white" onClick={() => { setViewItem(null); handleCreatePR(viewItem); }}>
                      <ShoppingCart className="h-3.5 w-3.5 ml-1" />طلب شراء
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ── Create/Edit Dialog ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل صنف' : 'إضافة صنف'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div><Label>كود الصنف *</Label><Input value={form.item_code} onChange={e => setForm(f => ({ ...f, item_code: e.target.value }))} placeholder="MAT-CEM-001" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الاسم بالعربية *</Label><Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} /></div>
              <div><Label>الاسم بالإنجليزية</Label><Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الفئة</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>وحدة القياس</Label><Input value={form.unit_of_measure} onChange={e => setForm(f => ({ ...f, unit_of_measure: e.target.value }))} placeholder="كيس - طن - متر" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>المستودع</Label><Select value={form.warehouse_id} onValueChange={v => setForm(f => ({ ...f, warehouse_id: v }))}><SelectTrigger><SelectValue placeholder="اختر المستودع" /></SelectTrigger><SelectContent>{warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.warehouse_name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>المورد</Label><Input value={form.supplier_name} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} placeholder="اسم المورد" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="inactive">غير نشط</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الحد الأدنى</Label><Input type="number" value={form.minimum_stock} onChange={e => setForm(f => ({ ...f, minimum_stock: Number(e.target.value) }))} /></div>
              <div><Label>الحد الأقصى</Label><Input type="number" value={form.maximum_stock} onChange={e => setForm(f => ({ ...f, maximum_stock: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>نقطة إعادة الطلب</Label><Input type="number" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: Number(e.target.value) }))} /></div>
              <div><Label>متوسط التكلفة</Label><Input type="number" value={form.average_cost} onChange={e => setForm(f => ({ ...f, average_cost: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات إضافية..." rows={2} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)} className="border-gray-200">إلغاء</Button><Button onClick={handleSave} className="bg-lime-500 hover:bg-lime-600 text-white">{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

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
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف <strong className="text-gray-900">{deleteTarget.name_ar}</strong>؟</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}