import { formatQAR, formatQARInt, formatThousand } from '@/lib/format';
import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { LandMap, generateDemoCoordinates, type MapLand } from '@/components/maps/LandMap';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  IconSearch as Search, IconClose as X, IconPlus as Plus, IconMap as MapIcon,
  IconEye as Eye, IconPencil as Pencil, IconTrash as Trash2,
  IconChevronLeft as ChevronLeft, IconChevronRight as ChevronRight,
  IconLayers as Layers, IconHome as Home, IconBuilding as Building2,
  IconTree as TreePine, IconBriefcase as Briefcase, IconHammer as Hammer,
  IconCheck as CheckCircle2, IconArchive as Archive,
  IconCoin as CircleDollarSign, IconTrending as TrendingUp,
  IconRefresh as RotateCcw, IconDownload as Download,
  IconTruck as Truck, IconFile as FileText, IconSort as ArrowUpDown,
  IconSortAsc as ArrowUp, IconSortDesc as ArrowDown, IconFolder as FolderKanban,
  IconDollar as DollarSign, IconGrid as LayoutGrid, IconList as List,
  IconLocation as MapPin, IconCalendar as Calendar, IconRuler as Ruler,
  IconPin as Pin, IconSparkle as Sparkles, IconActivity as Activity,
  IconCopy as Copy, IconFilter as Filter, IconBank as Bank,
} from '@/components/icons/IconSet';
import { landStore, projectStore } from '@/services/stores';
import { exportToCSV } from '@/utils/exportUtils';
import type { Land, LandStatus } from '@/types';

// ────────────────────────────────────────────────────────────
// CONFIG
// ────────────────────────────────────────────────────────────
type StatusTone = {
  label: string;
  pill: string; dot: string; stripe: string; soft: string;
  ring: string; ink: string; bg: string;
  icon: any; chip: string; accent: string;
};

const statusTones: Record<LandStatus, StatusTone> = {
  available: {
    label: 'متاحة', pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500',
    stripe: 'border-emerald-400', soft: 'bg-emerald-50/40', ring: 'ring-emerald-100',
    ink: 'text-emerald-700', bg: 'bg-emerald-500', icon: CheckCircle2,
    chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100', accent: 'bg-emerald-500/10',
  },
  under_study: {
    label: 'تحت الدراسة', pill: 'bg-blue-50 text-blue-700', dot: 'bg-blue-500',
    stripe: 'border-blue-400', soft: 'bg-blue-50/40', ring: 'ring-blue-100',
    ink: 'text-blue-700', bg: 'bg-blue-500', icon: FileText,
    chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100', accent: 'bg-blue-500/10',
  },
  under_design: {
    label: 'تحت التصميم', pill: 'bg-cyan-50 text-cyan-700', dot: 'bg-cyan-500',
    stripe: 'border-cyan-400', soft: 'bg-cyan-50/40', ring: 'ring-cyan-100',
    ink: 'text-cyan-700', bg: 'bg-cyan-500', icon: FileText,
    chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100', accent: 'bg-cyan-500/10',
  },
  under_approvals: {
    label: 'تحت الترخيص', pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500',
    stripe: 'border-amber-400', soft: 'bg-amber-50/40', ring: 'ring-amber-100',
    ink: 'text-amber-700', bg: 'bg-amber-500', icon: FileText,
    chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100', accent: 'bg-amber-500/10',
  },
  under_construction: {
    label: 'قيد التطوير', pill: 'bg-orange-50 text-orange-700', dot: 'bg-orange-500',
    stripe: 'border-orange-400', soft: 'bg-orange-50/40', ring: 'ring-orange-100',
    ink: 'text-orange-700', bg: 'bg-orange-500', icon: Hammer,
    chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100', accent: 'bg-orange-500/10',
  },
  developed: {
    label: 'مطوّرة', pill: 'bg-teal-50 text-teal-700', dot: 'bg-teal-500',
    stripe: 'border-teal-400', soft: 'bg-teal-50/40', ring: 'ring-teal-100',
    ink: 'text-teal-700', bg: 'bg-teal-500', icon: CheckCircle2,
    chip: 'bg-teal-50 text-teal-700 ring-1 ring-teal-100', accent: 'bg-teal-500/10',
  },
  sold: {
    label: 'مباعة', pill: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500',
    stripe: 'border-indigo-400', soft: 'bg-indigo-50/40', ring: 'ring-indigo-100',
    ink: 'text-indigo-700', bg: 'bg-indigo-500', icon: CircleDollarSign,
    chip: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100', accent: 'bg-indigo-500/10',
  },
  archived: {
    label: 'غير نشطة', pill: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400',
    stripe: 'border-gray-300', soft: 'bg-gray-50/40', ring: 'ring-gray-100',
    ink: 'text-gray-600', bg: 'bg-gray-400', icon: Archive,
    chip: 'bg-gray-100 text-gray-600 ring-1 ring-gray-200', accent: 'bg-gray-400/10',
  },
};

type UsageTone = {
  label: string; soft: string; text: string; dot: string; ring: string;
  bg: string; ink: string; icon: any;
};

const usageTones: Record<string, UsageTone> = {
  'سكني':     { label: 'سكني',     soft: 'bg-sky-50',      text: 'text-sky-700',     dot: 'bg-sky-500',     ring: 'ring-sky-100',     bg: 'bg-sky-500',     ink: 'text-sky-600',     icon: Home },
  'تجاري':    { label: 'تجاري',    soft: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500', ring: 'ring-emerald-100', bg: 'bg-emerald-500', ink: 'text-emerald-600', icon: Building2 },
  'مختلط':    { label: 'مختلط',    soft: 'bg-violet-50',   text: 'text-violet-700',  dot: 'bg-violet-500',  ring: 'ring-violet-100',  bg: 'bg-violet-500',  ink: 'text-violet-600',  icon: Layers },
  'استثماري': { label: 'استثماري', soft: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500',   ring: 'ring-amber-100',   bg: 'bg-amber-500',   ink: 'text-amber-600',   icon: Briefcase },
  'زراعي':    { label: 'زراعي',    soft: 'bg-lime-50',     text: 'text-lime-700',    dot: 'bg-lime-500',    ring: 'ring-lime-100',    bg: 'bg-lime-500',    ink: 'text-lime-600',    icon: TreePine },
  'صناعي':    { label: 'صناعي',    soft: 'bg-slate-50',    text: 'text-slate-700',   dot: 'bg-slate-500',   ring: 'ring-slate-100',   bg: 'bg-slate-500',   ink: 'text-slate-600',   icon: Truck },
};
const defaultUsageTone: UsageTone = { label: 'أخرى', soft: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400', ring: 'ring-gray-100', bg: 'bg-gray-400', ink: 'text-gray-600', icon: FileText };

const STATUS_ORDER: LandStatus[] = ['available', 'under_study', 'under_design', 'under_approvals', 'under_construction', 'developed', 'sold', 'archived'];
const STATUS_GROUPS: { label: string; statuses: LandStatus[]; tone: 'emerald' | 'amber' | 'blue' | 'gray' }[] = [
  { label: 'متاحة للتطوير', statuses: ['available'], tone: 'emerald' },
  { label: 'قيد الإجراءات', statuses: ['under_study', 'under_design', 'under_approvals', 'under_construction'], tone: 'amber' },
  { label: 'مكتملة',         statuses: ['developed'], tone: 'blue' },
  { label: 'مغلقة',          statuses: ['sold', 'archived'], tone: 'gray' },
];

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────
type SortField = 'land_code' | 'land_name' | 'municipality' | 'area_sqm' | 'zone' | 'status' | 'acquisition_date' | 'estimated_value';
type SortDir = 'asc' | 'desc';
type ViewMode = 'dossier' | 'gallery' | 'map';

const SORT_LABELS: Record<SortField, string> = {
  land_code: 'رقم الأرض', land_name: 'اسم الموقع', municipality: 'البلدية', area_sqm: 'المساحة',
  zone: 'الاستخدام', status: 'الحالة', acquisition_date: 'تاريخ الشراء', estimated_value: 'القيمة',
};

const VIEW_LABELS: Record<ViewMode, { label: string; icon: any; sub: string }> = {
  dossier: { label: 'ملفات',  icon: List,       sub: 'عرض كقائمة سريعة المسح' },
  gallery: { label: 'معرض',   icon: LayoutGrid, sub: 'بطاقات بصرية' },
  map:     { label: 'خريطة',  icon: MapIcon,    sub: 'التوزيع الجغرافي' },
};

// ────────────────────────────────────────────────────────────
// PAGE
// ────────────────────────────────────────────────────────────
export default function LandListPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Land | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('dossier');

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUsage, setFilterUsage] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterAcqPeriod, setFilterAcqPeriod] = useState<string>('all');
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('land_code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [filterTrayOpen, setFilterTrayOpen] = useState(false);
  const [hoveredLandId, setHoveredLandId] = useState<string | null>(null);

  const lands = useMemo(() => landStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);

  const kpis = useMemo(() => {
    const totalArea = lands.reduce((s, l) => s + (l.area_sqm || 0), 0);
    const totalCount = lands.length;
    const availableCount = lands.filter(l => l.status === 'available').length;
    const underDevCount = lands.filter(l =>
      ['under_study', 'under_design', 'under_approvals', 'under_construction'].includes(l.status)
    ).length;
    const totalCost = lands.reduce((s, l) => s + (l.total_acquisition_cost || 0), 0);
    const totalValue = lands.reduce((s, l) => s + (l.current_estimated_value || 0), 0);
    const appreciation = totalCost > 0 ? Math.round(((totalValue - totalCost) / totalCost) * 100) : 0;
    return { totalArea, totalCount, availableCount, underDevCount, totalCost, totalValue, appreciation };
  }, [lands]);

  const allUsageTypes = useMemo(() => {
    const set = new Set<string>(); lands.forEach(l => { if (l.zone) set.add(l.zone); }); return Array.from(set);
  }, [lands]);
  const allLocations = useMemo(() => {
    const set = new Set<string>(); lands.forEach(l => { if (l.municipality) set.add(l.municipality); }); return Array.from(set);
  }, [lands]);

  const getProjectCount = (landId: string) => projects.filter((p: any) => p.land_id === landId).length;

  const statusCounts = useMemo(() => {
    const m: Record<string, number> = { all: lands.length };
    STATUS_ORDER.forEach(s => { m[s] = lands.filter(l => l.status === s).length; });
    return m;
  }, [lands]);
  const usageCounts = useMemo(() => {
    const m: Record<string, number> = { all: lands.length };
    allUsageTypes.forEach(u => { m[u] = lands.filter(l => l.zone === u).length; });
    return m;
  }, [lands, allUsageTypes]);
  const locationCounts = useMemo(() => {
    const m: Record<string, number> = { all: 0 };
    allLocations.forEach(loc => { m[loc] = lands.filter(l => l.municipality === loc).length; m.all += m[loc]; });
    return m;
  }, [lands, allLocations]);

  const filtered = useMemo(() => {
    let result = lands.filter(l => {
      if (filterStatus !== 'all' && l.status !== filterStatus) return false;
      if (filterUsage !== 'all' && l.zone !== filterUsage) return false;
      if (filterLocation !== 'all' && l.municipality !== filterLocation) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${l.land_code} ${l.land_name} ${l.plot_number} ${l.municipality} ${l.zone}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterAcqPeriod !== 'all' && l.acquisition_date) {
        const d = new Date(l.acquisition_date);
        const now = new Date();
        const days = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        if (filterAcqPeriod === '30d' && days > 30) return false;
        if (filterAcqPeriod === '90d' && days > 90) return false;
        if (filterAcqPeriod === 'year' && d.getFullYear() !== now.getFullYear()) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      let va: any, vb: any;
      switch (sortField) {
        case 'land_code': va = a.land_code; vb = b.land_code; break;
        case 'land_name': va = a.land_name; vb = b.land_name; break;
        case 'municipality': va = a.municipality || ''; vb = b.municipality || ''; break;
        case 'area_sqm': va = a.area_sqm || 0; vb = b.area_sqm || 0; break;
        case 'zone': va = a.zone || ''; vb = b.zone || ''; break;
        case 'status': va = a.status; vb = b.status; break;
        case 'acquisition_date': va = a.acquisition_date || ''; vb = b.acquisition_date || ''; break;
        case 'estimated_value': va = a.current_estimated_value || 0; vb = b.current_estimated_value || 0; break;
        default: return 0;
      }
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb, 'ar') : vb.localeCompare(va, 'ar');
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return result;
  }, [lands, search, filterStatus, filterUsage, filterLocation, filterAcqPeriod, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const mapLands = useMemo<MapLand[]>(() =>
    lands.map((l, i) => {
      const coords = (l.gps_lat && l.gps_lng) ? { latitude: l.gps_lat, longitude: l.gps_lng } : generateDemoCoordinates(i, lands.length);
      return { id: l.id, land_name: l.land_name, land_code: l.land_code, status: l.status, area_sqm: l.area_sqm, municipality: l.municipality, ...coords };
    }), [lands]);

  useEffect(() => { setCurrentPage(1); }, [search, filterStatus, filterUsage, filterLocation, filterAcqPeriod, sortField, sortDir, viewMode]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 inline ms-1 opacity-40" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 inline ms-1 text-blue-600" />
      : <ArrowDown className="h-3.5 w-3.5 inline ms-1 text-blue-600" />;
  };

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(code).then(() => toast.success('تم نسخ الكود'));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    landStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.land_name} بنجاح`);
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  function handleResetFilters() {
    setSearch(''); setFilterStatus('all'); setFilterUsage('all'); setFilterLocation('all');
    setFilterAcqPeriod('all'); setCurrentPage(1);
  }

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; tone: string; onRemove: () => void }[] = [];
    if (filterStatus !== 'all') chips.push({ key: 'status', label: statusTones[filterStatus as LandStatus]?.label || filterStatus, tone: statusTones[filterStatus as LandStatus]?.chip || 'chip', onRemove: () => { setFilterStatus('all'); } });
    if (filterUsage !== 'all') chips.push({ key: 'usage', label: (usageTones[filterUsage] || defaultUsageTone).label, tone: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100', onRemove: () => { setFilterUsage('all'); } });
    if (filterLocation !== 'all') chips.push({ key: 'location', label: filterLocation, tone: 'bg-slate-50 text-slate-700 ring-1 ring-slate-100', onRemove: () => { setFilterLocation('all'); } });
    if (filterAcqPeriod !== 'all') chips.push({ key: 'period', label: `الفترة: ${filterAcqPeriod === '30d' ? '30 يوم' : filterAcqPeriod === '90d' ? '90 يوم' : 'هذا العام'}`, tone: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100', onRemove: () => { setFilterAcqPeriod('all'); } });
    if (search) chips.push({ key: 'search', label: `بحث: "${search}"`, tone: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100', onRemove: () => { setSearch(''); } });
    return chips;
  }, [filterStatus, filterUsage, filterLocation, filterAcqPeriod, search]);

  const activeFiltersCount = activeFilterChips.length;
  const activeFiltersClean = activeFiltersCount === 0;

  function handleExport() {
    const data = filtered.map((l) => ({
      'كود الأرض': l.land_code, 'اسم الأرض': l.land_name, 'رقم القطعة': l.plot_number || '',
      'البلدية': l.municipality || '', 'المنطقة': l.zone || '', 'المساحة (م²)': l.area_sqm,
      'تكلفة الشراء': l.total_acquisition_cost || 0, 'القيمة المقدرة': l.current_estimated_value || 0,
      'المشاريع': getProjectCount(l.id), 'الحالة': statusTones[l.status]?.label || l.status,
    }));
    exportToCSV(data, [
      { key: 'كود الأرض', label: 'كود الأرض' }, { key: 'اسم الأرض', label: 'اسم الأرض' },
      { key: 'رقم القطعة', label: 'رقم القطعة' }, { key: 'البلدية', label: 'البلدية' },
      { key: 'المنطقة', label: 'المنطقة' }, { key: 'المساحة (م²)', label: 'المساحة (م²)' },
      { key: 'تكلفة الشراء', label: 'تكلفة الشراء' }, { key: 'القيمة المقدرة', label: 'القيمة المقدرة' },
      { key: 'المشاريع', label: 'المشاريع' }, { key: 'الحالة', label: 'الحالة' },
    ], 'الأراضي.csv');
  }

  // ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#fafbfc]" dir="rtl">
      {/* COMMAND BAR — sticky top */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-sm">
              <Bank className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">الأراضي</span>
              <span className="text-sm font-bold text-gray-900">{kpis.totalCount} أصل عقاري</span>
            </div>
          </div>

          <div className="h-7 w-px bg-gray-200 hidden md:block" />

          <div className="relative flex-1 max-w-md">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="ابحث في الكود، الاسم، البلدية..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pe-10 ps-10 h-10 text-sm rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500">
            <span>إجمالي القيمة:</span>
            <span className="font-bold text-gray-900 ltr-only" dir="ltr">{formatQARInt(kpis.totalValue)}</span>
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${kpis.appreciation >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {kpis.appreciation >= 0 ? '↑' : '↓'} {Math.abs(kpis.appreciation)}%
            </span>
          </div>

          <div className="me-auto" />

          {/* View switcher */}
          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {(Object.keys(VIEW_LABELS) as ViewMode[]).map(v => {
              const cfg = VIEW_LABELS[v];
              const active = viewMode === v;
              const Icon = cfg.icon;
              return (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  role="tab"
                  aria-selected={active}
                  title={cfg.sub}
                  className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-[13px] font-semibold transition-all ${
                    active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{cfg.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filter tray toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterTrayOpen(v => !v)}
            className="h-9 px-3 border-gray-200 rounded-lg text-[13px] gap-1.5 text-gray-700 hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            فلاتر
            {activeFiltersCount > 0 && (
              <span className="ms-0.5 inline-flex items-center justify-center h-5 min-w-[20px] px-1 text-[11px] font-bold rounded-full bg-blue-600 text-white">
                {activeFiltersCount}
              </span>
            )}
            <ChevronLeft className={`h-3.5 w-3.5 transition-transform ${filterTrayOpen ? 'rotate-90' : '-rotate-90'}`} />
          </Button>

          {/* Sort dropdown */}
          <Select value={sortField} onValueChange={v => setSortField(v as SortField)}>
            <SelectTrigger className="h-9 w-[160px] text-[13px] border-gray-200 rounded-lg bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                className="h-9 w-9 p-0 border-gray-200 rounded-lg">
                {sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{sortDir === 'asc' ? 'تصاعدي' : 'تنازلي'}</TooltipContent>
          </Tooltip>

          <div className="h-7 w-px bg-gray-200" />

          <Button variant="outline" size="sm" onClick={handleExport}
            className="h-9 px-3 border-gray-200 rounded-lg text-[13px] gap-1.5 text-gray-700 hover:bg-gray-50">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">تصدير</span>
          </Button>

          <Button onClick={() => navigate('/lands/create')}
            className="h-9 px-4 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-semibold rounded-lg shadow-sm">
            <Plus className="h-4 w-4" />
            <span>أضف أرضاً</span>
          </Button>
        </div>

        {/* FILTER TRAY */}
        {filterTrayOpen && (
          <div className="border-t border-gray-100 bg-white/95 backdrop-blur-md">
            <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <FilterGroup title="الحالة" icon={Activity}>
                <Chip active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} count={statusCounts.all}>الكل</Chip>
                {STATUS_ORDER.map(s => (
                  <Chip key={s} active={filterStatus === s} onClick={() => setFilterStatus(s)} count={statusCounts[s] || 0} dot={statusTones[s].dot}>
                    {statusTones[s].label}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup title="الاستخدام" icon={Layers}>
                <Chip active={filterUsage === 'all'} onClick={() => setFilterUsage('all')} count={usageCounts.all}>الكل</Chip>
                {allUsageTypes.map(u => {
                  const tn = usageTones[u] || defaultUsageTone;
                  return (
                    <Chip key={u} active={filterUsage === u} onClick={() => setFilterUsage(u)} count={usageCounts[u] || 0} dot={tn.dot}>
                      {tn.label}
                    </Chip>
                  );
                })}
              </FilterGroup>

              <FilterGroup title="فترة الشراء" icon={Calendar}>
                {[
                  { v: 'all', l: 'الكل' },
                  { v: '30d', l: 'آخر 30 يوم' },
                  { v: '90d', l: 'آخر 90 يوم' },
                  { v: 'year', l: 'هذا العام' },
                ].map(p => (
                  <Chip key={p.v} active={filterAcqPeriod === p.v} onClick={() => setFilterAcqPeriod(p.v)}>{p.l}</Chip>
                ))}
              </FilterGroup>

              {allLocations.length > 0 && (
                <FilterGroup title="البلدية" icon={MapPin}>
                  <Chip active={filterLocation === 'all'} onClick={() => setFilterLocation('all')} count={locationCounts.all}>الكل</Chip>
                  {allLocations.map(loc => (
                    <Chip key={loc} active={filterLocation === loc} onClick={() => setFilterLocation(loc)} count={locationCounts[loc] || 0}>
                      {loc}
                    </Chip>
                  ))}
                </FilterGroup>
              )}
            </div>
            {activeFiltersCount > 0 && (
              <div className="border-t border-gray-100 max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-end">
                <Button variant="ghost" size="sm" onClick={handleResetFilters}
                  className="h-8 text-xs text-gray-500 hover:text-gray-900 gap-1">
                  <RotateCcw className="h-3.5 w-3.5" />إعادة تعيين الكل
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PAGE CONTENT */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

        {/* HERO STRIP — title card + 4 stat ribbons */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr,2.8fr] gap-4">
          <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 mb-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>بنك الأراضي · إدارة الممتلكات</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">
                  محفظة الأراضي الاستثمارية
                </h1>
                <p className="text-[13px] text-gray-500 mt-2 leading-relaxed max-w-md">
                  {filtered.length === lands.length
                    ? `إدارة شاملة لـ ${lands.length} أصل عقاري بإجمالي ${formatThousand(kpis.totalArea)} م²`
                    : `عرض ${filtered.length} من ${lands.length} أصل مطابق للفلاتر النشطة`}
                </p>
              </div>
              <div className="hidden sm:flex h-11 w-11 rounded-xl bg-gradient-to-br from-blue-50 to-emerald-50 ring-1 ring-gray-100 items-center justify-center shrink-0">
                <Layers className="h-5 w-5 text-blue-600" />
              </div>
            </div>

            {activeFilterChips.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-gray-50">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">نشط:</span>
                {activeFilterChips.map(chip => (
                  <button key={chip.key} onClick={chip.onRemove}
                    className={`group inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${chip.tone}`}>
                    {chip.label}
                    <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatRibbon
              label="إجمالي"
              value={kpis.totalCount.toString()}
              sub={`${formatThousand(kpis.totalArea)} م²`}
              icon={Layers}
              tone="blue"
              trend="+12%"
              active={activeFiltersClean}
              onClick={handleResetFilters}
            />
            <StatRibbon
              label="متاحة"
              value={kpis.availableCount.toString()}
              sub="للتطوير الفوري"
              icon={CheckCircle2}
              tone="emerald"
              active={filterStatus === 'available'}
              onClick={() => setFilterStatus('available')}
            />
            <StatRibbon
              label="قيد التنفيذ"
              value={kpis.underDevCount.toString()}
              sub="تحت الإجراء"
              icon={Hammer}
              tone="amber"
              active={['under_study', 'under_design', 'under_approvals', 'under_construction'].includes(filterStatus)}
              onClick={() => setFilterStatus('under_construction')}
            />
            <StatRibbon
              label="القيمة"
              value={formatQARInt(kpis.totalValue)}
              sub={`تكلفة: ${formatQARInt(kpis.totalCost)}`}
              icon={TrendingUp}
              tone="violet"
              trend={`${kpis.appreciation >= 0 ? '+' : ''}${kpis.appreciation}%`}
              trendTone={kpis.appreciation >= 0 ? 'emerald' : 'rose'}
            />
          </div>
        </div>

        {/* PIPELINE STRIP — 8 statuses grouped into 4 stages */}
        <div className="bg-white rounded-2xl border border-gray-100 p-2">
          <div className="flex items-center gap-1 overflow-x-auto px-3 py-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 me-2 shrink-0">خط الإنتاج</span>
            {STATUS_GROUPS.map((group, gi) => (
              <div key={group.label} className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col items-start">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{group.label}</span>
                  <div className="flex items-center gap-1">
                    {group.statuses.map((s, si) => {
                      const tone = statusTones[s];
                      const Icon = tone.icon;
                      const count = statusCounts[s] || 0;
                      const active = filterStatus === s;
                      return (
                        <button
                          key={s}
                          onClick={() => setFilterStatus(active ? 'all' : s)}
                          className={`group inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold transition-all ${
                            active
                              ? `${tone.soft} ${tone.ink} ring-1 ${tone.ring}`
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                          <Icon className="h-3.5 w-3.5" />
                          <span>{tone.label}</span>
                          <span className={`text-[11px] font-bold px-1 rounded ${active ? tone.ink : 'text-gray-400'}`}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {gi < STATUS_GROUPS.length - 1 && (
                  <ChevronLeft className="h-4 w-4 text-gray-300 mx-2 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* VIEW-MODE CONTENT */}
        {viewMode === 'dossier' && (
          <DossierView
            paginated={paginated}
            filtered={filtered}
            sortField={sortField}
            handleSort={handleSort}
            handleCopyCode={handleCopyCode}
            setDeleteTarget={setDeleteTarget}
            navigate={navigate}
            getProjectCount={getProjectCount}
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            setCurrentPage={setCurrentPage}
            handleResetFilters={handleResetFilters}
            SortIcon={SortIcon}
            activeFiltersCount={activeFiltersCount}
            hoveredLandId={hoveredLandId}
            setHoveredLandId={setHoveredLandId}
          />
        )}

        {viewMode === 'gallery' && (
          <GalleryView
            paginated={paginated}
            filtered={filtered}
            handleCopyCode={handleCopyCode}
            setDeleteTarget={setDeleteTarget}
            navigate={navigate}
            getProjectCount={getProjectCount}
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            setCurrentPage={setCurrentPage}
            handleResetFilters={handleResetFilters}
            activeFiltersCount={activeFiltersCount}
          />
        )}

        {viewMode === 'map' && (
          <MapView
            mapLands={mapLands}
            statusCounts={statusCounts}
            navigate={navigate}
            currentPage={currentPage}
            totalPages={totalPages}
            rowsPerPage={rowsPerPage}
            setRowsPerPage={setRowsPerPage}
            setCurrentPage={setCurrentPage}
            filtered={filtered}
            handleCopyCode={handleCopyCode}
            setDeleteTarget={setDeleteTarget}
            getProjectCount={getProjectCount}
            handleResetFilters={handleResetFilters}
            activeFiltersCount={activeFiltersCount}
          />
        )}

        {/* RESULT META FOOTER */}
        <div className="flex items-center justify-between text-xs text-gray-500 px-1">
          <div>
            <span>عرض </span>
            <span className="font-bold text-gray-900">
              {filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
            </span>
            <span> – </span>
            <span className="font-bold text-gray-900">{Math.min(currentPage * rowsPerPage, filtered.length)}</span>
            <span> من </span>
            <span className="font-bold text-gray-900">{filtered.length}</span>
            <span> نتيجة</span>
            {filtered.length !== lands.length && <span className="text-gray-400"> (إجمالي {lands.length})</span>}
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />مفلتر محلياً</span>
            <span className="text-gray-300">·</span>
            <span>مرتبة حسب: <span className="font-semibold text-gray-700">{SORT_LABELS[sortField]}</span> ({sortDir === 'asc' ? 'تصاعدياً' : 'تنازلياً'})</span>
          </div>
        </div>
      </div>

      {/* DELETE DIALOG */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2.5">
              <div className="h-11 w-11 rounded-full bg-red-50 ring-1 ring-red-100 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <span className="text-base">تأكيد الحذف</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              هل أنت متأكد من حذف الأرض <strong className="text-gray-900">{deleteTarget?.land_name}</strong> ({deleteTarget?.land_code})؟
              <br /><span className="text-xs text-gray-400">لا يمكن التراجع عن هذا الإجراء.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 h-10">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ────────────────────────────────────────────────────────────

function Chip({ active, onClick, count, dot, children }: { active: boolean; onClick: () => void; count?: number; dot?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`group inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold transition-all ${
        active ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-gray-700 ring-1 ring-gray-200 hover:ring-gray-300 hover:bg-gray-50'
      }`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-white/80' : dot}`} />}
      <span>{children}</span>
      {count !== undefined && (
        <span className={`text-[11px] font-bold tabular-nums ${active ? 'text-white/80' : 'text-gray-400'}`}>{count}</span>
      )}
    </button>
  );
}

function FilterGroup({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
        <Icon className="h-3.5 w-3.5" />
        <span>{title}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {children}
      </div>
    </div>
  );
}

function StatRibbon({ label, value, sub, icon: Icon, tone, trend, trendTone, active, onClick }: {
  label: string; value: string; sub: string;
  icon: any; tone: 'blue' | 'emerald' | 'amber' | 'violet' | 'rose';
  trend?: string; trendTone?: 'emerald' | 'rose';
  active?: boolean; onClick?: () => void;
}) {
  const toneMap = {
    blue:    { icon: 'bg-blue-50',    text: 'text-blue-600',    bar: 'bg-blue-500',    ring: 'ring-blue-100' },
    emerald: { icon: 'bg-emerald-50', text: 'text-emerald-600', bar: 'bg-emerald-500', ring: 'ring-emerald-100' },
    amber:   { icon: 'bg-amber-50',   text: 'text-amber-600',   bar: 'bg-amber-500',   ring: 'ring-amber-100' },
    violet:  { icon: 'bg-violet-50',  text: 'text-violet-600',  bar: 'bg-violet-500',  ring: 'ring-violet-100' },
    rose:    { icon: 'bg-rose-50',    text: 'text-rose-600',    bar: 'bg-rose-500',    ring: 'ring-rose-100' },
  };
  const t = toneMap[tone];
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`group relative text-start w-full bg-white rounded-xl border p-4 transition-all ${
        active
          ? 'border-blue-200 ring-2 ring-blue-100 shadow-[0_4px_12px_rgba(37,99,235,0.08)]'
          : 'border-gray-100 hover:border-gray-200 hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)]'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      dir="rtl"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <div className={`h-8 w-8 rounded-lg ${t.icon} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${t.text}`} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
        {active && <span className="ms-auto text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">نشط</span>}
        {!active && trend && (
          <span className={`ms-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${
            trendTone === 'rose' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
          }`}>{trend}</span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 ltr-only" dir="ltr" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
      <div className={`absolute bottom-0 start-0 end-0 h-0.5 rounded-b-xl ${active ? t.bar : 'bg-transparent'}`} />
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// DOSSIER VIEW (default)
// ────────────────────────────────────────────────────────────
function DossierView(props: {
  paginated: Land[]; filtered: Land[]; sortField: SortField;
  handleSort: (f: SortField) => void; handleCopyCode: (c: string, e?: React.MouseEvent) => void;
  setDeleteTarget: (l: Land) => void; navigate: any; getProjectCount: (id: string) => number;
  currentPage: number; totalPages: number; rowsPerPage: number;
  setRowsPerPage: (v: number) => void; setCurrentPage: (p: number) => void;
  handleResetFilters: () => void; SortIcon: any;
  activeFiltersCount: number;
  hoveredLandId: string | null; setHoveredLandId: (id: string | null) => void;
}) {
  const {
    paginated, filtered, sortField, handleSort, handleCopyCode, setDeleteTarget,
    navigate, getProjectCount, currentPage, totalPages, rowsPerPage, setRowsPerPage,
    setCurrentPage, handleResetFilters, SortIcon, activeFiltersCount, hoveredLandId, setHoveredLandId,
  } = props;

  if (paginated.length === 0) {
    return <EmptyState onCreate={() => navigate('/lands/create')} hasFilters={activeFiltersCount > 0} onReset={handleResetFilters} variant="dossier" />;
  }

  const SortHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className={`group inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors ${
        sortField === field ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
      <SortIcon field={field} />
    </button>
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/40 flex items-center gap-3 text-xs">
        <span className="w-10 shrink-0" />
        <span className="flex-1 grid grid-cols-12 gap-3">
          <span className="col-span-5 flex items-center gap-3">
            <SortHeader field="land_code">الكود</SortHeader>
            <span className="text-gray-300">·</span>
            <SortHeader field="land_name">الموقع</SortHeader>
            <span className="text-gray-300">·</span>
            <SortHeader field="municipality">البلدية</SortHeader>
          </span>
          <span className="col-span-3 flex items-center gap-3">
            <SortHeader field="zone">الاستخدام</SortHeader>
            <span className="text-gray-300">·</span>
            <SortHeader field="status">الحالة</SortHeader>
          </span>
          <span className="col-span-2 flex items-center">
            <SortHeader field="area_sqm">المساحة</SortHeader>
          </span>
          <span className="col-span-2 flex items-center justify-between">
            <SortHeader field="estimated_value">القيمة</SortHeader>
            <span className="text-gray-500 normal-case font-medium tracking-normal">المشاريع</span>
          </span>
        </span>
        <span className="w-24 text-center text-gray-500 normal-case font-medium tracking-normal">إجراءات</span>
      </div>

      <div className="divide-y divide-gray-50">
        {paginated.map((l) => {
          const projCount = getProjectCount(l.id);
          const usage = usageTones[l.zone] || defaultUsageTone;
          const UsageIcon = usage.icon;
          const status = statusTones[l.status] || statusTones.archived;
          const StatusIcon = status.icon;
          const isHovered = hoveredLandId === l.id;

          return (
            <div
              key={l.id}
              onClick={() => navigate(`/lands/${l.id}`)}
              onMouseEnter={() => setHoveredLandId(l.id)}
              onMouseLeave={() => setHoveredLandId(null)}
              className={`group relative px-5 py-4 cursor-pointer transition-colors ${
                isHovered ? status.soft : 'hover:bg-gray-50/60'
              }`}
            >
              <div className={`absolute start-0 top-0 bottom-0 w-1 ${status.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />

              <div className="flex items-center gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-lg ${status.soft} ring-1 ${status.ring} flex items-center justify-center`}>
                  <StatusIcon className={`h-4 w-4 ${status.ink}`} />
                </div>

                <div className="flex-1 min-w-0 grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-5 min-w-0 flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={(e) => handleCopyCode(l.land_code, e)}
                          className="font-mono text-[13px] font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors shrink-0"
                          dir="ltr">
                          {l.land_code}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>اضغط للنسخ</TooltipContent>
                    </Tooltip>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-gray-900 truncate tracking-tight">{l.land_name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{l.municipality || '—'}</span>
                        {l.plot_number && <><span className="text-gray-300">·</span><span className="text-gray-400">قطعة {l.plot_number}</span></>}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-3 flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-semibold ${usage.soft} ${usage.text}`}>
                      <UsageIcon className="h-3 w-3" />{usage.label}
                    </span>
                    <span className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-semibold ${status.pill}`}>
                      <span className={`h-1 w-1 rounded-full ${status.dot}`} />{status.label}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-baseline gap-1">
                    <span className="text-sm font-bold text-gray-900 font-mono ltr-only" dir="ltr">{formatThousand(l.area_sqm)}</span>
                    <span className="text-[11px] text-gray-400">م²</span>
                  </div>

                  <div className="col-span-2 flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-900 ltr-only flex items-center gap-1" dir="ltr">
                      {l.current_estimated_value ? (
                        <>
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          {formatQAR(l.current_estimated_value)}
                        </>
                      ) : '—'}
                    </div>
                    {projCount > 0 ? (
                      <button onClick={(e) => { e.stopPropagation(); navigate('/projects'); }}
                        className="inline-flex items-center gap-1 h-7 px-2 rounded-md text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
                        <FolderKanban className="h-3 w-3" />{projCount}
                      </button>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </div>
                </div>

                <div className="w-24 flex items-center justify-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => navigate(`/lands/${l.id}`)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-blue-600 hover:bg-white transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>عرض</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => navigate(`/lands/${l.id}/edit`)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-amber-600 hover:bg-white transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>تعديل</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button onClick={() => setDeleteTarget(l)}
                        className="h-8 w-8 inline-flex items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-white transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>حذف</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Pagination
        currentPage={currentPage} totalPages={totalPages} rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(v) => setRowsPerPage(v)}
        onPageChange={setCurrentPage} totalItems={filtered.length}
      />
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// GALLERY VIEW
// ────────────────────────────────────────────────────────────
function GalleryView(props: {
  paginated: Land[]; filtered: Land[];
  handleCopyCode: (c: string, e?: React.MouseEvent) => void;
  setDeleteTarget: (l: Land) => void; navigate: any; getProjectCount: (id: string) => number;
  currentPage: number; totalPages: number; rowsPerPage: number;
  setRowsPerPage: (v: number) => void; setCurrentPage: (p: number) => void;
  handleResetFilters: () => void; activeFiltersCount: number;
}) {
  const {
    paginated, filtered, handleCopyCode, setDeleteTarget, navigate, getProjectCount,
    currentPage, totalPages, rowsPerPage, setRowsPerPage, setCurrentPage,
    handleResetFilters, activeFiltersCount,
  } = props;

  if (paginated.length === 0) {
    return <EmptyState onCreate={() => navigate('/lands/create')} hasFilters={activeFiltersCount > 0} onReset={handleResetFilters} variant="gallery" />;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        {paginated.map((l) => {
          const projCount = getProjectCount(l.id);
          const usage = usageTones[l.zone] || defaultUsageTone;
          const UsageIcon = usage.icon;
          const status = statusTones[l.status] || statusTones.archived;

          return (
            <div key={l.id}
              onClick={() => navigate(`/lands/${l.id}`)}
              className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden cursor-pointer transition-all hover:border-gray-200 hover:-translate-y-0.5"
              style={{ boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(15,23,42,0.06)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 2px rgba(15,23,42,0.04)'; }}>
              <div className={`relative aspect-[4/3] ${usage.soft} overflow-hidden`}>
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `linear-gradient(${usage.bg.replace('bg-', 'text-')} 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)`,
                  backgroundSize: '20px 20px',
                  color: 'currentColor',
                }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`h-20 w-20 rounded-2xl bg-white/80 ring-1 ${usage.ring} flex items-center justify-center backdrop-blur-sm`}>
                    <UsageIcon className={`h-9 w-9 ${usage.ink}`} />
                  </div>
                </div>
                <div className="absolute top-3 end-3">
                  <span className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur ${status.pill} ring-1 ${status.ring}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />{status.label}
                  </span>
                </div>
                <div className="absolute top-3 start-3">
                  <button onClick={(e) => handleCopyCode(l.land_code, e)}
                    className="font-mono text-xs font-bold text-gray-700 bg-white/90 backdrop-blur px-2 py-1 rounded hover:bg-white hover:text-blue-600 transition-colors"
                    dir="ltr">
                    {l.land_code}
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <div className="text-sm font-bold text-gray-900 leading-tight tracking-tight truncate">{l.land_name}</div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{l.municipality || '—'}</span>
                    {l.plot_number && <span className="text-gray-300 shrink-0">· {l.plot_number}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50/60 rounded-lg p-2.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">المساحة</div>
                    <div className="text-sm font-bold text-gray-900 ltr-only flex items-baseline gap-1" dir="ltr">
                      {formatThousand(l.area_sqm)}<span className="text-[11px] text-gray-400 font-normal">م²</span>
                    </div>
                  </div>
                  <div className={`${status.soft} rounded-lg p-2.5`}>
                    <div className={`text-[11px] font-bold uppercase tracking-wider ${status.ink} opacity-80 mb-1`}>القيمة</div>
                    <div className={`text-sm font-bold ${status.ink} ltr-only flex items-baseline gap-1`} dir="ltr">
                      {l.current_estimated_value ? formatQARInt(l.current_estimated_value) : '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                {projCount > 0 ? (
                  <button onClick={(e) => { e.stopPropagation(); navigate('/projects'); }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800">
                    <FolderKanban className="h-3.5 w-3.5" />
                    {projCount} مشروع
                  </button>
                ) : <span className="text-xs text-gray-300">لا مشاريع</span>}
                <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => navigate(`/lands/${l.id}`)} className="h-7 w-7 inline-flex items-center justify-center rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => navigate(`/lands/${l.id}/edit`)} className="h-7 w-7 inline-flex items-center justify-center rounded text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(l)} className="h-7 w-7 inline-flex items-center justify-center rounded text-gray-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 bg-white rounded-2xl border border-gray-100">
        <Pagination
          currentPage={currentPage} totalPages={totalPages} rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(v) => setRowsPerPage(v)}
          onPageChange={setCurrentPage} totalItems={filtered.length}
        />
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// MAP VIEW
// ────────────────────────────────────────────────────────────
function MapView(props: {
  mapLands: MapLand[]; statusCounts: Record<string, number>;
  navigate: any; currentPage: number; totalPages: number; rowsPerPage: number;
  setRowsPerPage: (v: number) => void; setCurrentPage: (p: number) => void;
  filtered: Land[]; handleCopyCode: (c: string, e?: React.MouseEvent) => void;
  setDeleteTarget: (l: Land) => void; getProjectCount: (id: string) => number;
  handleResetFilters: () => void; activeFiltersCount: number;
}) {
  const {
    mapLands, statusCounts, navigate, currentPage, totalPages, rowsPerPage,
    setRowsPerPage, setCurrentPage, filtered, getProjectCount, handleResetFilters, activeFiltersCount,
  } = props;

  if (mapLands.length === 0) {
    return <EmptyState onCreate={() => navigate('/lands/create')} hasFilters={activeFiltersCount > 0} onReset={handleResetFilters} variant="map" />;
  }

  const totalUnder = (statusCounts.under_construction || 0) + (statusCounts.under_study || 0) + (statusCounts.under_design || 0) + (statusCounts.under_approvals || 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr,1fr] gap-4">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden p-1">
        <div className="relative rounded-xl overflow-hidden">
          <LandMap lands={mapLands} height="640px" onMarkerClick={(land) => navigate(`/lands/${land.id}`)} />

          <div className="absolute top-4 end-4 z-[400] bg-white/95 backdrop-blur-md rounded-2xl border border-gray-100 p-4 w-[260px]"
            style={{ boxShadow: '0 4px 12px rgba(15,23,42,0.08)' }}>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                <MapIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-gray-900">التوزيع الجغرافي</div>
                <div className="text-xs text-gray-500">إجمالي {mapLands.length} موقع</div>
              </div>
            </div>
            <div className="space-y-2">
              {[
                { label: 'متاحة',      val: statusCounts.available || 0, color: 'bg-emerald-500' },
                { label: 'قيد التنفيذ', val: totalUnder,                  color: 'bg-amber-500' },
                { label: 'مكتملة',     val: statusCounts.developed || 0,  color: 'bg-blue-500' },
                { label: 'مباعة',      val: statusCounts.sold || 0,       color: 'bg-indigo-500' },
                { label: 'أرشيف',      val: statusCounts.archived || 0,   color: 'bg-gray-400' },
              ].map(row => (
                <div key={row.label} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 rounded-full ${row.color}`} />
                  <span className="flex-1 text-gray-700">{row.label}</span>
                  <span className="font-bold text-gray-900 tabular-nums ltr-only" dir="ltr">{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-[13px] font-bold text-gray-900">قائمة المواقع</div>
          <span className="text-xs text-gray-500">{filtered.length} نتيجة</span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50" style={{ maxHeight: '560px' }}>
          {filtered.map((l) => {
            const usage = usageTones[l.zone] || defaultUsageTone;
            const UsageIcon = usage.icon;
            const status = statusTones[l.status] || statusTones.archived;
            const projCount = getProjectCount(l.id);
            return (
              <div key={l.id} onClick={() => navigate(`/lands/${l.id}`)}
                className="group px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg ${status.soft} flex items-center justify-center shrink-0`}>
                  <UsageIcon className={`h-4 w-4 ${status.ink}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-bold text-gray-900 truncate">{l.land_name}</div>
                  <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                    <span dir="ltr" className="font-mono">{l.land_code}</span>
                    <span className="text-gray-300">·</span>
                    <span className="truncate">{l.municipality || '—'}</span>
                  </div>
                </div>
                <div className="text-end shrink-0">
                  <div className="text-xs font-bold text-gray-900 ltr-only" dir="ltr">{formatThousand(l.area_sqm)}</div>
                  <div className="text-xs text-gray-500">م²</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// PAGINATION
// ────────────────────────────────────────────────────────────
function Pagination({ currentPage, totalPages, rowsPerPage, onRowsPerPageChange, onPageChange, totalItems }: {
  currentPage: number; totalPages: number; rowsPerPage: number;
  onRowsPerPageChange: (v: number) => void; onPageChange: (p: number) => void;
  totalItems: number;
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const end = Math.min(currentPage * rowsPerPage, totalItems);
  return (
    <div className="px-5 py-3.5 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3 bg-gray-50/30">
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span>صفحة</span>
        <Select value={String(rowsPerPage)} onValueChange={v => onRowsPerPageChange(Number(v))}>
          <SelectTrigger className="h-8 w-[64px] text-xs border-gray-200 rounded-md bg-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="4">4</SelectItem>
            <SelectItem value="6">6</SelectItem>
            <SelectItem value="8">8</SelectItem>
            <SelectItem value="12">12</SelectItem>
            <SelectItem value="24">24</SelectItem>
          </SelectContent>
        </Select>
        <span className="hidden sm:inline">لكل صفحة</span>
      </div>
      <span className="text-xs text-gray-500 tabular-nums">
        <span className="font-bold text-gray-900 ltr-only" dir="ltr">{start}–{end}</span>
        <span> من </span>
        <span className="font-bold text-gray-900 ltr-only" dir="ltr">{totalItems}</span>
      </span>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
          className="h-8 px-2.5 text-xs border-gray-200 rounded-md text-gray-600 hover:bg-white disabled:opacity-40 gap-1">
          <ChevronRight className="h-3.5 w-3.5" />السابق
        </Button>
        <div className="hidden sm:flex items-center gap-0.5">
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(page => (
            <button key={page} onClick={() => onPageChange(page)}
              className={`h-8 min-w-[30px] px-1.5 rounded-md text-xs font-bold flex items-center justify-center transition-colors ${
                currentPage === page ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-white'
              }`}>
              {page}
            </button>
          ))}
          {totalPages > 7 && <span className="text-gray-400 px-1">…</span>}
        </div>
        <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
          className="h-8 px-2.5 text-xs border-gray-200 rounded-md text-gray-600 hover:bg-white disabled:opacity-40 gap-1">
          التالي<ChevronLeft className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// EMPTY STATE
// ────────────────────────────────────────────────────────────
function EmptyState({ onCreate, hasFilters, onReset, variant = 'dossier' }: { onCreate: () => void; hasFilters: boolean; onReset: () => void; variant?: 'dossier' | 'gallery' | 'map' }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100">
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="relative mb-5">
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="8" y="8" width="80" height="80" rx="16" fill="url(#empty-gradient)" />
            <path d="M8 24h80M8 48h80M8 72h80M24 8v80M48 8v80M72 8v80" stroke="white" strokeWidth="0.5" opacity="0.4" />
            <circle cx="32" cy="32" r="3" fill="#10b981" />
            <circle cx="60" cy="48" r="3" fill="#3b82f6" />
            <circle cx="40" cy="64" r="3" fill="#f59e0b" />
            <path d="M32 32L60 48L40 64" stroke="#3b82f6" strokeWidth="1" opacity="0.4" strokeDasharray="2 2" />
            <defs>
              <linearGradient id="empty-gradient" x1="8" y1="8" x2="88" y2="88" gradientUnits="userSpaceOnUse">
                <stop stopColor="#eff6ff" />
                <stop offset="0.5" stopColor="#f0f9ff" />
                <stop offset="1" stopColor="#ecfdf5" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute -bottom-1 -end-1 h-7 w-7 rounded-full bg-white shadow-md ring-1 ring-gray-100 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
          </div>
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">
          {hasFilters ? 'لا توجد نتائج مطابقة' : 'لا توجد أراضي بعد'}
        </h3>
        <p className="text-[13px] text-gray-500 max-w-sm mb-5">
          {hasFilters
            ? 'جرّب توسيع نطاق البحث، أو إعادة تعيين الفلاتر لعرض جميع الأراضي.'
            : 'ابدأ بإضافة أول أرض لبنك الأراضي الخاص بك. ستظهر هنا جميع الممتلكات الاستثمارية.'}
        </p>
        <div className="flex items-center gap-2">
          {hasFilters ? (
            <>
              <Button variant="outline" size="sm" onClick={onReset} className="gap-1.5 rounded-xl border-gray-200 h-10">
                <RotateCcw className="h-4 w-4" />إعادة تعيين الفلاتر
              </Button>
              <Button onClick={onCreate} className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10">
                <Plus className="h-4 w-4" />أضف أرضاً جديدة
              </Button>
            </>
          ) : (
            <Button onClick={onCreate} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm h-10">
              <Plus className="h-4 w-4" />أضف أول أرض
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
