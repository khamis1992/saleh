import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { formatQAR, formatQARInt } from '@/lib/format';
import {
  invoiceStore, leaseStore, projectStore, contractorClaimStore,
  purchaseRequestStore, purchaseOrderStore, inventoryStore, stockTransactionStore,
  chequeStore, maintenanceStore,
} from '@/services/stores';

// ============================================================
// Types
// ============================================================
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const STORAGE_KEY = 'erp_notifications';

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

function loadStored(): Notification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveNotifications(notifs: Notification[]) {
  // Keep max 100, remove oldest
  const trimmed = notifs.slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(loadStored);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateAlerts = useCallback(() => {
    const existing = loadStored();
    const existingKeys = new Set(existing.map(n => n.title + n.message));
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const thirtyDays = d.toISOString().split('T')[0];

    const newNotifs: Notification[] = [];
    // Track category counts for grouping
    const categoryCounts: Record<string, number> = {};

    // Helper: add or group notification
    const addOrGroup = (category: string, title: string, message: string, singleMsg: string, type: Notification['type'], link: string) => {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    };

    // --- 1) Overdue invoices ---
    const overdueInvs = invoiceStore.getAll().filter(i => i.status === 'overdue' || (i.balance > 0 && i.due_date < today));
    if (overdueInvs.length > 0) {
      const total = overdueInvs.reduce((s, i) => s + i.balance, 0);
      const key = 'فواتير متأخرة' + total;
      if (!existingKeys.has(key)) {
        newNotifs.push({
          id: generateId(),
          title: 'فواتير إيجار متأخرة',
          message: `يوجد ${overdueInvs.length} فواتير متأخرة بقيمة ${formatQAR(total)}`,
          type: 'error',
          timestamp: now,
          read: false,
          link: '/rent-collection/invoices',
        });
      }
    }

    // --- 2) Contracts expiring soon ---
    const expiringLeases = leaseStore.getAll().filter(l => l.end_date >= today && l.end_date <= thirtyDays);
    if (expiringLeases.length > 0) {
      const key = 'عقود تنتهي قريباً' + expiringLeases.length;
      if (!existingKeys.has(key)) {
        newNotifs.push({
          id: generateId(),
          title: 'عقود إيجار تنتهي قريباً',
          message: `يوجد ${expiringLeases.length} عقود إيجار تنتهي خلال 30 يوماً`,
          type: 'warning',
          timestamp: now,
          read: false,
          link: '/leases',
        });
      }
    }

    // --- 3) Delayed projects ---
    const delayedPrjs = projectStore.getAll().filter(p => p.status === 'construction' && p.planned_end_date < today);
    if (delayedPrjs.length > 0) {
      const key = 'مشاريع متأخرة' + delayedPrjs.length;
      if (!existingKeys.has(key)) {
        newNotifs.push({
          id: generateId(),
          title: 'مشاريع إنشائية متأخرة',
          message: `يوجد ${delayedPrjs.length} مشاريع تجاوزت تاريخ الانتهاء المخطط`,
          type: 'error',
          timestamp: now,
          read: false,
          link: '/projects',
        });
      }
    }

    // --- 4) Pending contractor claims ---
    const pendingClaims = contractorClaimStore.getAll().filter(c =>
      c.status === 'submitted' || c.status === 'verified' || c.status === 'approved');
    if (pendingClaims.length > 0) {
      const total = pendingClaims.reduce((s, c) => s + c.net_payable, 0);
      const key = 'مطالبات مقاولين' + pendingClaims.length;
      if (!existingKeys.has(key)) {
        newNotifs.push({
          id: generateId(),
          title: 'مطالبات مقاولين معلقة',
          message: `يوجد ${pendingClaims.length} مطالبات معلقة بصافي ${formatQAR(total)}`,
          type: 'warning',
          timestamp: now,
          read: false,
          link: '/construction/claims',
        });
      }
    }

    // --- 5) Pending purchase requests ---
    const pendingPRs = purchaseRequestStore.getAll().filter(pr => pr.status === 'pending' || pr.status === 'draft');
    if (pendingPRs.length > 0) {
      const key = 'طلبات شراء' + pendingPRs.length;
      if (!existingKeys.has(key)) {
        newNotifs.push({
          id: generateId(),
          title: 'طلبات شراء معلقة',
          message: `يوجد ${pendingPRs.length} طلبات شراء بانتظار الموافقة`,
          type: 'info',
          timestamp: now,
          read: false,
          link: '/procurement',
        });
      }
    }

    // --- 6) Low stock items ---
    const stockTxns = stockTransactionStore.getAll();
    const qtyMap = new Map<string, number>();
    for (const t of stockTxns) {
      const prev = qtyMap.get(t.inventory_item_id) || 0;
      if (t.transaction_type === 'in' || t.transaction_type === 'receipt' || t.transaction_type === 'opening' || t.transaction_type === 'purchase_receipt' || t.transaction_type === 'transfer_in' || t.transaction_type === 'return_from_project')
        qtyMap.set(t.inventory_item_id, prev + t.quantity);
      else
        qtyMap.set(t.inventory_item_id, prev - t.quantity);
    }
    const lowStockItems = inventoryStore.getAll().filter(i => (qtyMap.get(i.id) || 0) <= i.reorder_level);
    if (lowStockItems.length > 0) {
      const key = 'مخزون منخفض' + lowStockItems.length;
      if (!existingKeys.has(key)) {
        newNotifs.push({
          id: generateId(),
          title: 'أصناف مخزون منخفضة',
          message: `يوجد ${lowStockItems.length} أصناف وصلت لحد إعادة الطلب`,
          type: 'warning',
          timestamp: now,
          read: false,
          link: '/inventory/items',
        });
      }
    }

    // --- 7) Budget exceeded projects ---
    const overBudget = projectStore.getAll().filter(p => p.actual_cost > p.approved_budget);
    if (overBudget.length > 0) {
      const key = 'تجاوز ميزانية' + overBudget.length;
      if (!existingKeys.has(key)) {
        newNotifs.push({
          id: generateId(),
          title: 'مشاريع تجاوزت الميزانية',
          message: `يوجد ${overBudget.length} مشاريع تجاوزت تكاليفها الميزانية المعتمدة`,
          type: 'error',
          timestamp: now,
          read: false,
          link: '/projects',
        });
      }
    }

    // ========================================================================
    // NEW CATEGORIES (Fix 4)
    // ========================================================================

    // --- 8) Overdue preventive maintenance schedules ---
    try {
      const pmRaw = localStorage.getItem('erp_pm_schedules');
      if (pmRaw) {
        const pmSchedules: any[] = JSON.parse(pmRaw);
        const overduePM = pmSchedules.filter((s: any) =>
          s.status === 'overdue' || (s.next_due_date && s.next_due_date < today)
        );
        if (overduePM.length > 0) {
          const key = 'صيانة وقائية متأخرة' + overduePM.length;
          if (!existingKeys.has(key)) {
            newNotifs.push({
              id: generateId(),
              title: 'جداول صيانة وقائية متأخرة',
              message: `يوجد ${overduePM.length} جدول صيانة وقائية متأخر عن موعد الاستحقاق`,
              type: 'warning',
              timestamp: now,
              read: false,
              link: '/maintenance/preventive',
            });
          }
        }
      }
    } catch {}

    // --- 9) Bounced cheques ---
    const bouncedCheques = chequeStore.getAll().filter(c => c.status === 'bounced' || c.status === 'returned');
    if (bouncedCheques.length > 0) {
      const total = bouncedCheques.reduce((s, c) => s + (c.amount || 0), 0);
      const key = 'شيكات مرتجعة' + bouncedCheques.length;
      if (!existingKeys.has(key)) {
        newNotifs.push({
          id: generateId(),
          title: 'شيكات مرتجعة',
          message: `يوجد ${bouncedCheques.length} شيك مرتجع بقيمة ${formatQAR(total)}`,
          type: 'error',
          timestamp: now,
          read: false,
          link: '/finance/cheques',
        });
      }
    }

    // --- 10) Contracts pending signature ---
    const pendingSignatures = leaseStore.getAll().filter(l => l.status === 'pending_signature');
    if (pendingSignatures.length > 0) {
      const key = 'عقود بانتظار التوقيع' + pendingSignatures.length;
      if (!existingKeys.has(key)) {
        newNotifs.push({
          id: generateId(),
          title: 'عقود بانتظار التوقيع',
          message: `يوجد ${pendingSignatures.length} عقد إيجار بانتظار التوقيع من الأطراف`,
          type: 'info',
          timestamp: now,
          read: false,
          link: '/leases',
        });
      }
    }

    // --- 11) Pending maintenance requests ---
    const pendingMaintenance = maintenanceStore.getAll().filter(m =>
      m.status === 'submitted' || m.status === 'under_review'
    );
    if (pendingMaintenance.length > 0) {
      const key = 'طلبات صيانة معلقة' + pendingMaintenance.length;
      if (!existingKeys.has(key)) {
        newNotifs.push({
          id: generateId(),
          title: 'طلبات صيانة معلقة',
          message: `يوجد ${pendingMaintenance.length} طلب صيانة بانتظار المراجعة أو الموافقة`,
          type: 'warning',
          timestamp: now,
          read: false,
          link: '/maintenance',
        });
      }
    }

    // --- 12) Upcoming court hearing dates ---
    try {
      const casesRaw = localStorage.getItem('erp_legal_cases');
      if (casesRaw) {
        const legalCases: any[] = JSON.parse(casesRaw);
        const d2 = new Date();
        d2.setDate(d2.getDate() + 7);
        const sevenDays = d2.toISOString().split('T')[0];
        const upcomingHearings = legalCases.filter((c: any) =>
          c.status !== 'closed' && c.status !== 'cancelled' &&
          c.hearing_date && c.hearing_date >= today && c.hearing_date <= sevenDays
        );
        if (upcomingHearings.length > 0) {
          const key = 'جلسات محكمة قادمة' + upcomingHearings.length;
          if (!existingKeys.has(key)) {
            const caseList = upcomingHearings.map((c: any) =>
              `${c.case_number} (${c.hearing_date})`
            ).join('، ');
            newNotifs.push({
              id: generateId(),
              title: 'جلسات محكمة قادمة',
              message: `يوجد ${upcomingHearings.length} جلسة محكمة خلال 7 أيام: ${caseList}`,
              type: 'warning',
              timestamp: now,
              read: false,
              link: '/legal/cases',
            });
          }
        }
      }
    } catch {}

    // --- 13) Terminated contracts needing unit status update ---
    const terminatedLeases = leaseStore.getAll().filter(l =>
      l.status === 'terminated' || l.status === 'cancelled'
    );
    // Check if units are still marked as 'leased'
    let terminatedNeedingUpdate = 0;
    try {
      const unitsRaw = localStorage.getItem('erp_units');
      if (unitsRaw && terminatedLeases.length > 0) {
        const units: any[] = JSON.parse(unitsRaw);
        const leasedUnitIds = new Set(units.filter((u: any) => u.status === 'leased').map((u: any) => u.id));
        for (const l of terminatedLeases) {
          if (leasedUnitIds.has(l.unit_id)) terminatedNeedingUpdate++;
        }
      }
    } catch {}
    if (terminatedNeedingUpdate > 0) {
      const key = 'عقود منتهية تحتاج تحديث' + terminatedNeedingUpdate;
      if (!existingKeys.has(key)) {
        newNotifs.push({
          id: generateId(),
          title: 'وحدات بحاجة لتحديث الحالة',
          message: `يوجد ${terminatedNeedingUpdate} عقد منتهٍ أو ملغى والوحدة لا تزال مسجلة كمؤجرة`,
          type: 'warning',
          timestamp: now,
          read: false,
          link: '/leases',
        });
      }
    }

    if (newNotifs.length > 0) {
      // Prepend new notifications (newest first)
      const merged = [...newNotifs, ...existing];
      saveNotifications(merged);
      setNotifications(merged);
    }
  }, []);

  // Initial load + periodic refresh every 30 seconds
  useEffect(() => {
    generateAlerts();

    // Periodic refresh
    intervalRef.current = setInterval(() => {
      generateAlerts();
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [generateAlerts]);

  const unreadCount = useMemo(() =>
    notifications.filter(n => !n.read).length,
    [notifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, read: true } : n);
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
}
