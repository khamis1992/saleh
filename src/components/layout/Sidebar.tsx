import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Briefcase, ListChecks, BarChart3, Settings,
  ChevronRight, Menu, X, Building2, HardHat, Wrench, DollarSign, ChevronDown,
  PieChart, FileText, Bell, ChevronLeft, Shield, ShoppingCart,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useLocale } from '@/providers/LocaleContext';
import { useRole } from '@/providers/RoleContext';
import { companyStore } from '@/services/stores';
import { getTasks } from '@/services/tasks';

// ─── Work Centers definitions ─────────────────────────────
const workCenters = [
  {
    key: 'executive',
    title: 'المركز التنفيذي',
    description: 'الأداء العام والموافقات والمخاطر',
    icon: Building2,
    href: '/centers/executive',
    color: 'from-violet-500 to-purple-600',
    items: [
      { title: 'لوحة المؤشرات', href: '/dashboard', icon: LayoutDashboard },
      { title: 'المراكز التنفيذية', href: '/centers/executive', icon: Building2 },
      { title: 'الموافقات', href: '/queues/approvals', icon: Shield },
      { title: 'التقارير', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    key: 'construction',
    title: 'التطوير والبناء',
    description: 'الأراضي، المشاريع، المقاولين، البناء',
    icon: HardHat,
    href: '/centers/construction',
    color: 'from-orange-500 to-amber-600',
    items: [
      { title: 'بنك الأراضي', href: '/lands', icon: PieChart },
      { title: 'المشاريع', href: '/projects', icon: HardHat },
      { title: 'المقاولون', href: '/contractors', icon: Briefcase },
      { title: 'الإنشاءات', href: '/construction/contracts', icon: HardHat },
      { title: 'الميزانيات', href: '/budgets', icon: FileText },
      { title: 'قائمة البناء', href: '/queues/construction', icon: ListChecks },
      { title: 'المشتريات والمخزون', href: '/centers/procurement', icon: ShoppingCart },
      { title: 'قائمة المشتريات', href: '/queues/procurement', icon: ListChecks },
    ],
  },
  {
    key: 'property',
    title: 'العقارات والتأجير',
    description: 'العقارات، الوحدات، المستأجرين، عقود الإيجار',
    icon: Building2,
    href: '/centers/property',
    color: 'from-blue-500 to-cyan-600',
    items: [
      { title: 'العقارات', href: '/properties', icon: Building2 },
      { title: 'الوحدات', href: '/units', icon: Building2 },
      { title: 'المستأجرون', href: '/tenants', icon: Briefcase },
      { title: 'عقود الإيجار', href: '/leases', icon: FileText },
      { title: 'تحصيل الإيجار', href: '/rent-collection/invoices', icon: DollarSign },
      { title: 'قائمة التحصيل', href: '/queues/collection', icon: ListChecks },
    ],
  },
  {
    key: 'finance',
    title: 'المالية والتحصيل',
    description: 'الحسابات، القيود، البنوك، التقييم',
    icon: DollarSign,
    href: '/centers/finance',
    color: 'from-emerald-500 to-green-600',
    items: [
      { title: 'الحسابات', href: '/finance/accounts', icon: FileText },
      { title: 'القيود اليومية', href: '/finance/journal-entries', icon: FileText },
      { title: 'مراكز التكلفة', href: '/finance/cost-centers', icon: PieChart },
      { title: 'الحسابات البنكية', href: '/finance/bank-accounts', icon: DollarSign },
      { title: 'الشيكات', href: '/finance/cheques', icon: FileText },
      { title: 'إقفال الفترة', href: '/finance/period-closing', icon: ListChecks },
      { title: 'تقييم العقارات', href: '/finance/valuation', icon: BarChart3 },
      { title: 'توقعات التدفق النقدي', href: '/finance/cash-flow-forecast', icon: BarChart3 },
    ],
  },
  {
    key: 'maintenance',
    title: 'الصيانة والشؤون القانونية',
    description: 'الصيانة، أوامر العمل، القضايا، الإشعارات',
    icon: Wrench,
    href: '/centers/maintenance',
    color: 'from-rose-500 to-pink-600',
    items: [
      { title: 'طلبات الصيانة', href: '/maintenance/requests', icon: Wrench },
      { title: 'أوامر العمل', href: '/maintenance/work-orders', icon: ListChecks },
      { title: 'الصيانة الوقائية', href: '/maintenance/preventive', icon: ListChecks },
      { title: 'المعاينات', href: '/maintenance/inspections', icon: ListChecks },
      { title: 'قائمة الصيانة', href: '/queues/maintenance', icon: ListChecks },
      { title: 'الشؤون القانونية', href: '/legal/notices', icon: Shield },
    ],
  },
] as const;

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

export function Sidebar() {
  const { t } = useLocale();
  const { homePath } = useRole();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [companyName, setCompanyName] = useState('عقاري ERP');
  const [workCentersOpen, setWorkCentersOpen] = useState(false);
  const [openCenter, setOpenCenter] = useState<string | null>(null);
  const [taskCount, setTaskCount] = useState(0);
  const [approvalCount, setApprovalCount] = useState(0);

  useEffect(() => {
    const name = companyStore.getAll()[0]?.name_ar;
    if (name) setCompanyName(name);
  }, []);

  // Live task & approval counts
  useEffect(() => {
    const update = () => {
      try {
        const tasks = getTasks();
        setTaskCount(tasks.filter(t => t.status === 'open' || t.status === 'in_progress').length);
        setApprovalCount(tasks.filter(t => t.status === 'open' && t.category === 'approval').length);
      } catch { setTaskCount(0); setApprovalCount(0); }
    };
    update();
    const interval = setInterval(update, 8000);
    return () => clearInterval(interval);
  }, []);

  // Auto-open the relevant work center based on the active route
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/centers/executive') || path === '/dashboard') setOpenCenter('executive');
    else if (path.startsWith('/lands') || path.startsWith('/projects') || path.startsWith('/contractors') || path.startsWith('/construction') || path.startsWith('/budgets') || path === '/queues/construction') setOpenCenter('construction');
    else if (path.startsWith('/properties') || path.startsWith('/units') || path.startsWith('/tenants') || path.startsWith('/leases') || path.startsWith('/rent-collection') || path === '/queues/collection') setOpenCenter('property');
    else if (path.startsWith('/finance') || path.startsWith('/reports/balance') || path.startsWith('/reports/profit') || path.startsWith('/reports/cash-flow') || path.startsWith('/reports/trial')) setOpenCenter('finance');
    else if (path.startsWith('/maintenance') || path.startsWith('/legal') || path === '/queues/maintenance') setOpenCenter('maintenance');
  }, [location.pathname]);

  const isActive = (href: string) => {
    if (href === homePath || href === '/dashboard') return location.pathname === href;
    if (href === '/queues/approvals') return location.pathname.startsWith('/queues');
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  // ── Top-level nav groups (just 5 items + 1 expand) ──
  const topLevelItems: NavGroup = {
    items: [
      { title: t.nav.dashboard, href: homePath, icon: LayoutDashboard },
      { title: 'مهامي', href: '/tasks', icon: ListChecks, badge: taskCount || undefined },
      { title: 'مراكز العمل', href: '#', icon: Briefcase }, // expand trigger
      { title: 'قوائم الانتظار', href: '/queues/approvals', icon: Shield, badge: approvalCount || undefined },
      { title: 'التقارير', href: '/reports', icon: BarChart3 },
      { title: t.nav.settings, href: '/settings', icon: Settings },
    ],
  };

  const renderTopItem = (item: NavItem) => {
    const active = isActive(item.href);
    const isExpandTrigger = item.href === '#';

    if (isExpandTrigger) {
      return (
        <button
          key={item.title}
          onClick={() => setWorkCentersOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
            workCentersOpen ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white/80',
            collapsed && 'justify-center px-2',
          )}
          title={collapsed ? item.title : undefined}
        >
          <item.icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
          {!collapsed && (
            <>
              <span className="whitespace-nowrap flex-1 text-right">{item.title}</span>
              <ChevronDown className={cn('h-3.5 w-3.5 text-white/40 transition-transform', workCentersOpen && 'rotate-180')} />
            </>
          )}
        </button>
      );
    }

    return (
      <NavLink
        key={item.href}
        to={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-200 relative',
          active ? 'bg-white/10 text-white font-medium shadow-sm' : 'text-white/55 hover:bg-white/5 hover:text-white/80',
          collapsed && 'justify-center px-2',
        )}
        title={collapsed ? item.title : undefined}
      >
        <item.icon className="h-[18px] w-[18px] shrink-0 opacity-80" />
        {!collapsed && (
          <>
            <span className="whitespace-nowrap flex-1">{item.title}</span>
            {item.badge && item.badge > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1.5 flex items-center justify-center">
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </>
        )}
        {collapsed && item.badge && item.badge > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </NavLink>
    );
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <button
        className="fixed top-3 left-3 z-50 h-10 w-10 rounded-xl bg-white shadow-lg flex items-center justify-center lg:hidden hover:bg-gray-50 transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
      </button>

      <aside
        className={cn(
          'fixed top-0 right-0 z-40 h-screen bg-[#1B2559] transition-all duration-300 flex flex-col overflow-hidden',
          collapsed ? 'w-[60px]' : 'w-[280px]',
          mobileOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-3 h-16 px-5 border-b border-white/[0.08] shrink-0', collapsed && 'justify-center px-2')}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-blue-500/20">
            ع
          </div>
          {!collapsed && (
            <div className="overflow-hidden min-w-0">
              <div className="font-bold text-sm text-white whitespace-nowrap tracking-tight">{companyName}</div>
              <div className="text-[10px] text-white/30 whitespace-nowrap mt-0.5">نظام الإدارة العقارية</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 scrollbar-thin">
          <nav className="space-y-1">
            {topLevelItems.items.map(renderTopItem)}

            {/* Work Centers — expanded list */}
            {!collapsed && workCentersOpen && (
              <div className="mt-2 space-y-1 border-r border-white/10 pr-2 mr-1">
                {workCenters.map(c => {
                  const Icon = c.icon;
                  const isOpen = openCenter === c.key;
                  return (
                    <div key={c.key}>
                      <button
                        onClick={() => setOpenCenter(isOpen ? null : c.key)}
                        className={cn(
                          'w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all',
                          isOpen ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white/80',
                        )}
                      >
                        <div className={cn('h-6 w-6 rounded-md bg-gradient-to-br flex items-center justify-center shrink-0', c.color)}>
                          <Icon className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="flex-1 text-right truncate">{c.title}</span>
                        <ChevronDown className={cn('h-3 w-3 text-white/30 transition-transform', isOpen && 'rotate-180')} />
                      </button>
                      {isOpen && (
                        <div className="mt-1 space-y-0.5">
                          <NavLink
                            to={c.href}
                            onClick={() => setMobileOpen(false)}
                            className={({ isActive }) => cn(
                              'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px]',
                              isActive ? 'bg-white/10 text-white font-medium' : 'text-white/50 hover:bg-white/5 hover:text-white/80',
                            )}
                          >
                            <div className="h-1 w-1 rounded-full bg-white/40" />
                            <span>الصفحة الرئيسية للمركز</span>
                          </NavLink>
                          {c.items.map((it, i) => (
                            <NavLink
                              key={i}
                              to={it.href}
                              onClick={() => setMobileOpen(false)}
                              className={({ isActive }) => cn(
                                'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11px]',
                                isActive ? 'bg-white/10 text-white font-medium' : 'text-white/50 hover:bg-white/5 hover:text-white/80',
                              )}
                            >
                              <div className="h-1 w-1 rounded-full bg-white/40" />
                              <span className="flex-1">{it.title}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Collapsed mode: show all center icons */}
            {collapsed && (
              <div className="mt-3 space-y-1 border-r border-white/10 pr-1 mr-1 pt-2">
                {workCenters.map(c => {
                  const Icon = c.icon;
                  return (
                    <NavLink
                      key={c.key}
                      to={c.href}
                      className={({ isActive }) => cn(
                        'flex items-center justify-center h-9 rounded-lg transition-all',
                        isActive ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white/80',
                      )}
                      title={c.title}
                    >
                      <Icon className="h-4 w-4" />
                    </NavLink>
                  );
                })}
              </div>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className={cn('border-t border-white/[0.08] shrink-0', collapsed ? 'p-2' : 'p-3')}>
          {!collapsed && (
            <NavLink
              to="/users"
              className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                م
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <div className="text-xs font-medium text-white/80 truncate">د. محمد العتيبي</div>
                <div className="text-[10px] text-white/30 truncate">مدير النظام</div>
              </div>
              <Settings className="h-3.5 w-3.5 text-white/20 shrink-0" />
            </NavLink>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center justify-center gap-2 text-white/30 hover:text-white/60 transition-colors w-full rounded-lg py-1.5',
              collapsed ? 'h-10' : '',
            )}
            title={collapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span className="text-[11px] font-medium">طي القائمة</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
