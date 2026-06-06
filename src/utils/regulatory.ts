// Regulatory Registrations — GCC agencies and authorities
// Ejari (Dubai tenancy contract registration)
// DLD (Dubai Land Department)
// RERA (Real Estate Regulatory Authority)
// Baladi / MOMRA (Saudi building permits)
// Dubai Municipality (building completion certificates)
// MOHRE (labour/workforce registration)
// GAZT (Saudi ZATCA / tax authority)
// QatarRA (Qatar Real Estate Regulatory Authority)

import type { RegulatoryAuthority, RegulatoryRegistration, RegulatoryStatus } from '@/types';

export interface AuthorityMeta {
  code: RegulatoryAuthority;
  name_ar: string;
  name_en: string;
  country: 'AE' | 'SA' | 'QA' | 'BH';
  description: string;
  portal_url: string;
  fee_currency: 'AED' | 'SAR' | 'QAR' | 'BHD';
  typical_renewal_days: number;
  icon: string;
}

export const AUTHORITY_REGISTRY: Record<RegulatoryAuthority, AuthorityMeta> = {
  Ejari: {
    code: 'Ejari', name_ar: 'إيجاري (دبي)', name_en: 'Ejari (Dubai)',
    country: 'AE', description: 'تسجيل عقود إيجار دبي',
    portal_url: 'https://www.ejari.ae', fee_currency: 'AED', typical_renewal_days: 365, icon: 'FileText',
  },
  DLD: {
    code: 'DLD', name_ar: 'دائرة الأراضي والأملاك - دبي', name_en: 'Dubai Land Department',
    country: 'AE', description: 'تسجيل العقارات والمعاملات العقارية في دبي',
    portal_url: 'https://www.dld.gov.ae', fee_currency: 'AED', typical_renewal_days: 365, icon: 'Building2',
  },
  RERA: {
    code: 'RERA', name_ar: 'مؤسسة التنظيم العقاري', name_en: 'RERA',
    country: 'AE', description: 'تراخيص الوسطاء العقاريين والمطورين',
    portal_url: 'https://www.rera.ae', fee_currency: 'AED', typical_renewal_days: 365, icon: 'Shield',
  },
  Baladi: {
    code: 'Baladi', name_ar: 'منصة بلدي (السعودية)', name_en: 'Baladi Platform',
    country: 'SA', description: 'التراخيص البلدية ورخص البناء',
    portal_url: 'https://balady.gov.sa', fee_currency: 'SAR', typical_renewal_days: 180, icon: 'Building',
  },
  MOMRA: {
    code: 'MOMRA', name_ar: 'وزارة الشؤون البلدية والقروية', name_en: 'MOMRA',
    country: 'SA', description: 'وزارة الشؤون البلدية والقروية والإسكان',
    portal_url: 'https://momra.gov.sa', fee_currency: 'SAR', typical_renewal_days: 365, icon: 'Landmark',
  },
  DubaiMunicipality: {
    code: 'DubaiMunicipality', name_ar: 'بلدية دبي', name_en: 'Dubai Municipality',
    country: 'AE', description: 'شهادات إتمام البناء والمطابقة',
    portal_url: 'https://www.dm.gov.ae', fee_currency: 'AED', typical_renewal_days: 365, icon: 'CheckCircle2',
  },
  MOHRE: {
    code: 'MOHRE', name_ar: 'وزارة الموارد البشرية والتوطين', name_en: 'MOHRE',
    country: 'AE', description: 'تصاريح العمل وعقود الموظفين',
    portal_url: 'https://www.mohre.gov.ae', fee_currency: 'AED', typical_renewal_days: 730, icon: 'Users',
  },
  GAZT: {
    code: 'GAZT', name_ar: 'هيئة الزكاة والضريبة والجمارك', name_en: 'ZATCA',
    country: 'SA', description: 'هيئة الزكاة والضريبة والجمارك (ZATCA)',
    portal_url: 'https://www.zatca.gov.sa', fee_currency: 'SAR', typical_renewal_days: 365, icon: 'Calculator',
  },
  QatarRA: {
    code: 'QatarRA', name_ar: 'هيئة تنظيم العقارات - قطر', name_en: 'Qatar Real Estate Regulatory Authority',
    country: 'QA', description: 'تسجيل العقارات والوساطة العقارية في قطر',
    portal_url: 'https://www.qrera.gov.qa', fee_currency: 'QAR', typical_renewal_days: 365, icon: 'Building',
  },
};

/** Status labels in Arabic. */
export const REGULATORY_STATUS_LABELS_AR: Record<RegulatoryStatus, string> = {
  pending: 'قيد الانتظار',
  in_progress: 'جارٍ المعالجة',
  registered: 'مسجّل',
  expired: 'منتهي الصلاحية',
  rejected: 'مرفوض',
  renewed: 'تم التجديد',
};

export const REGULATORY_STATUS_VARIANTS: Record<RegulatoryStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  in_progress: 'bg-blue-100 text-blue-700',
  registered: 'bg-emerald-100 text-emerald-700',
  expired: 'bg-red-100 text-red-700',
  rejected: 'bg-red-100 text-red-700',
  renewed: 'bg-cyan-100 text-cyan-700',
};

/** Registration types per authority — what can you register. */
export const REGISTRATION_TYPES: Record<RegulatoryAuthority, string[]> = {
  Ejari: ['عقد إيجار', 'تجديد عقد', 'فسخ عقد'],
  DLD: ['نقل ملكية', 'رهن عقاري', 'إفراغ', 'إصدار سند ملكية'],
  RERA: ['ترخيص وسيط عقاري', 'ترخيص مطور', 'ترخيص إدارة عقارات', 'ترخيص تقييم'],
  Baladi: ['رخصة بناء', 'رخصة هدم', 'شهادة إتمام بناء', 'رخصة ترميم'],
  MOMRA: ['اعتماد مخطط', 'ترخيص تسويق', 'اعتماد مكتب هندسي'],
  DubaiMunicipality: ['شهادة إتمام بناء', 'فحص عقار', 'تصريح ترميم', 'إصدار NOC'],
  MOHRE: ['تصريح عمل', 'عقد عمل', 'نقل كفالة', 'بطاقة عمل'],
  GAZT: ['شهادة تسجيل ضريبي', 'فوترة إلكترونية', 'إيداع إقرار ضريبي'],
  QatarRA: ['ترخيص وسيط', 'تسجيل مشروع', 'ترخيص تأجير', 'إعلان عقاري'],
};

export function isExpiringSoon(registration: RegulatoryRegistration, withinDays: number = 30, now: Date = new Date()): boolean {
  if (!registration.expiry_date) return false;
  const expiry = new Date(registration.expiry_date);
  const diff = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= withinDays;
}

export function isExpired(registration: RegulatoryRegistration, now: Date = new Date()): boolean {
  if (!registration.expiry_date) return false;
  return new Date(registration.expiry_date) < now;
}

export function daysUntilExpiry(registration: RegulatoryRegistration, now: Date = new Date()): number {
  if (!registration.expiry_date) return 0;
  return Math.floor((new Date(registration.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function registrationStatusColor(registration: RegulatoryRegistration, now: Date = new Date()): string {
  if (isExpired(registration, now)) return 'text-red-600';
  if (isExpiringSoon(registration, 30, now)) return 'text-amber-600';
  return 'text-emerald-600';
}

export function regulatoryPeriodLabel(authority: RegulatoryAuthority, ref: string): string {
  return `${AUTHORITY_REGISTRY[authority].name_ar} — ${ref}`;
}

/** Compute the upcoming renewal date for a registration. */
export function nextRenewalDate(registration: RegulatoryRegistration, now: Date = new Date()): string {
  const meta = AUTHORITY_REGISTRY[registration.authority];
  const base = registration.expiry_date ? new Date(registration.expiry_date) : now;
  base.setDate(base.getDate() + meta.typical_renewal_days);
  return base.toISOString().split('T')[0];
}
