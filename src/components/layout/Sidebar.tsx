import { useState, useEffect, useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ChevronRight, ChevronLeft, Menu, X,
  Landmark, ChevronDown, Settings,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useRole, ROLES } from '@/providers/RoleContext';
import { useAuth } from '@/providers/AuthContext';
import { useLocale } from '@/providers/LocaleContext';
import { companyStore } from '@/services/stores';
import { ROLE_SIMPLE_NAV } from '@/constants/roleNavigation';
import type { SimpleNavGroup } from '@/constants/roleNavigation';

function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const { role, setRole } = useRole();
  const { profile } = useAuth();
  const { t, tt, dir } = useLocale();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [companyName, setCompanyName] = useState(t.app.shortName);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const isRTL = dir === 'rtl';

  // Company name from localStorage
  useEffect(() => {
    const name = companyStore.getAll()[0]?.name_ar;
    if (name) setCompanyName(name);
  }, []);

  // Navigation groups from role-based config
  const navGroups: SimpleNavGroup[] = useMemo(
    () => ROLE_SIMPLE_NAV[role] || ROLE_SIMPLE_NAV.admin,
    [role],
  );

  // Auto-open group containing active route
  useEffect(() => {
    const path = location.pathname;
    const newOpen: Record<string, boolean> = { ...openGroups };
    for (const group of navGroups) {
      if (!group.title) continue; // skip title-less groups (always expanded)
      const hasActive = group.items.some(item => {
        if (item.href === '/my-work' || item.href === '/dashboard') return path === item.href;
        return path === item.href || (item.href !== '/' && path.startsWith(item.href));
      });
      if (hasActive) newOpen[group.title] = true;
    }
    setOpenGroups(newOpen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, role]);

  const isActive = (href: string) => {
    if (href === '/my-work' || href === '/dashboard') return location.pathname === href;
    return location.pathname === href || (href !== '/' && location.pathname.startsWith(href));
  };

  const toggleGroup = (title: string) => {
    setOpenGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  // User info
  const userName = profile?.full_name || tt('nav.user', 'المستخدم');
  const userInitials = getInitials(userName);
  const roleLabel = ROLES.find(r => r.value === role)?.label || role;

  // Position classes — use explicit RTL/LTR classes
  const sidebarPosition = isRTL ? 'right-0' : 'left-0';
  const sidebarMobileTranslate = isRTL
    ? (mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0')
    : (mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0');
  const CollapseIconExpanded = isRTL ? ChevronLeft : ChevronRight;
  const CollapseIconCollapsed = isRTL ? ChevronRight : ChevronLeft;

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      <button
        className={cn(
          'fixed top-3 z-50 h-10 w-10 rounded-xl bg-white shadow-lg flex items-center justify-center lg:hidden hover:bg-[#f6f9fc] transition-colors',
          isRTL ? 'right-3' : 'left-3',
        )}
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? tt('nav.closeMenu', 'إغلاق القائمة') : tt('nav.openMenu', 'فتح القائمة')}
      >
        {mobileOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
      </button>

      {/* Sidebar */}
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
        {/* Logo area */}
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

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 scrollbar-thin">
          {/* Role switcher (top of nav, compact dropdown) */}
          {!collapsed && (
            <div className="px-3 mb-3">
              <button
                onClick={() => {
                  const keys = Object.keys(ROLE_SIMPLE_NAV) as typeof ROLES[number]['value'][];
                  const idx = keys.indexOf(role);
                  const nextIdx = (idx + 1) % keys.length;
                  setRole(keys[nextIdx]);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group"
                title={tt('nav.switchRole', 'تغيير الدور')}
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {userInitials}
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <div className="text-[11px] font-medium text-white/70 truncate">{userName}</div>
                  <div className="text-[10px] text-white/30 truncate">{roleLabel}</div>
                </div>
              </button>
            </div>
          )}

          {navGroups.map((group, gi) => {
            // Groups with a title are collapsible; title-less groups are always expanded
            const hasTitle = group.title !== '';
            const isOpen = !hasTitle || openGroups[group.title] === true;
            const hasActiveChild = group.items.some(item => isActive(item.href));

            return (
              <div key={gi} className="mb-1">
                {/* Group header (only if group has a title) */}
                {!collapsed && hasTitle && (
                  <button
                    onClick={() => toggleGroup(group.title)}
                    className={cn(
                      'w-full flex items-center gap-2 px-5 py-1.5 text-xs font-bold uppercase tracking-widest transition-colors',
                      hasActiveChild ? 'text-indigo-300' : 'text-white/20 hover:text-white/40',
                    )}
                  >
                    <span className="flex-1 text-right">{group.title}</span>
                    <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
                  </button>
                )}

                {/* Group items — always visible if no group title */}
                {(collapsed || isOpen || !hasTitle) &&
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

        {/* Footer: collapse toggle */}
        <div className="shrink-0 border-t border-white/[0.08]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors w-full py-2',
              collapsed ? 'justify-center' : 'justify-end px-4',
            )}
            title={collapsed ? tt('nav.expandSidebar', isRTL ? 'توسيع القائمة' : 'Expand sidebar') : tt('nav.collapseSidebar', isRTL ? 'طي القائمة' : 'Collapse sidebar')}
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
