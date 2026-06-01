import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DayPilotScheduler } from '@daypilot/daypilot-lite-react';
import { workOrderStore, maintenanceStore } from '@/services/stores';

export default function CalendarPage() {
  const navigate = useNavigate();
  const today = new Date();

  const events = useMemo(() => {
    const all: any[] = [];

    workOrderStore.getAll().forEach((wo: any) => {
      const d = wo.scheduled_date || wo.due_date || new Date().toISOString().split('T')[0];
      all.push({
        id: wo.id,
        resource: wo.technician_id || wo.assigned_team_id || wo.maintenance_request_id || 'unassigned',
        start: `${d}T08:00:00`,
        end: `${d}T16:00:00`,
        text: (wo.technician_notes || wo.description || `WO-${wo.work_order_number || wo.id}`).substring(0, 40),
        backColor: wo.status === 'completed' || wo.status === 'closed' ? '#10B981' : wo.status === 'in_progress' ? '#3B82F6' : '#F59E0B',
        barHidden: false,
      });
    });

    maintenanceStore.getAll().forEach((m: any) => {
      const d = m.request_date || m.created_at || new Date().toISOString().split('T')[0];
      if (d) {
        all.push({
          id: m.id,
          resource: m.assigned_team_id || 'unassigned',
          start: `${d.split('T')[0]}T09:00:00`,
          end: `${d.split('T')[0]}T11:00:00`,
          text: (m.description || m.title || 'طلب صيانة').substring(0, 40),
          backColor: m.priority === 'emergency' || m.priority === 'urgent' ? '#EF4444' : '#8B5CF6',
          barHidden: false,
        });
      }
    });

    return all;
  }, []);

  const resources = useMemo(() => {
    const ids = new Set<string>();
    events.forEach(e => ids.add(e.resource));
    return Array.from(ids).map(id => ({ name: id === 'unassigned' ? 'غير معين' : `فريق ${id}`, id }));
  }, [events]);

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">جدول المواعيد</h1>
          <p className="text-xs text-gray-500 mt-0.5">{events.length} مهمة مجدولة</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
          onEventClick={(args: any) => {
            if (args.e.id()) navigate('/maintenance');
          }}
        />
      </div>
    </div>
  );
}
