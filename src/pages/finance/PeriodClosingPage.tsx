import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { journalEntryStore, journalEntryLineStore, chartOfAccountsStore } from '@/services/stores';
import { JournalEntry, JournalEntryLine, Account } from '@/types';
import { Lock, LockKeyhole, CheckCircle, AlertTriangle } from 'lucide-react';

const months = [
  { value: '01', label: 'يناير' }, { value: '02', label: 'فبراير' }, { value: '03', label: 'مارس' },
  { value: '04', label: 'أبريل' }, { value: '05', label: 'مايو' }, { value: '06', label: 'يونيو' },
  { value: '07', label: 'يوليو' }, { value: '08', label: 'أغسطس' }, { value: '09', label: 'سبتمبر' },
  { value: '10', label: 'أكتوبر' }, { value: '11', label: 'نوفمبر' }, { value: '12', label: 'ديسمبر' },
];

const years = ['2024', '2025', '2026', '2027'];

export default function PeriodClosingPage() {
  const { t } = useLocale();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const m = String(new Date().getMonth() + 1).padStart(2, '0');
    return m;
  });
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [showConfirm, setShowConfirm] = useState(false);
  const [closingEntries, setClosingEntries] = useState<JournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<{ account: Account; totalDebit: number; totalCredit: number }[]>([]);
  const [calculated, setCalculated] = useState(false);

  const calculateTrialBalance = () => {
    const entries = journalEntryStore.getAll();
    const lines = journalEntryLineStore.getAll();
    const accounts = chartOfAccountsStore.getAll();

    const periodStart = `${selectedYear}-${selectedMonth}-01`;
    // Last day of month
    const lastDay = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
    const periodEnd = `${selectedYear}-${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

    // Filter entries in this period that are posted
    const periodEntries = entries.filter((e) => 
      e.status === 'posted' && 
      e.entry_date >= periodStart && 
      e.entry_date <= periodEnd
    );

    // Compute trial balance by account
    const accountBalances = new Map<string, { debit: number; credit: number }>();
    for (const entry of periodEntries) {
      const entryLines = lines.filter((l) => l.journal_entry_id === entry.id);
      for (const line of entryLines) {
        const existing = accountBalances.get(line.account_id) || { debit: 0, credit: 0 };
        existing.debit += line.debit;
        existing.credit += line.credit;
        accountBalances.set(line.account_id, existing);
      }
    }

    const balance = accounts
      .filter((a) => accountBalances.has(a.id))
      .map((a) => ({
        account: a,
        totalDebit: accountBalances.get(a.id)!.debit,
        totalCredit: accountBalances.get(a.id)!.credit,
      }));

    setTrialBalance(balance);
    setClosingEntries(periodEntries);
    setCalculated(true);
  };

  const closePeriod = () => {
    // Lock all posted entries in the period
    const entriesRaw = localStorage.getItem('erp_journal_entries');
    if (!entriesRaw) return;
    const entries: JournalEntry[] = JSON.parse(entriesRaw);
    const periodStart = `${selectedYear}-${selectedMonth}-01`;
    const lastDay = new Date(Number(selectedYear), Number(selectedMonth), 0).getDate();
    const periodEnd = `${selectedYear}-${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

    const monthLabel = months.find(m => m.value === selectedMonth)?.label || selectedMonth;

    let locked = 0;
    for (const e of entries) {
      if (e.status === 'posted' && e.entry_date >= periodStart && e.entry_date <= periodEnd) {
        (e as any).locked = true;
        (e as any).period_id = `${selectedYear}-${selectedMonth}`;
        locked++;
      }
    }
    localStorage.setItem('erp_journal_entries', JSON.stringify(entries));

    toast.success(`تم إقفال فترة ${monthLabel} ${selectedYear} — تم إقفال ${locked} قيد`);
    setShowConfirm(false);
  };

  const fmt = (v: number) => formatQAR(v);

  const totalDebit = trialBalance.reduce((s, t) => s + t.totalDebit, 0);
  const totalCredit = trialBalance.reduce((s, t) => s + t.totalCredit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="bg-gray-50 min-h-full" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">إقفال الفترة المالية</h1>
          <p className="text-xs text-gray-500 mt-0.5">مراجعة وإقفال الفترات المالية</p>
        </div>
      </div>

      {/* Period Selection */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <Label>الشهر</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>السنة</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={calculateTrialBalance}
              className="bg-[#3B82F6] hover:bg-blue-600"
            >
              حساب ميزان المراجعة
            </Button>
          </div>
        </CardContent>
      </Card>

      {calculated && (
        <>
          {/* Trial Balance */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                ميزان المراجعة — {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                {isBalanced ? (
                  <span className="text-green-600 text-sm flex items-center gap-1"><CheckCircle className="h-4 w-4" />متوازن</span>
                ) : (
                  <span className="text-red-600 text-sm flex items-center gap-1"><AlertTriangle className="h-4 w-4" />غير متوازن</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold">كود الحساب</TableHead>
                      <TableHead className="text-xs font-semibold">اسم الحساب</TableHead>
                      <TableHead className="text-xs font-semibold">نوع الحساب</TableHead>
                      <TableHead className="text-xs font-semibold text-right">مدين</TableHead>
                      <TableHead className="text-xs font-semibold text-right">دائن</TableHead>
                      <TableHead className="text-xs font-semibold text-right">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trialBalance.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          لا توجد قيود مرحلة في هذه الفترة
                        </TableCell>
                      </TableRow>
                    )}
                    {trialBalance.map((tb) => {
                      const balance = tb.totalDebit - tb.totalCredit;
                      return (
                        <TableRow key={tb.account.id}>
                          <TableCell className="font-mono text-sm">{tb.account.account_code}</TableCell>
                          <TableCell className="text-sm">{tb.account.account_name_ar}</TableCell>
                          <TableCell className="text-sm">{tb.account.account_type}</TableCell>
                          <TableCell className="text-sm text-right font-mono">{fmt(tb.totalDebit)}</TableCell>
                          <TableCell className="text-sm text-right font-mono">{fmt(tb.totalCredit)}</TableCell>
                          <TableCell className={`text-sm text-right font-mono font-semibold ${balance >= 0 ? '' : 'text-red-600'}`}>
                            {fmt(Math.abs(balance))} {balance >= 0 ? 'مدين' : 'دائن'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end gap-8 mt-4 pt-4 border-t text-sm">
                <div><span className="text-gray-500">إجمالي المدين: </span><span className="font-mono font-semibold">{fmt(totalDebit)}</span></div>
                <div><span className="text-gray-500">إجمالي الدائن: </span><span className="font-mono font-semibold">{fmt(totalCredit)}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Open Items (entries to be closed) */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                القيود المفتوحة للإقفال ({closingEntries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold">رقم القيد</TableHead>
                      <TableHead className="text-xs font-semibold">التاريخ</TableHead>
                      <TableHead className="text-xs font-semibold">البيان</TableHead>
                      <TableHead className="text-xs font-semibold">الوحدة المصدر</TableHead>
                      <TableHead className="text-xs font-semibold text-right">مدين</TableHead>
                      <TableHead className="text-xs font-semibold text-right">دائن</TableHead>
                      <TableHead className="text-xs font-semibold">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closingEntries.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          لا توجد قيود مفتوحة للإقفال
                        </TableCell>
                      </TableRow>
                    )}
                    {closingEntries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-mono text-sm">{e.entry_number}</TableCell>
                        <TableCell className="text-sm">{e.entry_date}</TableCell>
                        <TableCell className="text-sm max-w-[300px] truncate">{e.description}</TableCell>
                        <TableCell className="text-sm">{e.source_module}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{fmt(e.total_debit)}</TableCell>
                        <TableCell className="text-sm text-right font-mono">{fmt(e.total_credit)}</TableCell>
                        <TableCell>{(e as any).locked ? 'مقفل' : 'مفتوح'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Close Period Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={() => setShowConfirm(true)}
              disabled={closingEntries.length === 0}
              className="gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-red-200"
            >
              <LockKeyhole className="h-5 w-5" />
              إقفال الفترة
            </Button>
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد إقفال الفترة المالية</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>سيتم إقفال جميع القيود المرحلة في فترة {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.</p>
              <p>عدد القيود المتأثرة: <strong>{closingEntries.length}</strong></p>
              <p className="text-red-600 font-medium">تحذير: لا يمكن التراجع عن هذا الإجراء بعد الإقفال.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={closePeriod} className="bg-red-600 hover:bg-red-700">تأكيد الإقفال</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}