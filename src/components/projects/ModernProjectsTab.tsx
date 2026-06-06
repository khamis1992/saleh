import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, Eye, Pencil, Trash2, LayoutGrid, List, Columns3, Clock, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle2, PauseCircle, HardHat, Building2,
  FileText, DollarSign, Users, CalendarDays, ArrowRight, X, Download, Filter,
  MoreHorizontal, Activity, FolderKanban, Timer, BarChart3, ChevronDown, ChevronUp,
  Save, RotateCcw, ClipboardList, CheckCircle, Calendar, GripVertical
} from 'lucide-react';
import {
  projectStore, contractorStore, contractorClaimStore, getLandName, getEmployeeName,
} from '@/services/stores';

/* ─────────── helpers ─────────── */
const fmt = formatQARInt;

const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string; icon: React.ElementType }> = {
  construction: { label: 'تحت الإنشاء', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500', icon: HardHat },
  testing: { label: 'اختبار وتسليم', color: 'text-indigo-700', bg: 'bg-indigo-50', dot: 'bg-indigo-500', icon: CheckCircle2 },
  completed: { label: 'مكتمل', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', icon: CheckCircle2 },
  design: { label: 'تصميم', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', icon: FolderKanban },
  approvals: { label: 'التراخيص', color: 'text-violet-700', bg: 'bg-violet-50', dot: 'bg-violet-500', icon: ClipboardList },
  tendering: { label: 'طرح مناقصة', color: 'text-cyan-700', bg: 'bg-cyan-50', dot: 'bg-cyan-500', icon: DollarSign },
  handover: { label: 'تسليم', color: 'text-orange-700', bg: 'bg-orange-50', dot: 'bg-orange-500', icon: Building2 },
  cancelled: { label: 'ملغي', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500', icon: X },
  feasibility: { label: 'دراسة جدوى', color: 'text-slate-700', bg: 'bg-slate-50', dot: 'bg-slate-500', icon: BarChart3 },
  idea: { label: 'فكرة', color: 'text-slate-700', bg: 'bg-slate-50', dot: 'bg-slate-400', icon: FolderKanban },
  on_hold: { label: 'معلق', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500', icon: PauseCircle },
  converted: { label: 'محول', color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500', icon: Building2 },
};

const KANBAN_COLUMNS = [
  { key: 'design', title: 'التصميم' },
  { key: 'approvals', title: 'التراخيص' },
  { key: 'tendering', title: 'المناقصة' },
  { key: 'construction', title: 'الإنشاء' },
  { key: 'testing', title: 'الاختبار' },
  { key: 'handover', title: 'التسليم' },
  { key: 'completed', title: 'مكتمل' },
];

/* ─────────── KPI Card ─────────── */
function KpiLarge({
  title, value, subtitle, icon: Icon, trend, accent = 'blue',
}: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; trend?: { value: number; label?: string };
  accent?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
}) {
  const accentMap: Record<string, { bg: string; text: string; iconBg: string; bar: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100 text-blue-600', bar: 'bg-blue-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100 text-emerald-600', bar: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100 text-amber-600', bar: 'bg-amber-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-700', iconBg: 'bg-rose-100 text-rose-600', bar: 'bg-rose-500' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', iconBg: 'bg-indigo-100 text-indigo-600', bar: 'bg-indigo-500' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-700', iconBg: 'bg-slate-100 text-slate-600', bar: 'bg-slate-500' },
  };
  const a = accentMap[accent] || accentMap.blue;
  const isUp = trend && trend.value >= 0;
  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className={`absolute top-0 start-0 w-1 h-full ${a.bar}`} />
      <div className="flex items-start justify-between mb-3">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${a.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 ltr-only" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{title}</div>
      {subtitle && <div className="text-[11px] text-gray-400 mt-1">{subtitle}</div>}
    </div>
  );
}

/* ─────────── Project Card ─────────── */
function ProjectCard({ p, onDelete }: { p: any; onDelete: (p: any) => void }) {
  const navigate = useNavigate();
  const { tt } = useLocale();
  const meta = STATUS_META[p.status] || STATUS_META.idea;
  const isDelayed = (p.status === 'construction' || p.status === 'testing') && p.planned_end_date && p.planned_end_date < new Date().toISOString().split('T')[0];
  const over = (p.actual_cost || 0) > (p.approved_budget || 0);
  const progress = p.completion_percentage || 0;
  const spent = p.actual_cost || 0;
  const budget = p.approved_budget || p.estimated_budget || 0;
  const remaining = Math.max(0, budget - spent);
  const profitMargin = budget > 0 ? Math.round(((budget - spent) / budget) * 100) : 0;

  // health
  const budgetHealth: 'good' | 'warning' | 'critical' = over ? 'critical' : remaining / (budget || 1) < 0.15 ? 'warning' : 'good';
  const scheduleHealth: 'good' | 'warning' | 'critical' = isDelayed ? 'critical' : progress < 30 && p.planned_end_date && (new Date(p.planned_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24) < 90 ? 'warning' : 'good';
  const resourceHealth = 'good';
  const riskLevel = over || isDelayed ? 'high' : scheduleHealth === 'warning' ? 'medium' : 'low';

  const healthDot = (h: string) => {
    if (h === 'good') return <span className="h-2 w-2 rounded-full bg-emerald-500" />;
    if (h === 'warning') return <span className="h-2 w-2 rounded-full bg-amber-500" />;
    return <span className="h-2 w-2 rounded-full bg-rose-500" />;
  };

  const riskBadge = (r: string) => {
    if (r === 'high') return <Badge variant="destructive" className="text-[10px] px-1.5 py-0">عالي</Badge>;
    if (r === 'medium') return <Badge variant="warning" className="text-[10px] px-1.5 py-0">متوسط</Badge>;
    return <Badge variant="success" className="text-[10px] px-1.5 py-0">منخفض</Badge>;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      onClick={() => navigate(`/projects/${p.id}`)}>
      {/* header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
            <meta.icon className={`h-5 w-5 ${meta.color}`} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{p.project_name}</div>
            <div className="text-[11px] text-gray-400 font-mono">{p.project_code}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge className={`${meta.bg} ${meta.color} border-0 text-[11px] font-semibold px-2 py-0.5 gap-1`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </Badge>
          {isDelayed && <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />}
        </div>
      </div>

      {/* meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{getLandName(p.land_id) || '—'}</span>
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{getEmployeeName(p.project_manager_id) || '—'}</span>
        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{p.planned_start_date?.slice(0, 10) || '—'} → {p.planned_end_date?.slice(0, 10) || '—'}</span>
      </div>

      {/* progress */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-gray-700">التقدم</span>
          <span className="font-bold text-gray-900">{progress}%</span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${isDelayed ? 'bg-rose-500' : over ? 'bg-amber-500' : 'bg-gradient-to-l from-blue-500 to-indigo-500'}`}
            style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      </div>

      {/* budget mini */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <div className="text-[10px] text-gray-400">الميزانية</div>
          <div className="text-xs font-bold text-gray-800 ltr-only">{fmt(budget)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <div className="text-[10px] text-gray-400">المصروف</div>
          <div className={`text-xs font-bold ltr-only ${over ? 'text-rose-600' : 'text-gray-800'}`}>{fmt(spent)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5 text-center">
          <div className="text-[10px] text-gray-400">المتبقي</div>
          <div className="text-xs font-bold text-gray-800 ltr-only">{fmt(remaining)}</div>
        </div>
      </div>

      {/* health row */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <Tooltip><TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">{healthDot(budgetHealth)} ميزانية</span></TooltipTrigger><TooltipContent>صحة الميزانية</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">{healthDot(scheduleHealth)} جدولة</span></TooltipTrigger><TooltipContent>صحة الجدولة</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><span className="flex items-center gap-1 cursor-help">{healthDot(resourceHealth)} موارد</span></TooltipTrigger><TooltipContent>صحة الموارد</TooltipContent></Tooltip>
        </div>
        {riskBadge(riskLevel)}
      </div>

      {/* quick actions */}
      <div className="flex items-center gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => navigate(`/projects/${p.id}`)}>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" onClick={() => navigate(`/projects/${p.id}/edit`)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => onDelete(p)}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="sm" className="h-8 text-[11px] text-gray-500 hover:text-gray-800 gap-1 rounded-lg px-2" onClick={() => navigate(`/projects/${p.id}`)}>
          التفاصيل <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

/* ─────────── List Row ─────────── */
function ProjectListRow({ p, onDelete }: { p: any; onDelete: (p: any) => void }) {
  const navigate = useNavigate();
  const meta = STATUS_META[p.status] || STATUS_META.idea;
  const isDelayed = (p.status === 'construction' || p.status === 'testing') && p.planned_end_date && p.planned_end_date < new Date().toISOString().split('T')[0];
  const over = (p.actual_cost || 0) > (p.approved_budget || 0);
  const progress = p.completion_percentage || 0;
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 transition-all hover:shadow-md cursor-pointer"
      onClick={() => navigate(`/projects/${p.id}`)}>
      <div className={`h-10 w-10 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
        <meta.icon className={`h-5 w-5 ${meta.color}`} />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{p.project_name}</div>
          <div className="text-[11px] text-gray-400 font-mono">{p.project_code}</div>
        </div>
        <div className="text-xs text-gray-600">{getLandName(p.land_id) || '—'}</div>
        <div className="min-w-[120px]">
          <div className="flex items-center gap-1.5 text-xs mb-1"><span className="font-bold text-gray-800">{progress}%</span>{isDelayed && <Clock className="h-3 w-3 text-rose-500" />}</div>
          <div className="h-1.5 w-full max-w-[140px] bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isDelayed ? 'bg-rose-500' : over ? 'bg-amber-500' : 'bg-gradient-to-l from-blue-500 to-indigo-500'}`} style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${meta.bg} ${meta.color} border-0 text-[11px] font-semibold px-2 py-0.5 gap-1`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => navigate(`/projects/${p.id}`)}><Eye className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" onClick={() => navigate(`/projects/${p.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => onDelete(p)}><Trash2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

/* ─────────── Kanban View ─────────── */
function KanbanCard({ p }: { p: any }) {
  const navigate = useNavigate();
  const meta = STATUS_META[p.status] || STATUS_META.idea;
  return (
    <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 cursor-pointer hover:shadow-md transition-all"
      onClick={() => navigate(`/projects/${p.id}`)}>
      <div className="text-xs font-bold text-gray-800 truncate">{p.project_name}</div>
      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{p.project_code}</div>
      <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(100, p.completion_percentage || 0)}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
        <span>{p.completion_percentage || 0}%</span>
        <span className="font-semibold">{fmt(p.approved_budget || 0)}</span>
      </div>
      <div className="mt-1.5">
        <Badge className={`${meta.bg} ${meta.color} border-0 text-[10px] px-1.5 py-0`}>{meta.label}</Badge>
      </div>
    </div>
  );
}

function KanbanView({ projects }: { projects: any[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2" dir="rtl">
      {KANBAN_COLUMNS.map(col => {
        const colProjects = projects.filter(p => p.status === col.key);
        return (
          <div key={col.key} className="min-w-[280px] flex-1 bg-gray-50/80 rounded-2xl border border-gray-100 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-xs font-bold text-gray-700">{col.title}</span>
              <Badge variant="secondary" className="text-[10px]">{colProjects.length}</Badge>
            </div>
            {colProjects.map(p => <KanbanCard key={p.id} p={p} />)}
            {colProjects.length === 0 && (
              <div className="text-center py-6 text-[11px] text-gray-400">لا توجد مشاريع</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─────────── Timeline View ─────────── */
function TimelineView({ projects }: { projects: any[] }) {
  const today = new Date().toISOString().split('T')[0];
  const minDate = projects.length ? new Date(Math.min(...projects.map(p => new Date(p.planned_start_date || today).getTime()))) : new Date();
  const maxDate = projects.length ? new Date(Math.max(...projects.map(p => new Date(p.planned_end_date || today).getTime()))) : new Date();
  const totalDays = Math.max(1, (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
  const pos = (dateStr: string) => {
    const d = new Date(dateStr || today).getTime();
    return Math.max(0, Math.min(100, ((d - minDate.getTime()) / (totalDays * 1000 * 60 * 60 * 24)) * 100));
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 overflow-x-auto">
      <div className="min-w-[700px]">
        <div className="flex items-center text-[10px] text-gray-400 mb-2 px-[140px]">
          <span>{minDate.toISOString().slice(0, 10)}</span>
          <div className="flex-1 border-b border-dashed border-gray-200 mx-3" />
          <span>{maxDate.toISOString().slice(0, 10)}</span>
        </div>
        <div className="flex flex-col gap-3">
          {projects.map(p => {
            const s = pos(p.planned_start_date || today);
            const e = pos(p.planned_end_date || today);
            const w = Math.max(2, e - s);
            const meta = STATUS_META[p.status] || STATUS_META.idea;
            return (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-[130px] shrink-0 text-xs font-bold text-gray-800 truncate">{p.project_name}</div>
                <div className="flex-1 relative h-6 bg-gray-50 rounded-lg overflow-hidden">
                  <div className="absolute top-1 bottom-1 rounded-md shadow-sm text-[10px] text-white font-semibold flex items-center px-2 truncate"
                    style={{ left: `${s}%`, width: `${w}%`, background: meta.dot }}>
                    {p.completion_percentage || 0}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────── Empty State ─────────── */
function EmptyProjects({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <Building2 className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد مشاريع</p>
        <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج تطابق فلاتر البحث</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1">
        <RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ModernProjectsTab() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [r, setR] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban' | 'timeline'>('grid');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const projects = useMemo(() => projectStore.getAll(), [r]);
  const claims = useMemo(() => contractorClaimStore.getAll(), [r]);

  const projectStatuses = useMemo(() => [...new Set(projects.map(p => p.status).filter(Boolean))], [projects]);
  const projectTypes = useMemo(() => [...new Set(projects.map(p => p.project_type).filter(Boolean))], [projects]);
  const managers = useMemo(() => [...new Set(projects.map(p => p.project_manager_id).filter(Boolean))], [projects]);

  const filtered = useMemo(() => projects.filter((p: any) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (typeFilter !== 'all' && p.project_type !== typeFilter) return false;
    if (managerFilter !== 'all' && p.project_manager_id !== managerFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const name = (p.project_name || '').toLowerCase();
      const code = (p.project_code || '').toLowerCase();
      const land = (getLandName(p.land_id) || '').toLowerCase();
      if (!name.includes(q) && !code.includes(q) && !land.includes(q)) return false;
    }
    return true;
  }), [projects, statusFilter, typeFilter, managerFilter, search]);

  // KPIs
  const activeCount = projects.filter((p: any) => p.status === 'construction' || p.status === 'testing').length;
  const completedCount = projects.filter((p: any) => p.status === 'completed').length;
  const delayedCount = projects.filter((p: any) => (p.status === 'construction' || p.status === 'testing') && p.planned_end_date && p.planned_end_date < new Date().toISOString().split('T')[0]).length;
  const totalBudget = projects.reduce((s: number, p: any) => s + (p.approved_budget || p.estimated_budget || 0), 0);
  const totalSpent = projects.reduce((s: number, p: any) => s + (p.actual_cost || 0), 0);
  const avgProgress = activeCount > 0 ? Math.round(projects.filter((p: any) => p.status === 'construction' || p.status === 'testing').reduce((s: number, p: any) => s + (p.completion_percentage || 0), 0) / activeCount) : 0;
  const upcomingDeadlines = projects.filter((p: any) => {
    if (!p.planned_end_date) return false;
    const days = (new Date(p.planned_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30 && p.status !== 'completed';
  }).length;
  const profitMargin = totalBudget > 0 ? Math.round(((totalBudget - totalSpent) / totalBudget) * 100) : 0;

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    projectStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.project_name} بنجاح`);
    setDeleteTarget(null);
    setR(x => x + 1);
  }, [deleteTarget]);

  const resetFilters = useCallback(() => {
    setSearch(''); setStatusFilter('all'); setTypeFilter('all'); setManagerFilter('all');
  }, []);

  return (
    <div className="flex flex-col gap-5" dir={dir}>
      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiLarge title="إجمالي المشاريع" value={projects.length} subtitle={`${activeCount} نشط`} icon={FolderKanban} accent="indigo" />
        <KpiLarge title="المشاريع النشطة" value={activeCount} subtitle={`${completedCount} مكتمل`} icon={Activity} trend={{ value: activeCount > 0 ? 12 : 0 }} accent="blue" />
        <KpiLarge title="متأخرة" value={delayedCount} subtitle={`${upcomingDeadlines} موعد قريب`} icon={AlertTriangle} trend={{ value: -delayedCount }} accent="rose" />
        <KpiLarge title="إجمالي الميزانيات" value={fmt(totalBudget)} subtitle={`${fmt(totalSpent)} مصروف`} icon={DollarSign} accent="emerald" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiLarge title="متوسط الإنجاز" value={`${avgProgress}%`} subtitle="المشاريع النشطة" icon={TrendingUp} accent="slate" />
        <KpiLarge title="هامش الربح" value={`${profitMargin}%`} subtitle="ميزانية - مصروف" icon={CheckCircle} accent="emerald" />
        <KpiLarge title="مواعيد قريبة" value={upcomingDeadlines} subtitle="خلال 30 يوم" icon={Calendar} accent="amber" />
        <KpiLarge title="مطالبات معلقة" value={claims.filter((c: any) => c.status === 'submitted' || c.status === 'verified').length} subtitle="إجمالي المطالبات" icon={FileText} accent="indigo" />
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-gray-900">المشاريع</h2>
            <Badge variant="secondary" className="text-[11px]">{filtered.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1" onClick={resetFilters}>
              <RotateCcw className="h-3.5 w-3.5" /> إعادة
            </Button>
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1">
              <Save className="h-3.5 w-3.5" /> حفظ
            </Button>
            <Button onClick={() => navigate('/projects/create')} className="h-8 text-xs rounded-lg gap-1 bg-[#533afd] hover:bg-[#4434d4] text-white px-3">
              <Plus className="h-3.5 w-3.5" /> مشروع جديد
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="بحث في المشاريع..." value={search} onChange={e => setSearch(e.target.value)}
              className="pr-10 h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300" />
            {search && <button onClick={() => setSearch('')} className="absolute left-3 top-2.5"><X className="h-4 w-4 text-gray-300 hover:text-gray-500" /></button>}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs rounded-lg border-gray-200"><Filter className="h-3.5 w-3.5 ml-1" /><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              {projectStatuses.map((s: string) => (
                <SelectItem key={s} value={s}>{(STATUS_META[s] || STATUS_META.idea).label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs rounded-lg border-gray-200"><Building2 className="h-3.5 w-3.5 ml-1" /><SelectValue placeholder="النوع" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              {projectTypes.map((s: string) => (
                <SelectItem key={s} value={s}>{(t.projects.types as any)[s] || s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs rounded-lg border-gray-200"><Users className="h-3.5 w-3.5 ml-1" /><SelectValue placeholder="المدير" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المدراء</SelectItem>
              {managers.map((id: string) => (
                <SelectItem key={id} value={id}>{getEmployeeName(id) || id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── View Switcher ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center bg-white rounded-xl border border-gray-100 shadow-sm p-1 gap-1">
          {([
            { key: 'grid', label: 'شبكة', icon: LayoutGrid },
            { key: 'list', label: 'قائمة', icon: List },
            { key: 'kanban', label: 'كانبان', icon: Columns3 },
            { key: 'timeline', label: 'الجدولة', icon: Timer },
          ] as const).map(v => (
            <button key={v.key}
              onClick={() => setViewMode(v.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === v.key ? 'bg-[rgba(83,58,253,0.08)] text-[#533afd]' : 'text-gray-500 hover:bg-gray-50'}`}>
              <v.icon className="h-3.5 w-3.5" />{v.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1">
            <Download className="h-3.5 w-3.5" /> تصدير
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1" onClick={() => navigate('/construction/daily-reports')}>
            <FileText className="h-3.5 w-3.5" /> تقرير يومي
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      {filtered.length === 0 ? (
        <EmptyProjects onReset={resetFilters} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map(p => <ProjectCard key={p.id} p={p} onDelete={setDeleteTarget} />)}
        </div>
      ) : viewMode === 'list' ? (
        <div className="flex flex-col gap-3">
          {filtered.map(p => <ProjectListRow key={p.id} p={p} onDelete={setDeleteTarget} />)}
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanView projects={filtered} onDelete={setDeleteTarget} />
      ) : (
        <TimelineView projects={filtered} />
      )}

      {/* ── Delete Dialog ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-2">تأكيد الحذف</h3>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف <strong>{deleteTarget.project_name}</strong>؟ لا يمكن التراجع.</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
              <Button variant="destructive" size="sm" className="h-8 text-xs rounded-lg" onClick={handleDelete}>حذف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
