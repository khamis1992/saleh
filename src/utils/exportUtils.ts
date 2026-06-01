// CSV export utility for data tables
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T | string; label: string }[],
  filename: string = 'export.csv',
) {
  if (data.length === 0) return;

  // Build CSV header (BOM for Arabic Excel compatibility)
  const BOM = '\uFEFF';
  const header = columns.map(c => `"${c.label}"`).join(',');
  
  // Build rows
  const rows = data.map(row =>
    columns.map(col => {
      const value = typeof col.key === 'string' ? (row as any)[col.key] : row[col.key];
      const str = value != null ? String(value).replace(/"/g, '""') : '';
      return `"${str}"`;
    }).join(',')
  );

  const csv = BOM + header + '\n' + rows.join('\n');
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Audit logging utility
const AUDIT_KEY = 'erp_audit_log';

export interface AuditEntry {
  id: string;
  user: string;
  action: string;
  module: string;
  recordId: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
}

export function logAudit(
  action: string,
  module: string,
  recordId: string,
  oldValue?: string,
  newValue?: string,
) {
  try {
    const stored = localStorage.getItem(AUDIT_KEY);
    const logs: AuditEntry[] = stored ? JSON.parse(stored) : [];
    const user = (() => {
      try {
        const u = localStorage.getItem('erp_auth_user');
        return u ? JSON.parse(u).email || 'مستخدم' : 'مستخدم';
      } catch { return 'مستخدم'; }
    })();

    logs.unshift({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      user,
      action,
      module,
      recordId,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    });

    // Keep last 500 entries
    if (logs.length > 500) logs.length = 500;
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs));
  } catch { /* fail silently */ }
}

export function getAuditLogs(): AuditEntry[] {
  try {
    const stored = localStorage.getItem(AUDIT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

// Journal entry validation
export function validateJournalEntry(
  lines: { debit: number; credit: number }[],
): { valid: boolean; totalDebit: number; totalCredit: number; error?: string } {
  const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);
  
  if (lines.length === 0) {
    return { valid: false, totalDebit, totalCredit, error: 'يجب إضافة بند واحد على الأقل' };
  }
  if (Math.abs(totalDebit - totalCredit) > 0.001) {
    return { valid: false, totalDebit, totalCredit, error: 'مجموع المدين يجب أن يساوي مجموع الدائن' };
  }
  return { valid: true, totalDebit, totalCredit };
}

// Lease activation — update unit status and generate rent schedule + first invoice
export function activateLeaseContract(unitId: string, contractId: string) {
  try {
    // Update unit status
    const unitsRaw = localStorage.getItem('erp_units');
    if (unitsRaw) {
      const units = JSON.parse(unitsRaw);
      const unitIdx = units.findIndex((u: any) => u.id === unitId);
      if (unitIdx !== -1) {
        units[unitIdx].status = 'leased';
        localStorage.setItem('erp_units', JSON.stringify(units));
      }
    }
    
    // Update contract status
    const leasesRaw = localStorage.getItem('erp_leases');
    let lease: any = null;
    if (leasesRaw) {
      const leases = JSON.parse(leasesRaw);
      const leaseIdx = leases.findIndex((l: any) => l.id === contractId);
      if (leaseIdx !== -1) {
        leases[leaseIdx].status = 'active';
        lease = leases[leaseIdx];
        localStorage.setItem('erp_leases', JSON.stringify(leases));
      }
    }

    // Auto-generate RentSchedule entries
    if (lease) {
      generateRentScheduleForLease(lease);
      // Generate JE for first invoice: Debit Tenant Receivables (acc-3), Credit Rental Revenue (acc-13)
      const freq = lease.payment_frequency;
      let intervalMonths = 12;
      if (freq === 'monthly') intervalMonths = 1;
      else if (freq === 'quarterly') intervalMonths = 3;
      else if (freq === 'semi_annual') intervalMonths = 6;
      const periodRent = freq === 'annual' ? lease.rent_amount : Math.round(lease.rent_amount / (12 / intervalMonths));
      generateJournalEntry(
        `تفعيل عقد إيجار — أول قسط ${lease.contract_number || contractId}`,
        'عقود',
        contractId,
        [
          { account_id: 'acc-3', debit: periodRent, credit: 0, description: 'ذمم مستأجرين — أول قسط' },
          { account_id: 'acc-13', debit: 0, credit: periodRent, description: 'إيرادات إيجار' },
        ],
      );
    }

    logAudit('activate', 'lease_contract', contractId, 'draft', 'active');
    return true;
  } catch {
    return false;
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function addMonths(date: string, months: number): string {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

function generateRentScheduleForLease(lease: any) {
  const schedulesRaw = localStorage.getItem('erp_rent_schedules');
  const schedules: any[] = schedulesRaw ? JSON.parse(schedulesRaw) : [];

  const invoicesRaw = localStorage.getItem('erp_invoices');
  const invoices: any[] = invoicesRaw ? JSON.parse(invoicesRaw) : [];

  const freq = lease.payment_frequency;
  const startDate = lease.start_date;
  const endDate = lease.end_date;
  const rentAmount = lease.rent_amount;

  // Determine number of periods based on payment frequency
  let intervalMonths = 12;
  if (freq === 'monthly') intervalMonths = 1;
  else if (freq === 'quarterly') intervalMonths = 3;
  else if (freq === 'semi_annual') intervalMonths = 6;

  // Calculate how many periods fit in the lease term
  const startD = new Date(startDate);
  const endD = new Date(endDate);
  const totalMonths = (endD.getFullYear() - startD.getFullYear()) * 12 + (endD.getMonth() - startD.getMonth());
  const numPeriods = Math.max(1, Math.ceil(totalMonths / intervalMonths));

  // Calculate per-period rent
  const periodRent = freq === 'annual' 
    ? rentAmount 
    : Math.round(rentAmount / (12 / intervalMonths));

  // Existing invoice counter
  const existingInvoices = invoices.filter((i: any) => i.contract_id === lease.id);
  const maxInvNum = invoices.reduce((max: number, i: any) => {
    const m = i.invoice_number?.match(/INV-(\d+)-(\d+)/);
    if (m) { const n = parseInt(m[2]); return n > max ? n : max; }
    return max;
  }, 0);

  for (let i = 0; i < numPeriods; i++) {
    const periodStart = i === 0 ? startDate : addMonths(startDate, i * intervalMonths);
    const periodEnd = i === numPeriods - 1 ? endDate : addMonths(periodStart, intervalMonths);
    const dueDate = periodStart;

    // Create RentSchedule entry
    const scheduleId = generateId();
    schedules.push({
      id: scheduleId,
      company_id: '',
      contract_id: lease.id,
      due_date: dueDate,
      period_start: periodStart,
      period_end: periodEnd,
      rent_amount: periodRent,
      service_charges: 0,
      other_charges: 0,
      late_fee: 0,
      total_due: periodRent,
      paid_amount: 0,
      balance: periodRent,
      status: 'upcoming',
    });

    // Create first invoice for the first period
    if (i === 0 && existingInvoices.length === 0) {
      const invNum = maxInvNum + 1;
      const year = new Date(periodStart).getFullYear();
      invoices.push({
        id: generateId(),
        company_id: '',
        invoice_number: `INV-${year}-${String(invNum).padStart(3, '0')}`,
        tenant_id: lease.tenant_id,
        contract_id: lease.id,
        unit_id: lease.unit_id,
        invoice_date: periodStart,
        due_date: addMonths(periodStart, 0.5),
        rent_amount: periodRent,
        service_charges: 0,
        maintenance_charges: 0,
        penalties: 0,
        discounts: 0,
        tax: 0,
        total: periodRent,
        paid_amount: 0,
        balance: periodRent,
        status: 'issued',
      });
    }
  }

  localStorage.setItem('erp_rent_schedules', JSON.stringify(schedules));
  localStorage.setItem('erp_invoices', JSON.stringify(invoices));
}

// ====================================================================
// Journal Entry Generation — creates JournalEntry + lines via localStorage
// (direct localStorage access avoids circular imports with stores.ts)
// ====================================================================
function generateLocalId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export interface JournalEntryLineInput {
  account_id: string;
  debit: number;
  credit: number;
  description: string;
}

export function generateJournalEntry(
  description: string,
  source_module: string,
  source_record_id: string,
  lines: JournalEntryLineInput[],
): string {
  try {
    // Auto-number: find max entry number + 1
    const entriesRaw = localStorage.getItem('erp_journal_entries');
    const entries: any[] = entriesRaw ? JSON.parse(entriesRaw) : [];
    const maxNum = entries.reduce((max: number, e: any) => {
      const m = e.entry_number?.match(/JRN-(\d+)-(\d+)/);
      if (m) { const n = parseInt(m[2]); return n > max ? n : max; }
      return max;
    }, 0);
    const year = new Date().getFullYear();
    const entryNumber = `JRN-${year}-${String(maxNum + 1).padStart(3, '0')}`;

    const totalDebit = lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit || 0), 0);

    const entryId = generateLocalId();
    const entry = {
      id: entryId,
      company_id: '',
      entry_number: entryNumber,
      entry_date: new Date().toISOString().split('T')[0],
      description,
      source_module,
      source_record_id,
      status: 'posted',
      total_debit: totalDebit,
      total_credit: totalCredit,
      created_by: '',
      posted_by: '',
      posted_at: new Date().toISOString(),
    };
    entries.push(entry);
    localStorage.setItem('erp_journal_entries', JSON.stringify(entries));

    // Create journal entry lines
    const linesRaw = localStorage.getItem('erp_journal_entry_lines');
    const journalLines: any[] = linesRaw ? JSON.parse(linesRaw) : [];
    for (const line of lines) {
      journalLines.push({
        id: generateLocalId(),
        journal_entry_id: entryId,
        account_id: line.account_id,
        cost_center_id: '',
        debit: line.debit || 0,
        credit: line.credit || 0,
        description: line.description,
      });
    }
    localStorage.setItem('erp_journal_entry_lines', JSON.stringify(journalLines));

    logAudit('create', 'journal_entry', entryId, '', `رقم ${entryNumber}`);
    return entryId;
  } catch {
    return '';
  }
}

// Receipt → update invoice balance + generate JE
export function postReceiptToInvoice(invoiceId: string, receiptAmount: number) {
  try {
    const invoicesRaw = localStorage.getItem('erp_invoices');
    if (!invoicesRaw) return false;
    
    const invoices = JSON.parse(invoicesRaw);
    const idx = invoices.findIndex((i: any) => i.id === invoiceId);
    if (idx === -1) return false;

    const inv = invoices[idx];
    inv.paid_amount = (inv.paid_amount || 0) + receiptAmount;
    inv.balance = inv.total - inv.paid_amount;
    
    if (inv.balance <= 0) {
      inv.status = 'paid';
    } else if (inv.paid_amount > 0) {
      inv.status = 'partially_paid';
    }

    invoices[idx] = inv;
    localStorage.setItem('erp_invoices', JSON.stringify(invoices));

    // Generate JE: Debit Bank (acc-2), Credit Tenant Receivables (acc-3)
    generateJournalEntry(
      `استلام دفعة إيجار — فاتورة ${inv.invoice_number}`,
      'إيجارات',
      invoiceId,
      [
        { account_id: 'acc-2', debit: receiptAmount, credit: 0, description: 'استلام دفعة إيجار — بنك' },
        { account_id: 'acc-3', debit: 0, credit: receiptAmount, description: 'تحصيل ذمم مستأجرين' },
      ],
    );
    
    logAudit('create', 'receipt', invoiceId, '', `مبلغ ${receiptAmount}`);
    return true;
  } catch {
    return false;
  }
}

// Update project cost when claim is approved + generate JE
export function updateProjectCostOnClaim(projectId: string, claimAmount: number) {
  try {
    const projectsRaw = localStorage.getItem('erp_projects');
    if (!projectsRaw) return false;
    
    const projects = JSON.parse(projectsRaw);
    const idx = projects.findIndex((p: any) => p.id === projectId);
    if (idx === -1) return false;
    
    projects[idx].actual_cost = (projects[idx].actual_cost || 0) + claimAmount;
    localStorage.setItem('erp_projects', JSON.stringify(projects));
    
    // Generate JE: Debit Projects Under Construction (acc-5), Credit Contractor Payables (acc-9)
    generateJournalEntry(
      `اعتماد مستخلص مقاول — مشروع ${projects[idx].project_name || projectId}`,
      'مقاولين',
      projectId,
      [
        { account_id: 'acc-5', debit: claimAmount, credit: 0, description: 'تكاليف مشاريع تحت التنفيذ' },
        { account_id: 'acc-9', debit: 0, credit: claimAmount, description: 'ذمم مقاولين — مستخلص معتمد' },
      ],
    );
    
    logAudit('update_cost', 'project', projectId, '', `+${claimAmount}`);
    return true;
  } catch {
    return false;
  }
}
