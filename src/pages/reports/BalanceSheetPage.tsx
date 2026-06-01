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

interface BSRow {
  account_code: string;
  account_name: string;
  amount: number;
}

export default function BalanceSheetPage() {
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

    const assetItems: BSRow[] = [];
    const liabilityItems: BSRow[] = [];
    const equityItems: BSRow[] = [];

    // Also compute P&L from revenue/expense for retained earnings
    let netPL = 0;

    for (const acc of accounts) {
      const bal = accountBalances.get(acc.id) || 0;
      if (bal === 0) continue;

      const amount = Math.abs(bal);
      if (acc.account_type === 'asset') {
        // Assets: debit balance (positive = debit > credit)
        const net = bal > 0 ? bal : -bal;
        if (Math.abs(net) > 0.001) assetItems.push({ account_code: acc.account_code, account_name: acc.account_name_ar, amount: net });
      } else if (acc.account_type === 'liability') {
        // Liabilities: credit balance (negative = credit > debit)
        const net = bal < 0 ? -bal : -bal;
        const absBal = Math.abs(bal);
        if (absBal > 0.001) liabilityItems.push({ account_code: acc.account_code, account_name: acc.account_name_ar, amount: absBal });
      } else if (acc.account_type === 'equity') {
        const absBal = Math.abs(bal);
        if (absBal > 0.001) equityItems.push({ account_code: acc.account_code, account_name: acc.account_name_ar, amount: absBal });
      } else if (acc.account_type === 'revenue') {
        netPL += Math.abs(bal);
      } else if (acc.account_type === 'expense') {
        netPL -= Math.abs(bal);
      }
    }

    // Add net profit/loss to equity as retained earnings
    if (Math.abs(netPL) > 0.001) {
      equityItems.push({
        account_code: 'P&L',
        account_name: netPL > 0 ? 'صافي ربح الفترة' : 'صافي خسارة الفترة',
        amount: Math.abs(netPL),
      });
    }

    return { assetItems, liabilityItems, equityItems, netPL };
  }, [accounts, entries, lines]);

  const fmt = (v: number) =>
    formatQARInt(v);

  const totals = useMemo(() => {
    const totalAssets = reportData.assetItems.reduce((s, r) => s + r.amount, 0);
    const totalLiabilities = reportData.liabilityItems.reduce((s, r) => s + r.amount, 0);
    const equityTotal = reportData.equityItems.reduce((s, r) => s + r.amount, 0);
    const totalLiabilitiesEquity = totalLiabilities + equityTotal;
    return { totalAssets, totalLiabilities, equityTotal, totalLiabilitiesEquity,
      balanced: Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01 };
  }, [reportData]);

  const csvColumns = [
    { key: 'account_code', label: 'كود الحساب' },
    { key: 'account_name', label: 'اسم الحساب' },
    { key: 'amount', label: 'المبلغ' },
  ];

  const handleExport = () => {
    const exportData = [
      ...reportData.assetItems.map((r) => ({ ...r, section: 'الأصول' })),
      { account_code: '', account_name: 'إجمالي الأصول', amount: totals.totalAssets, section: 'الأصول' },
      ...reportData.liabilityItems.map((r) => ({ ...r, section: 'الخصوم' })),
      { account_code: '', account_name: 'إجمالي الخصوم', amount: totals.totalLiabilities, section: 'الخصوم' },
      ...reportData.equityItems.map((r) => ({ ...r, section: 'حقوق الملكية' })),
      { account_code: '', account_name: 'إجمالي حقوق الملكية', amount: totals.equityTotal, section: 'حقوق الملكية' },
    ];
    exportToCSV(exportData, [...csvColumns, { key: 'section', label: 'القسم' }], 'الميزانية_العمومية.csv');
  };

  return (
    <div dir="rtl">
      <PageHeader title="الميزانية العمومية" description="تقرير المركز المالي">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 ml-2" />
          تصدير CSV
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي الأصول</p>
            <p className="text-2xl font-bold text-blue-600">{fmt(totals.totalAssets)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي الخصوم</p>
            <p className="text-2xl font-bold text-red-600">{fmt(totals.totalLiabilities)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">حقوق الملكية</p>
            <p className="text-2xl font-bold text-green-600">{fmt(totals.equityTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets */}
        <Card>
          <CardContent className="p-4">
            <h2 className="text-lg font-bold mb-4 text-blue-700">الأصول</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">كود الحساب</TableHead>
                  <TableHead className="text-right">اسم الحساب</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.assetItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-4">لا توجد أصول</TableCell>
                  </TableRow>
                ) : (
                  reportData.assetItems.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">{r.account_code}</TableCell>
                      <TableCell className="font-medium">{r.account_name}</TableCell>
                      <TableCell>{fmt(r.amount)}</TableCell>
                    </TableRow>
                  ))
                )}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell colSpan={2} className="text-right">إجمالي الأصول</TableCell>
                  <TableCell>{fmt(totals.totalAssets)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Liabilities + Equity */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-bold mb-4 text-red-700">الخصوم</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">كود الحساب</TableHead>
                    <TableHead className="text-right">اسم الحساب</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.liabilityItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-4">لا توجد خصوم</TableCell>
                    </TableRow>
                  ) : (
                    reportData.liabilityItems.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono">{r.account_code}</TableCell>
                        <TableCell className="font-medium">{r.account_name}</TableCell>
                        <TableCell>{fmt(r.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2} className="text-right">إجمالي الخصوم</TableCell>
                    <TableCell>{fmt(totals.totalLiabilities)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-bold mb-4 text-green-700">حقوق الملكية</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">كود الحساب</TableHead>
                    <TableHead className="text-right">اسم الحساب</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.equityItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-4">لا توجد حقوق ملكية</TableCell>
                    </TableRow>
                  ) : (
                    reportData.equityItems.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono">{r.account_code}</TableCell>
                        <TableCell className="font-medium">{r.account_name}</TableCell>
                        <TableCell>{fmt(r.amount)}</TableCell>
                      </TableRow>
                    ))
                  )}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={2} className="text-right">إجمالي حقوق الملكية</TableCell>
                    <TableCell>{fmt(totals.equityTotal)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Balance check */}
          <Card>
            <CardContent className={`p-4 ${totals.balanced ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">المعادلة المحاسبية</span>
                <span className={`text-lg font-bold ${totals.balanced ? 'text-green-700' : 'text-red-700'}`}>
                  الأصول ({fmt(totals.totalAssets)}) = الخصوم ({fmt(totals.totalLiabilities)}) + حقوق الملكية ({fmt(totals.equityTotal)})
                </span>
              </div>
              <p className={`text-sm mt-1 ${totals.balanced ? 'text-green-600' : 'text-red-600'}`}>
                {totals.balanced ? '✓ الميزانية متوازنة' : `✗ فرق: ${fmt(Math.abs(totals.totalAssets - totals.totalLiabilitiesEquity))}`}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
