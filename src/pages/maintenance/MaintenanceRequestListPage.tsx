import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
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
import { Search, Filter, Eye, Trash2, X, Wrench } from 'lucide-react';
import { maintenanceStore, unitStore, tenantStore } from '@/services/stores';
import { MaintenanceRequest } from '@/types';

export default function MaintenanceRequestListPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MaintenanceRequest[]>(() => maintenanceStore.getAll());
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<MaintenanceRequest | null>(null);

  useState(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  });

  const refresh = () => setRequests(maintenanceStore.getAll());

  const getUnitNumber = (unitId: string) => unitStore.getById(unitId)?.unit_number || '—';
  const getTenantName = (tenantId: string) => {
    const t = tenantStore.getById(tenantId);
    return t?.full_name || t?.company_name || '—';
  };

  const filtered = useMemo(() => {
    return requests.filter((m) => {
      if (priorityFilter !== 'all' && m.priority !== priorityFilter) return false;
      if (search && !m.description.includes(search) && !m.request_number.includes(search)) return false;
      return true;
    });
  }, [requests, search, priorityFilter]);

  const handleDelete = () => {
    if (!deleteTarget) return;
    maintenanceStore.remove(deleteTarget.id);
    refresh();
    toast.success(`تم حذف طلب الصيانة ${deleteTarget.request_number} بنجاح`);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.maintenance.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} طلب — {t.maintenance.requests}
          </p>
        </div>
        <Button
          onClick={() => navigate('/maintenance/requests/create')}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          + طلب صيانة جديد
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
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder={t.maintenance.priority} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأولويات</SelectItem>
              <SelectItem value="emergency">طارئة</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="low">منخفضة</SelectItem>
            </SelectContent>
          </Select>
          {search && (
            <span className="text-xs text-gray-400">{filtered.length} نتيجة</span>
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
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.maintenance.requestNumber}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.units.number}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.tenant}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.maintenance.category}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.maintenance.priority}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.maintenance.description}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.common.status}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[60px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <Wrench className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا توجد طلبات صيانة</p>
                        <p className="text-xs text-gray-400">لم يتم العثور على أي نتائج</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSearch(''); setPriorityFilter('all'); }}
                          className="h-8 text-xs rounded-lg mt-1"
                        >
                          مسح الفلاتر
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((m) => (
                  <TableRow key={m.id} className="">
                    <TableCell className="font-medium text-sm">{m.request_number}</TableCell>
                    <TableCell className="text-sm">{getUnitNumber(m.unit_id)}</TableCell>
                    <TableCell className="text-sm">{getTenantName(m.tenant_id)}</TableCell>
                    <TableCell className="text-sm">{(t.maintenance.categories as any)[m.category] || m.category}</TableCell>
                    <TableCell><StatusBadge status={m.priority} label={(t.maintenance.priorities as any)[m.priority] || m.priority} /></TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{m.description}</TableCell>
                    <TableCell><StatusBadge status={m.status} label={(t.maintenance.statuses as any)[m.status] || m.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/maintenance/requests/${m.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(m)}
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
              <span className="text-xs text-gray-500">عرض {filtered.length} من {requests.length} طلب</span>
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
              هل أنت متأكد من حذف طلب الصيانة <strong>{deleteTarget?.request_number}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
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
