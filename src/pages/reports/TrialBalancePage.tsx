import { useState, useMemo } from 'react';
import { formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Download } from 'lucide-react';
import { exportToCSV } from '@/utils/exportUtils';
import { chartOfAccountsStore, journalEntryStore, journalEntryLineStore } from '@/services/stores';

const typeLabels: Record<string, string> = {
  asset: 'أصول',
  liability: 'خصوم',
  equity: 'حقوق ملكية',
  revenue: 'إيرادات',
  expense: 'مصروفات',
};

interface TrialBalanceRow {
  account_code: string;
  account_name: string;
  account_type: string;
  debit_total: number;
  credit_total: number;
  net_debit: number;
  net_credit: number;
}

export default function TrialBalancePage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refresh] = useState(0);

  const accounts = useMemo(() => chartOfAccountsStore.getAll(), [refresh]);
  const entries = useMemo(() => journalEntryStore.getAll(), [refresh]);
  const lines = useMemo(() => journalEntryLineStore.getAll(), [refresh]);

  const reportData = useMemo(() => {
    const accountMap = new Map<string, TrialBalanceRow>();

    for (const acc of accounts) {
      accountMap.set(acc.id, {
        account_code: acc.account_code,
        account_name: acc.account_name_ar,
        account_type: acc.account_type,
        debit_total: 0,
        credit_total: 0,
        net_debit: 0,
        net_credit: 0,
      });
    }

    const postedEntries = entries.filter((e) => e.status === 'posted');
    const postedEntryIds = new Set(postedEntries.map((e) => e.id));

    for (const line of lines) {
      if (!postedEntryIds.has(line.journal_entry_id)) continue;
      const row = accountMap.get(line.account_id);
      if (!row) continue;
      row.debit_total += line.debit || 0;
      row.credit_total += line.credit || 0;
    }

    const result: TrialBalanceRow[] = [];
    for (const row of accountMap.values()) {
      const net = row.debit_total - row.credit_total;
      if (net > 0) {
        row.net_debit = net;
        row.net_credit = 0;
      } else if (net < 0) {
        row.net_debit = 0;
        row.net_credit = -net;
      }
      if (row.debit_total === 0 && row.credit_total === 0) continue;
      result.push(row);
    }

    return result
      .filter((r) => {
        if (typeFilter !== 'all' && r.account_type !== typeFilter) return false;
        if (search && !r.account_name.includes(search) && !r.account_code.includes(search)) return false;
        return true;
      })
      .sort((a, b) => a.account_code.localeCompare(b.account_code));
  }, [accounts, entries, lines, search, typeFilter]);

  const fmt = (v: number) =>
    formatQARInt(v);

  const totals = useMemo(() => {
    const totalDebit = reportData.reduce((s, r) => s + r.debit_total, 0);
    const totalCredit = reportData.reduce((s, r) => s + r.credit_total, 0);
    const totalNetDebit = reportData.reduce((s, r) => s + r.net_debit, 0);
    const totalNetCredit = reportData.reduce((s, r) => s + r.net_credit, 0);
    return { totalDebit, totalCredit, totalNetDebit, totalNetCredit, balanced: Math.abs(totalNetDebit - totalNetCredit) < 0.01 };
  }, [reportData]);

  const csvColumns = [
    { key: 'account_code', label: 'كود الحساب' },
    { key: 'account_name', label: 'اسم الحساب' },
    { key: 'account_type', label: 'نوع الحساب' },
    { key: 'debit_total', label: 'إجمالي مدين' },
    { key: 'credit_total', label: 'إجمالي دائن' },
    { key: 'net_debit', label: 'صافي مدين' },
    { key: 'net_credit', label: 'صافي دائن' },
  ];

  const handleExport = () => {
    const exportData = reportData.map((r) => ({
      ...r,
      account_type: typeLabels[r.account_type] || r.account_type,
    }));
    exportToCSV(exportData, csvColumns, 'ميزان_المراجعة.csv');
  };

  return (
    <div dir="rtl">
      <PageHeader title="ميزان المراجعة" description="تقرير ميزان المراجعة حسب الحسابات">
        <Button variant="outline" onClick={handleExport} disabled={reportData.length === 0}>
          <Download className="h-4 w-4 ml-2" />
          تصدير CSV
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">عدد الحسابات</p>
            <p className="text-2xl font-bold">{reportData.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي المدين</p>
            <p className="text-2xl font-bold">{fmt(totals.totalNetDebit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
            <p className="text-2xl font-bold">{fmt(totals.totalNetCredit)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">التوازن</p>
            <p className={`text-2xl font-bold ${totals.balanced ? 'text-green-600' : 'text-red-600'}`}>
              {totals.balanced ? 'متوازن ✓' : 'غير متوازن ✗'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بكود الحساب أو الاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="نوع الحساب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {Object.entries(typeLabels).map(([k, v]) => (
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
                <TableHead className="text-right">كود الحساب</TableHead>
                <TableHead className="text-right">اسم الحساب</TableHead>
                <TableHead className="text-right">نوع الحساب</TableHead>
                <TableHead className="text-right">إجمالي مدين</TableHead>
                <TableHead className="text-right">إجمالي دائن</TableHead>
                <TableHead className="text-right">صافي مدين</TableHead>
                <TableHead className="text-right">صافي دائن</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    لا توجد قيود محاسبية مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{r.account_code}</TableCell>
                    <TableCell className="font-medium">{r.account_name}</TableCell>
                    <TableCell>{typeLabels[r.account_type] || r.account_type}</TableCell>
                    <TableCell>{fmt(r.debit_total)}</TableCell>
                    <TableCell>{fmt(r.credit_total)}</TableCell>
                    <TableCell className={r.net_debit > 0 ? 'font-medium' : ''}>{r.net_debit > 0 ? fmt(r.net_debit) : '-'}</TableCell>
                    <TableCell className={r.net_credit > 0 ? 'font-medium' : ''}>{r.net_credit > 0 ? fmt(r.net_credit) : '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {reportData.length > 0 && (
              <tfoot>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={3} className="text-right">المجموع</TableCell>
                  <TableCell>{fmt(totals.totalDebit)}</TableCell>
                  <TableCell>{fmt(totals.totalCredit)}</TableCell>
                  <TableCell>{fmt(totals.totalNetDebit)}</TableCell>
                  <TableCell>{fmt(totals.totalNetCredit)}</TableCell>
                </TableRow>
              </tfoot>
            )}
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
