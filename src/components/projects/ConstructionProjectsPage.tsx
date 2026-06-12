import { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Plus, Eye, Pencil, Trash2, LayoutGrid, List, Columns3, Clock, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle2, PauseCircle, HardHat, Building2,
  FileText, DollarSign, Users, CalendarDays, ArrowRight, X, Download, Filter,
  Activity, FolderKanban, Timer, BarChart3, RotateCcw, ClipboardList, CheckCircle,
  Calendar, MapPin, Target, AlertOctagon, Sparkles, Layers,
} from 'lucide-react';
import {
  projectStore, contractorClaimStore, getLandName, getEmployeeName,
} from '@/services/stores';

const fmt = formatQARInt;

/* ── Status config — editorial palette ── */
const STATUS_META: Record<string, { label: string; bar: string; dot: string; icon: React.ElementType; chip: string; ring: string }> = {
  construction: { label: 'تحت الإنشاء', bar: 'bg-amber-500', dot: 'bg-amber-500', icon: HardHat, chip: 'bg-amber-50 text-amber-700', ring: 'ring-amber-100' },
  testing:      { label: 'اختبار وتسليم', bar: 'bg-cyan-500', dot: 'bg-cyan-500', icon: CheckCircle2, chip: 'bg-cyan-50 text-cyan-700', ring: 'ring-cyan-100' },
  completed:    { label: 'مكتمل', bar: 'bg-emerald-500', dot: 'bg-emerald-500', icon: CheckCircle2, chip: 'bg-emerald-50 text-emerald-700', ring: 'ring-emerald-100' },
  design:       { label: 'تصميم', bar: 'bg-blue-500', dot: 'bg-blue-500', icon: FolderKanban, chip: 'bg-blue-50 text-blue-700', ring: 'ring-blue-100' },
  approvals:    { label: 'التراخيص', bar: 'bg-violet-500', dot: 'bg-violet-500', icon: ClipboardList, chip: 'bg-violet-50 text-violet-700', ring: 'ring-violet-100' },
  tendering:    { label: 'طرح مناقصة', bar: 'bg-teal-500', dot: 'bg-teal-500', icon: DollarSign, chip: 'bg-teal-50 text-teal-700', ring: 'ring-teal-100' },
  handover:     { label: 'تسليم', bar: 'bg-orange-500', dot: 'bg-orange-500', icon: Building2, chip: 'bg-orange-50 text-orange-700', ring: 'ring-orange-100' },
  cancelled:    { label: 'ملغي', bar: 'bg-red-500', dot: 'bg-red-500', icon: X, chip: 'bg-red-50 text-red-700', ring: 'ring-red-100' },
  feasibility:  { label: 'دراسة جدوى', bar: 'bg-slate-500', dot: 'bg-slate-500', icon: BarChart3, chip: 'bg-slate-50 text-slate-700', ring: 'ring-slate-100' },
  idea:         { label: 'فكرة', bar: 'bg-slate-500', dot: 'bg-slate-400', icon: FolderKanban, chip: 'bg-slate-50 text-slate-700', ring: 'ring-slate-100' },
  on_hold:      { label: 'معلق', bar: 'bg-amber-500', dot: 'bg-amber-500', icon: PauseCircle, chip: 'bg-amber-50 text-amber-700', ring: 'ring-amber-100' },
  converted:    { label: 'محول', bar: 'bg-emerald-500', dot: 'bg-emerald-500', icon: Building2, chip: 'bg-emerald-50 text-emerald-700', ring: 'ring-emerald-100' },
};

/* ── KPI Card — editorial stat block ── */
function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string; bar: string; border: string }> = {
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600', bar: 'bg-amber-500', border: 'border-amber-200' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600', bar: 'bg-blue-500', border: 'border-blue-200' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', bar: 'bg-emerald-500', border: 'border-emerald-200' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600', bar: 'bg-rose-500', border: 'border-rose-200' },
    violet: { iconBg: 'bg-violet-50', iconColor: 'text-violet-600', bar: 'bg-violet-500', border: 'border-violet-200' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600', bar: 'bg-slate-500', border: 'border-slate-200' },
    cyan:   { iconBg: 'bg-cyan-50', iconColor: 'text-cyan-600', bar: 'bg-cyan-500', border: 'border-cyan-200' },
  };
  const a = accentMap[accent] || accentMap.slate;
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${a.iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
            {trend.dir === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend.val)}%
          </div>
        )}
      </div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Project Card — editorial card ── */
function ProjectCard({ p, onDelete }: { p: any; onDelete: (p: any) => void }) {
  const navigate = useNavigate();
  const meta = STATUS_META[p.status] || STATUS_META.idea;
  const isDelayed = (p.status === 'construction' || p.status === 'testing') && p.planned_end_date && p.planned_end_date < new Date().toISOString().split('T')[0];
  const over = (p.actual_cost || 0) > (p.approved_budget || 0);
  const progress = p.completion_percentage || 0;
  const spent = p.actual_cost || 0;
  const budget = p.approved_budget || p.estimated_budget || 0;
  const remaining = Math.max(0, budget - spent);
  const burnRate = budget > 0 ? Math.round((spent / budget) * 100) : 0;

  return (
    <div
      onClick={() => navigate(`/projects/${p.id}`)}
      className="group relative bg-white rounded-xl border border-gray-100 p-5 cursor-pointer transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]"
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${meta.bar} rounded-t-xl opacity-60`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-10 w-10 rounded-lg ${meta.chip} ring-1 ${meta.ring} flex items-center justify-center shrink-0`}>
            <meta.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{p.project_name}</div>
            <div className="text-[11px] text-gray-400 font-mono mt-0.5">{p.project_code}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${meta.chip} ring-1 ${meta.ring}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
          {isDelayed && <AlertOctagon className="h-4 w-4 text-rose-500 shrink-0" />}
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-gray-400" />{getLandName(p.land_id) || '—'}</span>
        <span className="flex items-center gap-1.5"><Users className="h-3 w-3 text-gray-400" />{getEmployeeName(p.project_manager_id) || '—'}</span>
        <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3 text-gray-400" />{p.planned_start_date?.slice(0, 10) || '—'}</span>
      </div>

      {/* Progress bar */}
      <div className="mb-3.5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold text-gray-700">التقدم</span>
          <span className="font-bold text-gray-900 tabular-nums">{progress}%</span>
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isDelayed ? 'bg-rose-500' : 'bg-gradient-to-l from-amber-500 to-amber-400'}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
          {[25, 50, 75].map(t => (
            <div key={t} className="absolute top-0 bottom-0 w-px bg-white/30" style={{ left: `${t}%` }} />
          ))}
        </div>
      </div>

      {/* Budget grid */}
      <div className="grid grid-cols-3 gap-2 mb-3.5">
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">الميزانية</div>
          <div className="text-xs font-bold text-gray-800 ltr-only tabular-nums">{fmt(budget)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">المصروف</div>
          <div className={`text-xs font-bold ltr-only tabular-nums ${over ? 'text-rose-600' : 'text-gray-800'}`}>{fmt(spent)}</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-2.5 text-center">
          <div className="text-[10px] text-gray-400 mb-0.5">الحرق</div>
          <div className={`text-xs font-bold ltr-only tabular-nums ${burnRate > 80 ? 'text-amber-600' : 'text-emerald-600'}`}>{burnRate}%</div>
        </div>
      </div>

      {/* Health + risk */}
      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 cursor-help">
                <span className={`h-1.5 w-1.5 rounded-full ${over ? 'bg-rose-500' : remaining / (budget || 1) < 0.15 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                ميزانية
              </span>
            </TooltipTrigger>
            <TooltipContent>صحة الميزانية</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 cursor-help">
                <span className={`h-1.5 w-1.5 rounded-full ${isDelayed ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                جدولة
              </span>
            </TooltipTrigger>
            <TooltipContent>صحة الجدولة</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex items-center gap-1.5 cursor-help">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                موارد
              </span>
            </TooltipTrigger>
            <TooltipContent>صحة الموارد</TooltipContent>
          </Tooltip>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          over || isDelayed ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {over || isDelayed ? 'عالي' : 'منخفض'}
        </span>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1 mt-3 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => navigate(`/projects/${p.id}`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => navigate(`/projects/${p.id}/edit`)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => onDelete(p)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
        <div className="flex-1" />
        <button onClick={() => navigate(`/projects/${p.id}`)} className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-amber-600 transition-colors">
          التفاصيل <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

/* ── List Row ── */
function ProjectListRow({ p, onDelete }: { p: any; onDelete: (p: any) => void }) {
  const navigate = useNavigate();
  const meta = STATUS_META[p.status] || STATUS_META.idea;
  const isDelayed = (p.status === 'construction' || p.status === 'testing') && p.planned_end_date && p.planned_end_date < new Date().toISOString().split('T')[0];
  const over = (p.actual_cost || 0) > (p.approved_budget || 0);
  const progress = p.completion_percentage || 0;
  return (
    <div onClick={() => navigate(`/projects/${p.id}`)}
      className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 cursor-pointer transition-all hover:border-gray-200 hover:shadow-sm">
      <div className={`h-10 w-10 rounded-lg ${meta.chip} ring-1 ${meta.ring} flex items-center justify-center shrink-0`}>
        <meta.icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{p.project_name}</div>
          <div className="text-[11px] text-gray-400 font-mono">{p.project_code}</div>
        </div>
        <div className="text-xs text-gray-600">{getLandName(p.land_id) || '—'}</div>
        <div className="min-w-[120px]">
          <div className="flex items-center gap-1.5 text-xs mb-1">
            <span className="font-bold text-gray-800">{progress}%</span>
            {isDelayed && <Clock className="h-3 w-3 text-rose-500" />}
          </div>
          <div className="h-1.5 w-full max-w-[140px] bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full ${isDelayed ? 'bg-rose-500' : 'bg-gradient-to-l from-amber-500 to-amber-400'}`} style={{ width: `${Math.min(100, progress)}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${meta.chip} ring-1 ${meta.ring}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => navigate(`/projects/${p.id}`)} className="h-8 w-8 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-4 w-4" /></button>
        <button onClick={() => navigate(`/projects/${p.id}/edit`)} className="h-8 w-8 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
        <button onClick={() => onDelete(p)} className="h-8 w-8 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

/* ── Kanban View ── */
const KANBAN_COLUMNS = [
  { key: 'design', title: 'التصميم' },
  { key: 'approvals', title: 'التراخيص' },
  { key: 'tendering', title: 'المناقصة' },
  { key: 'construction', title: 'الإنشاء' },
  { key: 'testing', title: 'الاختبار' },
  { key: 'handover', title: 'التسليم' },
  { key: 'completed', title: 'مكتمل' },
];

function KanbanCard({ p }: { p: any }) {
  const navigate = useNavigate();
  const meta = STATUS_META[p.status] || STATUS_META.idea;
  return (
    <div onClick={() => navigate(`/projects/${p.id}`)}
      className="bg-white rounded-lg border border-gray-100 p-3 cursor-pointer hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="text-xs font-bold text-gray-800 truncate">{p.project_name}</div>
      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{p.project_code}</div>
      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-l from-amber-500 to-amber-400 rounded-full" style={{ width: `${Math.min(100, p.completion_percentage || 0)}%` }} />
      </div>
      <div className="flex items-center justify-between mt-2 text-[10px] text-gray-500">
        <span>{p.completion_percentage || 0}%</span>
        <span className="font-semibold text-gray-700">{fmt(p.approved_budget || 0)}</span>
      </div>
      <div className="mt-1.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${meta.chip} ring-1 ${meta.ring}`}>
          <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
          {meta.label}
        </span>
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
          <div key={col.key} className="min-w-[280px] flex-1 bg-gray-50/60 rounded-xl border border-gray-100 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-xs font-bold text-gray-700">{col.title}</span>
              <span className="text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 rounded-full ring-1 ring-gray-100">{colProjects.length}</span>
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

/* ── Timeline View ── */
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
    <div className="bg-white rounded-xl border border-gray-100 p-5 overflow-x-auto">
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
                  <div className="absolute top-0.5 bottom-0.5 rounded-md text-[10px] text-white font-bold flex items-center px-2 truncate shadow-sm"
                    style={{ left: `${s}%`, width: `${w}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}>
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

/* ── Empty State ── */
function EmptyProjects({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
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
   MAIN COMPONENT — Editorial Light
   ═══════════════════════════════════════════════════════ */
export default function ConstructionProjectsPage() {
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
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
              <HardHat className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">إدارة الإنشاءات</span>
              <span className="text-[13px] font-bold text-gray-900">{projects.length} مشروع</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block" />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input
              placeholder="ابحث في المشاريع..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>إجمالي الميزانيات:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{fmt(totalBudget)}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${profitMargin >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {profitMargin >= 0 ? '↑' : '↓'} {Math.abs(profitMargin)}%
            </span>
          </div>

          <div className="me-auto" />

          {/* View switcher */}
          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'grid', label: 'شبكة', icon: LayoutGrid },
              { key: 'list', label: 'قائمة', icon: List },
              { key: 'kanban', label: 'كانبان', icon: Columns3 },
              { key: 'timeline', label: 'جدولة', icon: Timer },
            ] as const).map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                role="tab"
                aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <v.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          <Button onClick={() => navigate('/projects/create')}
            className="h-8 px-3 gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>مشروع جديد</span>
          </Button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي المشاريع" value={projects.length} sub={`${activeCount} نشط`} icon={FolderKanban} accent="slate" />
          <KpiCard label="المشاريع النشطة" value={activeCount} sub={`${completedCount} مكتمل`} icon={Activity} trend={{ val: 12, dir: 'up' }} accent="amber" />
          <KpiCard label="متأخرة" value={delayedCount} sub={`${upcomingDeadlines} موعد قريب`} icon={AlertOctagon} trend={{ val: delayedCount, dir: 'down' }} accent="rose" />
          <KpiCard label="إجمالي الميزانيات" value={fmt(totalBudget)} sub={`${fmt(totalSpent)} مصروف`} icon={DollarSign} accent="emerald" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="متوسط الإنجاز" value={`${avgProgress}%`} sub="المشاريع النشطة" icon={Target} accent="cyan" />
          <KpiCard label="هامش الربح" value={`${profitMargin}%`} sub="ميزانية - مصروف" icon={TrendingUp} accent="emerald" />
          <KpiCard label="مواعيد قريبة" value={upcomingDeadlines} sub="خلال 30 يوم" icon={Calendar} accent="amber" />
          <KpiCard label="مطالبات معلقة" value={claims.filter((c: any) => c.status === 'submitted' || c.status === 'verified').length} sub="إجمالي المطالبات" icon={FileText} accent="violet" />
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">المشاريع</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}
                className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                <RotateCcw className="h-3.5 w-3.5" /> إعادة
              </Button>
              <Button variant="outline" size="sm"
                className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                <Download className="h-3.5 w-3.5" /> تصدير
              </Button>
              <Button onClick={() => navigate('/projects/create')}
                className="h-8 text-xs rounded-lg gap-1 bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 shadow-sm">
                <Plus className="h-3.5 w-3.5" /> مشروع جديد
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                {projectStatuses.map((s: string) => (
                  <SelectItem key={s} value={s}>{(STATUS_META[s] || STATUS_META.idea).label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Building2 className="h-3 w-3 ml-1" /><SelectValue placeholder="النوع" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                {projectTypes.map((s: string) => (
                  <SelectItem key={s} value={s}>{(t.projects.types as any)[s] || s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={managerFilter} onValueChange={setManagerFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Users className="h-3 w-3 ml-1" /><SelectValue placeholder="المدير" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع المدراء</SelectItem>
                {managers.map((id: string) => (
                  <SelectItem key={id} value={id}>{getEmployeeName(id) || id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
          <KanbanView projects={filtered} />
        ) : (
          <TimelineView projects={filtered} />
        )}

        {/* ── Result meta ── */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {projects.length} مشروع</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            مفلتر محلياً
          </span>
        </div>
      </div>

      {/* ── Delete Dialog ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3>
                <p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              هل أنت متأكد من حذف <strong className="text-gray-900">{deleteTarget.project_name}</strong>؟
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}
                className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}
                className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
