import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { workOrderStore, maintenanceStore, rentScheduleStore } from '@/services/stores';
import { seedProjectTasks } from '@/pages/projects/ProjectTasksPage';
import { seedInspections } from '@/pages/maintenance/InspectionsPage';
import { seedLeaveRequests } from '@/pages/hr/LeaveManagementPage';

function safeAll<T = any>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  const a: Record<string, string> = {
    sky: 'bg-sky-50 text-sky-600', amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600', rose: 'bg-rose-50 text-rose-600',
    slate: 'bg-slate-50 text-slate-600', purple: 'bg-purple-50 text-purple-600',
    cyan: 'bg-cyan-50 text-cyan-600', orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600', blue: 'bg-blue-50 text-blue-600',
    pink: 'bg-pink-50 text-pink-600', yellow: 'bg-yellow-50 text-yellow-600',
  };
  const c = a[accent] || a.slate;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 transition-all hover:shadow-sm">
      <div className="text-lg font-bold text-gray-900">{value}</div>
      <div className="text-[11px] text-gray-500 mt-0.5">{label}</div>
    </div>
  );
}

interface EventItem {
  id: string;
  resource: string;
  date: string;
  text: string;
  backColor: string;
  moduleLabel: string;
  link: string;
}

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

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export default function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(() => today.getMonth());
  const [currentYear, setCurrentYear] = useState(() => today.getFullYear());
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Prime stores
  useMemo(() => {
    rentScheduleStore.getAll();
    if (!localStorage.getItem('erp_project_tasks')) localStorage.setItem('erp_project_tasks', JSON.stringify(seedProjectTasks));
    if (!localStorage.getItem('erp_inspections')) localStorage.setItem('erp_inspections', JSON.stringify(seedInspections));
    if (!localStorage.getItem('erp_leave_requests')) localStorage.setItem('erp_leave_requests', JSON.stringify(seedLeaveRequests));
  }, []);

  const events = useMemo((): EventItem[] => {
    const all: EventItem[] = [];
    const fmt = (d: string) => d.split('T')[0];

    maintenanceStore.getAll().forEach((m: any) => {
      const d = fmt(m.request_date || m.created_at || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`);
      all.push({ id: `mnt-${m.id}`, resource: 'maintenance_reqs', date: d, text: (m.description || m.title || 'طلب صيانة').substring(0, 50), backColor: m.priority === 'emergency' || m.priority === 'urgent' ? '#EF4444' : '#8B5CF6', moduleLabel: 'صيانة', link: '/maintenance/requests' });
    });

    workOrderStore.getAll().forEach((wo: any) => {
      const d = fmt(wo.scheduled_date || wo.due_date);
      if (!d) return;
      all.push({ id: `wo-${wo.id}`, resource: 'work_orders', date: d, text: (wo.technician_notes || wo.description || `WO-${wo.work_order_number || wo.id}`).substring(0, 50), backColor: wo.status === 'completed' || wo.status === 'closed' ? '#10B981' : wo.status === 'in_progress' ? '#3B82F6' : '#F59E0B', moduleLabel: 'أمر عمل', link: '/maintenance/work-orders' });
    });

    safeAll('erp_pm_schedules').forEach((s: any) => {
      if (!s.next_due_date) return;
      all.push({ id: `pm-${s.id}`, resource: 'preventive', date: s.next_due_date, text: (s.asset_name || 'صيانة وقائية').substring(0, 50), backColor: '#06B6D4', moduleLabel: 'وقائية', link: '/maintenance/preventive' });
    });

    safeAll('erp_project_tasks').forEach((t: any) => {
      const d = fmt(t.start_date || t.due_date);
      if (!d) return;
      all.push({ id: `pt-${t.id}`, resource: 'project_tasks', date: d, text: (t.task_name || '').substring(0, 50), backColor: '#F97316', moduleLabel: 'مشروع', link: '/projects' });
    });

    safeAll('erp_inspections').forEach((i: any) => {
      if (!i.inspection_date) return;
      all.push({ id: `insp-${i.id}`, resource: 'inspections', date: i.inspection_date, text: `معاينة: ${(i.inspector_name || '').substring(0, 30)}`, backColor: '#22C55E', moduleLabel: 'معاينة', link: '/maintenance/inspections' });
    });

    safeAll('erp_leases').forEach((l: any) => {
      if (l.status !== 'active') return;
      if (l.start_date) all.push({ id: `ls-${l.id}`, resource: 'leases', date: l.start_date, text: `بداية عقد ${l.contract_number || ''}`, backColor: '#3B82F6', moduleLabel: 'عقد', link: '/leases' });
      if (l.end_date) all.push({ id: `le-${l.id}`, resource: 'leases', date: l.end_date, text: `نهاية عقد ${l.contract_number || ''}`, backColor: l.end_date < today.toISOString().split('T')[0] ? '#EF4444' : '#F59E0B', moduleLabel: 'عقد', link: '/leases' });
    });

    safeAll('erp_leave_requests').forEach((lv: any) => {
      if (lv.status === 'rejected' || lv.status === 'draft') return;
      if (lv.start_date) all.push({ id: `lv-${lv.id}`, resource: 'leave', date: lv.start_date, text: `إجازة ${lv.days_count || ''} يوم`, backColor: '#EC4899', moduleLabel: 'إجازة', link: '/hr/employees' });
    });

    safeAll('erp_rent_schedules').forEach((rs: any) => {
      if (!rs.due_date || rs.status === 'paid' || rs.status === 'cancelled') return;
      const overdue = rs.due_date < today.toISOString().split('T')[0];
      all.push({ id: `rent-${rs.id}`, resource: 'rent', date: rs.due_date, text: `${rs.total_due ? rs.total_due.toLocaleString('en-US') + ' ر.ق' : 'دفعة'}${overdue ? ' (متأخرة)' : ''}`, backColor: overdue ? '#EF4444' : '#EAB308', moduleLabel: 'إيجار', link: '/rent-collection/invoices' });
    });

    return all;
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (categoryFilter !== 'all' && e.resource !== categoryFilter) return false;
      if (searchQuery && !e.text.includes(searchQuery)) return false;
      return true;
    });
  }, [events, categoryFilter, searchQuery]);

  // Month navigation
  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else { setCurrentMonth(m => m - 1); } };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else { setCurrentMonth(m => m + 1); } };

  // Build grid
  const monthData = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const todayStr = today.toISOString().split('T')[0];

    const cells: { day: number; dateStr: string; isToday: boolean; items: EventItem[] }[] = [];
    const monthEvents = filteredEvents.filter(e => {
      const ed = new Date(e.date);
      return ed.getMonth() === currentMonth && ed.getFullYear() === currentYear;
    });

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateStr,
        isToday: dateStr === todayStr,
        items: monthEvents.filter(e => e.date === dateStr),
      });
    }

    return { firstDay, daysInMonth, cells };
  }, [filteredEvents, currentMonth, currentYear]);

  const kpis = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach(e => { counts[e.resource] = (counts[e.resource] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [filteredEvents]);

  const monthLabel = today.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-sm">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600">جدول المواعيد</span>
              <span className="text-[13px] font-bold text-gray-900">{filteredEvents.length} مهمة</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="me-auto" />
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kpis.slice(0, 8).map(([key, count]) => (
            <KpiCard key={key} label={RESOURCE_LABEL[key] || key} value={count} accent={RESOURCE_ACCENT[key] || 'slate'} />
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-9 h-9 text-sm rounded-lg border-gray-200"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[170px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              {Object.entries(RESOURCE_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Month Grid */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Month header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <button onClick={prevMonth} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
            <h2 className="text-sm font-bold text-gray-900">{monthLabel}</h2>
            <button onClick={nextMonth} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {DAYS_AR.map(day => (
              <div key={day} className="text-center text-[11px] font-medium text-gray-500 py-2 border-l border-gray-50 last:border-l-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: monthData.firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] bg-gray-50/30 border-b border-l border-gray-100 last:border-l-0" />
            ))}

            {/* Day cells */}
            {monthData.cells.map(cell => (
              <div
                key={cell.day}
                className={`min-h-[90px] border-b border-l border-gray-100 last:border-l-0 p-1.5 transition-colors ${
                  cell.isToday ? 'bg-sky-50/50 ring-1 ring-inset ring-sky-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`text-[11px] font-semibold mb-1 ${
                  cell.isToday ? 'h-5 w-5 rounded-full bg-sky-600 text-white flex items-center justify-center' : 'text-gray-600'
                }`}>
                  {cell.day}
                </div>
                <div className="space-y-0.5">
                  {cell.items.slice(0, 3).map(item => (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.link)}
                      className="w-full text-right text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white block"
                      style={{ backgroundColor: item.backColor }}
                      title={item.text}
                    >
                      {item.text}
                    </button>
                  ))}
                  {cell.items.length > 3 && (
                    <div className="text-[9px] text-gray-400 px-1">+{cell.items.length - 3} أخرى</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>{filteredEvents.length} مهمة {categoryFilter !== 'all' ? `(${RESOURCE_LABEL[categoryFilter]})` : ''}</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />محدث في الوقت الفعلي</span>
        </div>
      </div>
    </div>
  );
}
