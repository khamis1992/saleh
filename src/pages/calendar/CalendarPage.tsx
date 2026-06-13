import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPilotScheduler } from '@daypilot/daypilot-lite-react';
import { workOrderStore, maintenanceStore } from '@/services/stores';

// ── Helpers ──
function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function fmtName(key: string): string {
  if (key.startsWith('pm-')) return 'الصيانة الوقائية';
  const map: Record<string, string> = {
    maintenance_reqs: 'طلبات الصيانة', work_orders: 'أوامر العمل',
    preventive: 'الصيانة الوقائية', project_tasks: 'مهام المشاريع',
    inspections: 'المعاينات', leases: 'عقود الإيجار',
    leave: 'إجازات الموظفين', rent: 'استحقاقات الإيجار',
  };
  return map[key] || key;
}

interface CalendarEvent {
  id: string;
  resource: string;
  start: string;
  end: string;
  text: string;
  backColor: string;
  barHidden: boolean;
  navigateTo: string;
}

// ── Module colour palette (light, distinguishable) ──
const C = {
  maintenance: '#8B5CF6',    // purple
  workOrder:   '#F59E0B',    // amber
  preventive:  '#06B6D4',    // cyan
  task:        '#F97316',    // orange
  inspection:  '#22C55E',    // green
  lease:       '#3B82F6',    // blue
  leave:       '#EC4899',    // pink
  rent:        '#EAB308',    // yellow
} as const;

export default function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();

  const events = useMemo((): CalendarEvent[] => {
    const all: CalendarEvent[] = [];

    // 1. Maintenance requests
    maintenanceStore.getAll().forEach((m: any) => {
      const d = m.request_date || m.created_at;
      if (!d) return;
      all.push({
        id: `mnt-${m.id}`, resource: 'maintenance_reqs',
        start: `${d.split('T')[0]}T09:00:00`, end: `${d.split('T')[0]}T11:00:00`,
        text: (m.description || m.title || 'طلب صيانة').substring(0, 40),
        backColor: m.priority === 'emergency' || m.priority === 'urgent' ? '#EF4444' : C.maintenance,
        barHidden: false, navigateTo: '/maintenance/requests',
      });
    });

    // 2. Work orders
    workOrderStore.getAll().forEach((wo: any) => {
      const d = wo.scheduled_date || wo.due_date;
      if (!d) return;
      all.push({
        id: `wo-${wo.id}`, resource: 'work_orders',
        start: `${d}T08:00:00`, end: `${d}T16:00:00`,
        text: (wo.technician_notes || wo.description || `WO-${wo.work_order_number || wo.id}`).substring(0, 40),
        backColor: wo.status === 'completed' || wo.status === 'closed' ? '#10B981'
          : wo.status === 'in_progress' ? C.workOrder : '#F59E0B',
        barHidden: false, navigateTo: '/maintenance/work-orders',
      });
    });

    // 3. Preventive maintenance schedules
    safeAll('erp_pm_schedules').forEach((s: any) => {
      if (!s.next_due_date) return;
      all.push({
        id: `pm-${s.id}`, resource: 'preventive',
        start: `${s.next_due_date}T08:00:00`, end: `${s.next_due_date}T12:00:00`,
        text: `🔧 ${(s.asset_name || 'صيانة').substring(0, 30)}`,
        backColor: C.preventive, barHidden: false,
        navigateTo: '/maintenance/preventive',
      });
    });

    // 4. Project tasks
    safeAll('erp_project_tasks').forEach((t: any) => {
      const sd = t.start_date || t.due_date;
      if (!sd) return;
      all.push({
        id: `pt-${t.id}`, resource: 'project_tasks',
        start: `${sd}T07:00:00`, end: `${sd}T09:00:00`,
        text: `📋 ${(t.task_name || '').substring(0, 35)}`,
        backColor: C.task, barHidden: false,
        navigateTo: '/projects',
      });
      // Show a second marker on due_date if different
      if (t.due_date && t.due_date !== sd) {
        all.push({
          id: `pt-due-${t.id}`, resource: 'project_tasks',
          start: `${t.due_date}T07:00:00`, end: `${t.due_date}T09:00:00`,
          text: `⏰ استحقاق: ${(t.task_name || '').substring(0, 25)}`,
          backColor: '#DC2626', barHidden: false,
          navigateTo: '/projects',
        });
      }
    });

    // 5. Inspections
    safeAll('erp_inspections').forEach((i: any) => {
      if (!i.inspection_date) return;
      const typeLabel: Record<string, string> = { move_in: 'انتقال', move_out: 'خروج', routine: 'دورية', emergency: 'طارئة' };
      all.push({
        id: `insp-${i.id}`, resource: 'inspections',
        start: `${i.inspection_date}T10:00:00`, end: `${i.inspection_date}T12:00:00`,
        text: `🔍 ${typeLabel[i.inspection_type] || 'معاينة'}: ${(i.inspector_name || '').substring(0, 25)}`,
        backColor: C.inspection, barHidden: false,
        navigateTo: '/maintenance/inspections',
      });
    });

    // 6. Lease contracts (start / end milestones)
    safeAll('erp_leases').forEach((l: any) => {
      if (l.status !== 'active') return;
      if (l.start_date) {
        all.push({
          id: `lease-start-${l.id}`, resource: 'leases',
          start: `${l.start_date}T07:00:00`, end: `${l.start_date}T07:30:00`,
          text: `🤝 بداية عقد ${l.contract_number || ''}`,
          backColor: C.lease, barHidden: false, navigateTo: '/leases',
        });
      }
      if (l.end_date) {
        all.push({
          id: `lease-end-${l.id}`, resource: 'leases',
          start: `${l.end_date}T07:00:00`, end: `${l.end_date}T07:30:00`,
          text: `⏹ نهاية عقد ${l.contract_number || ''}`,
          backColor: l.end_date < new Date().toISOString().split('T')[0] ? '#EF4444' : '#F59E0B',
          barHidden: false, navigateTo: '/leases',
        });
      }
    });

    // 7. Employee leave
    safeAll('erp_leave_requests').forEach((lv: any) => {
      if (lv.status === 'rejected' || lv.status === 'draft') return;
      const typeLabel: Record<string, string> = { annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة', unpaid: 'بدون راتب' };
      if (lv.start_date) {
        all.push({
          id: `lv-${lv.id}`, resource: 'leave',
          start: `${lv.start_date}T08:00:00`, end: `${lv.end_date || lv.start_date}T16:00:00`,
          text: `🏖 ${typeLabel[lv.leave_type] || 'إجازة'} — ${lv.days_count || ''} يوم`,
          backColor: C.leave, barHidden: false,
          navigateTo: '/hr/employees',
        });
      }
    });

    // 8. Rent schedules (payment due dates)
    safeAll('erp_rent_schedules').forEach((rs: any) => {
      if (!rs.due_date) return;
      if (rs.status === 'paid' || rs.status === 'cancelled') return;
      const overdue = rs.due_date < new Date().toISOString().split('T')[0];
      all.push({
        id: `rent-${rs.id}`, resource: 'rent',
        start: `${rs.due_date}T08:00:00`, end: `${rs.due_date}T08:30:00`,
        text: `💰 ${rs.total_due ? rs.total_due.toLocaleString('en-US') + ' ر.ق' : 'دفعة'}${overdue ? ' (متأخرة)' : ''}`,
        backColor: overdue ? '#EF4444' : C.rent, barHidden: false,
        navigateTo: '/rent-collection/invoices',
      });
    });

    return all;
  }, []);

  // ── Resources = module categories ──
  const resources = useMemo(() => {
    const ids = new Set(events.map(e => e.resource));
    return Array.from(ids).sort().map(id => ({ name: fmtName(id), id }));
  }, [events]);

  // ── KPI data ──
  const kpis = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => {
      counts[e.resource] = (counts[e.resource] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [events]);

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">جدول المواعيد</h1>
          <p className="text-xs text-gray-500 mt-0.5">{events.length} مهمة مجدولة</p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {kpis.map(([key, count]) => (
          <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="text-lg font-bold text-gray-900">{count}</div>
            <div className="text-xs text-gray-500 mt-0.5">{fmtName(key)}</div>
          </div>
        ))}
      </div>

      {/* ── Scheduler ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <DayPilotScheduler
          startDate={`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`}
          days={42} // show 6 weeks for better cross-module visibility
          scale="Day"
          timeHeaders={[{ groupBy: 'Month' }, { groupBy: 'Day', format: 'd' }]}
          cellWidth={40}
          eventHeight={30}
          rowHeaderWidth={140}
          resources={resources}
          events={events}
          durationBarVisible={false}
          onEventClick={(args: any) => {
            const ev = events.find(e => e.id === args.e.id());
            if (ev) navigate(ev.navigateTo);
          }}
        />
      </div>
    </div>
  );
}

