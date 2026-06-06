type LabelMap = Record<string, string>;

const SIMPLE_LABELS: Record<string, LabelMap> = {
  nav: {
    dashboard: 'لوحة المعلومات',
    projects: 'المشاريع',
    lands: 'الأراضي',
    contractors: 'المقاولون',
    properties: 'العقارات',
    units: 'الوحدات',
    tenants: 'المستأجرون',
    leases: 'العقود',
    'rent-collection': 'التحصيل',
    maintenance: 'الصيانة',
    finance: 'المالية',
    reports: 'التقارير',
    settings: 'الإعدادات',
    users: 'المستخدمون',
    documents: 'المستندات',
  },
  actions: {
    create: 'إضافة جديد',
    edit: 'تعديل',
    delete: 'حذف',
    save: 'حفظ',
    cancel: 'إلغاء',
    approve: 'اعتماد',
    reject: 'رفض',
    activate: 'تفعيل',
    close: 'إغلاق',
    print: 'طباعة',
    download: 'تحميل',
    upload: 'رفع ملف',
    search: 'بحث',
    'save-draft': 'احفظ كمسودة',
    'record-payment': 'سجل دفعة',
    'send-reminder': 'أرسل تذكير',
    'start-work': 'ابدأ العمل',
    'add-note': 'أضف ملاحظة',
    'upload-photo': 'ارفع صورة',
  },
  status: {
    active: 'نشط', inactive: 'غير نشط', pending: 'بانتظار', approved: 'معتمد',
    rejected: 'مرفوض', completed: 'مكتمل', 'in-progress': 'قيد التنفيذ',
    cancelled: 'ملغي', draft: 'مسودة', overdue: 'متأخر', paid: 'مدفوع',
    unpaid: 'غير مدفوع', available: 'متاح', leased: 'مؤجر',
    'under-maintenance': 'تحت الصيانة', reserved: 'محجوز',
  },
};

export function label(category: keyof typeof SIMPLE_LABELS, key: string, fallback?: string): string {
  return SIMPLE_LABELS[category]?.[key] || fallback || key;
}

export { SIMPLE_LABELS };
