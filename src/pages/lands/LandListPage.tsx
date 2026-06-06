import { formatQAR, formatQARInt, formatThousand } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { LandMap, generateDemoCoordinates, type MapLand } from '@/components/maps/LandMap';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, X, Plus, Map, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
  Layers, Home, Building2, TreePine, Briefcase, Hammer, CheckCircle2, Archive,
  CircleDollarSign, TrendingUp, BarChart3, RotateCcw, Download,
  Truck, FileText, ArrowUpDown, ArrowUp, ArrowDown, FolderKanban,
  DollarSign,
} from 'lucide-react';
import { landStore, projectStore } from '@/services/stores';
import { exportToCSV } from '@/utils/exportUtils';
import { KpiCard } from '@/components/shared/DesignSystem';
import type { Land, LandStatus } from '@/types';

const usageTypeConfig: Record<string, { label: string; classes: string; icon: any }> = {
  'سكني':      { label: 'سكني',      classes: 'bg-blue-50 text-blue-700 border-blue-200',     icon: Home },
  'تجاري':     { label: 'تجاري',     classes: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Building2 },
  'مختلط':     { label: 'مختلط',     classes: 'bg-violet-50 text-violet-700 border-violet-200', icon: Layers },
  'استثماري':  { label: 'استثماري',  classes: 'bg-orange-50 text-orange-700 border-orange-200', icon: Briefcase },
  'زراعي':     { label: 'زراعي',     classes: 'bg-green-50 text-green-700 border-green-200', icon: TreePine },
  'صناعي':     { label: 'صناعي',     classes: 'bg-slate-50 text-slate-700 border-slate-200', icon: Truck },
};
const defaultUsageConfig = { label: 'أخرى', classes: 'bg-gray-50 text-gray-600 border-gray-200', icon: FileText };

function UsageBadge({ zone }: { zone: string }) {
  const cfg = usageTypeConfig[zone] || { ...defaultUsageConfig, label: zone };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${cfg.classes}`}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
}

const statusConfig: Record<LandStatus, { label: string; classes: string; icon: any }> = {
  available:          { label: 'متاحة',         classes: 'bg-emerald-500 text-white',                icon: CheckCircle2 },
  under_study:        { label: 'تحت الدراسة',   classes: 'bg-blue-500 text-white',                   icon: FileText },
  under_design:       { label: 'تحت التصميم',   classes: 'bg-cyan-500 text-white',                   icon: FileText },
  under_approvals:    { label: 'تحت الترخيص',   classes: 'bg-amber-500 text-white',                  icon: FileText },
  under_construction: { label: 'قيد التطوير',   classes: 'bg-orange-500 text-white',                 icon: Hammer },
  developed:          { label: 'مطوّرة',         classes: 'bg-teal-500 text-white',                   icon: CheckCircle2 },
  sold:               { label: 'مباعة',          classes: 'bg-indigo-500 text-white',                 icon: CircleDollarSign },
  archived:           { label: 'غير نشطة',       classes: 'bg-gray-400 text-white',                   icon: Archive },
};

function StatusBadge({ status }: { status: LandStatus }) {
  const cfg = statusConfig[status] || { label: status, classes: 'bg-gray-400 text-white', icon: Archive };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold ${cfg.classes}`}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  );
}

type SortField = 'land_code' | 'land_name' | 'municipality' | 'area_sqm' | 'zone' | 'status' | 'acquisition_date' | 'estimated_value';
type SortDir = 'asc' | 'desc';

export default function LandListPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Land | null>(null);
  const [showMap, setShowMap] = useState(false);

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUsage, setFilterUsage] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('land_code');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

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
    const developedCount = lands.filter(l => l.status === 'developed' || l.status === 'under_construction').length;
    return { totalArea, totalCount, availableCount, underDevCount, totalCost, totalValue, developedCount };
  }, [lands]);

  const allUsageTypes = useMemo(() => {
    const set = new Set<string>(); lands.forEach(l => { if (l.zone) set.add(l.zone); }); return Array.from(set);
  }, [lands]);
  const allLocations = useMemo(() => {
    const set = new Set<string>(); lands.forEach(l => { if (l.municipality) set.add(l.municipality); }); return Array.from(set);
  }, [lands]);

  // Related projects count per land
  const getProjectCount = (landId: string) => projects.filter((p: any) => p.land_id === landId).length;

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
  }, [lands, search, filterStatus, filterUsage, filterLocation, sortField, sortDir]);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 inline ml-1 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 inline ml-1 text-blue-500" /> : <ArrowDown className="h-3 w-3 inline ml-1 text-blue-500" />;
  };

  const handleCopyCode = (code: string) => { navigator.clipboard.writeText(code).then(() => toast.success('تم نسخ الكود')); };

  const handleDelete = () => {
    if (!deleteTarget) return;
    landStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.land_name} بنجاح`);
    setDeleteTarget(null); setRefresh(r => r + 1);
  };

  function handleResetFilters() {
    setSearch(''); setFilterStatus('all'); setFilterUsage('all'); setFilterLocation('all'); setCurrentPage(1);
  }

  function handleExport() {
    const data = filtered.map((l) => ({
      'كود الأرض': l.land_code, 'اسم الأرض': l.land_name, 'رقم القطعة': l.plot_number || '',
      'البلدية': l.municipality || '', 'المنطقة': l.zone || '', 'المساحة (م²)': l.area_sqm,
      'تكلفة الشراء': l.total_acquisition_cost || 0, 'القيمة المقدرة': l.current_estimated_value || 0,
      'المشاريع': getProjectCount(l.id), 'الحالة': statusConfig[l.status]?.label || l.status,
    }));
    exportToCSV(data, [
      { key: 'كود الأرض', label: 'كود الأرض' }, { key: 'اسم الأرض', label: 'اسم الأرض' },
      { key: 'رقم القطعة', label: 'رقم القطعة' }, { key: 'البلدية', label: 'البلدية' },
      { key: 'المنطقة', label: 'المنطقة' }, { key: 'المساحة (م²)', label: 'المساحة (م²)' },
      { key: 'تكلفة الشراء', label: 'تكلفة الشراء' }, { key: 'القيمة المقدرة', label: 'القيمة المقدرة' },
      { key: 'المشاريع', label: 'المشاريع' }, { key: 'الحالة', label: 'الحالة' },
    ], 'الأراضي.csv');
  }

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* ── PAGE HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.lands.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة بنك الأراضي — {kpis.totalCount} أرض مسجلة</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMap(!showMap)}
            className={`gap-2 h-9 rounded-lg text-sm border-gray-200 ${showMap ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-600'}`}>
            <Map className="h-4 w-4" />{showMap ? 'إخفاء الخريطة' : 'الخريطة'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filtered.length === 0}
            className="gap-2 h-9 rounded-lg text-sm border-gray-200 text-gray-600">
            <Download className="h-4 w-4" />تصدير
          </Button>
          <Button onClick={() => navigate('/lands/create')}
            className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20">
            <Plus className="h-4 w-4" />{t.lands.create}
          </Button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button onClick={() => { setFilterStatus('all'); setCurrentPage(1); }} className="text-left w-full">
          <KpiCard title="إجمالي الأراضي" value={kpis.totalCount} subtitle={`${formatThousand(kpis.totalArea)} م²`} icon={Layers} moduleOverride="construction" />
        </button>
        <button onClick={() => { setFilterStatus('available'); setCurrentPage(1); }} className="text-left w-full">
          <KpiCard title="متاحة للتطوير" value={kpis.availableCount} subtitle="أراضي جاهزة" icon={CheckCircle2} moduleOverride="construction" />
        </button>
        <button onClick={() => { setFilterStatus('under_construction'); setCurrentPage(1); }} className="text-left w-full">
          <KpiCard title="قيد التطوير" value={kpis.developedCount} subtitle={`${kpis.underDevCount} تحت الإجراء`} icon={Hammer} moduleOverride="construction" />
        </button>
        <KpiCard title="القيمة التقديرية" value={formatQARInt(kpis.totalValue)} subtitle={`التكلفة: ${formatQARInt(kpis.totalCost)}`} icon={DollarSign} moduleOverride="construction" />
      </div>

      {/* ── MAP VIEW ── */}
      {showMap && (
        <div className="mb-4">
          <LandMap lands={mapLands} height="350px" onMarkerClick={(land) => navigate(`/lands/${land.id}`)} />
        </div>
      )}

      {/* ── FILTER SECTION ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input placeholder="البحث بكود الأرض أو الاسم..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="pr-10 h-9 text-sm rounded-lg border-gray-200 bg-gray-50 focus:bg-white" />
          {search && <button onClick={() => setSearch('')} className="absolute left-3 top-2.5 text-gray-300 hover:text-gray-500"><X className="h-4 w-4" /></button>}
        </div>
        <Select value={filterLocation} onValueChange={v => { setFilterLocation(v); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-[150px] text-xs border-gray-200 rounded-lg bg-gray-50"><SelectValue placeholder="جميع المواقع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المواقع</SelectItem>
            {allLocations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterUsage} onValueChange={v => { setFilterUsage(v); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-[150px] text-xs border-gray-200 rounded-lg bg-gray-50"><SelectValue placeholder="جميع الاستخدامات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الاستخدامات</SelectItem>
            {allUsageTypes.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-[150px] text-xs border-gray-200 rounded-lg bg-gray-50"><SelectValue placeholder="جميع الحالات" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={handleResetFilters}
          className="h-9 border-gray-200 text-gray-500 hover:text-gray-800 rounded-lg gap-1.5 text-xs">
          <RotateCcw className="h-3.5 w-3.5" />إعادة تعيين
        </Button>
      </div>

      {/* ── DATA TABLE ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('land_code')}>رقم الأرض<SortIcon field="land_code" /></TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('land_name')}>اسم الموقع<SortIcon field="land_name" /></TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('municipality')}>الموقع<SortIcon field="municipality" /></TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('area_sqm')}>المساحة (م²)<SortIcon field="area_sqm" /></TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('zone')}>نوع الاستخدام<SortIcon field="zone" /></TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('status')}>الحالة<SortIcon field="status" /></TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المشاريع</TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9 cursor-pointer select-none" onClick={() => handleSort('estimated_value')}>القيمة التقديرية<SortIcon field="estimated_value" /></TableHead>
              <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[120px]">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                      <Map className="h-5 w-5 text-gray-300" />
                    </div>
                    <p className="text-sm font-semibold text-gray-400">لا توجد أراضي</p>
                    <p className="text-xs text-gray-300">لا توجد نتائج تطابق معايير البحث</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {paginated.map((l) => {
              const projCount = getProjectCount(l.id);
              return (
                <TableRow key={l.id}>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button onClick={(e) => { e.stopPropagation(); handleCopyCode(l.land_code); }}
                          className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs font-semibold transition-colors" dir="ltr">{l.land_code}</button>
                      </TooltipTrigger>
                      <TooltipContent>اضغط للنسخ</TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell><span className="text-[13px] font-medium text-[#1E293B]">{l.land_name}</span></TableCell>
                  <TableCell><span className="text-[12px] text-gray-600 flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-gray-300" />{l.municipality}</span></TableCell>
                  <TableCell><span className="text-[12px] text-gray-700 font-medium" dir="ltr">{formatThousand(l.area_sqm)}</span></TableCell>
                  <TableCell><UsageBadge zone={l.zone} /></TableCell>
                  <TableCell><StatusBadge status={l.status} /></TableCell>
                  <TableCell>
                    {projCount > 0 ? (
                      <button onClick={() => navigate(`/projects`)} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                        <FolderKanban className="h-3 w-3" />{projCount} مشروع
                      </button>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[12px] font-semibold text-[#1E293B] flex items-center gap-1" dir="ltr">
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                        {l.current_estimated_value ? formatQAR(l.current_estimated_value) : '—'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-0.5">
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/lands/${l.id}`)}><Eye className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>عرض</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => navigate(`/lands/${l.id}/edit`)}><Pencil className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget(l)}><Trash2 className="h-3.5 w-3.5" /></Button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* ── PAGINATION ── */}
        <div className="px-4 py-3 border-t border-gray-100 bg-[#FAFBFC] flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Select value={String(rowsPerPage)} onValueChange={v => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200 rounded-lg"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6</SelectItem><SelectItem value="10">10</SelectItem><SelectItem value="20">20</SelectItem><SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-gray-500">لكل صفحة</span>
          </div>
          <span className="text-xs text-gray-500">
            عرض <span className="font-bold text-[#1E293B]">{filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</span> - <span className="font-bold text-[#1E293B]">{Math.min(currentPage * rowsPerPage, filtered.length)}</span> من <span className="font-bold text-[#1E293B]">{filtered.length}</span> أرض
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
              className="h-8 px-2 text-xs border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40 gap-1">
              <ChevronRight className="h-3.5 w-3.5" />السابق
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`h-8 min-w-[32px] px-2 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${currentPage === page ? 'bg-[#3B82F6] text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>{page}</button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
              className="h-8 px-2 text-xs border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40 gap-1">
              التالي<ChevronLeft className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الأرض <strong>{deleteTarget?.land_name}</strong> ({deleteTarget?.land_code})؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
