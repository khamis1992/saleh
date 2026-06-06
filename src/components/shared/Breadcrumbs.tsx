import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/utils/cn';

// Route → Arabic label and parent path
const routeLabels: Record<string, { label: string; parent?: string }> = {
  '': { label: 'الرئيسية' },
  'tasks': { label: 'مهامي' },
  'reports': { label: 'التقارير والقوائم' },
  'settings': { label: 'الإعدادات' },
  'documents': { label: 'المستندات' },
  'calendar': { label: 'التقويم' },
  'centers': { label: 'مراكز العمل' },
  'centers/executive': { label: 'المركز التنفيذي' },
  'centers/construction': { label: 'التطوير والبناء' },
  'centers/property': { label: 'العقارات والتأجير' },
  'centers/finance': { label: 'المالية والتحصيل' },
  'centers/maintenance': { label: 'الصيانة والشؤون القانونية' },
  'centers/procurement': { label: 'المشتريات والمخزون' },
  'queues': { label: 'قوائم الانتظار' },
  'queues/approvals': { label: 'الموافقات' },
  'queues/collection': { label: 'التحصيل' },
  'queues/maintenance': { label: 'الصيانة' },
  'queues/construction': { label: 'البناء' },
  'queues/procurement': { label: 'المشتريات' },
  'wizards': { label: 'المعالجات' },
  'wizards/project': { label: 'إنشاء مشروع جديد' },
  'wizards/conversion': { label: 'تحويل مشروع إلى عقار' },
  'wizards/lease': { label: 'إنشاء عقد إيجار' },
  'wizards/payment': { label: 'تسجيل دفعة إيجار' },
  'wizards/claim': { label: 'اعتماد مطالبة مقاول' },
  'wizards/maintenance': { label: 'إغلاق طلب صيانة' },
  'lands': { label: 'الأراضي' },
  'projects': { label: 'المشاريع' },
  'project-tasks': { label: 'مهام المشاريع' },
  'contractors': { label: 'المقاولون' },
  'properties': { label: 'العقارات' },
  'units': { label: 'الوحدات' },
  'tenants': { label: 'المستأجرون' },
  'leases': { label: 'عقود الإيجار' },
  'rent-collection': { label: 'تحصيل الإيجار' },
  'maintenance': { label: 'الصيانة' },
  'finance': { label: 'المالية' },
  'construction': { label: 'الإنشاءات' },
  'procurement': { label: 'المشتريات' },
  'inventory': { label: 'المخزون' },
  'budgets': { label: 'الميزانيات' },
  'hr': { label: 'الموارد البشرية' },
  'legal': { label: 'الشؤون القانونية' },
  'system': { label: 'النظام' },
  'equipment': { label: 'المعدات' },
  'create': { label: 'جديد' },
  'edit': { label: 'تعديل' },
  'renew': { label: 'تجديد' },
  'terminate': { label: 'إنهاء' },
  'conversion': { label: 'التحويل' },
  'invoices': { label: 'الفواتير' },
  'receipts': { label: 'سندات القبض' },
  'schedules': { label: 'جدول الدفعات' },
  'cheques': { label: 'الشيكات' },
  'requests': { label: 'الطلبات' },
  'work-orders': { label: 'أوامر العمل' },
  'inspections': { label: 'المعاينات' },
  'preventive': { label: 'الصيانة الوقائية' },
  'accounts': { label: 'الحسابات' },
  'journal-entries': { label: 'القيود اليومية' },
  'cost-centers': { label: 'مراكز التكلفة' },
  'bank-accounts': { label: 'الحسابات البنكية' },
  'valuation': { label: 'تقييم العقارات' },
  'cash-flow-forecast': { label: 'توقعات التدفق النقدي' },
  'period-closing': { label: 'إقفال الفترة' },
  'dashboard': { label: 'لوحة المالية' },
  'contracts': { label: 'العقود' },
  'claims': { label: 'المطالبات' },
  'change-orders': { label: 'أوامر التغيير' },
  'daily-reports': { label: 'التقارير اليومية' },
  'progress': { label: 'تحديثات التقدم' },
  'vendors': { label: 'الموردون' },
  'purchase-requests': { label: 'طلبات الشراء' },
  'purchase-orders': { label: 'أوامر الشراء' },
  'goods-receipts': { label: 'استلام البضائع' },
  'quotation-comparison': { label: 'مقارنة العروض' },
  'warehouses': { label: 'المستودعات' },
  'items': { label: 'المواد' },
  'transactions': { label: 'حركات المخزون' },
  'employees': { label: 'الموظفين' },
  'attendance': { label: 'الحضور' },
  'payroll': { label: 'الرواتب' },
  'leaves': { label: 'الإجازات' },
  'notices': { label: 'الإشعارات' },
  'cases': { label: 'القضايا' },
  'roles': { label: 'الأدوار' },
  'numbering': { label: 'الترقيم' },
  'buildings': { label: 'المباني' },
  'tasks-page': { label: 'مهام المشاريع' },
  'audit-log': { label: 'سجل التدقيق' },
  'inspection-builder': { label: 'منشئ المعاينات' },
  'lands-report': { label: 'سجل الأراضي' },
  'project-progress': { label: 'تقدم المشاريع' },
  'occupancy': { label: 'الإشغال' },
  'rent-roll': { label: 'كشف الإيجار' },
  'overdue': { label: 'المتأخرات' },
  'receivables-aging': { label: 'أعمار الذمم' },
  'stock-balance': { label: 'أرصدة المخزون' },
  'contractor-performance': { label: 'أداء المقاولين' },
  'maintenance-report': { label: 'تقرير الصيانة' },
  'payroll-summary': { label: 'ملخص الرواتب' },
  'trial-balance': { label: 'ميزان المراجعة' },
  'profit-loss': { label: 'قائمة الدخل' },
  'balance-sheet': { label: 'الميزانية العمومية' },
  'cash-flow': { label: 'التدفقات النقدية' },
  // Mega-pages
  'leasing': { label: 'العقارات والتأجير' },
  'construction-all': { label: 'المشاريع والإنشاءات' },
  'my-work': { label: 'مهامي اليوم' },
  'executive-dashboard': { label: 'لوحة المعلومات التنفيذية' },
  'dashboard': { label: 'لوحة المعلومات' },
  'all': { label: 'الكل' },
};

function lookupLabel(segment: string): string {
  if (routeLabels[segment]) return routeLabels[segment].label;
  // Fallback: convert kebab-case to Arabic
  if (/^\d+$/.test(segment)) return `#${segment}`;
  return segment.replace(/-/g, ' ');
}

/**
 * Auto-derives breadcrumbs from the current route using a label map.
 * Each segment is a link except the last (current page).
 */
export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, i) => {
    const path = '/' + segments.slice(0, i + 1).join('/');
    const isLast = i === segments.length - 1;
    return { path, label: lookupLabel(segment), isLast };
  });

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground" dir="rtl" aria-label="مسار التنقل">
      <Link to="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
        <Home className="h-3 w-3" />
        <span>الرئيسية</span>
      </Link>
      {crumbs.map((c, i) => (
        <span key={c.path} className="flex items-center gap-1.5">
          <ChevronLeft className="h-3 w-3 text-muted-foreground/50" />
          {c.isLast ? (
            <span className={cn('font-semibold text-foreground')}>{c.label}</span>
          ) : (
            <Link to={c.path} className="hover:text-foreground transition-colors">
              {c.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
