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
import { Search, Filter, Eye, Pencil, Trash2, Plus, Play, FileText, X } from 'lucide-react';
import { leaseStore, unitStore, propertyStore } from '@/services/stores';
import { activateLeaseContract } from '@/utils/exportUtils';

export default function LeaseListPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const leases = useMemo(() => {
    const data = leaseStore.getAll();
    const timer = setTimeout(() => setLoading(false), 300);
    return data;
  }, [refresh]);

  const units = useMemo(() => unitStore.getAll(), [refresh]);
  const properties = useMemo(() => propertyStore.getAll(), [refresh]);

  const getUnitNumber = (unitId: string) => {
    const u = units.find((un: any) => un.id === unitId);
    return u ? u.unit_number : unitId;
  };
  const getPropertyName = (propertyId: string) => {
    const p = properties.find((prop: any) => prop.id === propertyId);
    return p ? p.property_name : propertyId;
  };
  const getTenantName = (lease: any) => {
    return lease.tenant_name || lease.tenant_id || '';
  };

  const filtered = leases.filter((l: any) => {
    if (statusFilter !== 'all' && l.status !== statusFilter) return false;
    if (search && !getTenantName(l).includes(search) && !l.contract_number.includes(search)) return false;
    return true;
  });

  const fmt = (v: number) => formatQAR(v);

  const handleDelete = () => {
    if (!deleteTarget) return;
    leaseStore.remove(deleteTarget.id);
    toast.success(`تم حذف العقد ${deleteTarget.contract_number} بنجاح`);
    setDeleteTarget(null);
    setRefresh(r => r + 1);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ رقم العقد');
    });
  };

  function handleActivate(lease: any) {
    const result = activateLeaseContract(lease.unit_id || lease.unit_number, lease.id);
    if (result) {
      toast.success('تم تفعيل العقد بنجاح - تم تغيير حالة الوحدة إلى مؤجرة وإنشاء جدول الدفعات');
      setRefresh(r => r + 1);
    } else {
      toast.error('فشل تفعيل العقد');
    }
  }

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.leases.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'عقد' : 'عقد'} — {t.leases.list}
          </p>
        </div>
        <Button
          onClick={() => navigate('/leases/create')}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          {t.leases.create}
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
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="expiring_soon">قارب على الانتهاء</SelectItem>
              <SelectItem value="terminated">منتهي</SelectItem>
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
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.contractNumber}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.tenant}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.unit}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">العقار</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.startDate}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.endDate}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.rentAmount}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.paymentFrequency}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.leases.status}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[80px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <FileText className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا توجد عقود</p>
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
                {filtered.map((l: any) => (
                  <TableRow
                    key={l.id}
                    className=" cursor-pointer"
                    onClick={() => navigate(`/leases/${l.id}`)}
                  >
                    <TableCell className="font-medium text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(l.contract_number); }}
                            className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {l.contract_number}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>اضغط للنسخ</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-800">{getTenantName(l)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{getUnitNumber(l.unit_id)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{getPropertyName(l.property_id)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{l.start_date}</TableCell>
                    <TableCell className="text-sm text-gray-600">{l.end_date}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-700">{fmt(l.rent_amount)}</TableCell>
                    <TableCell className="text-sm text-gray-600">{(t.leases.frequencies as any)[l.payment_frequency]}</TableCell>
                    <TableCell><StatusBadge status={l.status} label={(t.leases.statuses as any)[l.status]} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/leases/${l.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => navigate(`/leases/${l.id}/edit`)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>تعديل</TooltipContent>
                        </Tooltip>
                        {l.status === 'draft' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50" onClick={() => handleActivate(l)}>
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>تفعيل العقد</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(l)}
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
              <span className="text-xs text-gray-500">عرض {filtered.length} من {leases.length} عقد</span>
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
              هل أنت متأكد من حذف العقد <strong>{deleteTarget?.contract_number}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
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
