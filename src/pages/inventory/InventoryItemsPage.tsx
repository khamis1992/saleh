import { formatQAR, formatQARInt, formatThousand } from '@/lib/format';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, Filter, Pencil, Trash2, AlertTriangle, Package, X, TrendingDown,
  TrendingUp, BarChart3, DollarSign, Layers, Warehouse, Eye, Grid3X3, List,
  Download, Plus, ShoppingCart, ArrowUpDown, ArrowUp, ArrowDown, History,
  RotateCcw,
} from 'lucide-react';
import { inventoryStore, stockTransactionStore, warehouseStore } from '@/services/stores';
import { KpiCard } from '@/components/shared/DesignSystem';

const categoryLabels: Record<string, string> = {
  cement: 'أسمنت', steel: 'حديد', blocks: 'بلوك', wood: 'خشب',
  electrical: 'كهرباء', plumbing: 'سباكة', hvac: 'تكييف', finishing: 'تشطيبات',
  paint: 'دهانات', tools: 'أدوات', safety: 'سلامة', spare_parts: 'قطع غيار', other: 'أخرى',
};

const categoryIcons: Record<string, string> = {
  cement: '🧱', steel: '🔩', blocks: '🧊', wood: '🪵', electrical: '⚡',
  plumbing: '🔧', hvac: '❄️', finishing: '🎨', paint: '🖌️', tools: '🛠️',
  safety: '🦺', spare_parts: '⚙️', other: '📦',
};

function getCurrentStock(itemId: string): number {
  const txs = stockTransactionStore.getAll().filter((t: any) => t.inventory_item_id === itemId);
  let stock = 0;
  for (const tx of txs) {
    switch (tx.transaction_type) {
      case 'purchase_receipt': case 'transfer_in': case 'return_from_project':
        stock += tx.quantity; break;
      case 'issue_to_project': case 'issue_to_maintenance': case 'transfer_out': case 'damage': case 'write_off':
        stock -= tx.quantity; break;
      case 'adjustment': stock += tx.quantity; break;
    }
  }
  return stock;
}

function getWeightedAverageCost(itemId: string): number {
  const txs = stockTransactionStore.getAll().filter((t: any) =>
    t.inventory_item_id === itemId && t.transaction_type === 'purchase_receipt'
  );
  if (txs.length === 0) return 0;
  let totalQty = 0, totalCost = 0;
  for (const tx of txs) {
    totalQty += tx.quantity;
    totalCost += tx.quantity * tx.unit_cost;
  }
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

export default function InventoryItemsPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('item_code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showTxHistory, setShowTxHistory] = useState(false);

  const items = useMemo(() => {
    return inventoryStore.getAll();
  }, [refresh]);

  const warehouses = useMemo(() => warehouseStore.getAll(), [refresh]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, [refresh]);

  const filtered = useMemo(() => {
    let result = items.filter((it: any) => {
      if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;
      if (search && !it.name_ar.includes(search) && !it.item_code.includes(search)) return false;
      return true;
    });

    // Sort
    result = [...result].sort((a: any, b: any) => {
      let va: any, vb: any;
      switch (sortField) {
        case 'item_code': va = a.item_code; vb = b.item_code; break;
        case 'name_ar': va = a.name_ar; vb = b.name_ar; break;
        case 'category': va = categoryLabels[a.category] || a.category; vb = categoryLabels[b.category] || b.category; break;
        case 'stock': va = getCurrentStock(a.id); vb = getCurrentStock(b.id); break;
        case 'stock_value': va = getCurrentStock(a.id) * a.average_cost; vb = getCurrentStock(b.id) * b.average_cost; break;
        case 'status': {
          const sa = getCurrentStock(a.id); const sb = getCurrentStock(b.id);
          va = sa <= 0 ? 2 : sa <= a.minimum_stock ? 1 : 0;
          vb = sb <= 0 ? 2 : sb <= b.minimum_stock ? 1 : 0;
          break;
        }
        default: return 0;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb, 'ar') : vb.localeCompare(va, 'ar');
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return result;
  }, [items, search, categoryFilter, sortField, sortDir]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, categoryFilter, sortField, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fmt = (v: number) => formatQAR(v);
  const fmtNum = (v: number) => formatThousand(v);

  // KPI stats
  const totalItems = items.length;
  const totalStockValue = useMemo(() =>
    items.reduce((s, it: any) => s + getCurrentStock(it.id) * it.average_cost, 0),
    [items]);
  const lowStockCount = items.filter((it: any) => getCurrentStock(it.id) <= it.minimum_stock).length;
  const outOfStock = items.filter((it: any) => getCurrentStock(it.id) <= 0).length;
  const stockHealth = totalItems > 0 ? Math.round(((totalItems - lowStockCount) / totalItems) * 100) : 0;

  // Warehouse name lookup
  const getWarehouseName = (whId: string) => {
    if (!whId) return '—';
    const wh = warehouses.find((w: any) => w.id === whId);
    return wh?.warehouse_name || whId;
  };

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
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
    const data = {
      company_id: '', ...form,
      minimum_stock: Number(form.minimum_stock), maximum_stock: Number(form.maximum_stock),
      reorder_level: Number(form.reorder_level), average_cost: Number(form.average_cost),
      default_supplier_id: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
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

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['الكود', 'اسم الصنف', 'الفئة', 'الوحدة', 'المستودع', 'الرصيد', 'الحد الأدنى', 'الحد الأقصى', 'متوسط التكلفة', 'قيمة المخزون', 'تصنيف ABC', 'الحالة'];
    const rows = filtered.map((it: any) => {
      const stock = getCurrentStock(it.id);
      const abc = getABCClass(it.id);
      const isOut = stock <= 0; const isLow = stock <= it.minimum_stock && stock > 0;
      return [
        it.item_code, it.name_ar, categoryLabels[it.category] || it.category,
        it.unit_of_measure, getWarehouseName(it.warehouse_id), stock,
        it.minimum_stock, it.maximum_stock, it.average_cost, stock * it.average_cost,
        abc, isOut ? 'نفذ' : isLow ? 'منخفض' : 'متوفر',
      ];
    });
    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `المخزون_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('تم تصدير الملف بنجاح');
  };

  // Create purchase request from low stock item
  const handleCreatePR = (item: any) => {
    navigate(`/procurement?tab=requests&item=${item.id}&name=${encodeURIComponent(item.name_ar)}`);
  };

  // Get transaction history for an item
  const getItemTransactions = (itemId: string) => {
    return stockTransactionStore.getAll()
      .filter((tx: any) => tx.inventory_item_id === itemId)
      .sort((a: any, b: any) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());
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

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="المواد" value={totalItems} subtitle={`${lowStockCount} منخفض`} icon={Package} moduleOverride="procurement" />
        <KpiCard title="قيمة المخزون" value={formatQARInt(totalStockValue)} subtitle="التكلفة الإجمالية" icon={DollarSign} moduleOverride="procurement" />
        <KpiCard title="نفاد المخزون" value={outOfStock} subtitle="أصناف بدون رصيد" icon={AlertTriangle} trend={outOfStock > 0 ? { value: outOfStock, label: outOfStock > 5 ? 'حرج' : 'انتباه' } : undefined} moduleOverride="procurement" />
        <KpiCard title="صحة المخزون" value={`${stockHealth}%`} subtitle="أصناف بمستوى آمن" icon={BarChart3} moduleOverride="procurement" />
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">المواد والمخزون</h1>
          <p className="text-xs text-gray-500 mt-0.5">{totalItems} صنف — {lowStockCount} منخفض</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5 h-9 text-sm rounded-lg">
            <Download className="h-4 w-4" /> تصدير CSV
          </Button>
          <div className="bg-white rounded-lg border border-gray-200 flex p-0.5">
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:text-gray-600'}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:text-gray-600'}`}><Grid3X3 className="h-4 w-4" /></button>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20">
            <Plus className="h-4 w-4" /> إضافة صنف
          </Button>
        </div>
      </div>

      {/* Manual KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"><Layers className="h-4 w-4 text-blue-600" /></div><span className="text-xs text-gray-500">إجمالي الأصناف</span></div>
          <div className="text-2xl font-bold text-gray-800 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{totalItems}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><DollarSign className="h-4 w-4 text-emerald-600" /></div><span className="text-xs text-gray-500">قيمة المخزون</span></div>
          <div className="text-2xl font-bold text-gray-800 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(totalStockValue)}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">صحة المخزون {stockHealth}%</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-amber-600" /></div><span className="text-xs text-gray-500">مخزون منخفض</span></div>
          <div className="text-2xl font-bold text-amber-600 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{lowStockCount}</div>
          <div className="text-[10px] text-amber-500 mt-0.5">يحتاج إعادة طلب</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center"><TrendingDown className="h-4 w-4 text-red-600" /></div><span className="text-xs text-gray-500">غير متوفر</span></div>
          <div className="text-2xl font-bold text-red-600 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{outOfStock}</div>
          <div className="text-[10px] text-red-500 mt-0.5">نفذ من المخزون</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="بحث باسم الصنف أو الكود..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300" />
            {search && <button onClick={() => setSearch('')} className="absolute left-3 top-2.5"><X className="h-4 w-4 text-gray-300 hover:text-gray-500" /></button>}
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200"><Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="الفئة" /></SelectTrigger>
            <SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
          </Select>
          {search && <span className="text-xs text-gray-400">{filtered.length} نتيجة</span>}
        </div>
      </div>

      {/* Content: Table or Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <Package className="h-14 w-14 mx-auto text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-500">لا توجد أصناف</p>
          <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p>
          <Button variant="outline" size="sm" onClick={() => { setSearch(''); setCategoryFilter('all'); }} className="h-8 text-xs rounded-lg mt-3">مسح الفلاتر</Button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {paged.map((it: any) => {
            const stock = getCurrentStock(it.id);
            const isLow = stock <= it.minimum_stock && stock > 0;
            const isOut = stock <= 0;
            const pct = it.maximum_stock > 0 ? Math.min(Math.round((stock / it.maximum_stock) * 100), 100) : 0;
            const abc = getABCClass(it.id);
            const wac = getWeightedAverageCost(it.id);
            return (
              <div key={it.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setViewItem(it)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400 font-mono ltr-only">{it.item_code}</span>
                  <div className="flex items-center gap-1">
                    {abc === 'A' && <Badge className="h-4 text-[9px] bg-red-100 text-red-600 border-red-200 px-1">A</Badge>}
                    {abc === 'B' && <Badge className="h-4 text-[9px] bg-amber-100 text-amber-600 border-amber-200 px-1">B</Badge>}
                    {abc === 'C' && <Badge className="h-4 text-[9px] bg-gray-100 text-gray-500 border-gray-200 px-1">C</Badge>}
                    <span className="text-lg">{categoryIcons[it.category] || '📦'}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">{it.name_ar}</h3>
                <p className="text-[11px] text-gray-400 mb-3">{categoryLabels[it.category] || it.category} · {it.unit_of_measure}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-gray-400">الرصيد</span><span className={`ltr-only font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{stock}</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : pct >= 70 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Math.abs(pct)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px]"><span className="text-gray-400">القيمة</span><span className="ltr-only font-medium text-gray-600" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(stock * it.average_cost)}</span></div>
                  {wac > 0 && wac !== it.average_cost && (
                    <div className="flex justify-between text-[10px]"><span className="text-gray-400">متوسط التكلفة</span><span className="ltr-only text-gray-500" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(wac)}</span></div>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
                  {isLow && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-blue-600 hover:text-blue-700" onClick={(e) => { e.stopPropagation(); handleCreatePR(it); }}>
                      <ShoppingCart className="h-3 w-3 ml-1" />طلب شراء
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500 hover:text-blue-600" onClick={(e) => { e.stopPropagation(); openEdit(it); }}><Pencil className="h-3 w-3 ml-1" />تعديل</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500 hover:text-red-600" onClick={(e) => { e.stopPropagation(); setDeleteTarget(it); }}><Trash2 className="h-3 w-3 ml-1" />حذف</Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('item_code')}>الكود<SortIcon field="item_code" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('name_ar')}>اسم الصنف<SortIcon field="name_ar" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('category')}>الفئة<SortIcon field="category" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المستودع</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('stock')}>الرصيد<SortIcon field="stock" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9">نسبة المخزون</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('stock_value')}>متوسط التكلفة<SortIcon field="stock_value" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9">ABC</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('status')}>الحالة<SortIcon field="status" /></TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[130px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((it: any) => {
                const stock = getCurrentStock(it.id);
                const isLow = stock <= it.minimum_stock && stock > 0;
                const isOut = stock <= 0;
                const pct = it.maximum_stock > 0 ? Math.min(Math.round((stock / it.maximum_stock) * 100), 100) : 0;
                const abc = getABCClass(it.id);
                const wac = getWeightedAverageCost(it.id);
                const displayCost = wac > 0 ? wac : it.average_cost;
                return (
                  <TableRow key={it.id} className="cursor-pointer" onClick={() => setViewItem(it)}>
                    <TableCell className="font-mono text-xs text-blue-600 ltr-only">{it.item_code}</TableCell>
                    <TableCell className="font-medium text-sm">{it.name_ar}</TableCell>
                    <TableCell className="text-xs text-gray-500">{categoryLabels[it.category] || it.category}</TableCell>
                    <TableCell className="text-xs text-gray-500">{getWarehouseName(it.warehouse_id)}</TableCell>
                    <TableCell><span className={`ltr-only font-semibold text-sm ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-800'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmtNum(stock)} {it.unit_of_measure}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-1.5 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.abs(pct)}%` }} /></div>
                        <span className="text-[10px] text-gray-400 ltr-only">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-600 ltr-only">
                      {fmt(displayCost)}
                      {displayCost !== it.average_cost && <span className="text-[9px] text-gray-400 block">(ثابت: {fmt(it.average_cost)})</span>}
                    </TableCell>
                    <TableCell>
                      {abc === 'A' && <Badge className="h-5 text-[10px] bg-red-100 text-red-600 border-red-200">A</Badge>}
                      {abc === 'B' && <Badge className="h-5 text-[10px] bg-amber-100 text-amber-600 border-amber-200">B</Badge>}
                      {abc === 'C' && <Badge className="h-5 text-[10px] bg-gray-100 text-gray-500 border-gray-200">C</Badge>}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${isOut ? 'bg-red-50 text-red-600' : isLow ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isOut ? 'نفذ' : isLow ? 'منخفض' : 'متوفر'}
                      </span>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {isLow && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleCreatePR(it)}>
                                <ShoppingCart className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>طلب شراء</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => setViewItem(it)}><Eye className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>عرض</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => openEdit(it)}><Pencil className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(it)}><Trash2 className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {/* Pagination Footer */}
          <div className="py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between px-4">
            <span className="text-xs text-gray-500">عرض {paged.length} من {filtered.length} صنف (صفحة {page} من {totalPages})</span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1).map((p, idx, arr) => (
                <span key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-gray-300 mx-0.5">…</span>}
                  <Button
                    variant={p === page ? 'default' : 'outline'}
                    size="sm"
                    className={`h-7 w-7 text-xs p-0 ${p === page ? 'bg-[#533afd] hover:bg-[#4434d4]' : ''}`}
                    onClick={() => setPage(p)}
                  >{p}</Button>
                </span>
              ))}
              <Button variant="outline" size="sm" className="h-7 text-xs px-2" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</Button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Dialog with Transaction History */}
      <Dialog open={!!viewItem} onOpenChange={() => { setViewItem(null); setShowTxHistory(false); }}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-600" />تفاصيل الصنف</DialogTitle></DialogHeader>
          {viewItem && (() => { const stock = getCurrentStock(viewItem.id); const isOut = stock <= 0; const isLow = stock <= viewItem.minimum_stock && stock > 0; const abc = getABCClass(viewItem.id); const wac = getWeightedAverageCost(viewItem.id); const txns = getItemTransactions(viewItem.id); return (
            <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto">
              <div className="text-center py-3 bg-gray-50 rounded-xl">
                <div className="text-3xl mb-1">{categoryIcons[viewItem.category] || '📦'}</div>
                <h2 className="text-lg font-bold text-gray-800">{viewItem.name_ar}</h2>
                <p className="text-xs text-gray-400">{viewItem.item_code} · {categoryLabels[viewItem.category]} · {getWarehouseName(viewItem.warehouse_id)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400">الرصيد</div><div className={`text-lg font-bold ltr-only ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{stock} {viewItem.unit_of_measure}</div></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400">القيمة</div><div className="text-lg font-bold ltr-only text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(stock * viewItem.average_cost)}</div></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400">الحد الأدنى</div><div className="text-sm font-semibold ltr-only text-gray-700" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{viewItem.minimum_stock}</div></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400">نقطة إعادة الطلب</div><div className="text-sm font-semibold ltr-only text-gray-700" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{viewItem.reorder_level}</div></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-gray-400">متوسط التكلفة (ثابت)</span><span className="ltr-only font-medium" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(viewItem.average_cost)}</span></div>
                {wac > 0 && <div className="flex justify-between text-sm"><span className="text-gray-400">متوسط التكلفة (مرجح)</span><span className="ltr-only font-medium text-blue-600" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(wac)}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-gray-400">الوحدة</span><span>{viewItem.unit_of_measure}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">الحد الأقصى</span><span className="ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{viewItem.maximum_stock}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">المستودع</span><span>{getWarehouseName(viewItem.warehouse_id)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">المورد</span><span>{viewItem.supplier_name || '—'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">تصنيف ABC</span><Badge className={`h-4 text-[9px] ${abc === 'A' ? 'bg-red-100 text-red-600' : abc === 'B' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>{abc}</Badge></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">الحالة</span><span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${isOut ? 'bg-red-50 text-red-600' : isLow ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{viewItem.status === 'inactive' ? 'غير نشط' : isOut ? 'نفذ' : isLow ? 'منخفض' : 'متوفر'}</span></div>
                {viewItem.notes && <div className="flex justify-between text-sm"><span className="text-gray-400">ملاحظات</span><span className="text-xs text-gray-500 max-w-[200px] text-left">{viewItem.notes}</span></div>}
              </div>

              {/* Transaction History Section */}
              <div className="border-t pt-3">
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTxHistory(h => !h); }} className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors w-full">
                  <History className="h-4 w-4" />
                  سجل الحركات ({txns.length})
                  <span className={`text-xs transition-transform ${showTxHistory ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {showTxHistory && (
                  <div className="mt-2 space-y-1.5 max-h-[200px] overflow-y-auto">
                    {txns.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">لا توجد حركات سابقة</p>
                    ) : txns.slice(0, 15).map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between text-xs py-1.5 px-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className={typeMeta[tx.transaction_type]?.color || 'text-gray-500'}>{typeMeta[tx.transaction_type]?.label || tx.transaction_type}</span>
                          <span className="text-gray-400">{tx.transaction_date?.slice(0, 10)}</span>
                        </div>
                        <span className={`ltr-only font-medium ${tx.transaction_type === 'purchase_receipt' || tx.transaction_type === 'transfer_in' || tx.transaction_type === 'return_from_project' ? 'text-emerald-600' : tx.transaction_type === 'adjustment' ? 'text-purple-600' : 'text-red-600'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                          {['purchase_receipt', 'transfer_in', 'return_from_project', 'adjustment'].includes(tx.transaction_type) ? '+' : '-'}{tx.quantity} {viewItem.unit_of_measure}
                        </span>
                      </div>
                    ))}
                    {txns.length > 15 && <p className="text-[10px] text-gray-400 text-center">+ {txns.length - 15} حركة أخرى</p>}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setViewItem(null); openEdit(viewItem); }}><Pencil className="h-3.5 w-3.5 ml-1" />تعديل</Button>
                {isLow && (
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={() => { setViewItem(null); handleCreatePR(viewItem); }}>
                    <ShoppingCart className="h-3.5 w-3.5 ml-1" />طلب شراء
                  </Button>
                )}
              </div>
            </div>
          ); })()}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
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
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button><Button onClick={handleSave}>{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف <strong>{deleteTarget?.name_ar}</strong>؟</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
