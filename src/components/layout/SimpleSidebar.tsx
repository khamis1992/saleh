import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, ChevronDown, X, Menu, Settings,
  Landmark, LayoutDashboard, ClipboardList, Building2, Users,
  FileText, Map, FolderKanban, HardHat, ShoppingCart, Package,
  Wrench, ClipboardCheck, ShieldCheck, Search, Monitor,
  DollarSign, Receipt, BookOpen,
  BarChart3, Hash, ScrollText, Key,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useRole, ROLES } from '@/providers/RoleContext';
import { useAuth } from '@/providers/AuthContext';
import { useLocale } from '@/providers/LocaleContext';
import { companyStore } from '@/services/stores';
import { ROLE_SIMPLE_NAV } from '@/constants/roleNavigation';
import type { SimpleNavGroup } from '@/constants/roleNavigation';

/* ──────────────── Types ──────────────── */

interface NavChild {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  key: string;
  title: string;
  items: NavChild[];
  /** ROLE_SIMPLE_NAV Arabic titles that gate this group */
  gateTitles: string[];
}

/* ──────────────── Full navigation tree (module-level constants for gate matching) ──────────────── */

/* ──────────────── Helpers ──────────────── */

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function stripDiacritics(s: string): string {
  // Normalise Arabic diacritics so title matching works regardless of tashkeel
  return s.normalize('NFD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '');
}

/* ──────────────── Component ──────────────── */

export function SimpleSidebar() {
  const { role } = useRole();
  const { profile } = useAuth();
  const { t, dir, tt } = useLocale();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [companyName, setCompanyName] = useState(t.app.shortName);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isRTL = dir === 'rtl';

  // ── Company name from localStorage ──
  useEffect(() => {
    const name = companyStore.getAll()[0]?.name_ar;
    if (name) setCompanyName(name);
  }, []);

  // ── Allowed href set from role-based nav ──
  const allowedHrefs = useMemo(() => {
    const groups: SimpleNavGroup[] = ROLE_SIMPLE_NAV[role] || ROLE_SIMPLE_NAV.admin;
    return new Set<string>(groups.flatMap(g => g.items.map(i => i.href)));
  }, [role]);

  // ── Full navigation tree (from translations) ──
  const FULL_NAV_GROUPS: NavGroup[] = useMemo(() => [
    // 1. عام — Dashboard, My Tasks
    {
      key: 'main',
      title: t.nav.dashboard,
      gateTitles: [t.nav.dashboard, t.nav.dashboard],
      items: [
        { title: t.nav.dashboard, href: '/dashboard', icon: LayoutDashboard },
        { title: tt('nav.myWork', 'My Tasks'), href: '/my-work', icon: ClipboardList },
      ],
    },
    // 2. المشاريع والإنشاء — Land → Develop → Procure → Stock
    {
      key: 'construction',
      title: tt('nav.constructionAndProjects', 'Projects & Construction'),
      gateTitles: [tt('nav.constructionAndProjects', 'Projects & Construction')],
      items: [
        { title: t.nav.landBank, href: '/lands', icon: Map },
        { title: t.nav.developmentProjects, href: '/projects', icon: FolderKanban },
        { title: t.nav.contractors, href: '/contractors', icon: HardHat },
        { title: t.nav.procurement, href: '/procurement', icon: ShoppingCart },
        { title: t.nav.inventory, href: '/inventory', icon: Package },
      ],
    },
    // 3. العقارات والتأجير — Properties → Tenants → Contracts
    {
      key: 'properties',
      title: t.nav.properties,
      gateTitles: [t.nav.properties, t.nav.properties],
      items: [
        { title: tt('nav.propertiesUnits', 'Properties & Units'), href: '/properties-units', icon: Building2 },
        { title: t.nav.tenants, href: '/tenants', icon: Users },
        { title: tt('nav.contracts', t.nav.leasingContracts), href: '/leases', icon: FileText },
      ],
    },
    // 4. تحصيل الإيجارات — Collections → Invoices → Receipts
    {
      key: 'rentCollection',
      title: t.rentCollection,
      gateTitles: [t.rentCollection],
      items: [
        { title: tt('nav.collections', 'Collections'), href: '/collections', icon: DollarSign },
        { title: t.rentCollection.invoices, href: '/rent-collection/invoices', icon: Receipt },
        { title: t.rentCollection.receipts, href: '/rent-collection/receipts', icon: Receipt },
      ],
    },
    // 5. الصيانة — Requests → Work Orders → Preventive → Inspections → Assets
    {
      key: 'maintenance',
      title: t.nav.maintenance,
      gateTitles: [t.nav.maintenance],
      items: [
        { title: t.maintenance.requests, href: '/maintenance/requests', icon: Wrench },
        { title: t.maintenance.workOrders, href: '/maintenance/work-orders', icon: ClipboardCheck },
        { title: tt('nav.preventiveMaintenance', 'Preventive'), href: '/maintenance/preventive', icon: ShieldCheck },
        { title: tt('nav.inspections', 'Inspections'), href: '/maintenance/inspections', icon: Search },
        { title: tt('nav.assets', 'Assets'), href: '/maintenance/assets', icon: Monitor },
      ],
    },
    // 6. المالية والمحاسبة — Accounts → JEs → Cost Centers → Bank Accounts
    {
      key: 'finance',
      title: t.nav.finance,
      gateTitles: [t.nav.finance],
      items: [
        { title: t.finance.accounts, href: '/finance/accounts', icon: Landmark },
        { title: t.finance.journalEntries, href: '/finance/journal-entries', icon: BookOpen },
        { title: tt('nav.costCenters', 'Cost Centers'), href: '/finance/cost-centers', icon: BarChart3 },
        { title: tt('nav.bankAccounts', 'Bank Accounts'), href: '/finance/bank-accounts', icon: Building2 },
      ],
    },
    // 7. التقارير
    {
      key: 'reports',
      title: t.nav.reports,
      gateTitles: [t.nav.reports, t.nav.reports],
      items: [
        { title: t.nav.reports, href: '/reports', icon: BarChart3 },
      ],
    },
    // 8. الإدارة — Employees → Settings → Numbering → Audit → Roles
    {
      key: 'admin',
      title: tt('nav.administration', 'Admin'),
      gateTitles: [tt('nav.administration', 'Admin'), tt('nav.employees', 'Employees'), t.nav.legal, tt('nav.waitlists', 'قوائم الانتظار')],
      items: [
        { title: tt('nav.employees', 'Employees'), href: '/hr/employees', icon: Users },
        { title: t.nav.settings, href: '/settings', icon: Settings },
        { title: t.settings.numbering, href: '/settings/numbering', icon: Hash },
        { title: t.system.auditLog, href: '/system/audit-log', icon: ScrollText },
        { title: t.settings.roles, href: '/settings/roles', icon: Key },
      ],
    },
  ], [t]);
  const visibleGroups = useMemo(() => {
    const roleGroups: SimpleNavGroup[] = ROLE_SIMPLE_NAV[role] || ROLE_SIMPLE_NAV.admin;
    const roleTitles = new Set(
      roleGroups.flatMap(g =>
        g.items.map(i => stripDiacritics(i.title)),
      ),
    );

    return FULL_NAV_GROUPS.filter(group =>
      group.gateTitles.some(gt => roleTitles.has(stripDiacritics(gt))),
    );
  }, [role]);

  // ── Auto-open group containing the active route ──
  useEffect(() => {
    const path = location.pathname;
    const newOpen: Record<string, boolean> = { ...openGroups };
    for (const group of visibleGroups) {
      const hasActive = group.items.some(item => {
        if (item.href === '/my-work' || item.href === '/dashboard') return path === item.href;
        return path === item.href || (item.href !== '/' && path.startsWith(item.href));
      });
      if (hasActive) newOpen[group.key] = true;
    }
    setOpenGroups(newOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, role]);

  // ── Active check ──
  const isActive = (href: string) => {
    if (href === '/my-work' || href === '/dashboard') return location.pathname === href;
    return location.pathname === href || (href !== '/' && location.pathname.startsWith(href));
  };

  // ── Toggle group open/closed ──
  const toggleGroup = (key: string) => {
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // ── User info ──
  const userName = profile?.full_name || tt('nav.user', t.system.user || tt('system.user','المستخدم'));
  const userInitials = getInitials(userName);
  const roleLabel = ROLES.find(r => r.value === role)?.label || role;

  // ── Position classes (RTL-aware) ──
  const sidebarPosition = isRTL
    ? 'right-0'
    : 'left-0';
  const sidebarMobileTranslate = isRTL
    ? (mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0')
    : (mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0');
  const CollapseIconExpanded = isRTL ? ChevronLeft : ChevronRight;
  const CollapseIconCollapsed = isRTL ? ChevronRight : ChevronLeft;

  return (
    <>
      {/* ── Mobile backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile toggle button ── */}
      <button
        className="fixed top-3 left-3 z-50 h-10 w-10 rounded-xl bg-white shadow-lg flex items-center justify-center lg:hidden hover:bg-[#f6f9fc] transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? tt('nav.closeMenu', 'إغلاق القائمة') : tt('nav.openMenu', 'فتح القائمة')}
      >
        {mobileOpen ? (
          <X className="h-5 w-5 text-gray-700" />
        ) : (
          <Menu className="h-5 w-5 text-gray-700" />
        )}
      </button>

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed top-0 z-40 h-screen flex flex-col overflow-hidden transition-all duration-300',
          'bg-gradient-to-b from-[#1B2559] to-[#0a1430]',
          collapsed ? 'w-[60px]' : 'w-[260px]',
          sidebarPosition,
          sidebarMobileTranslate,
        )}
        style={{ '--sidebar-gradient': 'linear-gradient(180deg, #1B2559 0%, #0a1430 100%)' } as React.CSSProperties}
      >
        {/* ── Logo area ── */}
        <div className={cn(
          'flex items-center gap-3 h-16 px-5 shrink-0',
          collapsed && 'justify-center px-2',
        )}>
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-500/20">
            <Landmark className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden min-w-0">
              <div className="font-bold text-sm text-white whitespace-nowrap tracking-tight">
                {companyName}
              </div>
              <div className="text-xs text-indigo-300/60 whitespace-nowrap mt-0.5">
                {t.app.shortName}
              </div>
            </div>
          )}
        </div>

        {/* ── Navigation ── */}
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {visibleGroups.map(group => {
            const isOpen = openGroups[group.key] === true;
            const hasActiveChild = group.items.some(item => isActive(item.href));

            return (
              <div key={group.key} className="mb-1">
                {/* Group header */}
                {!collapsed && (
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className={cn(
                      'w-full flex items-center gap-2 px-5 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors',
                      hasActiveChild
                        ? 'text-indigo-300'
                        : 'text-white/20 hover:text-white/40',
                    )}
                  >
                    <span className="flex-1 text-right">{group.title}</span>
                    <ChevronDown
                      className={cn(
                        'h-3 w-3 transition-transform',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </button>
                )}

                {/* Group items */}
                {(collapsed || isOpen) &&
                  group.items.map(item => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.href + item.title}
                        to={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 mx-2 px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md',
                          active
                            ? 'bg-white/10 text-white shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px]'
                            : 'text-white/50 hover:bg-white/5 hover:text-white/75',
                          collapsed && 'justify-center px-2',
                        )}
                        title={collapsed ? item.title : undefined}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        {!collapsed && (
                          <span className="whitespace-nowrap flex-1 text-right truncate">
                            {item.title}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
              </div>
            );
          })}
        </div>

        {/* ── Footer: user profile + collapse toggle ── */}
        <div className="shrink-0 border-t border-white/[0.08]">
          {/* User profile */}
          {!collapsed && (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-[rgba(50,50,93,0.20)_0px_4px_8px_-2px] shadow-indigo-500/20">
                {userInitials}
              </div>
              <div className="flex-1 min-w-0 text-right">
                <div className="text-xs font-medium text-white truncate">
                  {userName}
                </div>
                <div className="text-xs text-white/40 truncate">
                  {roleLabel}
                </div>
              </div>
              <button
                className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
                title={t.nav.settings}
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors w-full py-2',
              collapsed ? 'justify-center' : 'justify-end px-4',
            )}
            title={collapsed ? (tt('nav.expandSidebar', isRTL ? 'توسيع القائمة' : 'Expand sidebar')) : (tt('nav.collapseSidebar', isRTL ? 'طي القائمة' : 'Collapse sidebar'))}
          >
            {collapsed ? (
              <CollapseIconCollapsed className="h-4 w-4" />
            ) : (
              <>
                <span className="text-xs tracking-wide">{tt('nav.collapseSidebar', 'طي القائمة')}</span>
                <CollapseIconExpanded className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
