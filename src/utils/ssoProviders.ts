// SSO provider catalog + flow simulator library.
// Real OAuth/OIDC/SAML wiring requires a backend; this module provides:
//  - A static catalog of every provider we support (for the picker UI)
//  - Simulated flow functions (Nafath, UAE PASS, enterprise SSO) that
//    take 1-2 seconds of "loading" then return a synthetic but realistic
//    identity payload, which the caller (login page or hub) records as a
//    LinkedIdentity + AuthSession + IdentityAuditLog entry.

import type { SsoProviderId, SsoProviderCategory } from '@/types';

export interface SsoProviderInfo {
  id: SsoProviderId;
  category: SsoProviderCategory;
  /** Arabic display name (primary). */
  name_ar: string;
  /** English display name (for bilingual headers / tooltips). */
  name_en: string;
  /** Short Arabic description for the picker card. */
  description_ar: string;
  /** Brand background color (Tailwind class). */
  brand_bg: string;
  /** Brand foreground (icon) color. */
  brand_fg: string;
  /** First letter used for the avatar circle fallback. */
  initial: string;
  /** Approx. user base / signal (for the "X million users" line on cards). */
  user_base: string;
  /** Region tag — used to filter providers in the picker. */
  region: 'saudi' | 'uae' | 'gcc' | 'global';
  /** Whether this is available to demo right now (all are for prototype). */
  available: boolean;
}

export const SSO_PROVIDERS: SsoProviderInfo[] = [
  // ── National eID (GCC) ──
  {
    id: 'nafath',
    category: 'national_eid',
    name_ar: 'نفاذ — الهوية الرقمية',
    name_en: 'Nafath (Saudi)',
    description_ar: 'الدخول الموحد الوطني للمواطنين والمقيمين في المملكة',
    brand_bg: 'bg-emerald-50',
    brand_fg: 'text-emerald-700',
    initial: 'ن',
    user_base: '23+ مليون مستخدم',
    region: 'saudi',
    available: true,
  },
  {
    id: 'uae_pass',
    category: 'national_eid',
    name_ar: 'الهوية الرقمية الإماراتية',
    name_en: 'UAE PASS',
    description_ar: 'الهوية الرقمية الرسمية لدولة الإمارات',
    brand_bg: 'bg-red-50',
    brand_fg: 'text-red-700',
    initial: 'U',
    user_base: '7+ مليون مستخدم',
    region: 'uae',
    available: true,
  },
  {
    id: 'kuwait_mobile_id',
    category: 'national_eid',
    name_ar: 'الهوية الرقمية الكويتية',
    name_en: 'Kuwait Mobile ID',
    description_ar: 'تطبيق الهوية الوطنية لدولة الكويت',
    brand_bg: 'bg-teal-50',
    brand_fg: 'text-teal-700',
    initial: 'ك',
    user_base: '2+ مليون مستخدم',
    region: 'gcc',
    available: true,
  },
  {
    id: 'turk_id',
    category: 'national_eid',
    name_ar: 'الهوية العمانية',
    name_en: 'Oman TurkID',
    description_ar: 'تطبيق الهوية الرقمية لسلطنة عُمان',
    brand_bg: 'bg-amber-50',
    brand_fg: 'text-amber-700',
    initial: 'ع',
    user_base: '1+ مليون مستخدم',
    region: 'gcc',
    available: true,
  },

  // ── Enterprise SSO ──
  {
    id: 'azure_ad',
    category: 'enterprise',
    name_ar: 'Microsoft Entra ID',
    name_en: 'Azure AD / Entra ID',
    description_ar: 'تسجيل الدخول الموحد لموظفي المؤسسات',
    brand_bg: 'bg-blue-50',
    brand_fg: 'text-blue-700',
    initial: 'A',
    user_base: 'مؤسسي',
    region: 'global',
    available: true,
  },
  {
    id: 'google_workspace',
    category: 'enterprise',
    name_ar: 'Google Workspace',
    name_en: 'Google Workspace',
    description_ar: 'تسجيل الدخول بحساب Google الخاص بالعمل',
    brand_bg: 'bg-slate-50',
    brand_fg: 'text-slate-700',
    initial: 'G',
    user_base: 'مؤسسي',
    region: 'global',
    available: true,
  },
  {
    id: 'okta',
    category: 'enterprise',
    name_ar: 'Okta Workforce',
    name_en: 'Okta',
    description_ar: 'بوابة هوية المؤسسات الرائدة عالمياً',
    brand_bg: 'bg-indigo-50',
    brand_fg: 'text-indigo-700',
    initial: 'O',
    user_base: 'مؤسسي',
    region: 'global',
    available: true,
  },
  {
    id: 'keycloak',
    category: 'enterprise',
    name_ar: 'Keycloak (ذاتي الاستضافة)',
    name_en: 'Keycloak (self-hosted)',
    description_ar: 'حل الهوية مفتوح المصدر للاستضافة الذاتية',
    brand_bg: 'bg-violet-50',
    brand_fg: 'text-violet-700',
    initial: 'K',
    user_base: 'مؤسسي',
    region: 'global',
    available: true,
  },
  {
    id: 'saml',
    category: 'enterprise',
    name_ar: 'SAML 2.0 (عام)',
    name_en: 'SAML 2.0 (generic)',
    description_ar: 'تكامل مع أي موفر هوية يدعم SAML',
    brand_bg: 'bg-gray-100',
    brand_fg: 'text-gray-700',
    initial: 'S',
    user_base: 'مؤسسي',
    region: 'global',
    available: true,
  },

  // ── Social ──
  {
    id: 'apple',
    category: 'social',
    name_ar: 'Apple ID',
    name_en: 'Apple ID',
    description_ar: 'تسجيل الدخول بـ Apple (متوافق مع FaceID)',
    brand_bg: 'bg-gray-900',
    brand_fg: 'text-white',
    initial: '',
    user_base: 'استهلاكي',
    region: 'global',
    available: true,
  },
  {
    id: 'github',
    category: 'developer',
    name_ar: 'GitHub',
    name_en: 'GitHub',
    description_ar: 'تسجيل الدخول بحساب المطور',
    brand_bg: 'bg-slate-900',
    brand_fg: 'text-white',
    initial: 'G',
    user_base: 'استهلاكي',
    region: 'global',
    available: true,
  },
];

export function getProvider(id: SsoProviderId): SsoProviderInfo {
  return SSO_PROVIDERS.find((p) => p.id === id) || {
    id,
    category: 'social',
    name_ar: id,
    name_en: id,
    description_ar: '',
    brand_bg: 'bg-gray-100',
    brand_fg: 'text-gray-700',
    initial: id.charAt(0).toUpperCase(),
    user_base: '',
    region: 'global',
    available: true,
  };
}

export function getProvidersByCategory(category: SsoProviderCategory): SsoProviderInfo[] {
  return SSO_PROVIDERS.filter((p) => p.category === category);
}

// ============================================================
// Flow simulators
// ============================================================

export interface SsoFlowResult {
  ok: boolean;
  provider_user_id: string;
  provider_email: string;
  provider_display_name: string;
  claims: Record<string, string>;
  /** Short human-readable error in Arabic when ok=false. */
  error?: string;
}

/**
 * Simulate a Nafath flow. Real Nafath would push a request to the user's
 * Nafath app and poll for approval. Here we wait 1.6s and synthesize a
 * national-id-based identity.
 */
export async function simulateNafathFlow(phone: string): Promise<SsoFlowResult> {
  await sleep(1600);
  if (!/^[0-9+]{8,15}$/.test(phone)) {
    return { ok: false, provider_user_id: '', provider_email: '', provider_display_name: '', claims: {}, error: 'رقم الجوال غير صالح' };
  }
  const nationalId = generateSaudiNationalId();
  return {
    ok: true,
    provider_user_id: `NAFATH-${nationalId}`,
    provider_email: `user${nationalId.slice(-4)}@example.sa`,
    provider_display_name: `مستخدم نفاذ ${nationalId.slice(-4)}`,
    claims: {
      national_id: nationalId,
      phone,
      source: 'Nafath',
      trust_level: 'high',
    },
  };
}

/**
 * Simulate a UAE PASS flow: enter Emirates ID, get a "biometric" prompt,
 * approve, and the identity is returned. Returns ok=false if the ID
 * format is invalid.
 */
export async function simulateUaePassFlow(emiratesId: string): Promise<SsoFlowResult> {
  await sleep(1700);
  // UAE Emirates ID format: 784-YYYY-NNNNNNN-N
  const cleaned = emiratesId.replace(/[\s-]/g, '');
  if (!/^784[0-9]{12,15}$/.test(cleaned)) {
    return { ok: false, provider_user_id: '', provider_email: '', provider_display_name: '', claims: {}, error: 'رقم الهوية الإماراتية غير صالح' };
  }
  return {
    ok: true,
    provider_user_id: `UAEPASS-${cleaned}`,
    provider_email: `user${cleaned.slice(-4)}@uaepass.ae`,
    provider_display_name: `UAE PASS ${cleaned.slice(-4)}`,
    claims: {
      emirates_id: cleaned,
      biometric: 'verified',
      source: 'UAE PASS',
      trust_level: 'high',
    },
  };
}

/**
 * Simulate an enterprise SSO redirect. The "redirect URL" is generated
 * but not actually navigated to — the caller can show a "Redirecting..."
 * state for ~1.4s and then call this with the callback path.
 */
export async function simulateEnterpriseSsoFlow(provider: SsoProviderId): Promise<SsoFlowResult> {
  await sleep(1400);
  const random = Math.random().toString(36).slice(2, 10);
  const email = `user.${random}@enterprise.${provider === 'azure_ad' ? 'com' : provider === 'google_workspace' ? 'com' : 'io'}`;
  return {
    ok: true,
    provider_user_id: `${provider.toUpperCase()}-${random}`,
    provider_email: email,
    provider_display_name: `Enterprise User (${provider})`,
    claims: {
      tenant: 'land2-demo',
      saml_subject: random,
      source: provider,
      trust_level: 'medium',
    },
  };
}

// ============================================================
// Synthetic helpers (used by simulators + IdentityHub seed data)
// ============================================================

/** Generate a synthetic Saudi national ID (10 digits starting with 1 or 2). */
export function generateSaudiNationalId(): string {
  const prefix = Math.random() < 0.5 ? '1' : '2';
  let id = prefix;
  for (let i = 0; i < 9; i++) id += Math.floor(Math.random() * 10);
  return id;
}

/** Generate a synthetic UAE Emirates ID (784-YYYY-NNNNNNN-N). */
export function generateUaeEmiratesId(): string {
  const year = 1970 + Math.floor(Math.random() * 50);
  const serial = String(Math.floor(Math.random() * 1_000_000_0)).padStart(7, '0');
  const check = Math.floor(Math.random() * 10);
  return `784-${year}-${serial}-${check}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================================
// Session helpers
// ============================================================

/**
 * Best-effort parsing of the current browser UA into a friendly device
 * string. Falls back to "Unknown device".
 */
export function describeUserAgent(ua: string): { device: string; browser: string; os: string } {
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Safari\//.test(ua) ? 'Safari'
    : 'متصفح غير معروف';
  const os = /Windows NT/.test(ua) ? 'Windows'
    : /Mac OS X/.test(ua) ? 'macOS'
    : /Android/.test(ua) ? 'Android'
    : /iPhone|iPad/.test(ua) ? 'iOS'
    : /Linux/.test(ua) ? 'Linux'
    : 'نظام غير معروف';
  return {
    device: `${browser} على ${os}`,
    browser,
    os,
  };
}

/** Synthetic IP for demo sessions. */
export function syntheticIp(): string {
  return `10.${Math.floor(Math.random() * 200) + 20}.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 200) + 5}`;
}

/** Random MENA city for demo session location. */
export function randomMenaCity(): string {
  const cities = ['الدوحة، قطر', 'الرياض، السعودية', 'دبي، الإمارات', 'أبوظبي، الإمارات', 'الكويت، الكويت', 'المنامة، البحرين', 'مسقط، عُمان', 'عمّان، الأردن', 'القاهرة، مصر', 'بيروت، لبنان'];
  return cities[Math.floor(Math.random() * cities.length)];
}
