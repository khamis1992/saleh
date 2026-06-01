import { useState, useMemo } from 'react';
import { formatQAR, formatThousand } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { inventoryStore, stockTransactionStore } from '@/services/stores';

function computeStockQty(itemId: string, transactions: { inventory_item_id: string; quantity: number; transaction_type: string }[]): number {
  let qty = 0;
  for (const t of transactions) {
    if (t.inventory_item_id !== itemId) continue;
    if (t.transaction_type === 'purchase_receipt' || t.transaction_type === 'return_from_project' || t.transaction_type === 'transfer_in') {
      qty += t.quantity;
    } else if (t.transaction_type === 'issue_to_project' || t.transaction_type === 'issue_to_maintenance' || t.transaction_type === 'transfer_out') {
      qty -= t.quantity;
    }
  }
  return qty;
}

const categoryLabels: Record<string, string> = {
  cement: 'أسمنت',
  steel: 'حديد',
  blocks: 'بلوك',
  plumbing: 'سباكة',
  electrical: 'كهرباء',
  finishing: 'تشطيبات',
  paint: 'دهانات',
  hvac: 'تكييف',
  wood: 'خشب',
  safety: 'سلامة',
  tools: 'أدوات',
};

export default function StockBalanceReport() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [refresh] = useState(0);

  const items = useMemo(() => inventoryStore.getAll(), [refresh]);
  const transactions = useMemo(() => stockTransactionStore.getAll(), [refresh]);

  const reportData = useMemo(() => {
    return items
      .map((item) => {
        const qty = computeStockQty(item.id, transactions);
        const totalValue = qty * item.average_cost;
        return {
          id: item.id,
          item_code: item.item_code,
          name_ar: item.name_ar,
          category: item.category,
          quantity_in_stock: qty,
          unit: item.unit_of_measure,
          avg_cost: item.average_cost,
          total_value: totalValue,
          reorder_level: item.reorder_level,
        };
      })
      .filter((d) => {
        if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
        if (search && !d.name_ar.includes(search) && !d.item_code.includes(search)) return false;
        return true;
      })
      .sort((a, b) => b.total_value - a.total_value);
  }, [items, transactions, search, categoryFilter]);

  const fmt = (v: number) =>
    formatQAR(v);

  const stats = useMemo(() => {
    const totalValue = reportData.reduce((s, d) => s + d.total_value, 0);
    const lowStock = reportData.filter((d) => d.quantity_in_stock <= d.reorder_level).length;
    return { totalItems: reportData.length, totalValue, lowStock };
  }, [reportData]);

  return (
    <div dir="rtl">
      <PageHeader title="رصيد المخزون" description="تقرير أرصدة المخزون حسب البنود" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">عدد البنود</p>
            <p className="text-2xl font-bold">{stats.totalItems}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">القيمة الإجمالية للمخزون</p>
            <p className="text-2xl font-bold">{fmt(stats.totalValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">بنود منخفضة المخزون</p>
            <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برمز الصنف أو الاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الفئة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الفئات</SelectItem>
                {Object.entries(categoryLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رمز الصنف</TableHead>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الفئة</TableHead>
                <TableHead className="text-right">الكمية</TableHead>
                <TableHead className="text-right">الوحدة</TableHead>
                <TableHead className="text-right">متوسط التكلفة</TableHead>
                <TableHead className="text-right">القيمة الإجمالية</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد بنود مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((d) => (
                  <TableRow key={d.id} className={d.quantity_in_stock <= d.reorder_level ? 'bg-amber-50' : ''}>
                    <TableCell className="font-mono">{d.item_code}</TableCell>
                    <TableCell className="font-medium">{d.name_ar}</TableCell>
                    <TableCell>{categoryLabels[d.category] || d.category}</TableCell>
                    <TableCell className={d.quantity_in_stock <= d.reorder_level ? 'text-amber-600 font-medium' : ''}>
                      {formatThousand(d.quantity_in_stock)}
                    </TableCell>
                    <TableCell>{d.unit}</TableCell>
                    <TableCell>{fmt(d.avg_cost)}</TableCell>
                    <TableCell className="font-medium">{fmt(d.total_value)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
