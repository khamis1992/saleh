import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Filter, Eye, Pencil, Trash2, Plus, BookOpen, X, TrendingUp, TrendingDown, CreditCard, Wallet, FileText } from 'lucide-react';
import { chartOfAccountsStore, journalEntryStore } from '@/services/stores';
import { KpiCard } from '@/components/shared/DesignSystem';
import { Account } from '@/types';

export default function FinanceAccountsPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>(() => chartOfAccountsStore.getAll());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    account_code: '',
    account_name_ar: '',
    account_name_en: '',
    account_type: 'asset' as Account['account_type'],
    parent_account_id: '',
    level: 1,
  });

  const typeLabels: Record<string, string> = { asset: 'أصول', liability: 'خصوم', equity: 'حقوق ملكية', revenue: 'إيرادات', expense: 'مصروفات' };

  useState(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  });

  const refresh = () => setAccounts(chartOfAccountsStore.getAll());

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (typeFilter !== 'all' && a.account_type !== typeFilter) return false;
      if (search && !a.account_name_ar.includes(search) && !a.account_code.includes(search)) return false;
      return true;
    });
  }, [accounts, search, typeFilter]);

  // KPI computations
  const assetAccounts = accounts.filter((a) => a.account_type === 'asset').length;
  const liabilityAccounts = accounts.filter((a) => a.account_type === 'liability').length;
  const revenueAccounts = accounts.filter((a) => a.account_type === 'revenue').length;
  const expenseAccounts = accounts.filter((a) => a.account_type === 'expense').length;

  const handleDelete = () => {
    if (!deleteTarget) return;
    chartOfAccountsStore.remove(deleteTarget.id);
    refresh();
    toast.success(`تم حذف الحساب ${deleteTarget.account_name_ar} بنجاح`);
    setDeleteTarget(null);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ كود الحساب');
    });
  };

  const handleCreate = () => {
    if (!createForm.account_code || !createForm.account_name_ar) {
      toast.error('يرجى إدخال كود الحساب واسم الحساب');
      return;
    }
    chartOfAccountsStore.create({
      company_id: '',
      account_code: createForm.account_code,
      account_name_ar: createForm.account_name_ar,
      account_name_en: createForm.account_name_en,
      account_type: createForm.account_type,
      parent_account_id: createForm.parent_account_id,
      level: createForm.level,
      is_postable: true,
      status: 'active',
    });
    refresh();
    toast.success('تم إضافة الحساب بنجاح');
    setShowCreateModal(false);
    setCreateForm({ account_code: '', account_name_ar: '', account_name_en: '', account_type: 'asset', parent_account_id: '', level: 1 });
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="دليل الحسابات" value={accounts.length} subtitle={`${filtered.length} حساب`} icon={BookOpen} moduleOverride="finance" />
        <KpiCard title="الأصول" value={assetAccounts} subtitle="حسابات الأصول" icon={TrendingUp} moduleOverride="finance" />
        <KpiCard title="الالتزامات" value={liabilityAccounts} subtitle="حسابات الخصوم" icon={CreditCard} moduleOverride="finance" />
        <KpiCard title="الإيرادات والمصروفات" value={`${revenueAccounts} / ${expenseAccounts}`} subtitle="دخل / مصروف" icon={Wallet} moduleOverride="finance" />
      </div>


      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t.finance.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} حساب — {t.finance.chartOfAccounts}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20"
        >
          <Plus className="h-4 w-4" />
          إضافة حساب
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
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
              <SelectItem value="asset">أصول</SelectItem>
              <SelectItem value="liability">خصوم</SelectItem>
              <SelectItem value="equity">حقوق ملكية</SelectItem>
              <SelectItem value="revenue">إيرادات</SelectItem>
              <SelectItem value="expense">مصروفات</SelectItem>
            </SelectContent>
          </Select>
          {(search || typeFilter !== 'all') && (
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
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">كود الحساب</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">اسم الحساب</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">النوع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المستوى</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الحالة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[100px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <BookOpen className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا توجد حسابات</p>
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
                {filtered.map((a) => (
                  <TableRow
                    key={a.id}
                    className=""
                  >
                    <TableCell className="font-medium text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(a.account_code); }}
                            className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {a.account_code}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>اضغط للنسخ</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-gray-800">{a.account_name_ar}</TableCell>
                    <TableCell><StatusBadge status={a.account_type} label={typeLabels[a.account_type] || a.account_type} /></TableCell>
                    <TableCell className="text-sm text-gray-600">{a.level}</TableCell>
                    <TableCell><StatusBadge status={a.status} label={a.status === 'active' ? 'نشط' : 'غير نشط'} /></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>تعديل</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-indigo-600 hover:bg-indigo-50 font-semibold gap-1" onClick={() => navigate(`/finance/journal-entries?accountId=${a.id}`)}>
                              <FileText className="h-3 w-3" />قيود
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض قيود الحساب</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(a)}
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
              <span className="text-xs text-gray-500">عرض {filtered.length} من {accounts.length} حساب</span>
            </div>
          )}
        </div>
      )}

      {/* Create Account Dialog */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة حساب جديد</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>كود الحساب *</Label>
              <Input
                value={createForm.account_code}
                onChange={(e) => setCreateForm({ ...createForm, account_code: e.target.value })}
                placeholder="مثال: 1300"
              />
            </div>
            <div>
              <Label>اسم الحساب (عربي) *</Label>
              <Input
                value={createForm.account_name_ar}
                onChange={(e) => setCreateForm({ ...createForm, account_name_ar: e.target.value })}
                placeholder="اسم الحساب بالعربية"
              />
            </div>
            <div>
              <Label>اسم الحساب (إنجليزي)</Label>
              <Input
                value={createForm.account_name_en}
                onChange={(e) => setCreateForm({ ...createForm, account_name_en: e.target.value })}
                placeholder="Account name in English"
              />
            </div>
            <div>
              <Label>النوع</Label>
              <Select value={createForm.account_type} onValueChange={(v) => setCreateForm({ ...createForm, account_type: v as Account['account_type'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asset">أصول</SelectItem>
                  <SelectItem value="liability">خصوم</SelectItem>
                  <SelectItem value="equity">حقوق ملكية</SelectItem>
                  <SelectItem value="revenue">إيرادات</SelectItem>
                  <SelectItem value="expense">مصروفات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>المستوى</Label>
              <Input
                type="number"
                value={createForm.level}
                onChange={(e) => setCreateForm({ ...createForm, level: Number(e.target.value) })}
                min={1}
                max={5}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>{t.common.cancel}</Button>
            <Button onClick={handleCreate} className="bg-[#3B82F6] hover:bg-blue-600">{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف الحساب <strong>{deleteTarget?.account_name_ar}</strong> ({deleteTarget?.account_code})؟ لا يمكن التراجع عن هذا الإجراء.
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
