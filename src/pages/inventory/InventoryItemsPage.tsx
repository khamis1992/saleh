import { formatQAR, formatThousand } from '@/lib/format';
import { useState, useMemo } from 'react';
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, Filter, Pencil, Trash2, AlertTriangle, Package, X, TrendingDown,
  TrendingUp, BarChart3, DollarSign, Layers, Warehouse, Eye, Grid3X3, List,
} from 'lucide-react';
import { inventoryStore, stockTransactionStore } from '@/services/stores';

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

const emptyForm = {
  item_code: '', name_ar: '', name_en: '', category: 'other' as const,
  unit_of_measure: '', minimum_stock: 0, maximum_stock: 0, reorder_level: 0, average_cost: 0,
};

export default function InventoryItemsPage() {
  const { t } = useLocale();
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

  const items = useMemo(() => {
    const data = inventoryStore.getAll();
    setTimeout(() => setLoading(false), 300);
    return data;
  }, [refresh]);

  const filtered = items.filter((it: any) => {
    if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;
    if (search && !it.name_ar.includes(search) && !it.item_code.includes(search)) return false;
    return true;
  });

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

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (it: any) => {
    setEditId(it.id);
    setForm({ item_code: it.item_code, name_ar: it.name_ar, name_en: it.name_en || '', category: it.category, unit_of_measure: it.unit_of_measure, minimum_stock: it.minimum_stock, maximum_stock: it.maximum_stock, reorder_level: it.reorder_level, average_cost: it.average_cost });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.item_code || !form.name_ar) return;
    const data = { company_id: '', ...form, minimum_stock: Number(form.minimum_stock), maximum_stock: Number(form.maximum_stock), reorder_level: Number(form.reorder_level), average_cost: Number(form.average_cost), default_supplier_id: '', status: 'active', notes: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
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

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">المواد والمخزون</h1>
          <p className="text-xs text-gray-500 mt-0.5">{totalItems} صنف — {lowStockCount} منخفض</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-lg border border-gray-200 flex p-0.5">
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:text-gray-600'}`}><List className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:text-gray-600'}`}><Grid3X3 className="h-4 w-4" /></button>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20">
            + إضافة صنف
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
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
          {filtered.map((it: any) => {
            const stock = getCurrentStock(it.id);
            const isLow = stock <= it.minimum_stock && stock > 0;
            const isOut = stock <= 0;
            const pct = it.maximum_stock > 0 ? Math.min(Math.round((stock / it.maximum_stock) * 100), 100) : 0;
            return (
              <div key={it.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setViewItem(it)}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400 font-mono ltr-only">{it.item_code}</span>
                  <span className="text-lg">{categoryIcons[it.category] || '📦'}</span>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">{it.name_ar}</h3>
                <p className="text-[11px] text-gray-400 mb-3">{categoryLabels[it.category] || it.category} · {it.unit_of_measure}</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs"><span className="text-gray-400">الرصيد</span><span className={`ltr-only font-semibold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{stock}</span></div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-2 rounded-full transition-all ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : pct >= 70 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px]"><span className="text-gray-400">القيمة</span><span className="ltr-only font-medium text-gray-600" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(stock * it.average_cost)}</span></div>
                </div>
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-50">
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
              <TableRow >
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الكود</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9">اسم الصنف</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الفئة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الرصيد</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9">نسبة المخزون</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9">متوسط التكلفة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الحالة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[100px]">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((it: any) => {
                const stock = getCurrentStock(it.id);
                const isLow = stock <= it.minimum_stock && stock > 0;
                const isOut = stock <= 0;
                const pct = it.maximum_stock > 0 ? Math.min(Math.round((stock / it.maximum_stock) * 100), 100) : 0;
                return (
                  <TableRow key={it.id} className=" cursor-pointer" onClick={() => setViewItem(it)}>
                    <TableCell className="font-mono text-xs text-blue-600 ltr-only">{it.item_code}</TableCell>
                    <TableCell className="font-medium text-sm">{it.name_ar}</TableCell>
                    <TableCell className="text-xs text-gray-500">{categoryLabels[it.category] || it.category}</TableCell>
                    <TableCell><span className={`ltr-only font-semibold text-sm ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-800'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmtNum(stock)} {it.unit_of_measure}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-1.5 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>
                        <span className="text-[10px] text-gray-400 ltr-only">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-600 ltr-only">{fmt(it.average_cost)}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${isOut ? 'bg-red-50 text-red-600' : isLow ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isOut ? 'نفذ' : isLow ? 'منخفض' : 'متوفر'}
                      </span>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
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
          <div className="py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">عرض {filtered.length} من {items.length} صنف</span>
          </div>
        </div>
      )}

      {/* View Detail Dialog */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-600" />تفاصيل الصنف</DialogTitle></DialogHeader>
          {viewItem && (() => { const stock = getCurrentStock(viewItem.id); const isOut = stock <= 0; const isLow = stock <= viewItem.minimum_stock && stock > 0; return (
            <div className="space-y-4 py-2">
              <div className="text-center py-3 bg-gray-50 rounded-xl">
                <div className="text-3xl mb-1">{categoryIcons[viewItem.category] || '📦'}</div>
                <h2 className="text-lg font-bold text-gray-800">{viewItem.name_ar}</h2>
                <p className="text-xs text-gray-400">{viewItem.item_code} · {categoryLabels[viewItem.category]}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400">الرصيد</div><div className={`text-lg font-bold ltr-only ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{stock} {viewItem.unit_of_measure}</div></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400">القيمة</div><div className="text-lg font-bold ltr-only text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(stock * viewItem.average_cost)}</div></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400">الحد الأدنى</div><div className="text-sm font-semibold ltr-only text-gray-700" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{viewItem.minimum_stock}</div></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xs text-gray-400">نقطة إعادة الطلب</div><div className="text-sm font-semibold ltr-only text-gray-700" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{viewItem.reorder_level}</div></div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-gray-400">متوسط التكلفة</span><span className="ltr-only font-medium" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(viewItem.average_cost)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">الوحدة</span><span>{viewItem.unit_of_measure}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">الحد الأقصى</span><span className="ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{viewItem.maximum_stock}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">الحالة</span><span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${isOut ? 'bg-red-50 text-red-600' : isLow ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>{isOut ? 'نفذ' : isLow ? 'منخفض' : 'متوفر'}</span></div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => { setViewItem(null); openEdit(viewItem); }}><Pencil className="h-3.5 w-3.5 ml-1" />تعديل</Button>
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
            <div><Label>الفئة</Label><Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>وحدة القياس</Label><Input value={form.unit_of_measure} onChange={e => setForm(f => ({ ...f, unit_of_measure: e.target.value }))} placeholder="كيس - طن - متر" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الحد الأدنى</Label><Input type="number" value={form.minimum_stock} onChange={e => setForm(f => ({ ...f, minimum_stock: Number(e.target.value) }))} /></div>
              <div><Label>الحد الأقصى</Label><Input type="number" value={form.maximum_stock} onChange={e => setForm(f => ({ ...f, maximum_stock: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>نقطة إعادة الطلب</Label><Input type="number" value={form.reorder_level} onChange={e => setForm(f => ({ ...f, reorder_level: Number(e.target.value) }))} /></div>
              <div><Label>متوسط التكلفة</Label><Input type="number" value={form.average_cost} onChange={e => setForm(f => ({ ...f, average_cost: Number(e.target.value) }))} /></div>
            </div>
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