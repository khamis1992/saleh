import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, Filter, Pencil, Trash2, GanttChart, Plus, X, Calendar, Building2, Flag,
  AlertTriangle, CheckCircle2, Clock, Play, Layers, MoreVertical,
  ChevronLeft, ChevronRight, User as UserIcon, Hash, RefreshCw,
} from 'lucide-react';
import { createStore } from '@/services/dataService';
import { projectStore, employeeStore, getProjectName, getEmployeeName } from '@/services/stores';

export interface ProjectTask {
  id: string;
  company_id: string;
  task_name: string;
  project_id: string;
  phase_id: string;
  assigned_to: string;
  start_date: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  progress_percentage: number;
  status: 'not_started' | 'in_progress' | 'pending_approval' | 'completed' | 'delayed';
  notes: string;
}

export const seedProjectTasks: ProjectTask[] = [
  { id: 'task-1', company_id: '', task_name: 'أعمال الحفر والأساسات', project_id: 'prj-1', phase_id: 'ph-1', assigned_to: 'emp-3', start_date: '2026-02-15', due_date: '2026-02-16', priority: 'high', progress_percentage: 100, status: 'completed', notes: 'تم الانتهاء بنجاح' },
  { id: 'task-2', company_id: '', task_name: 'صب الخرسانة المسلحة', project_id: 'prj-1', phase_id: 'ph-2', assigned_to: 'emp-3', start_date: '2026-02-20', due_date: '2026-04-01', priority: 'urgent', progress_percentage: 65, status: 'in_progress', notes: 'تأخير بسبب الأمطار' },
  { id: 'task-3', company_id: '', task_name: 'أعمال الكهرباء', project_id: 'prj-2', phase_id: 'ph-3', assigned_to: 'emp-3', start_date: '2026-03-01', due_date: '2026-05-15', priority: 'medium', progress_percentage: 30, status: 'in_progress', notes: '' },
  { id: 'task-4', company_id: '', task_name: 'أعمال السباكة', project_id: 'prj-2', phase_id: 'ph-3', assigned_to: 'emp-5', start_date: '2026-04-01', due_date: '2026-06-01', priority: 'medium', progress_percentage: 0, status: 'not_started', notes: 'بانتظار توريد المواد' },
  { id: 'task-5', company_id: '', task_name: 'التشطيبات الداخلية', project_id: 'prj-1', phase_id: 'ph-4', assigned_to: 'emp-3', start_date: '2026-05-01', due_date: '2026-07-30', priority: 'low', progress_percentage: 0, status: 'not_started', notes: '' },
  { id: 'task-6', company_id: '', task_name: 'تركيب أنظمة التكييف', project_id: 'prj-3', phase_id: 'ph-1', assigned_to: 'emp-3', start_date: '2026-02-01', due_date: '2026-03-15', priority: 'high', progress_percentage: 85, status: 'pending_approval', notes: 'بانتظار موافقة الاستشاري' },
  { id: 'task-7', company_id: '', task_name: 'أعمال الدهانات', project_id: 'prj-2', phase_id: 'ph-4', assigned_to: 'emp-3', start_date: '2026-06-01', due_date: '2026-06-30', priority: 'low', progress_percentage: 0, status: 'not_started', notes: '' },
  { id: 'task-8', company_id: '', task_name: 'تسوية الموقع', project_id: 'prj-1', phase_id: 'ph-1', assigned_to: 'emp-3', start_date: '2026-01-01', due_date: '2026-01-20', priority: 'medium', progress_percentage: 100, status: 'completed', notes: 'تم التسوية بالكامل' },
];

const taskStore = createStore<ProjectTask>({ key: 'erp_project_tasks', seed: seedProjectTasks });

const priorityLabels: Record<string, string> = {
  low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة',
};

const statusLabels: Record<string, string> = {
  not_started: 'لم تبدأ', in_progress: 'قيد التنفيذ', pending_approval: 'بانتظار الاعتماد',
  completed: 'مكتملة', delayed: 'متأخرة',
};

const emptyForm = {
  task_name: '', project_id: '', phase_id: '', assigned_to: '',
  start_date: '', due_date: '', priority: 'medium' as string,
  progress_percentage: 0, status: 'not_started' as string, notes: '',
};

// ============================================================
// HELPERS
// ============================================================
function isOverdue(t: ProjectTask): boolean {
  if (t.status === 'delayed') return true;
  if (t.status === 'completed') return false;
  const today = new Date().toISOString().split('T')[0];
  return t.due_date < today;
}

function getEmployeeRole(id: string): string {
  const emp = (employeeStore.getAll() as any[]).find((e) => e.id === id);
  return emp?.job_title || 'موظف';
}

function employeeAvatarColor(id: string): string {
  const palette = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-violet-100 text-violet-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
  ];
  const hash = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return palette[hash % palette.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0);
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0));
}

function EmployeeAvatar({ id, name }: { id: string; name: string }) {
  return (
    <div className={`h-8 w-8 rounded-full ${employeeAvatarColor(id)} flex items-center justify-center text-[11px] font-bold flex-shrink-0 ring-2 ring-white`}>
      {getInitials(name)}
    </div>
  );
}

// Priority badge styling
function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, { bg: string; text: string; dot: string }> = {
    urgent: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    high:   { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    medium: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    low:    { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  };
  const s = styles[priority] || styles.medium;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {priorityLabels[priority] || priority}
    </span>
  );
}

// Status badge styling
function StatusPill({ status, overdue }: { status: string; overdue?: boolean }) {
  const effective = overdue ? 'delayed' : status;
  const styles: Record<string, { bg: string; text: string; dot: string }> = {
    not_started:     { bg: 'bg-gray-100',   text: 'text-gray-600',  dot: 'bg-gray-400' },
    in_progress:     { bg: 'bg-blue-50',    text: 'text-blue-700',  dot: 'bg-blue-500' },
    pending_approval:{ bg: 'bg-amber-50',   text: 'text-amber-700', dot: 'bg-amber-500' },
    completed:       { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    delayed:         { bg: 'bg-red-50',     text: 'text-red-700',   dot: 'bg-red-500' },
  };
  const s = styles[effective] || styles.not_started;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${s.bg} ${s.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {overdue ? 'متأخرة' : (statusLabels[status] || status)}
    </span>
  );
}

function ProgressBar({ value, overdue }: { value: number; overdue?: boolean }) {
  const color = overdue
    ? 'bg-red-500'
    : value >= 100 ? 'bg-emerald-500'
    : value >= 60  ? 'bg-blue-500'
    : value >= 30  ? 'bg-blue-500'
    : value > 0    ? 'bg-amber-500'
    : 'bg-gray-200';
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[11px] font-bold text-gray-600 tabular-nums min-w-[30px]">{value}%</span>
    </div>
  );
}

// ============================================================
// KPI CARD
// ============================================================
function KpiCard({
  label, value, sublabel, percent, color, icon,
}: {
  label: string; value: number | string; sublabel: string;
  percent?: string; color: 'red' | 'emerald' | 'gray' | 'blue';
  icon: React.ReactNode;
}) {
  const colorMap = {
    red:     { bg: 'bg-red-50',     text: 'text-red-600',     dot: 'bg-red-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    gray:    { bg: 'bg-gray-100',   text: 'text-gray-500',    dot: 'bg-gray-400' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    dot: 'bg-blue-500' },
  };
  const c = colorMap[color];
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className={`h-9 w-9 rounded-full ${c.bg} flex items-center justify-center`}>
          <div className={c.text}>{icon}</div>
        </div>
      </div>
      <p className="text-3xl font-extrabold text-[#1E293B] tabular-nums leading-none">{value}</p>
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
        <span className="text-[11px] text-gray-500 font-medium">{sublabel}</span>
      </div>
    </div>
  );
}

// ============================================================
// PAGE COMPONENT
// ============================================================
export default function ProjectTasksPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ProjectTask | null>(null);

  const tasks = useMemo(() => {
    const data = taskStore.getAll();
    const timer = setTimeout(() => setLoading(false), 300);
    return data;
  }, [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);
  const employees = useMemo(() => employeeStore.getAll(), [refresh]);

  const filtered = useMemo(() => tasks.filter((t: ProjectTask) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (projectFilter !== 'all' && t.project_id !== projectFilter) return false;
    if (assigneeFilter !== 'all' && t.assigned_to !== assigneeFilter) return false;
    if (dateFrom && t.start_date < dateFrom) return false;
    if (dateTo && t.due_date > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!t.task_name.toLowerCase().includes(q) &&
          !getProjectName(t.project_id).toLowerCase().includes(q) &&
          !getEmployeeName(t.assigned_to).toLowerCase().includes(q)) return false;
    }
    return true;
  }), [tasks, search, statusFilter, priorityFilter, projectFilter, assigneeFilter, dateFrom, dateTo]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  // KPIs
  const total = tasks.length;
  const countCompleted = tasks.filter(t => t.status === 'completed').length;
  const countInProgress = tasks.filter(t => t.status === 'in_progress').length;
  const countNotStarted = tasks.filter(t => t.status === 'not_started').length;
  const countOverdue = tasks.filter(t => isOverdue(t)).length;
  const pct = (n: number) => total === 0 ? '0%' : `${Math.round((n / total) * 100)}%`;

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (t: ProjectTask) => {
    setEditId(t.id);
    setForm({ task_name: t.task_name, project_id: t.project_id, phase_id: t.phase_id, assigned_to: t.assigned_to, start_date: t.start_date, due_date: t.due_date, priority: t.priority, progress_percentage: t.progress_percentage, status: t.status, notes: t.notes || '' });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.task_name || !form.project_id) {
      toast.error('يرجى ملء اسم المهمة والمشروع');
      return;
    }
    const data: any = { company_id: '', task_name: form.task_name, project_id: form.project_id, phase_id: form.phase_id, assigned_to: form.assigned_to, start_date: form.start_date, due_date: form.due_date, priority: form.priority, progress_percentage: Number(form.progress_percentage), status: form.status, notes: form.notes };
    if (editId) { taskStore.update(editId, data); toast.success('تم تحديث المهمة بنجاح'); }
    else { taskStore.create(data); toast.success('تم إضافة المهمة بنجاح'); }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    taskStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.task_name} بنجاح`);
    setDeleteTarget(null);
    setRefresh(r => r + 1);
  };

  function handleReset() {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setProjectFilter('all');
    setAssigneeFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  }

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <GanttChart className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1E293B] leading-tight">مهام المشاريع</h1>
            <p className="text-xs text-gray-500 mt-0.5">إدارة مهام المشاريع والمراحل</p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-[13px] h-10 rounded-lg px-4 shadow-sm shadow-blue-200"
        >
          <Plus className="h-4 w-4" />
          إضافة مهمة
        </Button>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <KpiCard
          label="متأخرة"
          value={countOverdue}
          sublabel={`${pct(countOverdue)} من إجمالي المهام`}
          color="red"
          icon={<AlertTriangle className="h-[18px] w-[18px]" />}
        />
        <KpiCard
          label="مكتملة"
          value={countCompleted}
          sublabel={`${pct(countCompleted)} من إجمالي المهام`}
          color="emerald"
          icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
        />
        <KpiCard
          label="لم تبدأ"
          value={countNotStarted}
          sublabel={`${pct(countNotStarted)} من إجمالي المهام`}
          color="gray"
          icon={<Clock className="h-[18px] w-[18px]" />}
        />
        <KpiCard
          label="قيد التنفيذ"
          value={countInProgress}
          sublabel={`${pct(countInProgress)} من إجمالي المهام`}
          color="blue"
          icon={<Play className="h-[18px] w-[18px]" />}
        />
        <KpiCard
          label="إجمالي المهام"
          value={total}
          sublabel="جميع المهام"
          color="blue"
          icon={<Layers className="h-[18px] w-[18px]" />}
        />
      </div>

      {/* ── FILTER BAR ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-4 flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="بحث باسم المهمة أو المشروع..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pr-10 h-9 text-[13px] rounded-lg border-gray-200 bg-gray-50 focus:bg-white"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute left-3 top-2.5 text-gray-300 hover:text-gray-500">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Project */}
        <Select value={projectFilter} onValueChange={v => { setProjectFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-[160px] text-xs border-gray-200 rounded-lg bg-gray-50 gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-gray-400" />
            <SelectValue placeholder="جميع المشاريع" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المشاريع</SelectItem>
            {(projects as any[]).map(p => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Responsible (Assignee) */}
        <Select value={assigneeFilter} onValueChange={v => { setAssigneeFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-[160px] text-xs border-gray-200 rounded-lg bg-gray-50 gap-1.5">
            <UserIcon className="h-3.5 w-3.5 text-gray-400" />
            <SelectValue placeholder="جميع المسؤولين" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المسؤولين</SelectItem>
            {(employees as any[]).map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Priority */}
        <Select value={priorityFilter} onValueChange={v => { setPriorityFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-[150px] text-xs border-gray-200 rounded-lg bg-gray-50 gap-1.5">
            <Flag className="h-3.5 w-3.5 text-gray-400" />
            <SelectValue placeholder="جميع الأولويات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الأولويات</SelectItem>
            <SelectItem value="urgent">عاجلة</SelectItem>
            <SelectItem value="high">عالية</SelectItem>
            <SelectItem value="medium">متوسطة</SelectItem>
            <SelectItem value="low">منخفضة</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-[150px] text-xs border-gray-200 rounded-lg bg-gray-50 gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <SelectValue placeholder="جميع الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="not_started">لم تبدأ</SelectItem>
            <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
            <SelectItem value="pending_approval">بانتظار الاعتماد</SelectItem>
            <SelectItem value="completed">مكتملة</SelectItem>
            <SelectItem value="delayed">متأخرة</SelectItem>
          </SelectContent>
        </Select>

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <div className="relative">
            <Input
              type="date"
              value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="h-9 w-[150px] text-xs border-gray-200 rounded-lg bg-gray-50 pl-8"
              dir="ltr"
            />
            <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
          <span className="text-xs text-gray-400">-</span>
          <div className="relative">
            <Input
              type="date"
              value={dateTo}
              onChange={e => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="h-9 w-[150px] text-xs border-gray-200 rounded-lg bg-gray-50 pl-8"
              dir="ltr"
            />
            <Calendar className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Reset */}
        <Button
          variant="outline" size="sm" onClick={handleReset}
          className="h-9 border-gray-200 text-gray-500 hover:text-gray-800 rounded-lg gap-1.5 text-xs mr-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          إعادة ضبط
        </Button>
      </div>

      {/* ── DATA TABLE ──────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow >
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">المهمة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">المشروع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">المسؤول</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">تاريخ البداية</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">تاريخ التسليم</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">الأولوية</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">نسبة التقدم</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">الحالة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right w-[110px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <GanttChart className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-400">لا توجد مهام</p>
                        <p className="text-xs text-gray-300">لا توجد نتائج تطابق معايير البحث</p>
                        <Button variant="outline" size="sm" onClick={handleReset}
                          className="h-8 text-xs rounded-lg mt-1 border-gray-200">
                          مسح الفلاتر
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {paginated.map((t: ProjectTask) => {
                  const overdue = isOverdue(t);
                  const assigneeName = getEmployeeName(t.assigned_to) || '—';
                  return (
                    <TableRow
                      key={t.id}
                      className=" h-[60px] group"
                    >
                      {/* Task */}
                      <TableCell className="px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Hash className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <span className="text-[13px] font-semibold text-[#1E293B] leading-tight">{t.task_name}</span>
                        </div>
                      </TableCell>

                      {/* Project */}
                      <TableCell className="px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                          </div>
                          <span className="text-xs text-[#334155] max-w-[140px] truncate">
                            {getProjectName(t.project_id) || t.project_id}
                          </span>
                        </div>
                      </TableCell>

                      {/* Responsible (avatar + name + role) */}
                      <TableCell className="px-3">
                        <div className="flex items-center gap-2">
                          <EmployeeAvatar id={t.assigned_to} name={assigneeName} />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#1E293B] leading-tight truncate max-w-[140px]">{assigneeName}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 truncate max-w-[140px]">{getEmployeeRole(t.assigned_to)}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Start date */}
                      <TableCell className="px-3" dir="ltr">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span className="text-xs text-[#334155] tabular-nums">{t.start_date || '—'}</span>
                        </div>
                      </TableCell>

                      {/* Due date */}
                      <TableCell className="px-3" dir="ltr">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          <span className={`text-xs tabular-nums ${overdue ? 'text-red-600 font-semibold' : 'text-[#334155]'}`}>{t.due_date || '—'}</span>
                        </div>
                      </TableCell>

                      {/* Priority */}
                      <TableCell className="px-3">
                        <PriorityBadge priority={t.priority} />
                      </TableCell>

                      {/* Progress */}
                      <TableCell className="px-3">
                        <ProgressBar value={t.progress_percentage} overdue={overdue} />
                      </TableCell>

                      {/* Status */}
                      <TableCell className="px-3">
                        <StatusPill status={t.status} overdue={overdue && t.status !== 'completed'} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-3">
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                onClick={() => openEdit(t)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>تعديل</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => setDeleteTarget(t)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>حذف</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 rounded-md text-gray-400 hover:bg-gray-100"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>المزيد</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ── PAGINATION ──────────────────────────────────────── */}
          <div className="py-3 border-t border-gray-100 bg-[#FAFBFC] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Select value={String(rowsPerPage)} onValueChange={v => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500">لكل صفحة</span>
            </div>

            <span className="text-xs text-gray-500">
              عرض <span className="font-bold text-[#1E293B]">{filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</span> -{' '}
              <span className="font-bold text-[#1E293B]">{Math.min(currentPage * rowsPerPage, filtered.length)}</span> من{' '}
              <span className="font-bold text-[#1E293B]">{filtered.length}</span> مهام
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <div className="h-8 min-w-[32px] px-2 bg-[#3B82F6] text-white rounded-lg text-xs font-bold flex items-center justify-center">
                {currentPage}
              </div>
              <Button
                variant="outline" size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT DIALOG ────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle className="flex items-center gap-2">
            <GanttChart className="h-5 w-5 text-blue-600" />
            {editId ? 'تعديل مهمة' : 'إضافة مهمة جديدة'}
          </DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">اسم المهمة *</label><Input value={form.task_name} onChange={e => setForm(f => ({ ...f, task_name: e.target.value }))} placeholder="اسم المهمة" className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">المشروع *</label>
                <Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}>
                  <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent>{projects.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">المرحلة</label><Input value={form.phase_id} onChange={e => setForm(f => ({ ...f, phase_id: e.target.value }))} placeholder="معرف المرحلة" className="h-9 text-sm rounded-lg border-gray-200" /></div>
            </div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">المسؤول</label>
              <Select value={form.assigned_to} onValueChange={v => setForm(f => ({ ...f, assigned_to: v }))}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                <SelectContent>{employees.map((emp: any) => (<SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">تاريخ البداية</label><Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className="h-9 text-sm rounded-lg border-gray-200" /></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">تاريخ التسليم</label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">الأولوية</label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as any }))}>
                  <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem><SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem><SelectItem value="urgent">عاجلة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">نسبة التقدم %</label><Input type="number" min="0" max="100" value={form.progress_percentage} onChange={e => setForm(f => ({ ...f, progress_percentage: Number(e.target.value) }))} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            </div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">الحالة</label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as any }))}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">لم تبدأ</SelectItem><SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                  <SelectItem value="pending_approval">بانتظار الاعتماد</SelectItem><SelectItem value="completed">مكتملة</SelectItem><SelectItem value="delayed">متأخرة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">ملاحظات</label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات..." rows={3} className="text-sm rounded-lg border-gray-200" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} className="h-9 text-sm rounded-lg">إلغاء</Button>
            <Button onClick={handleSave} className="bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4">{editId ? 'تحديث' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المهمة <strong>{deleteTarget?.task_name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
