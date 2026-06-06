import {
  LayoutDashboard, Users, FileText, Wrench, HardHat,
  ClipboardList, BarChart3, Shield, Building2, DollarSign,
  ShoppingCart, Settings, Package, Calendar, Box, Gavel,
  DoorOpen, CreditCard, MapPin,
} from 'lucide-react';
import type { UserRole } from '@/providers/RoleContext';

export interface SimpleNavGroup {
  title: string;
  items: SimpleNavItem[];
}

export interface SimpleNavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

// ============================================================
// SUPER-SIMPLE NAVIGATION — ~8 items per role
// Each item = one consolidated work center page
// ============================================================

export const ROLE_SIMPLE_NAV: Record<UserRole, SimpleNavGroup[]> = {

  admin: [
    {
      title: '',
      items: [
        { title: 'الرئيسية', href: '/dashboard', icon: ClipboardList },
      ],
    },
    {
      title: '',
      items: [
        { title: 'الأراضي', href: '/lands', icon: MapPin },
        { title: 'المشاريع والإنشاءات', href: '/construction-all', icon: HardHat },
        { title: 'ميزانيات المشاريع', href: '/budgets', icon: FileText },
      ],
    },
    {
      title: '',
      items: [
        { title: 'المشتريات', href: '/procurement', icon: ShoppingCart },
        { title: 'المخزون', href: '/inventory/items', icon: Package },
        { title: 'المعدات', href: '/equipment', icon: Box },
      ],
    },
    {
      title: 'العقارات والتأجير',
      items: [
        { title: 'العقارات', href: '/leasing/properties', icon: Building2 },
        { title: 'الوحدات', href: '/leasing/units', icon: DoorOpen },
        { title: 'المستأجرون', href: '/leasing/tenants', icon: Users },
        { title: 'عقود الإيجار', href: '/leasing/leases', icon: FileText },
        { title: 'التحصيل', href: '/leasing/collections', icon: CreditCard },
      ],
    },
    {
      title: '',
      items: [
        { title: 'الصيانة', href: '/maintenance', icon: Wrench },
        { title: 'المالية', href: '/finance', icon: DollarSign },
        { title: 'الموارد البشرية', href: '/hr/employees', icon: Users },
        { title: 'الشؤون القانونية', href: '/legal/notices', icon: Gavel },
      ],
    },
    {
      title: '',
      items: [
        { title: 'التقارير والقوائم', href: '/reports', icon: BarChart3 },
        { title: 'قوائم الانتظار', href: '/queues', icon: Shield },
        { title: 'المستندات', href: '/documents', icon: FileText },
        { title: 'جدول المواعيد', href: '/calendar', icon: Calendar },
        { title: 'الإدارة', href: '/settings', icon: Settings },
      ],
    },
  ],

  executive: [
    {
      title: '',
      items: [
        { title: 'الرئيسية', href: '/dashboard', icon: ClipboardList },
        { title: 'العقارات والتأجير', href: '/leasing', icon: Building2 },
        { title: 'المشاريع والإنشاءات', href: '/construction-all', icon: HardHat },
        { title: 'المالية', href: '/finance', icon: DollarSign },
        { title: 'التقارير', href: '/reports', icon: BarChart3 },
        { title: 'قوائم الانتظار', href: '/queues', icon: Shield },
      ],
    },
  ],

  project_manager: [
    {
      title: '',
      items: [
        { title: 'مهامي اليوم', href: '/my-work', icon: ClipboardList },
        { title: 'المشاريع والإنشاءات', href: '/construction-all', icon: HardHat },
        { title: 'المشتريات', href: '/procurement', icon: ShoppingCart },
        { title: 'العقارات', href: '/leasing', icon: Building2 },
        { title: 'التقارير', href: '/reports', icon: BarChart3 },
      ],
    },
  ],

  property_manager: [
    {
      title: '',
      items: [
        { title: 'مهامي اليوم', href: '/my-work', icon: ClipboardList },
        { title: 'العقارات والتأجير', href: '/leasing', icon: Building2 },
        { title: 'الصيانة', href: '/maintenance', icon: Wrench },
        { title: 'التقارير', href: '/reports', icon: BarChart3 },
      ],
    },
  ],

  accountant: [
    {
      title: '',
      items: [
        { title: 'مهامي اليوم', href: '/my-work', icon: ClipboardList },
        { title: 'العقارات والتأجير', href: '/leasing', icon: Building2 },
        { title: 'المالية', href: '/finance', icon: DollarSign },
        { title: 'التقارير', href: '/reports', icon: BarChart3 },
      ],
    },
  ],

  maintenance_manager: [
    {
      title: '',
      items: [
        { title: 'مهامي اليوم', href: '/my-work', icon: ClipboardList },
        { title: 'الصيانة', href: '/maintenance', icon: Wrench },
        { title: 'العقارات', href: '/leasing', icon: Building2 },
      ],
    },
  ],

  technician: [
    {
      title: '',
      items: [
        { title: 'مهامي اليوم', href: '/my-work', icon: ClipboardList },
        { title: 'الصيانة', href: '/maintenance', icon: Wrench },
      ],
    },
  ],

  legal_officer: [
    {
      title: '',
      items: [
        { title: 'مهامي اليوم', href: '/my-work', icon: ClipboardList },
        { title: 'العقارات والتأجير', href: '/leasing', icon: Building2 },
        { title: 'الشؤون القانونية', href: '/legal/notices', icon: Shield },
      ],
    },
  ],

  hr_manager: [
    {
      title: '',
      items: [
        { title: 'مهامي اليوم', href: '/my-work', icon: ClipboardList },
        { title: 'الموظفون', href: '/hr/employees', icon: Users },
        { title: 'الحضور والإجازات', href: '/hr/attendance', icon: FileText },
      ],
    },
  ],

};
