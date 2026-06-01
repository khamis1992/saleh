import { useState, useMemo } from 'react';
import { formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { invoiceStore, getTenantName, getUnitNumber } from '@/services/stores';

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

export default function OverdueReport() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [refresh] = useState(0);

  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const today = new Date().toISOString().split('T')[0];

  const overdue = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === 'overdue')
      .map((inv) => ({
        ...inv,
        tenant_name: getTenantName(inv.tenant_id),
        unit_number: getUnitNumber(inv.unit_id),
        days_overdue: daysBetween(inv.due_date, today),
      }))
      .filter((inv) => {
        if (search && !inv.invoice_number.includes(search) && !inv.tenant_name.includes(search) && !inv.unit_number.includes(search))
          return false;
        return true;
      })
      .sort((a, b) => b.days_overdue - a.days_overdue);
  }, [invoices, search, today]);

  const fmt = (v: number) =>
    formatQARInt(v);

  const stats = useMemo(() => {
    const totalOverdue = overdue.length;
    const totalBalance = overdue.reduce((s, i) => s + i.balance, 0);
    const avgDays = totalOverdue > 0 ? Math.round(overdue.reduce((s, i) => s + i.days_overdue, 0) / totalOverdue) : 0;
    const criticalCount = overdue.filter((i) => i.days_overdue > 90).length;
    return { totalOverdue, totalBalance, avgDays, criticalCount };
  }, [overdue]);

  return (
    <div dir="rtl">
      <PageHeader title="الإيجارات المتأخرة" description="تقرير الفواتير المتأخرة السداد" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">عدد الفواتير المتأخرة</p>
            <p className="text-2xl font-bold text-red-600">{stats.totalOverdue}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي المبالغ المتأخرة</p>
            <p className="text-2xl font-bold text-red-600">{fmt(stats.totalBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">متوسط أيام التأخير</p>
            <p className="text-2xl font-bold">{stats.avgDays} يوم</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">متأخرة أكثر من 90 يوم</p>
            <p className="text-2xl font-bold text-red-700">{stats.criticalCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الفاتورة أو المستأجر..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الفاتورة</TableHead>
                <TableHead className="text-right">المستأجر</TableHead>
                <TableHead className="text-right">رقم الوحدة</TableHead>
                <TableHead className="text-right">تاريخ الاستحقاق</TableHead>
                <TableHead className="text-right">إجمالي الفاتورة</TableHead>
                <TableHead className="text-right">الرصيد المتبقي</TableHead>
                <TableHead className="text-right">أيام التأخير</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdue.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد فواتير متأخرة
                  </TableCell>
                </TableRow>
              ) : (
                overdue.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                    <TableCell className="font-medium">{inv.tenant_name}</TableCell>
                    <TableCell>{inv.unit_number}</TableCell>
                    <TableCell>{inv.due_date}</TableCell>
                    <TableCell>{fmt(inv.total)}</TableCell>
                    <TableCell className="text-red-600 font-medium">{fmt(inv.balance)}</TableCell>
                    <TableCell>
                      <span className={inv.days_overdue > 90 ? 'text-red-700 font-bold' : inv.days_overdue > 30 ? 'text-amber-600' : ''}>
                        {inv.days_overdue} يوم
                      </span>
                    </TableCell>
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
