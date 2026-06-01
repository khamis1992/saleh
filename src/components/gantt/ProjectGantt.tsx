import { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';

export interface GanttTask {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  progress: number; // 0-100
  dependencies?: string; // comma-separated task ids
  custom_class?: string; // CSS class for styling
}

interface ProjectGanttProps {
  tasks: GanttTask[];
  viewMode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year';
  onDateChange?: (task: GanttTask, start: Date, end: Date) => void;
  onProgressChange?: (task: GanttTask, progress: number) => void;
  onClick?: (task: GanttTask) => void;
}

export function ProjectGantt({
  tasks,
  viewMode = 'Month',
  onDateChange,
  onProgressChange,
  onClick,
}: ProjectGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<Gantt | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Destroy previous instance
    if (ganttRef.current) {
      // Gantt doesn't have a destroy method, so we clear the container
      containerRef.current.innerHTML = '';
    }

    const gantt = new Gantt(containerRef.current, tasks, {
      view_mode: viewMode,
      date_format: 'YYYY-MM-DD',
      language: 'en',
      on_date_change: (task: any, start: Date, end: Date) => {
        onDateChange?.(task, start, end);
      },
      on_progress_change: (task: any, progress: number) => {
        onProgressChange?.(task, progress);
      },
      on_click: (task: any) => {
        onClick?.(task);
      },
      custom_popup_html: (task: any) => {
        return `
          <div class="details-container" dir="rtl" style="font-family: 'Cairo', system-ui, sans-serif; min-width: 200px;">
            <h5 style="margin:0 0 8px; font-size:14px; font-weight:600;">${task.name}</h5>
            <p style="margin:0 0 4px; font-size:12px; color:#6B7280;">البداية: ${task.start}</p>
            <p style="margin:0 0 4px; font-size:12px; color:#6B7280;">النهاية: ${task.end}</p>
            <p style="margin:0; font-size:12px; color:#6B7280;">الإنجاز: ${task.progress}%</p>
          </div>
        `;
      },
    });

    ganttRef.current = gantt;

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [tasks, viewMode]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">الجدول الزمني للمشروع</h3>
      </div>
      <div className="overflow-auto">
        <div ref={containerRef} className="min-w-[600px]" />
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
