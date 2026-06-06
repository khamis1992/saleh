import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type UserRole =
  | 'admin'         // Super admin — sees everything
  | 'executive'     // CEO / owner
  | 'project_manager'
  | 'property_manager'
  | 'accountant'
  | 'maintenance_manager'
  | 'technician'
  | 'legal_officer'
  | 'hr_manager';

export const ROLES: { value: UserRole; label: string; center: string }[] = [
  { value: 'admin', label: 'مدير النظام', center: '/dashboard' },
  { value: 'executive', label: 'المدير العام', center: '/dashboard' },
  { value: 'project_manager', label: 'مدير مشاريع', center: '/construction-all' },
  { value: 'property_manager', label: 'مدير عقارات', center: '/leasing' },
  { value: 'accountant', label: 'محاسب', center: '/finance' },
  { value: 'maintenance_manager', label: 'مدير صيانة', center: '/maintenance' },
  { value: 'technician', label: 'فني صيانة', center: '/maintenance' },
  { value: 'legal_officer', label: 'مسؤول قانوني', center: '/legal/notices' },
  { value: 'hr_manager', label: 'مدير موارد بشرية', center: '/hr/employees' },
];

const STORAGE_KEY = 'erp_active_role';

interface RoleContextValue {
  role: UserRole;
  setRole: (r: UserRole) => void;
  homePath: string;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ROLES.some(r => r.value === stored)) return stored as UserRole;
    } catch {}
    return 'admin';
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, role); } catch {}
  }, [role]);

  const homePath = ROLES.find(r => r.value === role)?.center || '/dashboard';

  return (
    <RoleContext.Provider value={{ role, setRole: setRoleState, homePath }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used inside RoleProvider');
  return ctx;
}
