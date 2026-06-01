// Tasks store — derives actionable tasks from existing data.
// Acts as the universal "My Tasks" / "مهامي" inbox across the ERP.
import { createStore } from './dataService';
import { logAudit } from '@/utils/exportUtils';

export type TaskCategory =
  | 'approval'      // pending approvals
  | 'followup'      // customer/tenant follow-ups
  | 'maintenance'   // maintenance jobs
  | 'collection'    // collection actions (invoices)
  | 'project'       // project updates
  | 'contract'      // expiring contracts
  | 'legal'         // legal actions
  | 'document';     // documents requiring renewal

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ErpTask {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  module: string;        // e.g. "contractor_claims"
  recordId: string;      // e.g. claim id
  recordLabel?: string;  // e.g. "CLM-2025-001"
  link: string;          // route to navigate to
  dueDate?: string;
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  assignedRole?: string; // which role should handle this
  createdAt: string;
  completedAt?: string;
}

const seedTasks: ErpTask[] = [];
const taskStore = createStore<ErpTask>({ key: 'erp_tasks', seed: seedTasks });

/**
 * Derives a fresh task list from the current data in the system.
 * Replaces any existing open/in_progress tasks (so re-deriving doesn't duplicate).
 */
export function deriveTasksFromData(): ErpTask[] {
  const now = new Date().toISOString();
  const all = taskStore.getAll();
  // remove any task that is "open" or "in_progress" — we'll re-add fresh
  const kept = all.filter(t => t.status === 'done' || t.status === 'cancelled');
  const derived: ErpTask[] = [];
  const id = (k: string, rid: string) => `${k}-${rid}`;

  try {
    // ── Overdue invoices (collection) ──
    const invoices = JSON.parse(localStorage.getItem('erp_invoices') || '[]');
    for (const inv of invoices) {
      if (inv.status === 'paid') continue;
      if (!inv.due_date) continue;
      const due = new Date(inv.due_date);
      const daysOverdue = Math.floor((Date.now() - due.getTime()) / 86400000);
      if (daysOverdue < 1) continue;
      const priority: TaskPriority = daysOverdue > 60 ? 'urgent' : daysOverdue > 30 ? 'high' : 'medium';
      derived.push({
        id: id('collection', inv.id),
        title: `تحصيل فاتورة متأخرة ${daysOverdue} يوم`,
        description: `فاتورة ${inv.invoice_number || inv.id} — المبلغ ${inv.total || inv.balance || 0} ر.ق`,
        category: 'collection',
        priority,
        module: 'invoices',
        recordId: inv.id,
        recordLabel: inv.invoice_number,
        link: '/rent-collection/invoices',
        dueDate: inv.due_date,
        status: 'open',
        assignedRole: 'accountant',
        createdAt: now,
      });
    }
  } catch {}

  try {
    // ── Contractor claims pending approvals ──
    const claims = JSON.parse(localStorage.getItem('erp_contractor_claims') || '[]');
    for (const clm of claims) {
      if (clm.status === 'paid' || clm.status === 'rejected') continue;
      if (clm.engineer_verification_status === 'pending') {
        derived.push({
          id: id('claim-engineer', clm.id),
          title: `التحقق الهندسي من مطالبة ${clm.claim_number}`,
          description: `المبلغ: ${clm.claimed_amount} ر.ق`,
          category: 'approval',
          priority: 'high',
          module: 'contractor_claims',
          recordId: clm.id,
          recordLabel: clm.claim_number,
          link: `/construction/claims`,
          dueDate: clm.claim_date,
          status: 'open',
          assignedRole: 'project_manager',
          createdAt: now,
        });
      } else if (clm.project_manager_approval_status === 'pending') {
        derived.push({
          id: id('claim-pm', clm.id),
          title: `موافقة مدير المشروع على مطالبة ${clm.claim_number}`,
          category: 'approval',
          priority: 'high',
          module: 'contractor_claims',
          recordId: clm.id,
          recordLabel: clm.claim_number,
          link: '/construction/claims',
          status: 'open',
          assignedRole: 'project_manager',
          createdAt: now,
        });
      } else if (clm.finance_approval_status === 'pending') {
        derived.push({
          id: id('claim-finance', clm.id),
          title: `موافقة المالية على مطالبة ${clm.claim_number}`,
          category: 'approval',
          priority: 'high',
          module: 'contractor_claims',
          recordId: clm.id,
          recordLabel: clm.claim_number,
          link: '/construction/claims',
          status: 'open',
          assignedRole: 'accountant',
          createdAt: now,
        });
      }
    }
  } catch {}

  try {
    // ── Expiring leases (within 60 days) ──
    const leases = JSON.parse(localStorage.getItem('erp_leases') || '[]');
    for (const l of leases) {
      if (l.status !== 'active') continue;
      if (!l.end_date) continue;
      const end = new Date(l.end_date);
      const daysToEnd = Math.floor((end.getTime() - Date.now()) / 86400000);
      if (daysToEnd > 60 || daysToEnd < -30) continue;
      const priority: TaskPriority = daysToEnd < 0 ? 'urgent' : daysToEnd < 30 ? 'high' : 'medium';
      derived.push({
        id: id('contract', l.id),
        title: daysToEnd < 0 ? `عقد منتهي منذ ${-daysToEnd} يوم` : `تجديد عقد قارب على الانتهاء (${daysToEnd} يوم)`,
        category: 'contract',
        priority,
        module: 'leases',
        recordId: l.id,
        recordLabel: l.contract_number,
        link: '/leases',
        dueDate: l.end_date,
        status: 'open',
        assignedRole: 'property_manager',
        createdAt: now,
      });
    }
  } catch {}

  try {
    // ── Open maintenance requests ──
    const requests = JSON.parse(localStorage.getItem('erp_maintenance') || '[]');
    for (const r of requests) {
      if (r.status === 'closed' || r.status === 'completed') continue;
      const priority: TaskPriority = r.priority === 'emergency' ? 'urgent'
        : r.priority === 'high' ? 'high' : 'medium';
      derived.push({
        id: id('maintenance', r.id),
        title: r.title || `طلب صيانة ${r.request_number}`,
        description: r.description,
        category: 'maintenance',
        priority,
        module: 'maintenance',
        recordId: r.id,
        recordLabel: r.request_number,
        link: '/maintenance/requests',
        status: 'open',
        assignedRole: 'maintenance_manager',
        createdAt: now,
      });
    }
  } catch {}

  try {
    // ── Procurement: pending PRs ──
    const prs = JSON.parse(localStorage.getItem('erp_purchase_requests') || '[]');
    for (const p of prs) {
      if (p.status !== 'pending_approval' && p.status !== 'draft') continue;
      const priority: TaskPriority = p.priority === 'urgent' ? 'urgent' : p.priority === 'high' ? 'high' : 'medium';
      derived.push({
        id: `pr-${p.id}`,
        title: `اعتماد طلب شراء: ${p.request_number || p.id}`,
        description: `المورد: ${p.vendor_name || '-'} · ${p.total_amount ? p.total_amount.toLocaleString('en-US') + ' ر.ق' : ''}`,
        category: 'approval',
        priority,
        module: 'purchase_requests',
        recordId: p.id,
        recordLabel: p.request_number,
        link: '/procurement/purchase-requests',
        dueDate: p.needed_by,
        status: 'open',
        assignedRole: 'project_manager',
        createdAt: now,
      });
    }
  } catch {}

  try {
    // ── Low stock items ──
    const items = JSON.parse(localStorage.getItem('erp_inventory') || '[]');
    const txns = JSON.parse(localStorage.getItem('erp_stock_transactions') || '[]');
    for (const i of items) {
      let onHand = 0;
      for (const t of txns) {
        if (t.inventory_item_id !== i.id) continue;
        const qty = Number(t.quantity) || 0;
        if (['purchase_receipt', 'transfer_in', 'return_to_stock', 'adjustment_in'].includes(t.transaction_type)) onHand += qty;
        else if (['issue_to_project', 'transfer_out', 'consumption', 'adjustment_out', 'damage', 'expired'].includes(t.transaction_type)) onHand -= qty;
      }
      if (onHand <= (i.reorder_level || 0)) {
        derived.push({
          id: `ls-${i.id}`,
          title: `مخزون منخفض: ${i.name_ar}`,
          description: `المتوفر: ${onHand.toLocaleString('en-US')} ${i.unit_of_measure} · حد الطلب: ${i.reorder_level}`,
          category: 'followup',
          priority: onHand <= (i.minimum_stock || 0) ? 'urgent' : 'high',
          module: 'inventory',
          recordId: i.id,
          recordLabel: i.item_code,
          link: '/inventory/items',
          status: 'open',
          assignedRole: 'project_manager',
          createdAt: now,
        });
      }
    }
  } catch {}

  try {
    // ── Delayed project phases ──
    const phases = JSON.parse(localStorage.getItem('erp_project_phases') || '[]');
    for (const p of phases) {
      if (p.status === 'completed') continue;
      if (!p.planned_end) continue;
      const end = new Date(p.planned_end);
      const days = Math.floor((Date.now() - end.getTime()) / 86400000);
      if (days < 1) continue;
      derived.push({
        id: id('project', p.id),
        title: `مرحلة متأخرة ${days} يوم: ${p.phase_name}`,
        category: 'project',
        priority: days > 30 ? 'high' : 'medium',
        module: 'project_phases',
        recordId: p.id,
        recordLabel: p.phase_name,
        link: '/projects',
        status: 'open',
        assignedRole: 'project_manager',
        createdAt: now,
      });
    }
  } catch {}

  // persist: keep completed/cancelled, replace open/in_progress
  const final = [...kept, ...derived];
  localStorage.setItem('erp_tasks', JSON.stringify(final));
  logAudit('update', 'tasks', 'all', '', `derived ${derived.length} tasks`);
  return final;
}

export function getTasks(): ErpTask[] {
  return taskStore.getAll();
}

export function markTaskDone(taskId: string) {
  const tasks = taskStore.getAll();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;
  tasks[idx] = { ...tasks[idx], status: 'done', completedAt: new Date().toISOString() };
  localStorage.setItem('erp_tasks', JSON.stringify(tasks));
}

export function markTaskInProgress(taskId: string) {
  const tasks = taskStore.getAll();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;
  tasks[idx] = { ...tasks[idx], status: 'in_progress' };
  localStorage.setItem('erp_tasks', JSON.stringify(tasks));
}

export function cancelTask(taskId: string) {
  const tasks = taskStore.getAll();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;
  tasks[idx] = { ...tasks[idx], status: 'cancelled' };
  localStorage.setItem('erp_tasks', JSON.stringify(tasks));
}
