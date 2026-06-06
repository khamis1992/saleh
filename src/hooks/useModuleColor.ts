import { useLocation } from 'react-router-dom';

export type ModuleName =
  | 'leasing'
  | 'construction'
  | 'procurement'
  | 'maintenance'
  | 'finance'
  | 'hr'
  | 'legal'
  | 'reports'
  | 'settings'
  | 'system';

/** Maps route prefixes to module names */
function getModuleFromPath(pathname: string): ModuleName {
  if (pathname.startsWith('/leasing') || pathname.startsWith('/leases') || pathname.startsWith('/tenants') || pathname.startsWith('/units') || pathname.startsWith('/properties') || pathname.startsWith('/rent-collection')) {
    return 'leasing';
  }
  if (pathname.startsWith('/construction') || pathname.startsWith('/projects')) {
    return 'construction';
  }
  if (pathname.startsWith('/procurement') || pathname.startsWith('/purchase')) {
    return 'procurement';
  }
  if (pathname.startsWith('/maintenance') || pathname.startsWith('/equipment')) {
    return 'maintenance';
  }
  if (pathname.startsWith('/finance') || pathname.startsWith('/bank') || pathname.startsWith('/cheque') || pathname.startsWith('/cost-centers')) {
    return 'finance';
  }
  if (pathname.startsWith('/hr') || pathname.startsWith('/employees') || pathname.startsWith('/payroll') || pathname.startsWith('/attendance') || pathname.startsWith('/leave')) {
    return 'hr';
  }
  if (pathname.startsWith('/legal')) {
    return 'legal';
  }
  if (pathname.startsWith('/reports') || pathname.startsWith('/report')) {
    return 'reports';
  }
  if (pathname.startsWith('/settings') || pathname.startsWith('/users') || pathname.startsWith('/roles')) {
    return 'settings';
  }
  if (pathname.startsWith('/system') || pathname.startsWith('/audit') || pathname.startsWith('/activity')) {
    return 'system';
  }
  // Dashboard gets leasing blue as default
  return 'leasing';
}

export function useModuleColor(): { module: ModuleName; colorVar: string; bgVar: string } {
  const location = useLocation();
  const module = getModuleFromPath(location.pathname);
  return {
    module,
    colorVar: `hsl(var(--module-${module}))`,
    bgVar: `hsl(var(--module-${module}-bg))`,
  };
}

/** Returns just the module name without the CSS vars — for conditional styling */
export function useModuleName(): ModuleName {
  const location = useLocation();
  return getModuleFromPath(location.pathname);
}
