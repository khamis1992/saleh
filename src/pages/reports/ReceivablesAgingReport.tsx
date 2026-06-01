import { useState, useMemo } from 'react';
import { formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';
import { invoiceStore, getTenantName } from '@/services/stores';

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

interface AgingEntry {
  tenant_name: string;
  tenant_id: string;
  bucket_0_30: number;
  bucket_31_60: number;
  bucket_61_90: number;
  bucket_90_plus: number;
  total_due: number;
}

export default function ReceivablesAgingReport() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [refresh] = useState(0);

  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const today = new Date().toISOString().split('T')[0];

  const agingData = useMemo(() => {
    const map = new Map<string, AgingEntry>();
    const unpaidInvoices = invoices.filter((inv) => inv.balance > 0);

    for (const inv of unpaidInvoices) {
      const tid = inv.tenant_id;
      const days = daysBetween(inv.due_date, today);

      if (!map.has(tid)) {
        map.set(tid, {
          tenant_name: getTenantName(tid),
          tenant_id: tid,
          bucket_0_30: 0,
          bucket_31_60: 0,
          bucket_61_90: 0,
          bucket_90_plus: 0,
          total_due: 0,
        });
      }

      const entry = map.get(tid)!;
      if (days <= 30) entry.bucket_0_30 += inv.balance;
      else if (days <= 60) entry.bucket_31_60 += inv.balance;
      else if (days <= 90) entry.bucket_61_90 += inv.balance;
      else entry.bucket_90_plus += inv.balance;
      entry.total_due += inv.balance;
    }

    return Array.from(map.values())
      .filter((e) => {
        if (search && !e.tenant_name.includes(search)) return false;
        return true;
      })
      .sort((a, b) => b.total_due - a.total_due);
  }, [invoices, search, today]);

  const fmt = (v: number) =>
    formatQARInt(v);

  const stats = useMemo(() => {
    const totalDue = agingData.reduce((s, e) => s + e.total_due, 0);
    const total090 = agingData.reduce((s, e) => s + e.bucket_0_30 + e.bucket_31_60 + e.bucket_61_90, 0);
    const total90Plus = agingData.reduce((s, e) => s + e.bucket_90_plus, 0);
    return { totalDue, total090, total90Plus, tenantCount: agingData.length };
  }, [agingData]);

  return (
    <div dir="rtl">
      <PageHeader title="تقادم الذمم" description="تقرير تقادم الذمم المدينة حسب الفئات العمرية" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">عدد المستأجرين</p>
            <p className="text-2xl font-bold">{stats.tenantCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي الذمم</p>
            <p className="text-2xl font-bold">{fmt(stats.totalDue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">ذمم 0-90 يوم</p>
            <p className="text-2xl font-bold text-amber-600">{fmt(stats.total090)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">ذمم +90 يوم</p>
            <p className="text-2xl font-bold text-red-600">{fmt(stats.total90Plus)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث باسم المستأجر..."
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
                <TableHead className="text-right">المستأجر</TableHead>
                <TableHead className="text-right">0-30 يوم</TableHead>
                <TableHead className="text-right">31-60 يوم</TableHead>
                <TableHead className="text-right">61-90 يوم</TableHead>
                <TableHead className="text-right">+90 يوم</TableHead>
                <TableHead className="text-right">الإجمالي المستحق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agingData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    لا توجد ذمم مدينة
                  </TableCell>
                </TableRow>
              ) : (
                agingData.map((e) => (
                  <TableRow key={e.tenant_id}>
                    <TableCell className="font-medium">{e.tenant_name}</TableCell>
                    <TableCell>{e.bucket_0_30 > 0 ? fmt(e.bucket_0_30) : '-'}</TableCell>
                    <TableCell>{e.bucket_31_60 > 0 ? fmt(e.bucket_31_60) : '-'}</TableCell>
                    <TableCell>{e.bucket_61_90 > 0 ? fmt(e.bucket_61_90) : '-'}</TableCell>
                    <TableCell className={e.bucket_90_plus > 0 ? 'text-red-600 font-medium' : ''}>
                      {e.bucket_90_plus > 0 ? fmt(e.bucket_90_plus) : '-'}
                    </TableCell>
                    <TableCell className="font-bold">{fmt(e.total_due)}</TableCell>
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
