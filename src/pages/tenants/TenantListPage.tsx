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
import { Search, Filter, Eye, Pencil, Trash2, Plus, Users, X, UserPlus, Phone, Calendar } from 'lucide-react';
import { tenantStore, leaseStore } from '@/services/stores';
import { KpiCard } from '@/components/shared/DesignSystem';

export default function TenantListPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const tenants = useMemo(() => {
    const data = tenantStore.getAll();
    const timer = setTimeout(() => setLoading(false), 300);
    return data;
  }, [refresh]);

  const filtered = tenants.filter((t: any) => {
    if (typeFilter !== 'all' && t.tenant_type !== typeFilter) return false;
    if (search && !t.full_name.includes(search) && !t.tenant_code.includes(search)) return false;
    return true;
  });

  // KPI computations
  const leases = useMemo(() => leaseStore.getAll(), [refresh]);
  const activeLeases = leases.filter((l: any) => l.status === 'active').length;
  const individualTenants = tenants.filter((t: any) => t.tenant_type === 'individual').length;
  const companyTenants = tenants.filter((t: any) => t.tenant_type === 'company').length;

  const handleDelete = () => {
    if (!deleteTarget) return;
    tenantStore.remove(deleteTarget.id);
    toast.success(`تم حذف ${deleteTarget.full_name} بنجاح`);
    setDeleteTarget(null);
    setRefresh(r => r + 1);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ الكود');
    });
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title={t.tenants.title} value={tenants.length} subtitle={`${filtered.length} مستأجر`} icon={Users} moduleOverride="leasing" />
        <KpiCard title="عقود نشطة" value={activeLeases} subtitle="عقود إيجار سارية" icon={Calendar} moduleOverride="leasing" />
        <KpiCard title="أفراد" value={individualTenants} subtitle="مستأجرين أفراد" icon={UserPlus} moduleOverride="leasing" />
        <KpiCard title="شركات" value={companyTenants} subtitle="مستأجرين شركات" icon={Phone} moduleOverride="leasing" />
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.tenants.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'مستأجر' : 'مستأجر'} — {t.tenants.list}
          </p>
        </div>
        <Button
          onClick={() => navigate('/tenants/create')}
          className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          {t.tenants.create}
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="النوع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأنواع</SelectItem>
              <SelectItem value="individual">فرد</SelectItem>
              <SelectItem value="company">شركة</SelectItem>
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
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.tenants.code}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.tenants.name}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.tenants.type}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.tenants.nationalId}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.tenants.phone}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.tenants.email}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.tenants.contracts}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">{t.tenants.status}</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[80px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <Users className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا يوجد مستأجرون</p>
                        <p className="text-xs text-gray-400">لم يتم العثور على أي نتائج</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSearch(''); setTypeFilter('all'); }}
                          className="h-8 text-xs rounded-lg mt-1"
                        >
                          مسح الفلاتر
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((tn: any) => (
                  <TableRow
                    key={tn.id}
                    className=" cursor-pointer"
                    onClick={() => navigate(`/tenants/${tn.id}`)}
                  >
                    <TableCell className="font-medium text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(tn.tenant_code); }}
                            className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {tn.tenant_code}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>اضغط للنسخ</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-800">{tn.full_name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{(t.tenants.types as any)[tn.tenant_type]}</TableCell>
                    <TableCell className="text-sm text-gray-600" dir="ltr">{tn.national_id || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-600" dir="ltr">{tn.phone}</TableCell>
                    <TableCell className="text-sm text-gray-600" dir="ltr">{tn.email}</TableCell>
                    <TableCell className="text-sm text-gray-600">{tn.active_contracts ?? 0}</TableCell>
                    <TableCell><StatusBadge status={tn.status} label={tn.status === 'active' ? 'نشط' : 'غير نشط'} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => navigate(`/tenants/${tn.id}`)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50" onClick={() => navigate(`/tenants/${tn.id}/edit`)}>
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
                              onClick={() => setDeleteTarget(tn)}
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
              <span className="text-xs text-gray-500">عرض {filtered.length} من {tenants.length} مستأجر</span>
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
              هل أنت متأكد من حذف المستأجر <strong>{deleteTarget?.full_name}</strong> ({deleteTarget?.tenant_code})؟ لا يمكن التراجع عن هذا الإجراء.
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
