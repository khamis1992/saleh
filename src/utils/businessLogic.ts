// Business logic utilities for the Real Estate ERP
// These functions implement the business rules from the Phase 1 spec.

import type { Land, LeaseContract, RentalInvoice, Unit } from '@/types';

// ============================================================
// 12.1 Land Cost Calculation
// total_acquisition_cost = acquisition_price + broker_commission + registration_fees + legal_fees + other_costs
// ============================================================

export function calculateLandAcquisitionCost(land: Partial<Land>): number {
  const price = land.acquisition_price || 0;
  const broker = land.broker_commission || 0;
  const registration = land.registration_fees || 0;
  const legal = land.legal_fees || 0;
  const other = land.other_costs || 0;
  return price + broker + registration + legal + other;
}

export function computeLandTotalCost(land: Land): Land {
  return {
    ...land,
    total_acquisition_cost: calculateLandAcquisitionCost(land),
  };
}

// ============================================================
// 12.2 Unit Status Transitions (when lease contract activates/terminates)
// ============================================================

export function getUnitStatusAfterLeaseActivation(): 'leased' {
  return 'leased';
}

export function getUnitStatusAfterLeaseTermination(needsMaintenance: boolean): 'available' | 'under_maintenance' {
  return needsMaintenance ? 'under_maintenance' : 'available';
}

export function canUnitBeLeased(unit: Unit): boolean {
  return !['under_maintenance', 'blocked', 'sold'].includes(unit.status);
}

// ============================================================
// 12.3 Invoice Balance Calculation
// balance = total - paid_amount
// If balance === 0 → status = 'paid'
// If paid_amount > 0 AND balance > 0 → status = 'partially_paid'
// If due_date passed AND balance > 0 → status = 'overdue'
// ============================================================

export function calculateInvoiceBalance(invoice: Partial<RentalInvoice>): {
  balance: number;
  status: RentalInvoice['status'];
} {
  const total = invoice.total || 0;
  const paid = invoice.paid_amount || 0;
  const balance = total - paid;
  const dueDate = invoice.due_date;
  
  let status: RentalInvoice['status'];
  if (balance <= 0) {
    status = 'paid';
  } else if (paid > 0 && balance > 0) {
    status = 'partially_paid';
  } else if (dueDate && new Date(dueDate) < new Date() && balance > 0) {
    status = 'overdue';
  } else {
    status = 'issued';
  }
  
  return { balance, status };
}

export function computeInvoiceTotals(
  rentAmount: number,
  serviceCharges: number,
  maintenanceCharges: number,
  penalties: number,
  discounts: number,
): { total: number } {
  const total = rentAmount + serviceCharges + maintenanceCharges + penalties - discounts;
  return { total: Math.max(0, total) };
}

// ============================================================
// 12.4 Receipt Posting
// When receipt is created:
// - Add receipt amount to invoice paid_amount
// - Recalculate invoice balance
// - Update invoice status
// ============================================================

export function applyReceiptToInvoice(
  invoice: RentalInvoice,
  receiptAmount: number,
): RentalInvoice {
  const newPaid = (invoice.paid_amount || 0) + receiptAmount;
  const updated = {
    ...invoice,
    paid_amount: newPaid,
  };
  const { balance, status } = calculateInvoiceBalance(updated);
  return { ...updated, balance, status };
}

// ============================================================
// 12.5 Project Completion Average
// Project completion % = average of phase progress percentages
// ============================================================

export function calculateProjectCompletion(phases: { progress_percentage: number }[]): number {
  if (phases.length === 0) return 0;
  const total = phases.reduce((sum, p) => sum + (p.progress_percentage || 0), 0);
  return Math.round(total / phases.length);
}

// ============================================================
// UNIT AVAILABILITY CHECK
// ============================================================

export function validateLeaseContractDates(
  startDate: string,
  endDate: string,
): { valid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { valid: false, error: 'يجب تحديد تاريخ البداية والنهاية' };
  }
  if (new Date(endDate) <= new Date(startDate)) {
    return { valid: false, error: 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية' };
  }
  return { valid: true };
}

export function validateReceiptAmount(amount: number): { valid: boolean; error?: string } {
  if (amount <= 0) {
    return { valid: false, error: 'يجب أن يكون المبلغ أكبر من صفر' };
  }
  return { valid: true };
}

export function validateInvoiceTotal(
  rentAmount: number,
  serviceCharges: number,
  maintenanceCharges: number,
  penalties: number,
  discounts: number,
): { valid: boolean; total: number } {
  const total = rentAmount + serviceCharges + maintenanceCharges + penalties - discounts;
  return { valid: total >= 0, total: Math.max(0, total) };
}

// ============================================================
// STATIC DASHBOARD KPIs (computed from data)
// ============================================================

export interface DashboardKPIs {
  totalLands: number;
  activeProjects: number;
  avgProjectCompletion: number;
  totalProperties: number;
  totalUnits: number;
  availableUnits: number;
  leasedUnits: number;
  occupancyRate: number;
  monthlyRentIncome: number;
  overdueRent: number;
  openMaintenanceRequests: number;
  totalReceivables: number;
  cashCollectedThisMonth: number;
}

export function computeDashboardKPIs(data: {
  lands: Land[];
  projects: { status: string; completion_percentage: number }[];
  properties: unknown[];
  units: { status: string }[];
  invoices: { status: string; balance: number; paid_amount: number; total: number }[];
  maintenance: { status: string }[];
}): DashboardKPIs {
  const { lands, projects, properties, units, invoices, maintenance } = data;
  
  const activeProjects = projects.filter(p => 
    ['construction', 'testing'].includes(p.status)
  );
  
  const avgCompletion = projects.length > 0
    ? Math.round(projects.reduce((s, p) => s + (p.completion_percentage || 0), 0) / projects.length)
    : 0;
  
  const availableUnits = units.filter(u => u.status === 'available');
  const leasedUnits = units.filter(u => u.status === 'leased');
  const occupancyRate = units.length > 0
    ? Math.round((leasedUnits.length / units.length) * 100 * 10) / 10
    : 0;
  
  const monthlyRent = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + (i.total || 0), 0);
  
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const overdueRent = overdueInvoices.reduce((s, i) => s + (i.balance || 0), 0);
  
  const openMaintenance = maintenance.filter(m => 
    !['completed', 'closed', 'cancelled'].includes(m.status)
  );
  
  const receivables = invoices
    .filter(i => i.balance > 0)
    .reduce((s, i) => s + i.balance, 0);
  
  const cashCollected = invoices
    .reduce((s, i) => s + (i.paid_amount || 0), 0);
  
  return {
    totalLands: lands.length,
    activeProjects: activeProjects.length,
    avgProjectCompletion: avgCompletion,
    totalProperties: properties.length,
    totalUnits: units.length,
    availableUnits: availableUnits.length,
    leasedUnits: leasedUnits.length,
    occupancyRate,
    monthlyRentIncome: monthlyRent,
    overdueRent,
    openMaintenanceRequests: openMaintenance.length,
    totalReceivables: receivables,
    cashCollectedThisMonth: cashCollected,
  };
}
