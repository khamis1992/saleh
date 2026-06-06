import { useMemo, useState, useEffect } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/providers/RoleContext';
import { getTasks, deriveTasksFromData, markTaskDone } from '@/services/tasks';
import { formatQARInt } from '@/lib/format';
import {
  ClipboardList, AlertTriangle, CheckCircle2, DollarSign, Wrench, HardHat,
  Building2, ChevronDown, ChevronUp, Flame, Package, Check, ArrowRight,
  LayoutDashboard, Users, Home, TrendingUp, Bell, CalendarDays,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';
import {
  invoiceStore, receiptStore, leaseStore, maintenanceStore,
  propertyStore, unitStore, projectStore, inventoryStore,
} from '@/services/stores';

/* ──────────────── Types ──────────────── */
interface TaskRow {
  id: string; title: string; module: string; priority: string;
  category: string; status: string; link?: string;
}

/* ──────────────── Category Registry ──────────────── */
const CAT = {
  collection:   { label: 'تحصيل',    icon: DollarSign,    accent: 'text-emerald-600', stripe: 'bg-emerald-500', bg: 'bg-emerald-50' },
  maintenance:  { label: 'صيانة',    icon: Wrench,        accent: 'text-orange-600',  stripe: 'bg-orange-500',  bg: 'bg-orange-50' },
  approval:     { label: 'اعتمادات', icon: CheckCircle2,  accent: 'text-violet-600',  stripe: 'bg-violet-500',  bg: 'bg-violet-50' },
  project:      { label: 'مشاريع',   icon: HardHat,       accent: 'text-indigo-600',  stripe: 'bg-indigo-500',  bg: 'bg-indigo-50' },
  contract:     { label: 'عقود',     icon: ClipboardList, accent: 'text-sky-600',     stripe: 'bg-sky-500',     bg: 'bg-sky-50' },
  inventory:    { label: 'مخزون',    icon: Package,        accent: 'text-amber-600',  stripe: 'bg-amber-500',  bg: 'bg-amber-50' },
  followup:     { label: 'متابعة',   icon: Package,        accent: 'text-amber-600',  stripe: 'bg-amber-500',  bg: 'bg-amber-50' },
};
const CAT_DEF = { label: 'أخرى', icon: ClipboardList, accent: 'text-gray-600', stripe: 'bg-gray-400', bg: 'bg-gray-100' };

const CATEGORY_LINK: Record<string, string> = {
  collection: '/rent-collection/invoices',  maintenance: '/maintenance/requests',
  approval: '/queues/approvals', inventory: '/inventory/items', followup: '/inventory/items',
  contract: '/leases', project: '/projects',
};

/* ──────────────── Quick Actions By Role ──────────────── */
const QUICK_ACTIONS: Record<string, { label: string; href: string; icon: React.ElementType; gradient: string }[]> = {
  collection: [
    { label: 'تسجيل دفعة', href: '/wizards/payment', icon: DollarSign, gradient: 'from-emerald-400 to-emerald-600' },
    { label: 'المتأخرات', href: '/queues/collection', icon: AlertTriangle, gradient: 'from-red-400 to-red-600' },
  ],
  leasing: [
    { label: 'مستأجر جديد', href: '/tenants/create', icon: Users, gradient: 'from-violet-400 to-violet-600' },
    { label: 'عقد جديد', href: '/wizards/lease', icon: ClipboardList, gradient: 'from-emerald-400 to-emerald-600' },
  ],
  maintenance: [
    { label: 'طلب صيانة', href: '/wizards/maintenance', icon: Wrench, gradient: 'from-orange-400 to-orange-600' },
    { label: 'أوامر العمل', href: '/maintenance/work-orders', icon: ClipboardList, gradient: 'from-indigo-400 to-indigo-600' },
  ],
  construction: [
    { label: 'تقرير يومي', href: '/construction/daily-reports', icon: ClipboardList, gradient: 'from-indigo-400 to-indigo-600' },
    { label: 'طلب مواد', href: '/wizards/purchase-request', icon: Package, gradient: 'from-amber-400 to-amber-600' },
  ],
  finance: [
    { label: 'تسجيل قيد', href: '/finance/journal-entries', icon: ClipboardList, gradient: 'from-indigo-400 to-indigo-600' },
    { label: 'تسجيل دفعة', href: '/wizards/payment', icon: DollarSign, gradient: 'from-emerald-400 to-emerald-600' },
  ],
  default: [
    { label: 'لوحة التحكم', href: '/dashboard', icon: LayoutDashboard, gradient: 'from-indigo-400 to-indigo-600' },
    { label: 'التقارير', href: '/reports', icon: TrendingUp, gradient: 'from-emerald-400 to-emerald-600' },
  ],
};

/* ──────────────── KPI Card ──────────────── */
function KpiBox({ icon: Icon, label, value, trend, color }: {
  icon: React.ElementType; label: string; value: string | number;
  trend?: { dir: 'up' | 'down'; pct: number }; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border border-[#e5edf5] shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', color)}>
          <Icon className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="text-xs font-medium text-[#64748d]">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold text-[#061b31] ltr-only" style={{ direction: 'ltr', fontFamily: "'Inter', system-ui, sans-serif" }}>
          {value}
        </span>
        {trend && (
          <span className={cn('text-xs font-semibold flex items-center gap-0.5', trend.dir === 'up' ? 'text-emerald-600' : 'text-red-500')}>
            {trend.dir === 'up' ? '↑' : '↓'} {trend.pct}%
          </span>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN — ERP HOMEPAGE
   ═══════════════════════════════════════════ */
export default function MyWorkPage() {
  const { dir } = useLocale();
  const { role } = useRole();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => { localStorage.setItem('erp_onboarding_done', 'true'); }, []);

  useEffect(() => {
    deriveTasksFromData();
    setTasks(getTasks().filter((t: any) => t.status === 'open' || t.status === 'in_progress'));
  }, [refresh]);

  useEffect(() => {
    const id = setInterval(() => setRefresh(r => r + 1), 10000);
    return () => clearInterval(id);
  }, []);

  /* ── Live store data for KPIs ── */
  const invoices = useMemo(() => invoiceStore.getAll(), [refresh]);
  const leases = useMemo(() => leaseStore.getAll(), [refresh]);
  const maintenance = useMemo(() => maintenanceStore.getAll(), [refresh]);
  const properties = useMemo(() => propertyStore.getAll(), [refresh]);
  const units = useMemo(() => unitStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);
  const inventoryItems = useMemo(() => inventoryStore.getAll(), [refresh]);
  const receipts = useMemo(() => receiptStore.getAll(), [refresh]);

  /* ── KPIs ── */
  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDays = (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })();

  const activeLeases = leases.filter(l => l.status === 'active').length;
  const expiringLeases = leases.filter(l => l.status === 'active' && l.end_date >= todayStr && l.end_date <= thirtyDays).length;
  const openMaintenance = maintenance.filter(m => !['completed', 'closed', 'cancelled'].includes(m.status)).length;
  const activeProjects = projects.filter(p => p.status === 'construction' || p.status === 'testing').length;
  const lowStock = inventoryItems.filter(i => (i.minimum_stock || 0) <= (i.reorder_level || 0)).length;
  const overdueAmount = invoices.filter(i => i.balance > 0 || i.status === 'overdue').reduce((s, i) => s + (i.balance || i.total), 0);
  const occupancyRate = (() => {
    const leased = units.filter(u => u.status === 'leased').length;
    return units.length > 0 ? Math.round((leased / units.length) * 100) : 0;
  })();
  const collectionRate = (() => {
    const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
    const collected = receipts.reduce((s, r) => s + r.amount, 0);
    return totalInvoiced > 0 ? Math.round((collected / totalInvoiced) * 100) : 0;
  })();

  /* ── Tasks ── */
  const urgent = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high');
  const today = tasks.filter(t => t.priority === 'medium');
  const upcoming = tasks.filter(t => t.priority === 'low');
  const visibleUrgent = urgent.filter(t => !dismissed.has(t.id));
  const urgentCount = visibleUrgent.filter(t => t.priority === 'urgent').length;

  const urgentByCategory = useMemo(() => {
    const groups: Record<string, TaskRow[]> = {};
    visibleUrgent.forEach(task => {
      const cat = task.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(task);
    });
    Object.values(groups).forEach(g => g.sort((a, b) =>
      (a.priority === 'urgent' ? -1 : 1) - (b.priority === 'urgent' ? -1 : 1)
    ));
    return Object.fromEntries(
      Object.entries(groups).sort(([, a], [, b]) =>
        (b.filter(t => t.priority === 'urgent').length - a.filter(t => t.priority === 'urgent').length) || (b.length - a.length)
      )
    );
  }, [visibleUrgent]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const init: Record<string, boolean> = {};
    Object.entries(urgentByCategory).forEach(([cat, ts]) => { init[cat] = ts.length > 4; });
    setCollapsed(init);
  }, []);

  const roleActions = QUICK_ACTIONS[{
    accountant: 'finance', property_manager: 'leasing',
    maintenance_manager: 'maintenance', technician: 'maintenance', project_manager: 'construction',
  }[role] || 'default'];

  const date = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const fmt = formatQARInt;

  return (
    <div className="bg-[#f6f9fc] min-h-full" dir={dir}>
      {/* ═══════════ WELCOME BANNER ═══════════ */}
      <div className="bg-white rounded-2xl border border-[#e5edf5] shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#061b31]">👋 مرحباً بك</h1>
            <p className="text-sm text-[#64748d] mt-1">{date}</p>
            {urgentCount > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="h-2 w-2 rounded-full bg-[#ea2261] animate-pulse" />
                <p className="text-sm font-semibold text-[#ea2261]">
                  {urgentCount} {urgentCount === 1 ? 'مهمة عاجلة' : 'مهام عاجلة'} بحاجة لانتباهك
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-3xl font-bold text-[#061b31] ltr-only" style={{ direction: 'ltr', fontFamily: "'Inter', system-ui, sans-serif" }}>
              {tasks.length}
            </div>
            <div className="text-xs text-[#64748d]">مهمة معلقة</div>
          </div>
        </div>
      </div>

      {/* ═══════════ KPI GRID ═══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiBox icon={Home} label="نسبة الإشغال" value={`${occupancyRate}%`}
          trend={{ dir: occupancyRate >= 70 ? 'up' : 'down', pct: occupancyRate }}
          color="bg-indigo-500" />
        <KpiBox icon={DollarSign} label="نسبة التحصيل" value={`${collectionRate}%`}
          trend={{ dir: collectionRate >= 70 ? 'up' : 'down', pct: collectionRate }}
          color="bg-emerald-500" />
        <KpiBox icon={Building2} label="العقود النشطة" value={activeLeases}
          color="bg-violet-500" />
        <KpiBox icon={Wrench} label="صيانة مفتوحة" value={openMaintenance}
          color="bg-orange-500" />
        <KpiBox icon={HardHat} label="مشاريع نشطة" value={activeProjects}
          color="bg-sky-500" />
        <KpiBox icon={Package} label="مخزون منخفض" value={lowStock}
          trend={lowStock > 0 ? { dir: 'down', pct: lowStock } : undefined}
          color="bg-amber-500" />
        <KpiBox icon={ClipboardList} label="عقود تنتهي" value={expiringLeases}
          color="bg-rose-500" />
        <KpiBox icon={DollarSign} label="متأخرات" value={fmt(overdueAmount)}
          color="bg-red-500" />
      </div>

      {/* ═══════════ QUICK ACTIONS + URGENT SPLIT ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Quick Actions */}
        <div>
          <h3 className="text-sm font-bold text-[#64748d] mb-3 uppercase tracking-wide">⚡ إجراءات سريعة</h3>
          <div className="grid grid-cols-2 gap-2">
            {roleActions.map((a, i) => (
              <button
                key={i}
                onClick={() => navigate(a.href)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white border border-[#e5edf5] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className={cn('h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center', a.gradient)}>
                  <a.icon className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-[12px] font-semibold text-[#273951] text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Urgent feed */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-bold text-[#64748d] mb-3 uppercase tracking-wide">🔴 مطلوب انتباهك</h3>
          {visibleUrgent.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#e5edf5] p-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#273951]">لا توجد عناصر عاجلة</p>
              <p className="text-xs text-[#64748d] mt-1">كل شيء تحت السيطرة ✓</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e5edf5] overflow-hidden">
              {Object.entries(urgentByCategory).map(([cat, groupTasks]) => {
                const cfg = CAT[cat] || CAT_DEF;
                const isCollapsed = collapsed[cat];
                const urgentInGroup = groupTasks.filter(t => t.priority === 'urgent').length;

                return (
                  <div key={cat} className={cn(Object.keys(urgentByCategory).indexOf(cat) > 0 && 'border-t border-[#e5edf5]')}>
                    <button
                      onClick={() => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))}
                      className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-[#f6f9fc] transition-colors"
                    >
                      <div className={cn('h-6 w-6 rounded flex items-center justify-center', cfg.bg)}>
                        <cfg.icon className={cn('h-3 w-3', cfg.accent)} />
                      </div>
                      <span className="text-[13px] font-semibold text-[#061b31]">{cfg.label}</span>
                      {urgentInGroup > 0 && (
                        <Badge className="bg-red-50 text-[#ea2261] border-0 h-5 text-[11px]">{urgentInGroup}</Badge>
                      )}
                      <span className="ml-auto text-[12px] text-[#64748d]">{groupTasks.length}</span>
                      {isCollapsed ? <ChevronDown className="h-3.5 w-3.5 text-[#64748d]" /> : <ChevronUp className="h-3.5 w-3.5 text-[#64748d]" />}
                    </button>
                    {!isCollapsed && groupTasks.slice(0, 3).map(task => {
                      const tcfg = CAT[task.category] || CAT_DEF;
                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-2 px-4 py-1.5 hover:bg-[#f6f9fc] cursor-pointer text-[13px]"
                          onClick={() => task.link && navigate(task.link)}
                        >
                          <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', tcfg.stripe)} />
                          <span className="flex-1 truncate">{task.title}</span>
                          <span className={cn('text-[12px] font-medium shrink-0', tcfg.accent)}>{tcfg.label}</span>
                        </div>
                      );
                    })}
                    {!isCollapsed && groupTasks.length > 3 && (
                      <button
                        onClick={() => navigate(CATEGORY_LINK[cat] || '/dashboard')}
                        className="w-full text-center py-1.5 text-[12px] font-medium text-[#533afd] hover:bg-[rgba(83,58,253,0.06)] transition-colors flex items-center justify-center gap-1"
                      >
                        <span>+{groupTasks.length - 3} عنصر آخر</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════ TODAY'S TASKS ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-indigo-500" />
            <h3 className="text-sm font-bold text-[#64748d] uppercase tracking-wide">📋 مهام اليوم</h3>
            <Badge className="bg-indigo-50 text-indigo-600 border-0 text-xs">{today.length}</Badge>
          </div>
          <div className="bg-white rounded-xl border border-[#e5edf5] overflow-hidden">
            {today.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#273951]">لا توجد مهام اليوم</p>
                <p className="text-xs text-[#64748d] mt-1">كل المهام منجزة ✓</p>
              </div>
            ) : (
              today.map(task => {
                const tcfg = CAT[task.category] || CAT_DEF;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f6f9fc] transition-colors cursor-pointer border-b border-[#e5edf5] last:border-0"
                    onClick={() => task.link && navigate(task.link)}
                  >
                    <div className={cn('w-1 h-8 rounded-full', tcfg.stripe)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#273951] truncate">{task.title}</p>
                      <p className="text-[12px] text-[#64748d]">{task.module}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-[#64748d]" />
            <h3 className="text-sm font-bold text-[#64748d] uppercase tracking-wide">⏰ قريباً</h3>
            <Badge className="bg-gray-100 text-[#64748d] border-0 text-xs">{upcoming.length}</Badge>
          </div>
          <div className="bg-white rounded-xl border border-[#e5edf5] overflow-hidden">
            {upcoming.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-[#64748d]">لا توجد مهام قادمة</p>
              </div>
            ) : (
              upcoming.map(task => {
                const tcfg = CAT[task.category] || CAT_DEF;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f6f9fc] transition-colors cursor-pointer border-b border-[#e5edf5] last:border-0"
                    onClick={() => task.link && navigate(task.link)}
                  >
                    <div className={cn('w-1 h-8 rounded-full', 'bg-gray-300')} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#273951] truncate">{task.title}</p>
                      <p className="text-[12px] text-[#64748d]">{task.module}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ EMPTY STATE ═══════════ */}
      {tasks.length === 0 && (
        <div className="mt-10 bg-white rounded-2xl border border-[#e5edf5] shadow-sm p-10 text-center">
          <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#061b31]">كل شيء على ما يرام ✓</h2>
          <p className="text-sm text-[#64748d] mt-2 max-w-sm mx-auto">
            لا توجد مهام معلقة. يمكنك البدء بمراجعة التقارير أو إنشاء مهام جديدة
          </p>
          <div className="flex items-center justify-center gap-3 mt-5">
            <button onClick={() => navigate('/dashboard')} className="h-9 px-5 rounded-lg bg-[#533afd] text-white text-sm font-medium hover:bg-indigo-700 transition-colors">لوحة التحكم</button>
            <button onClick={() => navigate('/reports')} className="h-9 px-5 rounded-lg border border-[#e5edf5] text-[#533afd] text-sm font-medium hover:bg-[#f6f9fc] transition-colors">التقارير</button>
          </div>
        </div>
      )}
    </div>
  );
}
