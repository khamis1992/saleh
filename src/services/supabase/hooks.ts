// Supabase service hooks for the Real Estate ERP
// Provides typed hooks for all Phase 1 CRUD operations

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './client';
import type { PostgrestError } from '@supabase/supabase-js';

// ============================================================
// GENERIC HOOK FACTORY
// ============================================================

interface UseSupabaseQueryResult<T> {
  data: T[];
  loading: boolean;
  error: PostgrestError | null;
  refresh: () => Promise<void>;
}

export function useSupabaseQuery<T>(
  tableName: string,
  options?: {
    select?: string;
    filter?: Record<string, unknown>;
    order?: { column: string; ascending?: boolean };
    single?: boolean;
  }
): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from(tableName).select(options?.select || '*');
      
      if (options?.filter) {
        Object.entries(options.filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      
      if (options?.order) {
        query = query.order(options.order.column, { ascending: options.order.ascending ?? false });
      }
      
      if (options?.single) {
        const { data: row, error: err } = await query.single();
        if (err) throw err;
        setData(row ? [row as T] : []);
      } else {
        const { data: rows, error: err } = await query;
        if (err) throw err;
        setData((rows || []) as T[]);
      }
      setError(null);
    } catch (e) {
      setError(e as PostgrestError);
    } finally {
      setLoading(false);
    }
  }, [tableName, options?.select, JSON.stringify(options?.filter), options?.order?.column, options?.order?.ascending, options?.single]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refresh: fetch };
}

// ============================================================
// MUTATION BASE
// ============================================================

export async function supabaseInsert<T extends Record<string, unknown>>(
  tableName: string,
  record: T,
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from(tableName)
    .insert(record)
    .select()
    .single();
  return { data: data as T | null, error };
}

export async function supabaseUpdate<T extends Record<string, unknown>>(
  tableName: string,
  id: string,
  record: Partial<T>,
): Promise<{ data: T | null; error: PostgrestError | null }> {
  const { data, error } = await supabase
    .from(tableName)
    .update(record as Record<string, unknown>)
    .eq('id', id)
    .select()
    .single();
  return { data: data as T | null, error };
}

export async function supabaseSoftDelete(
  tableName: string,
  id: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from(tableName)
    .update({ is_active: false })
    .eq('id', id);
  return { error };
}

export async function supabaseDelete(
  tableName: string,
  id: string,
): Promise<{ error: PostgrestError | null }> {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);
  return { error };
}

// ============================================================
// SPECIFIC HOOKS
// ============================================================

// Dashboard
export function useDashboardStats() {
  const lands = useSupabaseQuery('lands');
  const projects = useSupabaseQuery('projects');
  const properties = useSupabaseQuery('properties');
  const units = useSupabaseQuery('units');
  const invoices = useSupabaseQuery('rental_invoices');
  const maintenance = useSupabaseQuery('maintenance_requests');

  const loading = lands.loading || projects.loading || properties.loading || units.loading || invoices.loading || maintenance.loading;

  return {
    lands: lands.data,
    projects: projects.data,
    properties: properties.data,
    units: units.data,
    invoices: invoices.data,
    maintenance: maintenance.data,
    loading,
    refresh: () => {
      lands.refresh();
      projects.refresh();
      properties.refresh();
      units.refresh();
      invoices.refresh();
      maintenance.refresh();
    },
  };
}

// Lands
export function useLands() {
  return useSupabaseQuery('lands', { order: { column: 'created_at', ascending: false } });
}

// Projects
export function useProjects() {
  return useSupabaseQuery('projects', { order: { column: 'created_at', ascending: false } });
}

// Contractors
export function useContractors() {
  return useSupabaseQuery('contractors', { order: { column: 'contractor_name', ascending: true } });
}

// Properties
export function useProperties() {
  return useSupabaseQuery('properties', { order: { column: 'created_at', ascending: false } });
}

// Units
export function useUnits(propertyId?: string) {
  return useSupabaseQuery('units', {
    filter: propertyId ? { property_id: propertyId } : undefined,
    order: { column: 'unit_number', ascending: true },
  });
}

// Tenants
export function useTenants() {
  return useSupabaseQuery('tenants', { order: { column: 'created_at', ascending: false } });
}

// Lease Contracts
export function useLeaseContracts() {
  return useSupabaseQuery('lease_contracts', { order: { column: 'created_at', ascending: false } });
}

// Rental Invoices
export function useRentalInvoices(tenantId?: string) {
  return useSupabaseQuery('rental_invoices', {
    filter: tenantId ? { tenant_id: tenantId } : undefined,
    order: { column: 'due_date', ascending: false },
  });
}

// Receipts
export function useReceipts(invoiceId?: string) {
  return useSupabaseQuery('receipts', {
    filter: invoiceId ? { invoice_id: invoiceId } : undefined,
    order: { column: 'payment_date', ascending: false },
  });
}

// Maintenance Requests
export function useMaintenanceRequests() {
  return useSupabaseQuery('maintenance_requests', { order: { column: 'created_at', ascending: false } });
}

// Chart of Accounts
export function useChartOfAccounts() {
  return useSupabaseQuery('chart_of_accounts', { order: { column: 'account_code', ascending: true } });
}

// Journal Entries
export function useJournalEntries() {
  return useSupabaseQuery('journal_entries', { order: { column: 'entry_date', ascending: false } });
}

// Documents
export function useDocuments(module?: string, recordId?: string) {
  return useSupabaseQuery('documents', {
    filter: module && recordId ? { linked_module: module, linked_record_id: recordId } 
           : module ? { linked_module: module }
           : undefined,
    order: { column: 'created_at', ascending: false },
  });
}

// Profiles
export function useProfiles() {
  return useSupabaseQuery('profiles', {
    select: '*, roles(role_name_ar), departments(department_name_ar)',
    order: { column: 'full_name', ascending: true },
  });
}
