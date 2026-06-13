import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPilotScheduler } from '@daypilot/daypilot-lite-react';
import { workOrderStore, maintenanceStore, rentScheduleStore } from '@/services/stores';
import { seedProjectTasks } from '@/pages/projects/ProjectTasksPage';
import { seedInspections } from '@/pages/maintenance/InspectionsPage';
import { seedLeaveRequests } from '@/pages/hr/LeaveManagementPage';

// ── Helpers ──
function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function KpiCard({ label, value, icon, accent }: {
  label: string; value: string | number; icon: React.ElementType; accent: string;
}) {
  const a: Record<string, { iconBg: string; iconColor: string }> = {
    sky:{ iconBg: 'bg-sky-50', iconColor: 'text-sky-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, rose:{ iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    purple:{ iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
    cyan:{ iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600' },
    orange:{ iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
    green:{ iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    blue:{ iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    pink:{ iconBg: 'bg-pink-50', iconColor: 'text-pink-600' },
    yellow:{ iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600' },
  }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  const Icon = icon;
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
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

const RESOURCE_ORDER = [
  'maintenance_reqs', 'work_orders', 'preventive', 'project_tasks',
  'inspections', 'leases', 'leave', 'rent',
];

const RESOURCE_LABEL: Record<string, string> = {
  maintenance_reqs: 'طلبات الصيانة', work_orders: 'أوامر العمل',
  preventive: 'الصيانة الوقائية', project_tasks: 'مهام المشاريع',
  inspections: 'المعاينات', leases: 'عقود الإيجار',
  leave: 'إجازات الموظفين', rent: 'استحقاقات الإيجار',
};

const RESOURCE_ACCENT: Record<string, string> = {
  maintenance_reqs: 'purple', work_orders: 'amber', preventive: 'cyan',
  project_tasks: 'orange', inspections: 'green', leases: 'blue',
  leave: 'pink', rent: 'yellow',
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();

  /* Prime stores that haven't been visited yet */
  useMemo(() => {
    rentScheduleStore.getAll();
    if (!localStorage.getItem('erp_project_tasks')) {
      localStorage.setItem('erp_project_tasks', JSON.stringify(seedProjectTasks));
    }
    if (!localStorage.getItem('erp_inspections')) {
      localStorage.setItem('erp_inspections', JSON.stringify(seedInspections));
    }
    if (!localStorage.getItem('erp_leave_requests')) {
      localStorage.setItem('erp_leave_requests', JSON.stringify(seedLeaveRequests));
    }
  }, []);

  const events = useMemo((): CalendarEvent[] => {
    const all: CalendarEvent[] = [];

    // 1. Maintenance requests
    maintenanceStore.getAll().forEach((m: any) => {
      const d = m.request_date || m.created_at || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      all.push({
        id: `mnt-${m.id}`, resource: 'maintenance_reqs',
        start: `${d.split('T')[0]}T09:00:00`, end: `${d.split('T')[0]}T11:00:00`,
        text: (m.description || m.title || 'طلب صيانة').substring(0, 40),
        backColor: m.priority === 'emergency' || m.priority === 'urgent' ? '#EF4444' : '#8B5CF6',
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
          : wo.status === 'in_progress' ? '#3B82F6' : '#F59E0B',
        barHidden: false, navigateTo: '/maintenance/work-orders',
      });
    });

    // 3. Preventive maintenance
    safeAll('erp_pm_schedules').forEach((s: any) => {
      if (!s.next_due_date) return;
      all.push({
        id: `pm-${s.id}`, resource: 'preventive',
        start: `${s.next_due_date}T08:00:00`, end: `${s.next_due_date}T12:00:00`,
        text: (s.asset_name || 'صيانة وقائية').substring(0, 40),
        backColor: '#06B6D4', barHidden: false,
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
        text: (t.task_name || '').substring(0, 40),
        backColor: '#F97316', barHidden: false,
        navigateTo: '/projects',
      });
      if (t.due_date && t.due_date !== sd) {
        all.push({
          id: `pt-due-${t.id}`, resource: 'project_tasks',
          start: `${t.due_date}T07:00:00`, end: `${t.due_date}T09:00:00`,
          text: `⏰ ${(t.task_name || '').substring(0, 25)}`,
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
        text: `${typeLabel[i.inspection_type] || 'معاينة'}: ${(i.inspector_name || '').substring(0, 25)}`,
        backColor: '#22C55E', barHidden: false,
        navigateTo: '/maintenance/inspections',
      });
    });

    // 6. Lease contracts
    safeAll('erp_leases').forEach((l: any) => {
      if (l.status !== 'active') return;
      if (l.start_date) {
        all.push({
          id: `lease-start-${l.id}`, resource: 'leases',
          start: `${l.start_date}T07:00:00`, end: `${l.start_date}T07:30:00`,
          text: `بداية عقد ${l.contract_number || ''}`,
          backColor: '#3B82F6', barHidden: false, navigateTo: '/leases',
        });
      }
      if (l.end_date) {
        const expired = l.end_date < new Date().toISOString().split('T')[0];
        all.push({
          id: `lease-end-${l.id}`, resource: 'leases',
          start: `${l.end_date}T07:00:00`, end: `${l.end_date}T07:30:00`,
          text: `نهاية عقد ${l.contract_number || ''}`,
          backColor: expired ? '#EF4444' : '#F59E0B',
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
          text: `${typeLabel[lv.leave_type] || 'إجازة'} ${lv.days_count || ''} يوم`,
          backColor: '#EC4899', barHidden: false,
          navigateTo: '/hr/employees',
        });
      }
    });

    // 8. Rent schedules
    safeAll('erp_rent_schedules').forEach((rs: any) => {
      if (!rs.due_date) return;
      if (rs.status === 'paid' || rs.status === 'cancelled') return;
      const overdue = rs.due_date < new Date().toISOString().split('T')[0];
      all.push({
        id: `rent-${rs.id}`, resource: 'rent',
        start: `${rs.due_date}T08:00:00`, end: `${rs.due_date}T08:30:00`,
        text: `${rs.total_due ? rs.total_due.toLocaleString('en-US') + ' ر.ق' : 'دفعة'}${overdue ? ' (متأخرة)' : ''}`,
        backColor: overdue ? '#EF4444' : '#EAB308', barHidden: false,
        navigateTo: '/rent-collection/invoices',
      });
    });

    return all;
  }, []);

  // ── Resources sorted by module ──
  const resources = useMemo(() => {
    const ids = new Set(events.map(e => e.resource));
    return RESOURCE_ORDER.filter(id => ids.has(id)).map(id => ({
      name: RESOURCE_LABEL[id] || id, id,
    }));
  }, [events]);

  // ── KPI data per module ──
  const kpis = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => { counts[e.resource] = (counts[e.resource] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [events]);

  const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-sm">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600">جدول المواعيد</span>
              <span className="text-[13px] font-bold text-gray-900">{events.length} مهمة</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="me-auto" />
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* ── KPI Cards (up to 8 in a 4-col grid) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.slice(0, 8).map(([key, count]) => (
            <KpiCard
              key={key}
              label={RESOURCE_LABEL[key] || key}
              value={count}
              icon={() => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
              accent={RESOURCE_ACCENT[key] || 'slate'}
            />
          ))}
        </div>

        {/* ── Scheduler ── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">الجدول الزمني</h2>
            <p className="text-[11px] text-gray-500">{today.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</p>
          </div>
          <DayPilotScheduler
            startDate={firstOfMonth}
            days={new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()}
            scale="Day"
            timeHeaders={[{ groupBy: 'Month' }, { groupBy: 'Day', format: 'd' }]}
            cellWidth={60}
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

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>{events.length} مهمة مجدولة</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />محدث في الوقت الفعلي</span>
        </div>
      </div>
    </div>
  );
}
