import { useState, useMemo } from 'react';
import { formatQARInt } from '@/lib/format';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { payrollStore, employeeStore } from '@/services/stores';

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

function formatMonth(month: string): string {
  const parts = month.split('-');
  if (parts.length === 2) {
    const year = parts[0];
    const monthNum = parts[1];
    return `${monthLabels[monthNum] || monthNum} ${year}`;
  }
  return month;
}

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  approved: 'معتمد',
  paid: 'مدفوع',
  cancelled: 'ملغي',
};

export default function PayrollSummaryReport() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh] = useState(0);

  const payrolls = useMemo(() => payrollStore.getAll(), [refresh]);
  const employees = useMemo(() => employeeStore.getAll(), [refresh]);

  const months = useMemo(() => {
    const set = new Set(payrolls.map((p) => p.payroll_month));
    return Array.from(set).sort().reverse();
  }, [payrolls]);

  const reportData = useMemo(() => {
    return payrolls
      .map((p) => {
        const emp = employees.find((e) => e.id === p.employee_id);
        return {
          id: p.id,
          employee_code: emp?.employee_code || '',
          employee_name: emp?.full_name || '',
          employee_id: p.employee_id,
          month: p.payroll_month,
          basic: p.basic_salary,
          allowances: p.allowances,
          overtime: p.overtime_pay,
          deductions: p.deductions,
          net: p.net_salary,
          status: p.status,
        };
      })
      .filter((d) => {
        if (monthFilter !== 'all' && d.month !== monthFilter) return false;
        if (statusFilter !== 'all' && d.status !== statusFilter) return false;
        if (search && !d.employee_name.includes(search) && !d.employee_code.includes(search)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.month !== b.month) return b.month.localeCompare(a.month);
        return a.employee_name.localeCompare(b.employee_name);
      });
  }, [payrolls, employees, search, monthFilter, statusFilter]);

  const fmt = (v: number) =>
    formatQARInt(v);

  const stats = useMemo(() => {
    const totalBasic = reportData.reduce((s, d) => s + d.basic, 0);
    const totalAllowances = reportData.reduce((s, d) => s + d.allowances, 0);
    const totalOvertime = reportData.reduce((s, d) => s + d.overtime, 0);
    const totalDeductions = reportData.reduce((s, d) => s + d.deductions, 0);
    const totalNet = reportData.reduce((s, d) => s + d.net, 0);
    return { totalBasic, totalAllowances, totalOvertime, totalDeductions, totalNet, count: reportData.length };
  }, [reportData]);

  return (
    <div dir="rtl">
      <PageHeader title="ملخص الرواتب" description="تقرير ملخص الرواتب حسب الموظف" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">عدد السجلات</p>
            <p className="text-2xl font-bold">{stats.count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي الأساسي</p>
            <p className="text-2xl font-bold">{fmt(stats.totalBasic)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي البدلات</p>
            <p className="text-2xl font-bold">{fmt(stats.totalAllowances)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">إجمالي الخصومات</p>
            <p className="text-2xl font-bold text-red-600">{fmt(stats.totalDeductions)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">صافي الرواتب</p>
            <p className="text-2xl font-bold text-green-600">{fmt(stats.totalNet)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث برمز الموظف أو الاسم..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9"
              />
            </div>
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الشهر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأشهر</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={m}>{formatMonth(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
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
                <TableHead className="text-right">رمز الموظف</TableHead>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الشهر</TableHead>
                <TableHead className="text-right">الأساسي</TableHead>
                <TableHead className="text-right">البدلات</TableHead>
                <TableHead className="text-right">العمل الإضافي</TableHead>
                <TableHead className="text-right">الخصومات</TableHead>
                <TableHead className="text-right">الصافي</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    لا توجد سجلات رواتب مطابقة
                  </TableCell>
                </TableRow>
              ) : (
                reportData.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono">{d.employee_code}</TableCell>
                    <TableCell className="font-medium">{d.employee_name}</TableCell>
                    <TableCell>{formatMonth(d.month)}</TableCell>
                    <TableCell>{fmt(d.basic)}</TableCell>
                    <TableCell>{fmt(d.allowances)}</TableCell>
                    <TableCell>{fmt(d.overtime)}</TableCell>
                    <TableCell className="text-red-600">{fmt(d.deductions)}</TableCell>
                    <TableCell className="font-bold">{fmt(d.net)}</TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} label={statusLabels[d.status] || d.status} />
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
