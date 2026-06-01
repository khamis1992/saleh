import { formatQARInt } from '@/lib/format';
import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import {
  AlertRow,
  QuickActionCard,
} from '@/components/dashboard/DashboardComponents';
import {
  Map as MapIcon,
  MapPin,
  HardHat,
  Building2,
  DoorOpen,
  Home,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wrench,
  DollarSign,
  CreditCard,
  Package,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  BellRing,
  Bell,
  Clock,
  RefreshCw,
  FileText,
  Calendar,
  Landmark,
  Receipt,
  Users,
  ShieldAlert,
  PieChart,
  FileBarChart,
  Settings,
  CheckCircle2,
  Building,
  Banknote,
  ArrowUp,
  ArrowDown,
  Activity,
  Layers,
  ClipboardList,
  Wallet,
  LayoutDashboard,
  Scale,
  Archive,
  FileSignature,
  ShoppingCart,
} from 'lucide-react';
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  LineChart,
  Line,
} from 'recharts';
import {
  unitStore,
  projectStore,
  invoiceStore,
  leaseStore,
  receiptStore,
  landStore,
  contractorClaimStore,
  purchaseOrderStore,
  purchaseRequestStore,
  inventoryStore,
  stockTransactionStore,
  maintenanceStore,
  employeeStore,
  chequeStore,
  journalEntryStore,
  journalEntryLineStore,
  propertyStore,
} from '@/services/stores';
// ============================================================
// Constants & Helpers
// ============================================================
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316'];
const CHART_GREEN = '#10B981';
const CHART_BLUE = '#3B82F6';
const CHART_ORANGE = '#F59E0B';
const CHART_RED = '#EF4444';
const CHART_PURPLE = '#8B5CF6';
const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
type DateRange = 'this_month' | 'last_month' | 'last_3_months' | 'this_year';
function getDateRange(range: DateRange): { start: string; end: string } {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (range) {
    case 'this_month': return { start: new Date(y, m, 1).toISOString().split('T')[0], end: new Date(y, m + 1, 0).toISOString().split('T')[0] };
    case 'last_month': return { start: new Date(y, m - 1, 1).toISOString().split('T')[0], end: new Date(y, m, 0).toISOString().split('T')[0] };
    case 'last_3_months': return { start: new Date(y, m - 2, 1).toISOString().split('T')[0], end: new Date(y, m + 1, 0).toISOString().split('T')[0] };
    case 'this_year': return { start: new Date(y, 0, 1).toISOString().split('T')[0], end: new Date(y, 11, 31).toISOString().split('T')[0] };
    default: return { start: new Date(y, m, 1).toISOString().split('T')[0], end: new Date(y, m + 1, 0).toISOString().split('T')[0] };
  }
}
const fmt = (v: number) => formatQARInt(v);
const fmtShort = (v: number) => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}م`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}ك`;
  return v.toString();
};
// ============================================================
// KPI Card Component — matches image design
// ============================================================
interface KpiCardProps {
  title: string;
  value: string | number;
  trend?: number; // positive = up, negative = down
  trendLabel?: string;
  icon: React.ElementType;
  iconBg?: string;
  onClick?: () => void;
}
function KpiCard({ title, value, trend, trendLabel, icon: Icon, iconBg = 'bg-blue-500', onClick }: KpiCardProps) {
  const isUp = trend !== undefined && trend >= 0;
  return (
    <div
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all"
      onClick={onClick}
      dir="rtl"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            {isUp ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-800 mt-2 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {typeof value === 'number' && value > 9999 ? fmtShort(value) : value}
      </div>
      <div className="text-xs text-gray-500 mt-1 font-medium">{title}</div>
      {trendLabel && <div className="text-[11px] text-gray-400 mt-0.5">{trendLabel}</div>}
    </div>
  );
}
// ============================================================
// Small KPI Card — second row (more compact)
// ============================================================
function SmallKpiCard({ title, value, icon: Icon, iconBg = 'bg-blue-500', onClick }: Omit<KpiCardProps, 'trend' | 'trendLabel'>) {
  return (
    <div
      className="bg-white rounded-xl px-3 py-3 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all flex items-center gap-3"
      onClick={onClick}
      dir="rtl"
    >
      <div className={`h-9 w-9 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div>
        <div className="text-lg font-bold text-gray-800 ltr-only leading-tight" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
          {typeof value === 'number' && value > 9999 ? fmtShort(value) : value}
        </div>
        <div className="text-[11px] text-gray-500 leading-tight">{title}</div>
      </div>
    </div>
  );
}
// ============================================================
// Progress Bar Row
// ============================================================
function ProgressSection({ title, items }: { title: string; items: { label: string; value: number; max: number; color: string }[] }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100" dir="rtl">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      <div className="space-y-3">
        {items.map((item, i) => {
          const pct = item.max > 0 ? Math.min(Math.round((item.value / item.max) * 100), 100) : 0;
          const display = item.max <= 100 ? `${pct}%` : fmtShort(item.value);
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-600">{item.label}</span>
                <span className="text-xs font-semibold text-gray-700 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {display}
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
// ============================================================
// Chart Card wrapper
// ============================================================
function ChartBox({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100" dir="rtl">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
// ============================================================
// Table Card wrapper
// ============================================================
function TableBox({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden" dir="rtl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
// ============================================================
// Custom Tooltip
// ============================================================
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2" dir="rtl">
      {label && <p className="text-xs font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-600">{entry.name}: </span>
          <span className="font-semibold text-gray-800">{typeof entry.value === 'number' && entry.value > 1000 ? fmtShort(entry.value) : entry.value}</span>
        </div>
      ))}
    </div>
  );
};
// ============================================================
// Status dot
// ============================================================
const StatusDot = ({ color }: { color: string }) => (
  <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
);
// ============================================================
// Main Dashboard Component
// ============================================================
export default function DashboardPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>('this_month');
  // --- Data stores ---
  const units = useMemo(() => unitStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);
  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const receipts = useMemo(() => receiptStore.getAll(), [refresh]);
  const claims = useMemo(() => contractorClaimStore.getAll(), [refresh]);
  const leases = useMemo(() => leaseStore.getAll(), [refresh]);
  const lands = useMemo(() => landStore.getAll(), [refresh]);
  const maintenance = useMemo(() => maintenanceStore.getAll(), [refresh]);
  const employees = useMemo(() => employeeStore.getAll(), [refresh]);
  const cheques = useMemo(() => chequeStore.getAll(), [refresh]);
  const journalEntries = useMemo(() => journalEntryStore.getAll(), [refresh]);
  const journalLines = useMemo(() => journalEntryLineStore.getAll(), [refresh]);
  const inventoryItems = useMemo(() => inventoryStore.getAll(), [refresh]);
  const stockTxns = useMemo(() => stockTransactionStore.getAll(), [refresh]);
  const purchaseOrders = useMemo(() => purchaseOrderStore.getAll(), [refresh]);
  const purchaseRequests = useMemo(() => purchaseRequestStore.getAll(), [refresh]);
  const properties = useMemo(() => propertyStore.getAll(), [refresh]);
  const period = getDateRange(dateRange);
  const today = new Date().toISOString().split('T')[0];
  // ---- Unit stats ----
  const totalUnits = units.length;
  const leased = units.filter(u => u.status === 'leased').length;
  const available = units.filter(u => u.status === 'available').length;
  const underMaintenance = units.filter(u => u.status === 'under_maintenance').length;
  const reserved = units.filter(u => u.status === 'reserved').length;
  const occupiedRate = totalUnits > 0 ? Math.round((leased / totalUnits) * 100) : 0;
  // ---- Project stats ----
  const activeConstruction = projects.filter(p => p.status === 'construction' || p.status === 'testing');
  const delayedProjects = useMemo(() => projects.filter(p => p.status === 'construction' && p.planned_end_date < today), [projects, today]);
  // ---- Financial KPIs ----
  const monthlyIncome = useMemo(() => invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0), [invoices]);
  const overdueAmount = useMemo(() => invoices.filter(i => i.balance > 0).reduce((s, i) => s + i.balance, 0), [invoices]);
  const totalReceivables = overdueAmount;
  const cashCollected = useMemo(() => receipts.reduce((s, r) => s + r.amount, 0), [receipts]);
  const openMaintenance = useMemo(() => maintenance.filter(m => !['completed', 'closed', 'cancelled'].includes(m.status)).length, [maintenance]);
  // ---- Finance stats ----
  const financeStats = useMemo(() => {
    const postedEntries = journalEntries.filter(je => je.status === 'posted');
    let totalRevenue = 0, totalExpenses = 0;
    for (const je of postedEntries) {
      const lines = journalLines.filter(l => l.journal_entry_id === je.id);
      for (const l of lines) {
        if (l.debit > 0 && l.account_id?.startsWith('acc-1') && parseInt(l.account_id.split('-')[1]) >= 15) totalExpenses += l.debit;
        if (l.credit > 0 && l.account_id?.startsWith('acc-1') && parseInt(l.account_id.split('-')[1]) >= 13) totalRevenue += l.credit;
      }
    }
    const actualRevenue = monthlyIncome || totalRevenue;
    return { totalRevenue: actualRevenue, totalExpenses, netIncome: actualRevenue - totalExpenses, cashBalance: cashCollected };
  }, [monthlyIncome, journalEntries, journalLines, cashCollected]);
  // ---- Alert computations ----
  const overdueInvoices = useMemo(() => invoices.filter(i => i.status === 'overdue' || (i.balance > 0 && i.due_date < today)), [invoices, today]);
  const thirtyDaysFromNow = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })();
  const contractsExpiring = useMemo(() => leases.filter(l => l.end_date >= today && l.end_date <= thirtyDaysFromNow), [leases, today, thirtyDaysFromNow]);
  const budgetExceededProjects = useMemo(() => projects.filter(p => p.actual_cost > p.approved_budget), [projects]);
  const pendingContractorClaims = useMemo(() => claims.filter(c => c.status === 'submitted' || c.status === 'verified').length, [claims]);
  const pendingPurchaseOrders = useMemo(() => purchaseOrders.filter(po => po.status === 'draft' || po.status === 'in_progress').length, [purchaseOrders]);
  const maintenanceEmergencies = useMemo(() => maintenance.filter(m => m.priority === 'emergency' || m.priority === 'high').length, [maintenance]);
  const pendingInvoices = useMemo(() => invoices.filter(i => i.status === 'issued' || i.status === 'draft').length, [invoices]);
  const expandedAlertCount = overdueInvoices.length + contractsExpiring.length + delayedProjects.length + budgetExceededProjects.length + pendingContractorClaims + pendingPurchaseOrders + maintenanceEmergencies;
  // ---- Extra KPIs ----
  const avgProjectCompletion = useMemo(() => {
    const cp = projects.filter(p => p.status === 'construction' || p.status === 'testing');
    return cp.length > 0 ? Math.round(cp.reduce((s, p) => s + p.completion_percentage, 0) / cp.length) : 0;
  }, [projects]);
  const constructionInProgressValue = useMemo(() => activeConstruction.reduce((s, p) => s + (p.approved_budget || p.estimated_budget || 0), 0), [activeConstruction]);
  const totalPayables = useMemo(() => claims.filter(c => c.status === 'approved').reduce((s, c) => s + ((c as any).claimed_amount || 0), 0) + purchaseRequests.filter(pr => pr.status === 'pending' || pr.status === 'approved').reduce((s, pr) => s + (pr.estimated_total || 0), 0), [claims, purchaseRequests]);
  // ---- Chart data ----
  const unitStatusData = useMemo(() => [
    { name: 'مؤجرة', value: leased, fill: CHART_GREEN },
    { name: 'متاحة', value: available, fill: CHART_BLUE },
    { name: 'صيانة', value: underMaintenance, fill: CHART_ORANGE },
    { name: 'محجوزة', value: reserved, fill: CHART_PURPLE },
  ], [leased, available, underMaintenance, reserved]);
  const monthlyRentalData = useMemo(() => {
    const base = monthlyIncome > 0 ? Math.round(monthlyIncome / 12) : 40000;
    return AR_MONTHS.slice(0, 6).map((name, i) => {
      const variation = 0.6 + Math.sin((i / 6) * Math.PI) * 0.4;
      return { name, value: Math.round(base * variation * (0.85 + i * 0.05)) };
    });
  }, [monthlyIncome]);
  const collectionsData = useMemo(() => [
    { name: 'مُحصّل', value: cashCollected, fill: CHART_GREEN },
    { name: 'مستحق', value: totalReceivables, fill: CHART_RED },
  ], [cashCollected, totalReceivables]);
  const receivablesAgingData = useMemo(() => {
    const now = new Date();
    const b = { '30 يوم': 0, '60 يوم': 0, '90 يوم': 0, '90+ يوم': 0 };
    for (const inv of invoices) {
      if (inv.balance <= 0) continue;
      const days = Math.floor((now.getTime() - new Date(inv.due_date).getTime()) / 86400000);
      if (days <= 30) b['30 يوم'] += inv.balance;
      else if (days <= 60) b['60 يوم'] += inv.balance;
      else if (days <= 90) b['90 يوم'] += inv.balance;
      else b['90+ يوم'] += inv.balance;
    }
    return Object.entries(b).map(([name, value]) => ({ name, value }));
  }, [invoices]);
  const maintenanceByCategoryData = useMemo(() => {
    const cats = new Map<string, number>();
    for (const m of maintenance) cats.set(m.category || 'أخرى', (cats.get(m.category || 'أخرى') || 0) + 1);
    return Array.from(cats.entries()).slice(0, 5).map(([name, value]) => ({ name, value }));
  }, [maintenance]);
  const occupancyByPropertyData = useMemo(() =>
    properties.map(prop => {
      const pu = units.filter(u => u.property_id === prop.id);
      const rate = pu.length > 0 ? Math.round((pu.filter(u => u.status === 'leased').length / pu.length) * 100) : 0;
      return { name: prop.property_name.substring(0, 10), value: rate };
    }), [properties, units]);
  const doRefresh = useCallback(() => setRefresh(r => r + 1), []);
  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="bg-gray-50 min-h-full" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <KpiCard title="المشاريع قيد الإنشاء" value={activeConstruction.length} trend={-2} trendLabel={`${delayedProjects.length} متأخرة`} icon={HardHat} iconBg="bg-blue-500" onClick={() => navigate('/projects')} />
        <KpiCard title="إجمالي العقارات" value={properties.length} trend={8} trendLabel="عقار مكتمل" icon={Building2} iconBg="bg-blue-600" onClick={() => navigate('/properties')} />
        <KpiCard title="إجمالي الوحدات" value={totalUnits} trend={3} trendLabel={`${leased} مؤجرة`} icon={Building} iconBg="bg-indigo-500" onClick={() => navigate('/units')} />
        <KpiCard title="نسبة الإشغال" value={`${occupiedRate}%`} trend={8} trendLabel="من العام السابق" icon={PieChart} iconBg="bg-violet-500" onClick={() => navigate('/reports/occupancy')} />
        <KpiCard title="دخل الإيجار" value={monthlyIncome} trend={12} trendLabel="من العام السابق" icon={DollarSign} iconBg="bg-emerald-500" onClick={() => navigate('/rent-collection/invoices')} />
        <KpiCard title="الإيرادات المتوقعة" value={overdueAmount} trend={-5} trendLabel={`${overdueInvoices.length} مصادر متأخرة`} icon={AlertTriangle} iconBg="bg-amber-500" onClick={() => navigate('/rent-collection/invoices')} />
        <KpiCard title="طلبات الصيانة" value={openMaintenance} trend={7} trendLabel={`${maintenanceEmergencies} طارئة`} icon={Wrench} iconBg="bg-orange-500" onClick={() => navigate('/maintenance')} />
      </div>
      {/* ── ROW 2: SECONDARY KPI CARDS (8 smaller cards) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3 mb-4">
        <SmallKpiCard title="الوحدات المتاحة" value={available} icon={DoorOpen} iconBg="bg-emerald-500" onClick={() => navigate('/units')} />
        <SmallKpiCard title="الوحدات المؤجرة" value={leased} icon={Home} iconBg="bg-blue-500" onClick={() => navigate('/units')} />
        <SmallKpiCard title="الرصيد النقدي" value={fmtShort(financeStats.cashBalance)} icon={Wallet} iconBg="bg-teal-500" onClick={() => navigate('/finance/accounts')} />
        <SmallKpiCard title="إجمالي الذمم" value={fmtShort(totalReceivables)} icon={Receipt} iconBg="bg-red-500" onClick={() => navigate('/finance/accounts')} />
        <SmallKpiCard title="متوسط الإنجاز" value={`${avgProjectCompletion}%`} icon={Activity} iconBg="bg-violet-500" onClick={() => navigate('/projects')} />
        <SmallKpiCard title="قيمة الإنشاءات" value={fmtShort(constructionInProgressValue)} icon={Layers} iconBg="bg-blue-600" onClick={() => navigate('/construction/progress')} />
        <SmallKpiCard title="إجمالي المطلوبات" value={fmtShort(totalPayables)} icon={Banknote} iconBg="bg-amber-600" onClick={() => navigate('/finance/accounts')} />
        <SmallKpiCard title="فواتير معلقة" value={pendingInvoices} icon={ClipboardList} iconBg="bg-rose-500" onClick={() => navigate('/rent-collection/invoices')} />
      </div>
      {/* ── ROW 3: PROGRESS BARS (4 columns) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <ProgressSection
          title="حالة الوحدات العقارية"
          items={[
            { label: 'مؤجرة', value: leased, max: totalUnits || 1, color: CHART_GREEN },
            { label: 'متاحة', value: available, max: totalUnits || 1, color: CHART_BLUE },
            { label: 'صيانة', value: underMaintenance, max: totalUnits || 1, color: CHART_ORANGE },
          ]}
        />
        <ProgressSection
          title="أداء المشاريع"
          items={projects.slice(0, 3).map(p => ({
            label: p.project_name.substring(0, 14),
            value: p.completion_percentage,
            max: 100,
            color: p.completion_percentage >= 75 ? CHART_GREEN : p.completion_percentage >= 40 ? CHART_BLUE : CHART_ORANGE,
          }))}
        />
        <ProgressSection
          title="نسبة الإشغال حسب العقار"
          items={properties.slice(0, 3).map(prop => {
            const pu = units.filter(u => u.property_id === prop.id);
            const rate = pu.length > 0 ? Math.round((pu.filter(u => u.status === 'leased').length / pu.length) * 100) : 0;
            return { label: prop.property_name.substring(0, 14), value: rate, max: 100, color: rate >= 70 ? CHART_GREEN : rate >= 40 ? CHART_BLUE : CHART_RED };
          })}
        />
        <ProgressSection
          title="التحصيل المالي"
          items={[
            { label: 'الإيرادات', value: financeStats.totalRevenue || monthlyIncome, max: (financeStats.totalRevenue || monthlyIncome) * 1.2 || 1, color: CHART_GREEN },
            { label: 'المصروفات', value: financeStats.totalExpenses, max: (financeStats.totalRevenue || monthlyIncome) * 1.2 || 1, color: CHART_RED },
            { label: 'صافي الدخل', value: Math.max(financeStats.netIncome, 0), max: (financeStats.totalRevenue || monthlyIncome) * 1.2 || 1, color: CHART_BLUE },
          ]}
        />
      </div>
      {/* ── ROW 4: 5 CHARTS IN A ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
        {/* Chart 1: Donut — Unit Status */}
        <ChartBox title="حالة الوحدات" subtitle={`${totalUnits} وحدة`}>
          <div className="relative" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={unitStatusData} cx="50%" cy="45%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {unitStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: 20 }}>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{occupiedRate}%</div>
                <div className="text-[10px] text-gray-400">إشغال</div>
              </div>
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {unitStatusData.map((d, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px] text-gray-600">
                  <StatusDot color={d.fill} />
                  <span>{d.name} ({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </ChartBox>
        {/* Chart 2: Bar — Monthly Rental */}
        <ChartBox title="الدخل الشهري" subtitle="آخر 6 أشهر">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyRentalData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => fmtShort(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="الدخل" fill={CHART_BLUE} radius={[3, 3, 0, 0]} maxBarSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        {/* Chart 3: Donut — Collections */}
        <ChartBox title="التحصيلات" subtitle="مُحصّل / مستحق">
          <div className="relative" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={collectionsData} cx="50%" cy="45%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={4}>
                  {collectionsData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </RechartsPie>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: 20 }}>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                  {collectionsData[0].value + collectionsData[1].value > 0
                    ? `${Math.round((collectionsData[0].value / (collectionsData[0].value + collectionsData[1].value)) * 100)}%`
                    : '0%'}
                </div>
                <div className="text-[10px] text-gray-400">نسبة</div>
              </div>
            </div>
            <div className="mt-1 grid grid-cols-1 gap-1">
              {collectionsData.map((d, i) => (
                <div key={i} className="flex items-center gap-1 text-[10px] text-gray-600">
                  <StatusDot color={d.fill} />
                  <span>{d.name}: {fmtShort(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartBox>
        {/* Chart 4: Bar — Receivables Aging */}
        <ChartBox title="تقادم الذمم" subtitle="توزيع المستحقات">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={receivablesAgingData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => fmtShort(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="المبلغ" radius={[3, 3, 0, 0]} maxBarSize={24}>
                {receivablesAgingData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
        {/* Chart 5: Bar — Occupancy by Property */}
        <ChartBox title="الإشغال حسب العقار" subtitle="نسبة مئوية">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={occupancyByPropertyData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="الإشغال" radius={[3, 3, 0, 0]} maxBarSize={24}>
                {occupancyByPropertyData.map((d, i) => <Cell key={i} fill={d.value >= 70 ? CHART_GREEN : d.value >= 40 ? CHART_BLUE : CHART_RED} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
      {/* ── ROW 5: 4 DATA TABLES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {/* Table 1: Projects */}
        <TableBox
          title="المشاريع الإنشائية"
          action={<button onClick={() => navigate('/construction/progress')} className="text-xs text-blue-500 hover:underline flex items-center gap-1">عرض الكل <ChevronLeft className="h-3 w-3" /></button>}
        >
          <div className="overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">المشروع</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">الإنجاز</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 5).map(p => {
                  const isDelayed = p.status === 'construction' && p.planned_end_date < today;
                  const isOver = p.actual_cost > p.approved_budget;
                  return (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <StatusDot color={isDelayed ? CHART_RED : isOver ? CHART_ORANGE : CHART_GREEN} />
                          <span className="text-gray-700 truncate max-w-[90px]">{p.project_name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-12">
                            <div className="h-1.5 rounded-full" style={{ width: `${p.completion_percentage}%`, backgroundColor: p.completion_percentage >= 75 ? CHART_GREEN : CHART_BLUE }} />
                          </div>
                          <span className="text-gray-500 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{p.completion_percentage}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${isDelayed ? 'bg-red-50 text-red-600' : isOver ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                          {isDelayed ? 'متأخر' : isOver ? 'تجاوز' : 'في المسار'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TableBox>
        {/* Table 2: Latest Invoices */}
        <TableBox
          title="آخر الفواتير"
          action={<button onClick={() => navigate('/rent-collection/invoices')} className="text-xs text-blue-500 hover:underline flex items-center gap-1">عرض الكل <ChevronLeft className="h-3 w-3" /></button>}
        >
          <div className="overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">الفاتورة</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">المبلغ</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {invoices.slice(0, 5).map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/rent-collection/invoices')}>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <StatusDot color={inv.status === 'paid' ? CHART_GREEN : inv.status === 'overdue' ? CHART_RED : CHART_BLUE} />
                        <span className="text-gray-700 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{inv.invoice_number}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-700 ltr-only font-medium" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{fmtShort(inv.total)}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : inv.status === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                        {inv.status === 'paid' ? 'مدفوع' : inv.status === 'overdue' ? 'متأخر' : 'معلق'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableBox>
        {/* Table 3: Maintenance Requests */}
        <TableBox
          title="طلبات الصيانة"
          action={<button onClick={() => navigate('/maintenance')} className="text-xs text-blue-500 hover:underline flex items-center gap-1">عرض الكل <ChevronLeft className="h-3 w-3" /></button>}
        >
          <div className="overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">الطلب</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">الأولوية</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {maintenance.slice(0, 5).map(m => (
                  <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/maintenance')}>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <StatusDot color={m.priority === 'emergency' ? CHART_RED : m.priority === 'high' ? CHART_ORANGE : CHART_BLUE} />
                        <span className="text-gray-700 truncate max-w-[90px]">{m.category || 'عام'}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-medium ${m.priority === 'emergency' ? 'text-red-600' : m.priority === 'high' ? 'text-amber-600' : 'text-blue-600'}`}>
                        {m.priority === 'emergency' ? 'طارئ' : m.priority === 'high' ? 'عالي' : m.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${m.status === 'completed' || m.status === 'closed' ? 'bg-emerald-50 text-emerald-600' : m.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                        {m.status === 'completed' || m.status === 'closed' ? 'مكتمل' : m.status === 'in_progress' ? 'جاري' : 'معلق'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TableBox>
        {/* Table 4: Property ROI */}
        <TableBox
          title="ربحية العقارات"
          action={<button onClick={() => navigate('/reports')} className="text-xs text-blue-500 hover:underline flex items-center gap-1">التقارير <ChevronLeft className="h-3 w-3" /></button>}
        >
          <div className="overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">العقار</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">الإشغال</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-500">العائد</th>
                </tr>
              </thead>
              <tbody>
                {properties.slice(0, 5).map(prop => {
                  const pu = units.filter(u => u.property_id === prop.id);
                  const rate = pu.length > 0 ? Math.round((pu.filter(u => u.status === 'leased').length / pu.length) * 100) : 0;
                  const rev = invoices.filter(i => { const u = units.find(un => un.id === i.unit_id); return u?.property_id === prop.id; }).filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
                  const roi = prop.total_asset_value > 0 ? Math.round((rev / prop.total_asset_value) * 1000) / 10 : 0;
                  return (
                    <tr key={prop.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/properties/${prop.id}`)}>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <StatusDot color={rate >= 70 ? CHART_GREEN : rate >= 40 ? CHART_BLUE : CHART_RED} />
                          <span className="text-gray-700 truncate max-w-[90px]">{prop.property_name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-10">
                            <div className="h-1.5 rounded-full" style={{ width: `${rate}%`, backgroundColor: rate >= 70 ? CHART_GREEN : CHART_BLUE }} />
                          </div>
                          <span className="text-gray-500 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{rate}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-3">
                        <span className={`text-[10px] font-semibold ltr-only ${roi >= 5 ? 'text-emerald-600' : roi >= 0 ? 'text-blue-600' : 'text-red-600'}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
                          {roi}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TableBox>
      </div>
      {/* ── ROW 6: ALERTS (compact) ── */}
      {expandedAlertCount > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BellRing className="h-4 w-4 text-red-500" />
            <h3 className="text-sm font-semibold text-gray-800">التنبيهات والتحذيرات</h3>
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5">
              {expandedAlertCount}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {overdueInvoices.length > 0 && (
              <div onClick={() => navigate('/rent-collection/invoices')} className="border border-red-200 bg-red-50 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-xs font-semibold text-red-700">فواتير متأخرة</span>
                </div>
                <div className="text-lg font-bold text-red-600 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{overdueInvoices.length}</div>
              </div>
            )}
            {contractsExpiring.length > 0 && (
              <div onClick={() => navigate('/leases')} className="border border-amber-200 bg-amber-50 rounded-lg p-3 cursor-pointer hover:bg-amber-100 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">عقود تنتهي</span>
                </div>
                <div className="text-lg font-bold text-amber-600 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{contractsExpiring.length}</div>
              </div>
            )}
            {delayedProjects.length > 0 && (
              <div onClick={() => navigate('/construction/progress')} className="border border-red-200 bg-red-50 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <HardHat className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-xs font-semibold text-red-700">مشاريع متأخرة</span>
                </div>
                <div className="text-lg font-bold text-red-600 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{delayedProjects.length}</div>
              </div>
            )}
            {budgetExceededProjects.length > 0 && (
              <div onClick={() => navigate('/projects')} className="border border-red-200 bg-red-50 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-xs font-semibold text-red-700">تجاوز ميزانية</span>
                </div>
                <div className="text-lg font-bold text-red-600 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{budgetExceededProjects.length}</div>
              </div>
            )}
            {pendingContractorClaims > 0 && (
              <div onClick={() => navigate('/construction/claims')} className="border border-amber-200 bg-amber-50 rounded-lg p-3 cursor-pointer hover:bg-amber-100 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <FileText className="h-3.5 w-3.5 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">مطالبات معلقة</span>
                </div>
                <div className="text-lg font-bold text-amber-600 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{pendingContractorClaims}</div>
              </div>
            )}
            {maintenanceEmergencies > 0 && (
              <div onClick={() => navigate('/maintenance')} className="border border-red-200 bg-red-50 rounded-lg p-3 cursor-pointer hover:bg-red-100 transition-colors">
                <div className="flex items-center gap-1.5 mb-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                  <span className="text-xs font-semibold text-red-700">صيانة طارئة</span>
                </div>
                <div className="text-lg font-bold text-red-600 ltr-only" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{maintenanceEmergencies}</div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── ROW 7: QUICK ACTIONS (8 icon buttons) ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">إجراءات سريعة</h3>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {[
            { label: 'الأراضي', icon: MapPin, color: 'bg-emerald-500', path: '/lands' },
            { label: 'المشاريع', icon: HardHat, color: 'bg-blue-500', path: '/projects' },
            { label: 'العقارات', icon: Building2, color: 'bg-indigo-500', path: '/properties' },
            { label: 'الوحدات', icon: Building, color: 'bg-violet-500', path: '/units' },
            { label: 'المستأجرون', icon: Users, color: 'bg-teal-500', path: '/tenants' },
            { label: 'الفواتير', icon: Receipt, color: 'bg-orange-500', path: '/rent-collection/invoices' },
            { label: 'التقارير', icon: BarChart3, color: 'bg-blue-600', path: '/reports' },
            { label: 'الإعدادات', icon: Settings, color: 'bg-gray-600', path: '/settings' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className={`h-10 w-10 rounded-xl ${item.color} flex items-center justify-center shadow-sm`}>
                <item.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-[11px] font-medium text-gray-600 text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
