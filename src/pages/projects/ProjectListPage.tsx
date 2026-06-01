import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Filter, Eye, Pencil, Trash2, Plus, Building2, X } from 'lucide-react';
import { projectStore, getLandName } from '@/services/stores';

export default function ProjectListPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const projects = useMemo(() => {
    const data = projectStore.getAll();
    const timer = setTimeout(() => setLoading(false), 300);
    return data;
  }, [refresh]);

  const filtered = projects.filter((p: any) => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search && !p.project_name.includes(search) && !p.project_code.includes(search)) return false;
    return true;
  });

  const fmt = (v: number) => formatQAR(v);

  const handleDelete = () => {
    if (!deleteTarget) return;
    projectStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.project_name} بنجاح`);
    setDeleteTarget(null);
    setRefresh(r => r + 1);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ الكود');
    });
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.projects.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'مشروع' : 'مشروع'} — {t.projects.list}
          </p>
        </div>
        <Button
          onClick={() => navigate('/projects/create')}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          {t.projects.create}
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
            <Input
              placeholder={t.common.search + '...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 h-9 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute left-3 top-2.5 h-4 w-4 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder={t.common.status} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="construction">تحت الإنشاء</SelectItem>
              <SelectItem value="testing">اختبار وتسليم</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
            </SelectContent>
          </Select>
          {search && (
            <span className="text-xs text-gray-400">
              {filtered.length} نتيجة
            </span>
          )}
        </div>
      </div>

      {/* Table Card */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow >
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.projects.code}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.projects.name}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.projects.relatedLand}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.projects.type}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.projects.completion}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.projects.budget}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.projects.actualCost}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.common.status}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[80px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <Building2 className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا توجد مشاريع</p>
                        <p className="text-xs text-gray-400">لم يتم العثور على أي نتائج</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSearch(''); setStatusFilter('all'); }}
                          className="h-8 text-xs rounded-lg mt-1"
                        >
                          مسح الفلاتر
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((p: any) => (
                  <TableRow
                    key={p.id}
                    className=" cursor-pointer"
                    onClick={() => navigate(`/projects/${p.id}`)}
                  >
                    <TableCell className="font-medium text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(p.project_code); }}
                            className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {p.project_code}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>اضغط للنسخ</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-800">{p.project_name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{getLandName(p.land_id)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{(t.projects.types as any)[p.project_type] || p.project_type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5"><div className="bg-[#3B82F6] h-1.5 rounded-full" style={{ width: `${p.completion_percentage}%` }} /></div>
                        <span className="text-xs text-gray-500">{p.completion_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{fmt(p.approved_budget)}</TableCell>
                    <TableCell className={`text-sm ${p.actual_cost > p.approved_budget ? 'text-red-600' : 'text-gray-600'}`}>{fmt(p.actual_cost)}</TableCell>
                    <TableCell><StatusBadge status={p.status} label={(t.projects.statuses as any)[p.status]} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/projects/${p.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => navigate(`/projects/${p.id}/edit`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>تعديل</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(p)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>حذف</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 0 && (
            <div className="py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <span className="text-xs text-gray-500">عرض {filtered.length} من {projects.length} مشروع</span>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المشروع <strong>{deleteTarget?.project_name}</strong> ({deleteTarget?.project_code})؟ لا يمكن التراجع عن هذا الإجراء.
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
