import { useMemo } from 'react';

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class?: string;
}

interface ProjectGanttProps {
  tasks: GanttTask[];
  viewMode?: string;
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
  onProgressChange?: (task: GanttTask, progress: number) => void;
  onClick?: (task: GanttTask) => void;
}

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function getWeekNumber(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

function daysBetween(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / 86400000) + 1;
}

export function ProjectGantt({
  tasks,
  viewMode = 'Month',
  onClick,
}: ProjectGanttProps) {
  const columns = useMemo(() => {
    if (tasks.length === 0) return [];
    const dates = tasks.map(t => new Date(t.start)).concat(tasks.map(t => new Date(t.end)));
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    // Add padding
    min.setMonth(min.getMonth() - 1);
    max.setMonth(max.getMonth() + 1);

    const cols: { label: string; key: string; isMonth: boolean }[] = [];
    const current = new Date(min);
    while (current <= max) {
      if (viewMode === 'Month') {
        cols.push({ label: `${MONTHS_AR[current.getMonth()]} ${current.getFullYear()}`, key: `${current.getFullYear()}-${current.getMonth()}`, isMonth: true });
        current.setMonth(current.getMonth() + 1);
      } else {
        cols.push({ label: `W${getWeekNumber(current)}`, key: `${current.getFullYear()}-W${getWeekNumber(current)}`, isMonth: false });
        current.setDate(current.getDate() + 7);
      }
    }
    return cols;
  }, [tasks, viewMode]);

  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">الجدول الزمني للمشروع</h3>
        </div>
        <div className="flex items-center justify-center py-12 text-sm text-gray-400">
          لا توجد مراحل لعرضها في المخطط الزمني
        </div>
      </div>
    );
  }

  const projectStart = new Date(Math.min(...tasks.map(t => new Date(t.start).getTime())));
  const totalDays = daysBetween(projectStart, new Date(Math.max(...tasks.map(t => new Date(t.end).getTime())))) || 365;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">الجدول الزمني للمشروع</h3>
        <span className="text-[10px] text-gray-400">{tasks.length} مرحلة</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header row — months */}
          <div className="flex border-b border-gray-200 bg-gray-50/80">
            <div className="w-[180px] shrink-0 px-3 py-2 text-[11px] font-semibold text-gray-500 border-l border-gray-200">المرحلة</div>
            <div className="flex-1 flex">
              {columns.map((col, i) => (
                <div
                  key={col.key}
                  className="flex-1 text-center px-1 py-2 text-[10px] font-semibold text-gray-500 border-r border-gray-100"
                  style={{ minWidth: col.isMonth ? '80px' : '50px' }}
                >
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          {tasks.map((task, idx) => {
            const start = new Date(task.start);
            const end = new Date(task.end);
            const taskDays = daysBetween(start, end);
            const leftPct = Math.max(0, (daysBetween(projectStart, start) / totalDays) * 100);
            const widthPct = Math.min(100 - leftPct, (taskDays / totalDays) * 100);
            const isComplete = task.progress >= 100;
            const barColor = isComplete ? 'bg-emerald-500' : task.progress > 0 ? 'bg-indigo-500' : 'bg-gray-300';
            const progressColor = isComplete ? 'bg-emerald-600' : 'bg-indigo-700';

            return (
              <div
                key={task.id}
                className={`flex border-b border-gray-100 hover:bg-blue-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                onClick={() => onClick?.(task)}
                style={{ cursor: onClick ? 'pointer' : 'default' }}
              >
                <div className="w-[180px] shrink-0 px-3 py-2.5 border-l border-gray-200 flex items-center">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-800 truncate">{task.name}</div>
                    <div className="text-[10px] text-gray-400">
                      {task.start} → {task.end}
                    </div>
                  </div>
                </div>
                <div className="flex-1 relative py-2.5 px-1">
                  {/* Timeline bar */}
                  <div className="relative h-6 w-full">
                    <div
                      className={`absolute top-1 h-4 rounded-full ${barColor} opacity-90`}
                      style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 2)}%`, minWidth: '8px' }}
                    >
                      {/* Progress fill */}
                      <div
                        className={`absolute inset-0 rounded-full ${progressColor}`}
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    {/* Progress label */}
                    <div
                      className="absolute top-0 text-[9px] font-semibold text-gray-600"
                      style={{ left: `${leftPct + widthPct / 2}%`, transform: 'translateX(-50%)' }}
                    >
                      {task.progress}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Legend */}
      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-gray-500">مكتمل</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-indigo-500" />
          <span className="text-[10px] text-gray-500">قيد التنفيذ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-gray-300" />
          <span className="text-[10px] text-gray-500">لم يبدأ</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Converts project phases to Gantt tasks
 */
export function phasesToGanttTasks(phases: { id: string; phase_name: string; start_date: string; end_date: string; completion_percentage: number; dependencies?: string }[]): GanttTask[] {
  return phases.map(p => ({
    id: p.id,
    name: p.phase_name,
    start: p.start_date || new Date().toISOString().split('T')[0],
    end: p.end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    progress: p.completion_percentage || 0,
    dependencies: p.dependencies,
    custom_class: p.completion_percentage >= 100 ? 'gantt-completed' : p.completion_percentage > 0 ? 'gantt-in-progress' : '',
  }));
}
