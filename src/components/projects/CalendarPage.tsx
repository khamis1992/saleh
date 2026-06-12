import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPilotScheduler } from '@daypilot/daypilot-lite-react';
import { workOrderStore, maintenanceStore } from '@/services/stores';

function KpiCard({ label, value, icon, accent }: {
  label: string; value: string | number; icon: React.ElementType; accent: string;
}) {
  const a: Record<string, { iconBg: string; iconColor: string }> = {
    sky:{ iconBg: 'bg-sky-50', iconColor: 'text-sky-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, rose:{ iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
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

export default function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();

  const events = useMemo(() => {
    const all: any[] = [];
    workOrderStore.getAll().forEach((wo: any) => {
      const d = wo.scheduled_date || wo.due_date || new Date().toISOString().split('T')[0];
      all.push({ id: wo.id, resource: wo.technician_id || wo.assigned_team_id || wo.maintenance_request_id || 'unassigned', start: `${d}T08:00:00`, end: `${d}T16:00:00`, text: (wo.technician_notes || wo.description || `WO-${wo.work_order_number || wo.id}`).substring(0, 40), backColor: wo.status === 'completed' || wo.status === 'closed' ? '#10B981' : wo.status === 'in_progress' ? '#3B82F6' : '#F59E0B', barHidden: false });
    });
    maintenanceStore.getAll().forEach((m: any) => {
      const d = m.request_date || m.created_at || new Date().toISOString().split('T')[0];
      if (d) all.push({ id: m.id, resource: m.assigned_team_id || 'unassigned', start: `${d.split('T')[0]}T09:00:00`, end: `${d.split('T')[0]}T11:00:00`, text: (m.description || m.title || 'طلب صيانة').substring(0, 40), backColor: m.priority === 'emergency' || m.priority === 'urgent' ? '#EF4444' : '#8B5CF6', barHidden: false });
    });
    return all;
  }, []);

  const resources = useMemo(() => {
    const ids = new Set<string>(); events.forEach(e => ids.add(e.resource));
    return Array.from(ids).map(id => ({ name: id === 'unassigned' ? 'غير معين' : `فريق ${id}`, id }));
  }, [events]);

  const woCount = workOrderStore.getAll().length;
  const maintCount = maintenanceStore.getAll().length;
  const completedEvents = events.filter(e => e.backColor === '#10B981').length;
  const totalEvents = events.length;

  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-sm">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            </div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600">جدول المواعيد</span><span className="text-[13px] font-bold text-gray-900">{totalEvents} مهمة</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="me-auto" />
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي المهام" value={totalEvents} icon={() => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>} accent="slate" />
          <KpiCard label="أوامر عمل" value={woCount} icon={() => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>} accent="sky" />
          <KpiCard label="طلبات صيانة" value={maintCount} icon={() => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>} accent="amber" />
          <KpiCard label="مكتملة" value={completedEvents} icon={() => <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} accent="emerald" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">الجدول الزمني</h2>
            <p className="text-[11px] text-gray-500">{today.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</p>
          </div>
          <DayPilotScheduler
            startDate={`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`}
            days={new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()}
            scale="Day"
            timeHeaders={[{ groupBy: 'Month' }, { groupBy: 'Day', format: 'd' }]}
            cellWidth={40}
            eventHeight={30}
            rowHeaderWidth={120}
            resources={resources}
            events={events}
            durationBarVisible={false}
            onEventClick={(args: any) => { if (args.e.id()) navigate('/maintenance'); }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>{totalEvents} مهمة مجدولة</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />محدث في الوقت الفعلي</span>
        </div>
      </div>
    </div>
  );
}