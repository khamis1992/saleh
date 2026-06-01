import { formatQARInt } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  leaseStore, invoiceStore, contractorClaimStore, payrollStore,
  workOrderStore, maintenanceStore, employeeStore,
} from '@/services/stores';
import { exportToCSV } from '@/utils/exportUtils';
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  Download, Calendar, ArrowUpRight, ArrowDownRight, Wallet,
  HardHat, Users, Wrench, BarChart3,
} from 'lucide-react';

interface MonthlyCashFlow {
  month: string;
  monthLabel: string;
  rentInflow: number;
  contractorOutflow: number;
  payrollOutflow: number;
  maintenanceOutflow: number;
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  cumulativeCash: number;
  isNegative: boolean;
}

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export default function CashFlowForecastPage() {
  const { t } = useLocale();
  const [refresh] = useState(0);

  const leases = useMemo(() => leaseStore.getAll(), [refresh]);
  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const claims = useMemo(() => contractorClaimStore.getAll(), [refresh]);
  const payrolls = useMemo(() => payrollStore.getAll(), [refresh]);
  const workOrders = useMemo(() => workOrderStore.getAll(), [refresh]);
  const employees = useMemo(() => employeeStore.getAll(), [refresh]);

  const forecast = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-indexed
    const currentYear = now.getFullYear();

    const months: MonthlyCashFlow[] = [];
    let cumulative = 0;

    // Start with current cash position: sum of all collected rent
    const paidInvoices = invoices.filter((i: any) => i.status === 'paid');
    cumulative = paidInvoices.reduce((s: number, i: any) => s + i.total, 0);
    // Subtract paid contractor claims
    const paidClaims = claims.filter((c: any) => c.payment_status === 'paid' || c.status === 'paid');
    cumulative -= paidClaims.reduce((s: number, c: any) => s + (c.net_payable || 0), 0);
    // Subtract paid payroll
    const paidPayroll = payrolls.filter((p: any) => p.status === 'paid');
    cumulative -= paidPayroll.reduce((s: number, p: any) => s + (p.net_salary || 0), 0);
    // Subtract work order costs
    const completedWO = workOrders.filter((w: any) => w.status === 'completed' || w.status === 'tenant_confirmed');
    cumulative -= completedWO.reduce((s: number, w: any) => s + (w.total_cost || 0), 0);

    // Estimate starting cash as 60% of total collected (accounting for other expenses)
    cumulative = Math.round(cumulative * 0.6);
    if (cumulative < 0) cumulative = 0;

    // Calculate monthly payroll (average from active employees)
    const activeEmployees = employees.filter((e: any) => e.status === 'active');
    const monthlyPayrollEstimate = activeEmployees.reduce((s: number, e: any) =>
      s + (e.salary || 0) + (e.allowances || 0), 0);

    // Average monthly maintenance cost
    const avgMonthlyMaintenance = workOrders.reduce((s: number, w: any) =>
      s + (w.total_cost || 0), 0) / Math.max(1, workOrders.length);

    // Active leases - project monthly rent
    const activeLeases = leases.filter(l => l.status === 'active');
    const monthlyRentMap = new Map<number, number>();

    activeLeases.forEach(l => {
      let monthlyRent = 0;
      switch (l.payment_frequency) {
        case 'monthly': monthlyRent = l.rent_amount; break;
        case 'quarterly': monthlyRent = Math.round(l.rent_amount / 3); break;
        case 'semi_annual': monthlyRent = Math.round(l.rent_amount / 6); break;
        case 'annual': monthlyRent = Math.round(l.rent_amount / 12); break;
        default: monthlyRent = Math.round(l.rent_amount / 12);
      }
      // Distribute across next 12 months, but only if lease hasn't ended
      const endDate = new Date(l.end_date);
      for (let m = 0; m < 12; m++) {
        const forecastDate = new Date(currentYear, currentMonth + m, 1);
        if (forecastDate <= endDate) {
          const key = m;
          monthlyRentMap.set(key, (monthlyRentMap.get(key) || 0) + monthlyRent);
        }
      }
    });

    // Pending contractor claims - approximate when they'll be paid
    const pendingClaims = claims.filter(c =>
      c.status === 'submitted' || c.status === 'verified' || c.status === 'approved');
    const totalPendingClaims = pendingClaims.reduce((s, c) => s + (c.net_payable || 0), 0);
    // Assume paid over next 3 months
    const monthlyClaimOutflow = Math.round(totalPendingClaims / 3);

    for (let m = 0; m < 12; m++) {
      const fDate = new Date(currentYear, currentMonth + m, 1);
      const monthKey = `${fDate.getFullYear()}-${String(fDate.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${monthNames[fDate.getMonth()]} ${fDate.getFullYear()}`;

      const rentInflow = monthlyRentMap.get(m) || 0;
      const contractorOutflow = m < 3 ? monthlyClaimOutflow : 0;
      const payrollOutflow = monthlyPayrollEstimate;
      const maintenanceOutflow = Math.round(avgMonthlyMaintenance);

      const totalInflow = rentInflow;
      const totalOutflow = contractorOutflow + payrollOutflow + maintenanceOutflow;
      const netCashFlow = totalInflow - totalOutflow;
      cumulative += netCashFlow;

      months.push({
        month: monthKey,
        monthLabel,
        rentInflow,
        contractorOutflow,
        payrollOutflow,
        maintenanceOutflow,
        totalInflow,
        totalOutflow,
        netCashFlow,
        cumulativeCash: cumulative,
        isNegative: cumulative < 0,
      });
    }

    return months;
  }, [leases, invoices, claims, payrolls, workOrders, employees]);

  const fmt = (v: number) =>
    formatQARInt(v);

  const totals = useMemo(() => ({
    totalRentInflow: forecast.reduce((s, m) => s + m.rentInflow, 0),
    totalContractorOutflow: forecast.reduce((s, m) => s + m.contractorOutflow, 0),
    totalPayrollOutflow: forecast.reduce((s, m) => s + m.payrollOutflow, 0),
    totalMaintenanceOutflow: forecast.reduce((s, m) => s + m.maintenanceOutflow, 0),
    totalInflow: forecast.reduce((s, m) => s + m.totalInflow, 0),
    totalOutflow: forecast.reduce((s, m) => s + m.totalOutflow, 0),
    netTotal: forecast.reduce((s, m) => s + m.netCashFlow, 0),
    negativeMonthsCount: forecast.filter(m => m.isNegative).length,
  }), [forecast]);

  const maxAbsValue = useMemo(() => {
    const maxIn = Math.max(...forecast.map(m => m.totalInflow), 0);
    const maxOut = Math.max(...forecast.map(m => m.totalOutflow), 0);
    return Math.max(maxIn, maxOut, 1);
  }, [forecast]);

  const handleExport = () => {
    const data = forecast.map(m => ({
      month: m.monthLabel,
      rentInflow: m.rentInflow,
      contractorOutflow: m.contractorOutflow,
      payrollOutflow: m.payrollOutflow,
      maintenanceOutflow: m.maintenanceOutflow,
      totalInflow: m.totalInflow,
      totalOutflow: m.totalOutflow,
      netCashFlow: m.netCashFlow,
      cumulativeCash: m.cumulativeCash,
    }));
    exportToCSV(data, [
      { key: 'month', label: 'الشهر' },
      { key: 'rentInflow', label: 'إيرادات الإيجار' },
      { key: 'contractorOutflow', label: 'مدفوعات المقاولين' },
      { key: 'payrollOutflow', label: 'الرواتب' },
      { key: 'maintenanceOutflow', label: 'الصيانة' },
      { key: 'totalInflow', label: 'إجمالي التدفق الداخل' },
      { key: 'totalOutflow', label: 'إجمالي التدفق الخارج' },
      { key: 'netCashFlow', label: 'صافي التدفق' },
      { key: 'cumulativeCash', label: 'الرصيد التراكمي' },
    ], 'توقعات_التدفقات_النقدية.csv');
  };

  return (
    <div dir="rtl" className="space-y-6">
      <PageHeader
        title="توقعات التدفقات النقدية"
        description="توقعات التدفقات النقدية للـ 12 شهراً القادمة بناءً على العقود النشطة والالتزامات القائمة"
      >
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 ml-2" />
          تصدير CSV
        </Button>
      </PageHeader>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">إجمالي التدفقات الداخلة</span>
            </div>
            <p className="text-xl font-bold text-green-600">{fmt(totals.totalInflow)}</p>
            <p className="text-xs text-muted-foreground mt-1">خلال 12 شهراً</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">إجمالي التدفقات الخارجة</span>
            </div>
            <p className="text-xl font-bold text-red-600">{fmt(totals.totalOutflow)}</p>
            <p className="text-xs text-muted-foreground mt-1">مقاولين + رواتب + صيانة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">صافي التدفق المتوقع</span>
            </div>
            <p className={`text-xl font-bold ${totals.netTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(totals.netTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">12 شهر</p>
          </CardContent>
        </Card>
        <Card className={totals.negativeMonthsCount > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={`h-4 w-4 ${totals.negativeMonthsCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
              <span className="text-sm text-muted-foreground">أشهر سالبة</span>
            </div>
            <p className={`text-xl font-bold ${totals.negativeMonthsCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {totals.negativeMonthsCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {totals.negativeMonthsCount > 0 ? 'تحذير: يوجد عجز نقدي' : 'جميع الأشهر إيجابية'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Negative Cash Alerts */}
      {totals.negativeMonthsCount > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-800 mb-1">تحذير: توقعات بعجز نقدي</h3>
                <p className="text-sm text-red-700">
                  يوجد {totals.negativeMonthsCount} أشهر متوقعة بعجز نقدي خلال الـ 12 شهراً القادمة:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {forecast.filter(m => m.isNegative).map(m => (
                    <span key={m.month} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      {m.monthLabel} ({fmt(m.cumulativeCash)})
                    </span>
                  ))}
                </div>
                <p className="text-xs text-red-600 mt-2">
                  ينصح بمراجعة الذمم المدينة، تسريع التحصيل، أو تقليل المصروفات غير الضرورية خلال هذه الفترة.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart Visualization */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            مخطط التدفقات النقدية الشهري
          </h3>
          <div className="space-y-3">
            {forecast.map((m, i) => (
              <div key={m.month} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium w-24">{m.monthLabel}</span>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-600">داخل: {fmt(m.totalInflow)}</span>
                    <span className="text-red-600">خارج: {fmt(m.totalOutflow)}</span>
                    <span className={`font-bold ${m.netCashFlow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      صافي: {fmt(m.netCashFlow)}
                    </span>
                    <span className={`font-bold ${m.cumulativeCash >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      تراكمي: {fmt(m.cumulativeCash)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1 h-6">
                  {/* Inflow bar */}
                  <div
                    className="bg-green-400 rounded-sm h-full transition-all duration-300 flex items-center justify-center text-xs text-white font-bold"
                    style={{ width: `${Math.max(1, (m.totalInflow / maxAbsValue) * 100)}%`, minWidth: '20px' }}
                  >
                    {m.totalInflow > 0 ? '▼' : ''}
                  </div>
                  {/* Outflow bar */}
                  <div
                    className="bg-red-400 rounded-sm h-full transition-all duration-300 flex items-center justify-center text-xs text-white font-bold"
                    style={{ width: `${Math.max(1, (m.totalOutflow / maxAbsValue) * 100)}%`, minWidth: '20px' }}
                  >
                    {m.totalOutflow > 0 ? '▲' : ''}
                  </div>
                  {/* Net indicator */}
                  <div className="flex-1 relative">
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-1 rounded ${m.cumulativeCash >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                      title={`الرصيد التراكمي: ${fmt(m.cumulativeCash)}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 rounded-sm" /> التدفقات الداخلة
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-400 rounded-sm" /> التدفقات الخارجة
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-1 bg-blue-500 rounded" /> الرصيد التراكمي
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Trend - Cumulative Line Chart (text-based) */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            مسار الرصيد النقدي التراكمي
          </h3>
          <div className="space-y-1">
            {forecast.map((m, i) => {
              const maxCum = Math.max(...forecast.map(f => Math.abs(f.cumulativeCash)), 1);
              const pct = Math.max(0, Math.min(100, ((m.cumulativeCash + maxCum) / (2 * maxCum)) * 100));
              return (
                <div key={m.month} className="flex items-center gap-2 text-xs">
                  <span className="w-24 font-medium">{m.monthLabel}</span>
                  <div className="flex-1 h-4 bg-gray-100 rounded-full relative overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${m.cumulativeCash >= 0 ? 'bg-blue-500' : 'bg-red-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`w-24 text-left font-bold ${m.cumulativeCash >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {fmt(m.cumulativeCash)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown Table */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-lg mb-4">تفاصيل التدفقات الشهرية</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الشهر</TableHead>
                  <TableHead className="text-right">إيرادات الإيجار</TableHead>
                  <TableHead className="text-right">المقاولين</TableHead>
                  <TableHead className="text-right">الرواتب</TableHead>
                  <TableHead className="text-right">الصيانة</TableHead>
                  <TableHead className="text-right">إجمالي داخل</TableHead>
                  <TableHead className="text-right">إجمالي خارج</TableHead>
                  <TableHead className="text-right">صافي التدفق</TableHead>
                  <TableHead className="text-right">الرصيد التراكمي</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forecast.map(m => (
                  <TableRow key={m.month} className={m.isNegative ? 'bg-red-50' : ''}>
                    <TableCell className="font-medium">{m.monthLabel}</TableCell>
                    <TableCell className="text-green-600">{fmt(m.rentInflow)}</TableCell>
                    <TableCell className="text-red-600">{fmt(m.contractorOutflow)}</TableCell>
                    <TableCell className="text-red-600">{fmt(m.payrollOutflow)}</TableCell>
                    <TableCell className="text-red-600">{fmt(m.maintenanceOutflow)}</TableCell>
                    <TableCell className="text-green-600 font-medium">{fmt(m.totalInflow)}</TableCell>
                    <TableCell className="text-red-600 font-medium">{fmt(m.totalOutflow)}</TableCell>
                    <TableCell className={m.netCashFlow >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                      {fmt(m.netCashFlow)}
                    </TableCell>
                    <TableCell className={m.cumulativeCash >= 0 ? 'text-blue-600 font-bold' : 'text-red-600 font-bold'}>
                      {fmt(m.cumulativeCash)}
                      {m.isNegative && ' ⚠️'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <tfoot>
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>المجموع</TableCell>
                  <TableCell className="text-green-600">{fmt(totals.totalRentInflow)}</TableCell>
                  <TableCell className="text-red-600">{fmt(totals.totalContractorOutflow)}</TableCell>
                  <TableCell className="text-red-600">{fmt(totals.totalPayrollOutflow)}</TableCell>
                  <TableCell className="text-red-600">{fmt(totals.totalMaintenanceOutflow)}</TableCell>
                  <TableCell className="text-green-600">{fmt(totals.totalInflow)}</TableCell>
                  <TableCell className="text-red-600">{fmt(totals.totalOutflow)}</TableCell>
                  <TableCell className={totals.netTotal >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {fmt(totals.netTotal)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </tfoot>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Data Source Summary */}
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-lg mb-4">مصادر بيانات التوقعات</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">عقود الإيجار النشطة</span>
              </div>
              <p className="text-2xl font-bold text-green-700">
                {leases.filter(l => l.status === 'active').length}
              </p>
              <p className="text-xs text-green-600 mt-1">عقد نشط يُدر إيرادات</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <HardHat className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-800">مطالبات مقاولين معلقة</span>
              </div>
              <p className="text-2xl font-bold text-amber-700">
                {claims.filter(c => c.status === 'submitted' || c.status === 'verified' || c.status === 'approved').length}
              </p>
              <p className="text-xs text-amber-600 mt-1">
                {fmt(claims.filter(c => c.status === 'submitted' || c.status === 'verified' || c.status === 'approved')
                  .reduce((s, c) => s + (c.net_payable || 0), 0))} إجمالي المستحق
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">الرواتب الشهرية</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {fmt(employees.filter(e => e.status === 'active').reduce((s, e) => s + (e.salary || 0) + (e.allowances || 0), 0))}
              </p>
              <p className="text-xs text-blue-600 mt-1">{employees.filter(e => e.status === 'active').length} موظف نشط</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Wrench className="h-4 w-4 text-purple-600" />
                <span className="font-medium text-purple-800">الصيانة (متوسط شهري)</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">
                {fmt(workOrders.reduce((s, w) => s + (w.total_cost || 0), 0) / Math.max(1, workOrders.length))}
              </p>
              <p className="text-xs text-purple-600 mt-1">{workOrders.length} أمر عمل مسجل</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}