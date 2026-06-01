import { useState, useMemo } from 'react';
import { formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download } from 'lucide-react';
import { exportToCSV } from '@/utils/exportUtils';
import { journalEntryStore, journalEntryLineStore, chartOfAccountsStore } from '@/services/stores';

const monthLabels: Record<string, string> = {
  '01': 'يناير',
  '02': 'فبراير',
  '03': 'مارس',
  '04': 'أبريل',
  '05': 'مايو',
  '06': 'يونيو',
  '07': 'يوليو',
  '08': 'أغسطس',
  '09': 'سبتمبر',
  '10': 'أكتوبر',
  '11': 'نوفمبر',
  '12': 'ديسمبر',
};

function getMonthKey(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length >= 2) return `${parts[0]}-${parts[1]}`;
  return dateStr;
}

function formatMonth(month: string): string {
  const parts = month.split('-');
  if (parts.length === 2) return `${monthLabels[parts[1]] || parts[1]} ${parts[0]}`;
  return month;
}

interface CashFlowRow {
  month: string;
  inflow: number;
  outflow: number;
  net: number;
  inflowDetails: string[];
  outflowDetails: string[];
}

export default function CashFlowPage() {
  const { t } = useLocale();
  const [refresh] = useState(0);

  const entries = useMemo(() => journalEntryStore.getAll(), [refresh]);
  const lines = useMemo(() => journalEntryLineStore.getAll(), [refresh]);
  const accounts = useMemo(() => chartOfAccountsStore.getAll(), [refresh]);

  const cashAccountIds = useMemo(() => {
    return accounts
      .filter((a) => a.account_code === '1000' || a.account_code === '1100') // النقدية + البنوك
      .map((a) => a.id);
  }, [accounts]);

  const reportData = useMemo(() => {
    const monthMap = new Map<string, CashFlowRow>();

    const postedEntries = entries.filter((e) => e.status === 'posted');
    const postedEntryIds = new Set(postedEntries.map((e) => e.id));

    // Group journal entry lines by entry to understand transactions
    for (const entry of postedEntries) {
      const entryLines = lines.filter((l) => l.journal_entry_id === entry.id);
      const month = getMonthKey(entry.entry_date);

      if (!monthMap.has(month)) {
        monthMap.set(month, { month, inflow: 0, outflow: 0, net: 0, inflowDetails: [], outflowDetails: [] });
      }

      const row = monthMap.get(month)!;
      // Cash inflow: debit to cash accounts
      // Cash outflow: credit from cash accounts
      for (const line of entryLines) {
        if (cashAccountIds.includes(line.account_id)) {
          if (line.credit > 0) {
            row.outflow += line.credit;
            row.outflowDetails.push(entry.description);
          }
          if (line.debit > 0) {
            row.inflow += line.debit;
            row.inflowDetails.push(entry.description);
          }
        }
      }
    }

    const sorted = Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
    for (const row of sorted) {
      row.net = row.inflow - row.outflow;
    }

    return sorted;
  }, [entries, lines, cashAccountIds]);

  const fmt = (v: number) =>
    formatQARInt(v);

  const totals = useMemo(() => {
    const totalInflow = reportData.reduce((s, r) => s + r.inflow, 0);
    const totalOutflow = reportData.reduce((s, r) => s + r.outflow, 0);
    return { totalInflow, totalOutflow, net: totalInflow - totalOutflow };
  }, [reportData]);

  const csvColumns = [
    { key: 'month', label: 'الشهر' },
    { key: 'inflow', label: 'التدفقات الداخلة' },
    { key: 'outflow', label: 'التدفقات الخارجة' },
    { key: 'net', label: 'صافي التدفق' },
  ];

  const handleExport = () => {
    const exportData = reportData.map((r) => ({
      month: formatMonth(r.month),
      inflow: r.inflow,
      outflow: r.outflow,
      net: r.net,
    }));
    exportToCSV(exportData, csvColumns, 'التدفقات_النقدية.csv');
  };

  return (
    <div dir="rtl">
      <PageHeader title="التدفقات النقدية" description="تقرير التدفقات النقدية حسب الشهر">
        <Button variant="outline" onClick={handleExport} disabled={reportData.length === 0}>
          <Download className="h-4 w-4 ml-2" />
          تصدير CSV
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي التدفقات الداخلة</p>
            <p className="text-2xl font-bold text-green-600">{fmt(totals.totalInflow)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي التدفقات الخارجة</p>
            <p className="text-2xl font-bold text-red-600">{fmt(totals.totalOutflow)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">صافي التدفق النقدي</p>
            <p className={`text-2xl font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(totals.net)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الشهر</TableHead>
                <TableHead className="text-right">التدفقات الداخلة</TableHead>
                <TableHead className="text-right">التدفقات الخارجة</TableHead>
                <TableHead className="text-right">صافي التدفق</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    لا توجد حركات نقدية مسجلة
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((r) => (
                  <TableRow key={r.month}>
                    <TableCell className="font-medium">{formatMonth(r.month)}</TableCell>
                    <TableCell className="text-green-600 font-medium">{fmt(r.inflow)}</TableCell>
                    <TableCell className="text-red-600 font-medium">{fmt(r.outflow)}</TableCell>
                    <TableCell className={r.net >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {fmt(r.net)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <tfoot>
              <TableRow className="bg-muted/50 font-bold">
                <TableCell className="text-right">المجموع</TableCell>
                <TableCell className="text-green-600">{fmt(totals.totalInflow)}</TableCell>
                <TableCell className="text-red-600">{fmt(totals.totalOutflow)}</TableCell>
                <TableCell className={totals.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {fmt(totals.net)}
                </TableCell>
              </TableRow>
            </tfoot>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
