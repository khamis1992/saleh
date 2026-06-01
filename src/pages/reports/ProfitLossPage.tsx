import { useState, useMemo } from 'react';
import { formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { exportToCSV } from '@/utils/exportUtils';
import { chartOfAccountsStore, journalEntryStore, journalEntryLineStore } from '@/services/stores';

interface PLRow {
  account_code: string;
  account_name: string;
  amount: number;
}

export default function ProfitLossPage() {
  const { t } = useLocale();
  const [refresh] = useState(0);

  const accounts = useMemo(() => chartOfAccountsStore.getAll(), [refresh]);
  const entries = useMemo(() => journalEntryStore.getAll(), [refresh]);
  const lines = useMemo(() => journalEntryLineStore.getAll(), [refresh]);

  const reportData = useMemo(() => {
    const accountBalances = new Map<string, number>();

    const postedEntries = entries.filter((e) => e.status === 'posted');
    const postedEntryIds = new Set(postedEntries.map((e) => e.id));

    for (const line of lines) {
      if (!postedEntryIds.has(line.journal_entry_id)) continue;
      const prev = accountBalances.get(line.account_id) || 0;
      accountBalances.set(line.account_id, prev + (line.debit || 0) - (line.credit || 0));
    }

    const revenueItems: PLRow[] = [];
    const expenseItems: PLRow[] = [];

    for (const acc of accounts) {
      const bal = accountBalances.get(acc.id) || 0;
      if (bal === 0) continue;
      const row: PLRow = { account_code: acc.account_code, account_name: acc.account_name_ar, amount: Math.abs(bal) };
      if (acc.account_type === 'revenue') {
        row.amount = Math.abs(bal); // credit balance
        revenueItems.push(row);
      } else if (acc.account_type === 'expense') {
        row.amount = Math.abs(bal); // debit balance
        expenseItems.push(row);
      }
    }

    return { revenueItems, expenseItems };
  }, [accounts, entries, lines]);

  const fmt = (v: number) =>
    formatQARInt(v);

  const totals = useMemo(() => {
    const totalRevenue = reportData.revenueItems.reduce((s, r) => s + r.amount, 0);
    const totalExpenses = reportData.expenseItems.reduce((s, r) => s + r.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    return { totalRevenue, totalExpenses, netProfit, isProfit: netProfit >= 0 };
  }, [reportData]);

  const csvColumns = [
    { key: 'account_code', label: 'كود الحساب' },
    { key: 'account_name', label: 'اسم الحساب' },
    { key: 'amount', label: 'المبلغ' },
  ];

  const handleExport = () => {
    const exportData = [
      ...reportData.revenueItems.map((r) => ({ ...r, section: 'إيرادات' })),
      ...reportData.expenseItems.map((r) => ({ ...r, section: 'مصروفات' })),
    ];
    exportToCSV(exportData, [...csvColumns, { key: 'section', label: 'القسم' }], 'قائمة_الدخل.csv');
  };

  return (
    <div dir="rtl">
      <PageHeader title="قائمة الدخل" description="تقرير الأرباح والخسائر">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 ml-2" />
          تصدير CSV
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
            <p className="text-2xl font-bold text-green-600">{fmt(totals.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
            <p className="text-2xl font-bold text-red-600">{fmt(totals.totalExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">صافي {totals.isProfit ? 'الربح' : 'الخسارة'}</p>
            <p className={`text-2xl font-bold ${totals.isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(Math.abs(totals.netProfit))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Section */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="text-lg font-bold mb-4 text-green-700">الإيرادات</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">كود الحساب</TableHead>
                <TableHead className="text-right">اسم الحساب</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.revenueItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                    لا توجد إيرادات مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                reportData.revenueItems.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{r.account_code}</TableCell>
                    <TableCell className="font-medium">{r.account_name}</TableCell>
                    <TableCell>{fmt(r.amount)}</TableCell>
                  </TableRow>
                ))
              )}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={2} className="text-right">إجمالي الإيرادات</TableCell>
                <TableCell>{fmt(totals.totalRevenue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expense Section */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <h2 className="text-lg font-bold mb-4 text-red-700">المصروفات</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">كود الحساب</TableHead>
                <TableHead className="text-right">اسم الحساب</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.expenseItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                    لا توجد مصروفات مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                reportData.expenseItems.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono">{r.account_code}</TableCell>
                    <TableCell className="font-medium">{r.account_name}</TableCell>
                    <TableCell>{fmt(r.amount)}</TableCell>
                  </TableRow>
                ))
              )}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={2} className="text-right">إجمالي المصروفات</TableCell>
                <TableCell>{fmt(totals.totalExpenses)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Net Profit/Loss */}
      <Card>
        <CardContent className={`p-4 ${totals.isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">صافي {totals.isProfit ? 'الربح' : 'الخسارة'}</span>
            <span className={`text-2xl font-bold ${totals.isProfit ? 'text-green-700' : 'text-red-700'}`}>
              {fmt(Math.abs(totals.netProfit))}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
