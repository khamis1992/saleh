// Portal Auth Context — separate from admin AuthContext
// Used by /portal/tenant, /portal/landlord, /portal/vendor
// Each portal type has its own login flow that looks up the relevant record in localStorage stores

import React, { createContext, useContext, useEffect, useState } from 'react';
import { tenantStore, contractorStore, propertyStore } from '@/services/stores';
import { useLocale } from '@/providers/LocaleContext';

export type PortalType = 'tenant' | 'landlord' | 'vendor';

export interface PortalSession {
  portalType: PortalType;
  userId: string;        // tenant id, contractor id, or landlord id
  displayName: string;   // shown in header
  email: string;
  // Optional context (e.g. linked property for landlord, linked company for vendor)
  propertyId?: string;
  vendorId?: string;
  tenantId?: string;
  signedInAt: string;
}

interface PortalAuthContextType {
  session: PortalSession | null;
  loading: boolean;
  signInTenant: (email: string, code: string) => Promise<{ error: string | null }>;
  signInLandlord: (email: string, propertyCode: string) => Promise<{ error: string | null }>;
  signInVendor: (email: string, crNumber: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const STORAGE_KEY = 'erp_portal_session';

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export function PortalAuthProvider({ children }: { children: React.ReactNode }) {
  const { t, tt, dir } = useLocale();
  const [session, setSession] = useState<PortalSession | null>(() => {
    // Read synchronously on init so the first render has the session
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  });
  const [loading, setLoading] = useState(false); // no async work to wait for

  useEffect(() => {
    // Re-sync if localStorage changes (e.g. login from another tab/shell)
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          setSession(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const persist = (s: PortalSession | null) => {
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
    setSession(s);
  };

  const signInTenant = async (email: string, code: string): Promise<{ error: string | null }> => {
    if (!email || !code) {
      return { error: 'الرجاء إدخال البريد الإلكتروني وكود المستأجر' };
    }
    const tenants = tenantStore.getAll();
    const tenant = tenants.find(
      (t) => t.email.toLowerCase() === email.toLowerCase() && t.tenant_code.toLowerCase() === code.toLowerCase(),
    );
    if (!tenant) {
      return { error: 'البريد أو كود المستأجر غير صحيح' };
    }
    if (tenant.status === 'blacklisted') {
      return { error: 'هذا الحساب موقوف. يرجى التواصل مع الإدارة' };
    }
    persist({
      portalType: 'tenant',
      userId: tenant.id,
      tenantId: tenant.id,
      displayName: tenant.full_name || tenant.company_name,
      email: tenant.email,
      signedInAt: new Date().toISOString(),
    });
    return { error: null };
  };

  const signInLandlord = async (email: string, propertyCode: string): Promise<{ error: string | null }> => {
    if (!email || !propertyCode) {
      return { error: 'الرجاء إدخال البريد الإلكتروني وكود العقار' };
    }
    // The "landlord" in this demo is treated as the property owner / portfolio manager.
    // The property_code is the property_code of one of their properties.
    const properties = propertyStore.getAll();
    const property = properties.find(
      (p) => p.property_code.toLowerCase() === propertyCode.toLowerCase(),
    );
    if (!property) {
      return { error: 'كود العقار غير صحيح' };
    }
    persist({
      portalType: 'landlord',
      userId: 'landlord-' + property.id,
      propertyId: property.id,
      displayName: property.property_name + ' — مالك',
      email,
      signedInAt: new Date().toISOString(),
    });
    return { error: null };
  };

  const signInVendor = async (email: string, crNumber: string): Promise<{ error: string | null }> => {
    if (!email || !crNumber) {
      return { error: 'الرجاء إدخال البريد الإلكتروني والسجل التجاري' };
    }
    const contractors = contractorStore.getAll();
    const vendor = contractors.find(
      (c) => c.email.toLowerCase() === email.toLowerCase() && c.cr_number === crNumber,
    );
    if (!vendor) {
      return { error: 'البريد أو السجل التجاري غير صحيح' };
    }
    persist({
      portalType: 'vendor',
      userId: vendor.id,
      vendorId: vendor.id,
      displayName: (vendor as any).company_name || (vendor as any).name || 'Vendor',
      email: vendor.email,
      signedInAt: new Date().toISOString(),
    });
    return { error: null };
  };

  const signOut = () => persist(null);

  return (
    <PortalAuthContext.Provider value={{ session, loading, signInTenant, signInLandlord, signInVendor, signOut }}>
      {children}
    </PortalAuthContext.Provider>
  );
}

export function usePortalAuth() {
  const ctx = useContext(PortalAuthContext);
  if (!ctx) throw new Error('usePortalAuth must be used within a PortalAuthProvider');
  return ctx;
}
