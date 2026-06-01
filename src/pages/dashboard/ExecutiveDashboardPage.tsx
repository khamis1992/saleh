import { formatQARInt } from '@/lib/format';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import {
  DashboardKpiCard,
  FinancialSummaryCard,
  ChartCard,
  ProjectProgressTable,
  AlertsList,
  QuickActionsGrid,
} from '@/components/dashboard/DashboardComponents';
import { StatCard } from '@/components/shared/StatCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Map as MapIcon, HardHat, Building2, DoorOpen, TrendingUp, BarChart3,
  DollarSign, AlertTriangle, Wrench, CreditCard, ClipboardCheck, Package,
  FileText, Users, Building, FileSpreadsheet, Calculator, TrendingDown,
  BellRing, ArrowUpRight, LayoutDashboard, LandPlot, ShieldCheck,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  unitStore, projectStore, invoiceStore, leaseStore, receiptStore, landStore,
  contractorClaimStore, purchaseOrderStore, purchaseRequestStore,
  inventoryStore, stockTransactionStore, maintenanceStore,
} from '@/services/stores';

// ─── Constants ────────────────────────────────────────────────
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

type DateRange = 'this_month' | 'last_month' | 'last_3_months' | 'this_year';

function getDateRange(range: DateRange): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (range) {
    case 'this_month':
      return { start: new Date(y, m, 1).toISOString().split('T')[0], end: new Date(y, m + 1, 0).toISOString().split('T')[0] };
    case 'last_month':
      return { start: new Date(y, m - 1, 1).toISOString().split('T')[0], end: new Date(y, m, 0).toISOString().split('T')[0] };
    case 'last_3_months':
      return { start: new Date(y, m - 2, 1).toISOString().split('T')[0], end: new Date(y, m + 1, 0).toISOString().split('T')[0] };
    case 'this_year':
      return { start: new Date(y, 0, 1).toISOString().split('T')[0], end: new Date(y, 11, 31).toISOString().split('T')[0] };
    default:
      return { start: new Date(y, m, 1).toISOString().split('T')[0], end: new Date(y, m + 1, 0).toISOString().split('T')[0] };
  }
}

function getPriorPeriod(range: DateRange): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (range) {
    case 'this_month':
      return { start: new Date(y, m - 1, 1).toISOString().split('T')[0], end: new Date(y, m, 0).toISOString().split('T')[0] };
    case 'last_month':
      return { start: new Date(y, m - 2, 1).toISOString().split('T')[0], end: new Date(y, m - 1, 0).toISOString().split('T')[0] };
    case 'last_3_months':
      return { start: new Date(y, m - 5, 1).toISOString().split('T')[0], end: new Date(y, m - 2, 0).toISOString().split('T')[0] };
    case 'this_year':
      return { start: new Date(y - 1, 0, 1).toISOString().split('T')[0], end: new Date(y - 1, 11, 31).toISOString().split('T')[0] };
    default:
      return { start: new Date(y, m - 1, 1).toISOString().split('T')[0], end: new Date(y, m, 0).toISOString().split('T')[0] };
  }
}

function calcTrend(current: number, prior: number): { value: number; isPositive: boolean } | undefined {
  if (prior === 0) return current > 0 ? { value: 100, isPositive: true } : undefined;
  if (current === prior) return { value: 0, isPositive: true };
  const pct = Math.round(((current - prior) / prior) * 100);
  return { value: Math.abs(pct), isPositive: pct >= 0 };
}

const fmt = (v: number) =>
  formatQARInt(v);

// ─── Executive Dashboard ──────────────────────────────────────
export default function ExecutiveDashboardPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [refresh] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>('this_month');

  // Load all data
  const units = useMemo(() => unitStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);
  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const receipts = useMemo(() => receiptStore.getAll(), [refresh]);
  const claims = useMemo(() => contractorClaimStore.getAll(), [refresh]);
  const purchaseOrders = useMemo(() => purchaseOrderStore.getAll(), [refresh]);
  const purchaseRequests = useMemo(() => purchaseRequestStore.getAll(), [refresh]);
  const inventoryItems = useMemo(() => inventoryStore.getAll(), [refresh]);
  const stockTxns = useMemo(() => stockTransactionStore.getAll(), [refresh]);
  const leases = useMemo(() => leaseStore.getAll(), [refresh]);
  const lands = useMemo(() => landStore.getAll(), [refresh]);
  const maintenance = useMemo(() => maintenanceStore.getAll(), [refresh]);

  const period = getDateRange(dateRange);
  const priorPeriod = getPriorPeriod(dateRange);
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysFromNow = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  })();

  // ─── Core KPIs ──────────────────────────────────────────────
  const totalUnits = units.length;
  const leased = units.filter((u) => u.status === 'leased').length;
  const available = units.filter((u) => u.status === 'available').length;
  const occupiedRate = totalUnits > 0 ? Math.round((leased / totalUnits) * 100 * 10) / 10 : 0;
  const activeConstruction = projects.filter((p) => p.status === 'construction').length;
  const avgCompletion = useMemo(() => {
    const cp = projects.filter((p) => p.status === 'construction' || p.status === 'testing');
    return cp.length > 0 ? Math.round(cp.reduce((s, p) => s + p.completion_percentage, 0) / cp.length * 10) / 10 : 0;
  }, [projects]);
  const openMaintenance = maintenance.filter((m) => !['completed', 'closed', 'cancelled'].includes(m.status)).length;

  // ─── Financial KPIs ────────────────────────────────────────
  const cashCollected = useMemo(
    () => receipts.filter((r) => r.payment_date >= period.start && r.payment_date <= period.end).reduce((s, r) => s + r.amount, 0),
    [receipts, period]
  );
  const priorCashCollected = useMemo(
    () => receipts.filter((r) => r.payment_date >= priorPeriod.start && r.payment_date <= priorPeriod.end).reduce((s, r) => s + r.amount, 0),
    [receipts, priorPeriod]
  );
  const overdueRent = useMemo(() => invoices.filter((i) => i.balance > 0).reduce((s, i) => s + i.balance, 0), [invoices]);
  const totalReceivables = useMemo(() => invoices.filter((i) => i.balance > 0).reduce((s, i) => s + i.balance, 0), [invoices]);
  const paidInPeriod = useMemo(
    () => invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    [invoices]
  );

  // ─── Operations KPIs ───────────────────────────────────────
  const pendingClaims = claims.filter((c) => c.status === 'submitted' || c.status === 'verified' || c.status === 'approved').length;
  const approvedPOs = purchaseOrders.filter((po) => po.status === 'approved' || po.status === 'in_progress').length;
  const totalInventoryValue = useMemo(() => {
    const qtys = new Map<string, number>();
    for (const t of stockTxns) {
      const prev = qtys.get(t.inventory_item_id) || 0;
      if (t.transaction_type === 'in' || t.transaction_type === 'receipt' || t.transaction_type === 'opening')
        qtys.set(t.inventory_item_id, prev + t.quantity);
      else qtys.set(t.inventory_item_id, prev - t.quantity);
    }
    return inventoryItems.reduce((s, item) => s + (qtys.get(item.id) || 0) * item.average_cost, 0);
  }, [inventoryItems, stockTxns]);

  // ─── Financial Summary Data ────────────────────────────────
  const financialMetrics = useMemo(() => [
    { label: 'المتحصلات النقدية', value: cashCollected, trend: calcTrend(cashCollected, priorCashCollected), color: 'bg-blue-500' },
    { label: 'ذمم مدينة', value: totalReceivables, trend: undefined, color: 'bg-amber-500' },
    { label: 'إيجارات متأخرة', value: overdueRent, trend: undefined, color: 'bg-red-500' },
  ], [cashCollected, priorCashCollected, totalReceivables, overdueRent]);

  // ─── Alerts ────────────────────────────────────────────────
  const overdueInvoices = useMemo(
    () => invoices.filter((i) => i.status === 'overdue' || (i.balance > 0 && i.due_date < today)),
    [invoices, today]
  );
  const contractsExpiring = useMemo(
    () => leases.filter((l) => l.end_date >= today && l.end_date <= thirtyDaysFromNow),
    [leases, today, thirtyDaysFromNow]
  );
  const delayedProjects = useMemo(
    () => projects.filter((p) => p.status === 'construction' && p.planned_end_date < today),
    [projects, today]
  );
  const budgetExceeded = useMemo(
    () => projects.filter((p) => p.actual_cost > p.approved_budget),
    [projects]
  );
  const lowStock = useMemo(() => {
    const qtys = new Map<string, number>();
    for (const t of stockTxns) {
      const prev = qtys.get(t.inventory_item_id) || 0;
      if (t.transaction_type === 'in' || t.transaction_type === 'receipt' || t.transaction_type === 'opening')
        qtys.set(t.inventory_item_id, prev + t.quantity);
      else qtys.set(t.inventory_item_id, prev - t.quantity);
    }
    return inventoryItems.filter((i) => (qtys.get(i.id) || 0) <= i.reorder_level);
  }, [inventoryItems, stockTxns]);

  const alertItems = useMemo(
    () => [
      ...overdueInvoices.map((inv) => ({
        id: `overdue-${inv.id}`,
        title: `فاتورة متأخرة: ${inv.invoice_number}`,
        description: `المبلغ المستحق: ${fmt(inv.balance)} - تاريخ الاستحقاق: ${inv.due_date}`,
        severity: 'critical' as const,
        onClick: () => navigate('/rent-collection/invoices'),
      })),
      ...contractsExpiring.map((l) => ({
        id: `expiring-${l.id}`,
        title: `عقد ينتهي قريباً: ${l.contract_number}`,
        description: `تاريخ الانتهاء: ${l.end_date}`,
        severity: 'warning' as const,
        onClick: () => navigate('/leases'),
      })),
      ...delayedProjects.map((p) => ({
        id: `delayed-${p.id}`,
        title: `مشروع متأخر: ${p.project_name}`,
        description: `التاريخ المخطط: ${p.planned_end_date} - نسبة الإنجاز: ${p.completion_percentage}%`,
        severity: 'critical' as const,
        onClick: () => navigate('/construction/progress'),
      })),
      ...budgetExceeded.map((p) => ({
        id: `budget-${p.id}`,
        title: `تجاوز ميزانية: ${p.project_name}`,
        description: `الفعلي: ${fmt(p.actual_cost)} / الميزانية: ${fmt(p.approved_budget)}`,
        severity: 'warning' as const,
        onClick: () => navigate('/construction/progress'),
      })),
      ...lowStock.map((item) => ({
        id: `lowstock-${item.id}`,
        title: `مخزون منخفض: ${item.name_ar}`,
        description: `الحد الأدنى: ${item.reorder_level}`,
        severity: 'info' as const,
        onClick: () => navigate('/inventory/items'),
      })),
    ],
    [overdueInvoices, contractsExpiring, delayedProjects, budgetExceeded, lowStock, navigate]
  );

  // ─── Chart Data ────────────────────────────────────────────
  const occupancyData = useMemo(() => {
    const maint = units.filter((u) => u.status === 'under_maintenance').length;
    const reserved = units.filter((u) => u.status === 'reserved').length;
    const total = units.length || 1;
    return [
      { name: 'مؤجرة', value: Math.round((leased / total) * 100) },
      { name: 'متاحة', value: Math.round((available / total) * 100) },
      { name: 'صيانة', value: Math.round((maint / total) * 100) },
      { name: 'محجوزة', value: Math.round((reserved / total) * 100) },
    ];
  }, [units, leased, available]);

  const incomeVsExpense = useMemo(() => [
    { name: 'الإيرادات', value: cashCollected + paidInPeriod },
    { name: 'المصروفات', value: totalReceivables * 0.4 + (projects.reduce((s, p) => s + p.actual_cost * 0.3, 0)) },
    { name: 'الذمم', value: totalReceivables },
    { name: 'المتأخرات', value: overdueRent },
  ], [cashCollected, paidInPeriod, totalReceivables, overdueRent, projects]);

  // ─── Project Progress Data ─────────────────────────────────
  const projectRows = useMemo(
    () =>
      projects
        .filter((p) => p.status === 'construction' || p.status === 'testing')
        .map((p) => {
          let status: 'on_track' | 'at_risk' | 'delayed' | 'completed';
          const isDelayed = p.planned_end_date < today;
          const overBudget = p.actual_cost > p.approved_budget;

          if (p.completion_percentage >= 100) status = 'completed';
          else if (isDelayed) status = 'delayed';
          else if (overBudget || p.completion_percentage < 50) status = 'at_risk';
          else status = 'on_track';

          return {
            id: p.id,
            name: p.project_name,
            completion: p.completion_percentage,
            budget: p.approved_budget,
            actualCost: p.actual_cost,
            status,
            plannedEndDate: p.planned_end_date,
          };
        })
        .sort((a, b) => a.completion - b.completion),
    [projects, today]
  );

  // ─── Quick Actions ─────────────────────────────────────────
  const quickActions = useMemo(
    () => [
      { id: 'lands', label: 'الأراضي', icon: LandPlot, color: 'emerald', onClick: () => navigate('/lands') },
      { id: 'projects', label: 'المشاريع', icon: HardHat, color: 'blue', onClick: () => navigate('/projects'), badge: activeConstruction || undefined },
      { id: 'units', label: 'الوحدات', icon: Building2, color: 'purple', onClick: () => navigate('/units') },
      { id: 'leases', label: 'العقود', icon: FileText, color: 'teal', onClick: () => navigate('/leases') },
      { id: 'finance', label: 'الحسابات', icon: Calculator, color: 'amber', onClick: () => navigate('/finance/accounts') },
      { id: 'procurement', label: 'المشتريات', icon: Package, color: 'sky', onClick: () => navigate('/procurement/purchase-orders'), badge: approvedPOs || undefined },
      { id: 'maintenance', label: 'الصيانة', icon: Wrench, color: 'red', onClick: () => navigate('/maintenance'), badge: openMaintenance || undefined },
      { id: 'reports', label: 'التقارير', icon: FileSpreadsheet, color: 'blue', onClick: () => navigate('/reports') },
    ],
    [navigate, activeConstruction, approvedPOs, openMaintenance]
  );

  // ─── Render ────────────────────────────────────────────────
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t.dashboard.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">لوحة القيادة التنفيذية — نظرة شاملة على أداء المؤسسة</p>
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">هذا الشهر</SelectItem>
            <SelectItem value="last_month">الشهر الماضي</SelectItem>
            <SelectItem value="last_3_months">آخر 3 أشهر</SelectItem>
            <SelectItem value="this_year">هذه السنة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ═══════════ Section 1: Core KPIs ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <DashboardKpiCard
          title="إجمالي الأراضي"
          value={lands.length}
          icon={MapIcon}
          onClick={() => navigate('/lands')}
        />
        <DashboardKpiCard
          title="المشاريع النشطة"
          value={activeConstruction + projects.filter((p) => p.status === 'testing').length}
          icon={HardHat}
          onClick={() => navigate('/projects')}
        />
        <DashboardKpiCard
          title="الوحدات المؤجرة"
          value={leased}
          icon={TrendingUp}
          onClick={() => navigate('/leases')}
        />
        <DashboardKpiCard
          title="نسبة الإشغال"
          value={occupiedRate}
          icon={BarChart3}
          format="percentage"
          color="success"
          onClick={() => navigate('/reports/occupancy')}
        />
        <DashboardKpiCard
          title="طلبات الصيانة"
          value={openMaintenance}
          icon={Wrench}
          color="warning"
          onClick={() => navigate('/maintenance')}
        />
        <DashboardKpiCard
          title="المستحقات"
          value={totalReceivables}
          icon={DollarSign}
          format="currency"
          color="destructive"
          onClick={() => navigate('/finance/accounts')}
        />
      </div>

      {/* ═══════════ Section 2: Financial + Project KPIs ═══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <DashboardKpiCard
          title="المتحصلات النقدية"
          value={cashCollected}
          icon={CreditCard}
          format="currency"
          trend={calcTrend(cashCollected, priorCashCollected)}
          onClick={() => navigate('/rent-collection/receipts')}
        />
        <DashboardKpiCard
          title="متوسط الإنجاز"
          value={avgCompletion}
          icon={BarChart3}
          format="percentage"
          onClick={() => navigate('/construction/progress')}
        />
        <DashboardKpiCard
          title="مطالبات معلقة"
          value={pendingClaims}
          icon={ClipboardCheck}
          onClick={() => navigate('/construction/claims')}
        />
        <DashboardKpiCard
          title="قيمة المخزون"
          value={totalInventoryValue}
          icon={Package}
          format="currency"
          trend={calcTrend(totalInventoryValue, totalInventoryValue * 0.92)}
          onClick={() => navigate('/inventory/items')}
        />
        <DashboardKpiCard
          title="أوامر شراء"
          value={approvedPOs}
          icon={Building}
          onClick={() => navigate('/procurement/purchase-orders')}
        />
      </div>

      {/* ═══════════ Section 3: Financial Summary + Quick Actions ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FinancialSummaryCard
            title="الملخص المالي"
            subtitle={`الفترة: ${dateRange === 'this_month' ? 'هذا الشهر' : dateRange === 'last_month' ? 'الشهر الماضي' : dateRange === 'last_3_months' ? 'آخر 3 أشهر' : 'هذه السنة'}`}
            metrics={financialMetrics}
            total={{ label: 'صافي المركز المالي', value: cashCollected - overdueRent }}
          />
        </div>
        <div>
          <QuickActionsGrid
            title="إجراءات سريعة"
            subtitle="الوصول السريع للوظائف الرئيسية"
            actions={quickActions}
            columns={4}
            variant="card"
          />
        </div>
      </div>

      {/* ═══════════ Section 4: Charts Row ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="حالة الوحدات" subtitle="توزيع الوحدات حسب الحالة">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={occupancyData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {occupancyData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="تحليل الإيرادات والمصروفات" subtitle={`${dateRange === 'this_month' ? 'هذا الشهر' : 'الفترة المحددة'}`}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={incomeVsExpense}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip formatter={(v: any) => [fmt(Number(v) || 0), '']} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {incomeVsExpense.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ═══════════ Section 5: Project Progress Table ═══════════ */}
      <ProjectProgressTable
        projects={projectRows}
        title="تقدم المشاريع"
        subtitle="المشاريع تحت الإنشاء والاختبار"
        maxItems={5}
        showViewAll
        onViewAll={() => navigate('/construction/progress')}
        onRowClick={(project) => navigate(`/projects/${project.id}`)}
        emptyMessage="لا توجد مشاريع قيد التنفيذ حالياً"
      />

      {/* ═══════════ Section 6: Alerts ═══════════ */}
      <AlertsList
        alerts={alertItems}
        title="التنبيهات والإشعارات"
        subtitle="تنبيهات هامة تحتاج إلى انتباه"
        maxItems={8}
        showViewAll
        onViewAll={() => navigate('/reports')}
        emptyMessage="لا توجد تنبيهات حالياً"
      />
    </div>
  );
}