declare module 'frappe-gantt' {
  interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
    custom_class?: string;
  }

  interface GanttOptions {
    view_mode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month' | 'Year';
    date_format?: string;
    language?: string;
    on_date_change?: (task: GanttTask, start: Date, end: Date) => void;
    on_progress_change?: (task: GanttTask, progress: number) => void;
    on_click?: (task: GanttTask) => void;
    custom_popup_html?: (task: GanttTask) => string;
  }

  class Gantt {
    constructor(element: HTMLElement, tasks: GanttTask[], options: GanttOptions);
  }

  export default Gantt;
}
