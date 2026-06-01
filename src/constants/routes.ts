// Route definitions
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  
  // Company Setup
  SETTINGS: '/settings',
  SETTINGS_COMPANY: '/settings/company',
  SETTINGS_BRANCHES: '/settings/branches',
  SETTINGS_DEPARTMENTS: '/settings/departments',
  SETTINGS_NUMBERING: '/settings/numbering',
  SETTINGS_APPROVALS: '/settings/approvals',
  SETTINGS_ROLES: '/settings/roles',
  
  // Lands
  LANDS: '/lands',
  LANDS_CREATE: '/lands/create',
  LANDS_DETAILS: '/lands/:id',
  LANDS_EDIT: '/lands/:id/edit',
  
  // Projects
  PROJECTS: '/projects',
  PROJECTS_CREATE: '/projects/create',
  PROJECTS_DETAILS: '/projects/:id',
  PROJECTS_EDIT: '/projects/:id/edit',
  
  // Contractors
  CONTRACTORS: '/contractors',
  CONTRACTORS_CREATE: '/contractors/create',
  CONTRACTORS_DETAILS: '/contractors/:id',
  CONTRACTORS_EDIT: '/contractors/:id/edit',
  
  // Properties
  PROPERTIES: '/properties',
  PROPERTIES_CREATE: '/properties/create',
  PROPERTIES_DETAILS: '/properties/:id',
  PROPERTIES_EDIT: '/properties/:id/edit',
  
  // Units
  UNITS: '/units',
  UNITS_CREATE: '/units/create',
  UNITS_DETAILS: '/units/:id',
  UNITS_EDIT: '/units/:id/edit',
  
  // Tenants
  TENANTS: '/tenants',
  TENANTS_CREATE: '/tenants/create',
  TENANTS_DETAILS: '/tenants/:id',
  TENANTS_EDIT: '/tenants/:id/edit',
  
  // Leases
  LEASES: '/leases',
  LEASES_CREATE: '/leases/create',
  LEASES_DETAILS: '/leases/:id',
  LEASES_EDIT: '/leases/:id/edit',
  
  // Rent Collection
  RENT_COLLECTION: '/rent-collection',
  RENT_INVOICES: '/rent-collection/invoices',
  RENT_INVOICES_DETAILS: '/rent-collection/invoices/:id',
  RENT_RECEIPTS: '/rent-collection/receipts',
  RENT_SCHEDULES: '/rent-collection/schedules',
  
  // Maintenance
  MAINTENANCE: '/maintenance',
  MAINTENANCE_REQUESTS: '/maintenance/requests',
  MAINTENANCE_REQUESTS_DETAILS: '/maintenance/requests/:id',
  MAINTENANCE_WORK_ORDERS: '/maintenance/work-orders',
  
  // Finance
  FINANCE: '/finance',
  FINANCE_ACCOUNTS: '/finance/accounts',
  FINANCE_JOURNAL_ENTRIES: '/finance/journal-entries',
  FINANCE_JOURNAL_ENTRIES_CREATE: '/finance/journal-entries/create',
  
  // Documents
  DOCUMENTS: '/documents',
  
  // Reports
  REPORTS: '/reports',
  
  // Users
  USERS: '/users',
  USERS_CREATE: '/users/create',
  USERS_EDIT: '/users/:id/edit',
} as const;

export function route(path: typeof ROUTES[keyof typeof ROUTES], params?: Record<string, string>): string {
  let result = path as string;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(`:${key}`, value);
    }
  }
  return result;
}
