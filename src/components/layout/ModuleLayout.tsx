import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useModuleColor } from '@/hooks/useModuleColor';

interface SubNavItem {
  title: string;
  href: string;
}

interface ModuleLayoutProps {
  /** Sub-navigation items for this module */
  subNav: SubNavItem[];
  /** Optional: redirect the index route to this path */
  defaultRoute?: string;
}

/**
 * Wraps a module's sub-pages with a horizontal sub-navigation bar.
 * Each sub-page renders its own KPI cards + content via <Outlet />.
 */
export function ModuleLayout({ subNav, defaultRoute }: ModuleLayoutProps) {
  const location = useLocation();
  const { module } = useModuleColor();

  // If we're at the exact module root, redirect to default
  // This is handled by the route config; here we just render

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* Sub-navigation bar */}
      <div className="sticky top-16 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 lg:px-6">
          <nav className="flex items-center gap-0 overflow-x-auto" aria-label="Sub-navigation">
            {subNav.map((item) => {
              const active = isActive(item.href);
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'relative flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                    'border-b-2 -mb-[1px]',
                    active
                      ? 'border-current text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                  )}
                  style={active ? { color: `hsl(var(--module-${module}))`, borderColor: `hsl(var(--module-${module}))` } : undefined}
                >
                  {item.title}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Page content */}
      <div className="p-4 lg:p-6">
        <Outlet />
      </div>
    </div>
  );
}
