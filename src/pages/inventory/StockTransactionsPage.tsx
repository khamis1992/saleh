import { formatQAR, formatThousand } from '@/lib/format';
import { useState, useMemo, useEffect } from 'react';
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
  Search, Filter, Trash2, Plus, X, ArrowLeftRight, ArrowDown, ArrowUp,
  TrendingUp, TrendingDown, Package, Warehouse, Calendar, Hash, Wallet,
  List, GanttChart, Truck, Wrench, RefreshCw, AlertCircle, Trash,
} from 'lucide-react';
import { stockTransactionStore, warehouseStore, inventoryStore } from '@/services/stores';
import { KpiCard } from '@/components/shared/DesignSystem';
import { generateJournalEntry } from '@/utils/exportUtils';

const typeMeta: Record<string, { label: string; icon: any; direction: 'in' | 'out' | 'neutral'; color: string; bg: string }> = {
  purchase_receipt: { label: 'استلام شراء', icon: Truck, direction: 'in', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  transfer_in: { label: 'تحويل وارد', icon: RefreshCw, direction: 'in', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  return_from_project: { label: 'مرتجع من مشروع', icon: ArrowDown, direction: 'in', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  issue_to_project: { label: 'صرف لمشروع', icon: Package, direction: 'out', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  issue_to_maintenance: { label: 'صرف لصيانة', icon: Wrench, direction: 'out', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  transfer_out: { label: 'تحويل صادر', icon: RefreshCw, direction: 'out', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  adjustment: { label: 'تسوية', icon: Hash, direction: 'neutral', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  damage: { label: 'تالف', icon: AlertCircle, direction: 'out', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  write_off: { label: 'إعدام', icon: Trash, direction: 'out', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const emptyForm = { transaction_type: 'purchase_receipt', warehouse_id: '', inventory_item_id: '', project_id: '', quantity: 1, unit_cost: 0 };

export default function StockTransactionsPage() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  const transactions = useMemo(() => { return stockTransactionStore.getAll(); }, [refresh]);
  useEffect(() => { const t = setTimeout(() => setLoading(false), 300); return () => clearTimeout(t); }, [refresh]);
  const warehouses = useMemo(() => warehouseStore.getAll(), []);
  const items = useMemo(() => inventoryStore.getAll(), []);

  const fmt = (v: number) => formatQAR(v);
  const fmtNum = (v: number) => formatThousand(v);

  const filtered = useMemo(() =>
    transactions.filter((tx: any) => {
      if (typeFilter !== 'all' && tx.transaction_type !== typeFilter) return false;
      if (warehouseFilter !== 'all' && tx.warehouse_id !== warehouseFilter) return false;
      if (search) {
        const itemName = items.find((i: any) => i.id === tx.inventory_item_id)?.name_ar || '';
        if (!tx.transaction_number?.includes(search) && !itemName.includes(search)) return false;
      }
      return true;
    }).sort((a: any, b: any) => String(b.transaction_date || '').localeCompare(String(a.transaction_date || '')))
  , [transactions, typeFilter, warehouseFilter, search, items]);

  const totalInflow = filtered.filter((tx: any) => ['purchase_receipt', 'transfer_in', 'return_from_project'].includes(tx.transaction_type)).reduce((s: number, tx: any) => s + Math.abs(tx.total_cost || 0), 0);
  const totalOutflow = filtered.filter((tx: any) => ['issue_to_project', 'issue_to_maintenance', 'transfer_out', 'damage', 'write_off'].includes(tx.transaction_type)).reduce((s: number, tx: any) => s + Math.abs(tx.total_cost || 0), 0);
  const totalInCount = filtered.filter((tx: any) => ['purchase_receipt', 'transfer_in', 'return_from_project'].includes(tx.transaction_type)).length;
  const totalOutCount = filtered.filter((tx: any) => ['issue_to_project', 'issue_to_maintenance', 'transfer_out', 'damage', 'write_off'].includes(tx.transaction_type)).length;
  const netFlow = totalInflow - totalOutflow;

  const openCreate = () => { setForm(emptyForm); setModalOpen(true); };

  const handleSave = () => {
    if (!form.warehouse_id || !form.inventory_item_id || form.quantity <= 0) return;
    // Stock validation for issue_to_project and issue_to_maintenance: check current stock
    if (form.transaction_type === 'issue_to_project' || form.transaction_type === 'issue_to_maintenance') {
      const stockTxns = stockTransactionStore.getAll();
      let onHand = 0;
      for (const t of stockTxns) {
        if (t.inventory_item_id === form.inventory_item_id) {
          if (t.transaction_type === 'purchase_receipt' || t.transaction_type === 'transfer_in' || t.transaction_type === 'return_from_project' || t.transaction_type === 'opening') {
            onHand += t.quantity;
          } else if (t.transaction_type === 'issue_to_project' || t.transaction_type === 'issue_to_maintenance' || t.transaction_type === 'transfer_out' || t.transaction_type === 'damage' || t.transaction_type === 'write_off') {
            onHand -= t.quantity;
          }
        }
      }
      if (onHand < form.quantity) {
        toast.error(`المخزون غير كافٍ — المتاح حالياً: ${onHand} والكمية المطلوبة: ${form.quantity}`);
        return;
      }
    }
    stockTransactionStore.create({
      company_id: '', transaction_number: 'TXN-' + Date.now(),
      transaction_type: form.transaction_type, warehouse_id: form.warehouse_id,
      inventory_item_id: form.inventory_item_id, project_id: form.project_id || '',
      quantity: form.quantity, unit_cost: form.unit_cost,
      total_cost: form.quantity * form.unit_cost,
      transaction_date: new Date().toISOString().slice(0, 10),
      reference_type: '', reference_id: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    } as any);
    // Generate JE for issue_to_project and issue_to_maintenance
    if (form.transaction_type === 'issue_to_project') {
      const itemName = items.find((i: any) => i.id === form.inventory_item_id)?.name_ar || '';
      generateJournalEntry(
        'إصدار مواد للمشروع - ' + itemName,
        'مخزون',
        'TXN-' + Date.now(),
        [
          { account_id: 'acc-5', debit: form.quantity * form.unit_cost, credit: 0, description: 'مشاريع تحت التنفيذ — ' + itemName },
          { account_id: 'acc-7', debit: 0, credit: form.quantity * form.unit_cost, description: 'مخزون — ' + itemName },
        ],
      );
      toast.success('تم إنشاء القيد المحاسبي للإصدار للمشروع');
    }
    if (form.transaction_type === 'issue_to_maintenance') {
      const itemName = items.find((i: any) => i.id === form.inventory_item_id)?.name_ar || '';
      generateJournalEntry(
        'إصدار مواد للصيانة - ' + itemName,
        'مخزون',
        'TXN-' + Date.now(),
        [
          { account_id: 'acc-15', debit: form.quantity * form.unit_cost, credit: 0, description: 'مصاريف صيانة — ' + itemName },
          { account_id: 'acc-7', debit: 0, credit: form.quantity * form.unit_cost, description: 'مخزون — ' + itemName },
        ],
      );
      toast.success('تم إنشاء القيد المحاسبي للإصدار للصيانة');
    }
    toast.success('تم إضافة حركة المخزون بنجاح');
    setRefresh(r => r + 1); setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    stockTransactionStore.remove(deleteTarget.id);
    toast.success('تم حذف حركة المخزون بنجاح');
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  const getItemName = (id: string) => items.find((i: any) => i.id === id)?.name_ar || id;
  const getWarehouseName = (id: string) => warehouses.find((w: any) => w.id === id)?.warehouse_name || id;

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="حركات المخزون" value={transactions.length} subtitle={`${filtered.length} حركة`} icon={ArrowLeftRight} moduleOverride="procurement" />
        <KpiCard title="وارد" value={totalInCount} subtitle={formatQARInt(totalInflow)} icon={ArrowDown} moduleOverride="procurement" />
        <KpiCard title="منصرف" value={totalOutCount} subtitle={formatQARInt(totalOutflow)} icon={ArrowUp} moduleOverride="procurement" />
        <KpiCard title="صافي التدفق" value={formatQARInt(netFlow)} subtitle={netFlow >= 0 ? 'فائض' : 'عجز'} icon={Wallet} trend={{ value: netFlow >= 0 ? 100 : -100 }} moduleOverride="procurement" />
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">حركات المخزون</h1>
          <p className="text-xs text-gray-500 mt-0.5">{filtered.length} حركة — {totalInCount} وارد · {totalOutCount} صادر</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white rounded-lg border border-gray-200 flex p-0.5">
            <button onClick={() => setViewMode('timeline')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'timeline' ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:text-gray-600'}`}><GanttChart className="h-4 w-4" /></button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:text-gray-600'}`}><List className="h-4 w-4" /></button>
          </div>
          <Button onClick={openCreate} className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20">
            <Plus className="h-4 w-4" />حركة جديدة
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp className="h-4 w-4 text-emerald-600" /></div><span className="text-xs text-gray-500">إجمالي الوارد</span></div>
            <div className="text-xl font-bold text-emerald-600 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(totalInflow)}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{totalInCount} حركة واردة</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center"><TrendingDown className="h-4 w-4 text-red-600" /></div><span className="text-xs text-gray-500">إجمالي الصادر</span></div>
            <div className="text-xl font-bold text-red-600 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(totalOutflow)}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{totalOutCount} حركة صادرة</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center"><ArrowLeftRight className="h-4 w-4 text-blue-600" /></div><span className="text-xs text-gray-500">صافي التدفق</span></div>
            <div className={`text-xl font-bold ltr-only ${netFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{netFlow >= 0 ? '+' : ''}{fmt(netFlow)}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{netFlow >= 0 ? 'فائض' : 'عجز'}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-purple-50 flex items-center justify-center"><Hash className="h-4 w-4 text-purple-600" /></div><span className="text-xs text-gray-500">إجمالي الحركات</span></div>
            <div className="text-xl font-bold text-gray-800 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{filtered.length}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{transactions.length} حركة مسجلة</div>
          </div>
        </div>
      )}

      {/* Quick Filter Pills */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {['all', 'purchase_receipt', 'issue_to_project', 'issue_to_maintenance', 'transfer_in', 'transfer_out', 'return_from_project', 'adjustment', 'damage', 'write_off'].map(t => (
          <button
            key={t}
            onClick={() => { setTypeFilter(t); setSearch(''); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${typeFilter === t ? 'bg-[#3B82F6] text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
          >
            {t === 'all' ? 'الكل' : typeMeta[t]?.label || t}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="بحث باسم الصنف أو رقم الحركة..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200" />
            {search && <button onClick={() => setSearch('')} className="absolute left-3 top-2.5"><X className="h-4 w-4 text-gray-300 hover:text-gray-500" /></button>}
          </div>
          <Select value={warehouseFilter} onValueChange={v => { setWarehouseFilter(v); }}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200"><Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="المستودع" /></SelectTrigger>
            <SelectContent>{warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.warehouse_name}</SelectItem>)}</SelectContent>
          </Select>
          {search && <span className="text-xs text-gray-400">{filtered.length} نتيجة</span>}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <ArrowLeftRight className="h-14 w-14 mx-auto text-gray-200 mb-4" />
          <p className="text-sm font-medium text-gray-500">لا توجد حركات مخزون</p>
          <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p>
          <Button variant="outline" size="sm" onClick={() => { setSearch(''); setTypeFilter('all'); setWarehouseFilter('all'); }} className="h-8 text-xs rounded-lg mt-3">مسح الفلاتر</Button>
        </div>
      ) : viewMode === 'timeline' ? (
        /* TIMELINE CARD VIEW */
        <div className="space-y-3">
          {filtered.map((tx: any) => {
            const meta = typeMeta[tx.transaction_type] || typeMeta['adjustment'];
            const Icon = meta.icon;
            const isIn = meta.direction === 'in';
            const isOut = meta.direction === 'out';
            return (
              <div key={tx.id} className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden hover:shadow-md transition-all ${isIn ? 'border-l-emerald-500' : isOut ? 'border-l-red-500' : 'border-l-purple-500'}`}>
                <div className="flex items-stretch">
                  {/* Left icon column */}
                  <div className={`w-14 flex items-center justify-center shrink-0 ${isIn ? 'bg-emerald-50' : isOut ? 'bg-red-50' : 'bg-purple-50'}`}>
                    <Icon className={`h-6 w-6 ${meta.color}`} />
                  </div>
                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${meta.bg} ${meta.color}`}>{meta.label}</span>
                        <span className="text-xs text-gray-400 font-mono ltr-only">{tx.transaction_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Calendar className="h-3 w-3" />
                        <span className="ltr-only">{tx.transaction_date}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Package className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-sm font-medium text-gray-800">{getItemName(tx.inventory_item_id)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Warehouse className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-gray-500">{getWarehouseName(tx.warehouse_id)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ltr-only flex items-center gap-1 ${isIn ? 'text-emerald-600' : isOut ? 'text-red-600' : 'text-purple-600'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                            {isIn ? '+' : isOut ? '-' : '±'}{fmtNum(tx.quantity)}
                          </div>
                          <div className="text-xs text-gray-400">{fmt(tx.total_cost || tx.quantity * tx.unit_cost)}</div>
                        </div>
                        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-300 hover:text-red-500" onClick={() => setDeleteTarget(tx)}><Trash2 className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="text-center text-xs text-gray-400 py-2">عرض {filtered.length} من {transactions.length} حركة</div>
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <Table>
            <TableHeader><TableRow >
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9">رقم الحركة</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9">النوع</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المستودع</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الصنف</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الكمية</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الإجمالي</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9">التاريخ</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[60px]"></TableHead>
            </TableRow></TableHeader>
            <TableBody>{filtered.map((tx: any) => {
              const meta = typeMeta[tx.transaction_type] || typeMeta['adjustment'];
              const isIn = meta.direction === 'in';
              return (
                <TableRow key={tx.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                  <TableCell className="font-mono text-xs text-gray-500 ltr-only">{tx.transaction_number}</TableCell>
                  <TableCell><span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${meta.bg} ${meta.color}`}>{meta.label}</span></TableCell>
                  <TableCell className="text-xs text-gray-500">{getWarehouseName(tx.warehouse_id)}</TableCell>
                  <TableCell className="text-sm font-medium">{getItemName(tx.inventory_item_id)}</TableCell>
                  <TableCell><span className={`ltr-only font-semibold ${isIn ? 'text-emerald-600' : meta.direction === 'out' ? 'text-red-600' : 'text-purple-600'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{isIn ? '+' : ''}{tx.quantity}</span></TableCell>
                  <TableCell className="text-xs font-mono ltr-only">{fmt(tx.total_cost || tx.quantity * tx.unit_cost)}</TableCell>
                  <TableCell className="text-xs text-gray-400 ltr-only">{tx.transaction_date}</TableCell>
                  <TableCell><Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-300 hover:text-red-500" onClick={() => setDeleteTarget(tx)}><Trash2 className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip></TableCell>
                </TableRow>
              );
            })}</TableBody>
          </Table>
          <div className="py-3 border-t border-gray-100 bg-gray-50/50"><span className="text-xs text-gray-500">عرض {filtered.length} من {transactions.length} حركة</span></div>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>حركة مخزون جديدة</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div><Label>نوع الحركة</Label><Select value={form.transaction_type} onValueChange={v => setForm(f => ({ ...f, transaction_type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(typeMeta).map(([k, v]) => <SelectItem key={k} value={k}><span className="flex items-center gap-2"><v.icon className="h-3.5 w-3.5" />{v.label}</span></SelectItem>)}</SelectContent></Select></div>
            <div><Label>المستودع</Label><Select value={form.warehouse_id} onValueChange={v => setForm(f => ({ ...f, warehouse_id: v }))}><SelectTrigger><SelectValue placeholder="اختر المستودع" /></SelectTrigger><SelectContent>{warehouses.map((w: any) => <SelectItem key={w.id} value={w.id}>{w.warehouse_name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>الصنف</Label><Select value={form.inventory_item_id} onValueChange={v => setForm(f => ({ ...f, inventory_item_id: v }))}><SelectTrigger><SelectValue placeholder="اختر الصنف" /></SelectTrigger><SelectContent>{items.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.name_ar}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الكمية</Label><Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} min={1} /></div>
              <div><Label>سعر الوحدة</Label><Input type="number" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: Number(e.target.value) }))} min={0} /></div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg text-sm flex items-center justify-between">
              <span className="text-gray-500">الإجمالي</span>
              <span className="font-bold text-lg ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmt(form.quantity * form.unit_cost)}</span>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button><Button onClick={handleSave} disabled={!form.warehouse_id || !form.inventory_item_id || form.quantity <= 0}>حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>تأكيد الحذف</AlertDialogTitle><AlertDialogDescription>هل أنت متأكد من حذف حركة المخزون <strong>{deleteTarget?.transaction_number}</strong>؟</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}