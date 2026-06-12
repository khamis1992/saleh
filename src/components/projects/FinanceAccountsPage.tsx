import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Search, Filter, Eye, Pencil, Trash2, Plus, BookOpen, X, TrendingUp, TrendingDown,
  RotateCcw, Sparkles, FileText, Activity, DollarSign, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { chartOfAccountsStore } from '@/services/stores';
import type { Account } from '@/types';

const typeLabels: Record<string, string> = { asset: 'أصول', liability: 'خصوم', equity: 'حقوق ملكية', revenue: 'إيرادات', expense: 'مصروفات' };

const typeConfig: Record<string, { dot: string; chip: string }> = {
  asset:    { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  liability:{ dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  equity:   { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  revenue:  { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  expense:  { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};

function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    violet: { iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
  };
  const a = accentMap[accent] || accentMap.slate;
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${a.iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
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

function AccountRow({ a, onDelete, onViewEntries }: { a: Account; onDelete: (a: Account) => void; onViewEntries: (a: Account) => void }) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const typeCfg = typeConfig[a.account_type] || typeConfig.asset;
  const isActive = a.status === 'active';

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3">
        <Tooltip><TooltipTrigger asChild>
          <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(a.account_code).then(() => toast.success('تم نسخ كود الحساب')); }}
            className="font-mono text-xs text-emerald-600 hover:text-emerald-700 transition-colors">{a.account_code}</button>
        </TooltipTrigger><TooltipContent>اضغط للنسخ</TooltipContent></Tooltip>
      </td>
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{a.account_name_ar}</span></td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${typeCfg.chip}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${typeCfg.dot}`} />
          {typeLabels[a.account_type] || a.account_type}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-gray-600">{a.level}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-gray-50 text-gray-500 ring-1 ring-gray-100'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {isActive ? 'نشط' : 'غير نشط'}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>عرض</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onViewEntries(a)} className="h-7 px-2 rounded-md text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1"><FileText className="h-3 w-3" />قيود</button></TooltipTrigger><TooltipContent>عرض قيود الحساب</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(a)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyAccounts({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <BookOpen className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد حسابات</p>
        <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج تطابق فلاتر البحث</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function FinanceAccountsPage() {
  const { t, dir } = useLocale();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>(() => chartOfAccountsStore.getAll());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    account_code: '', account_name_ar: '', account_name_en: '',
    account_type: 'asset' as Account['account_type'], parent_account_id: '', level: 1,
  });

  const refresh = () => setAccounts(chartOfAccountsStore.getAll());

  const filtered = useMemo(() => {
    return accounts.filter((a) => {
      if (typeFilter !== 'all' && a.account_type !== typeFilter) return false;
      if (search && !a.account_name_ar.includes(search) && !a.account_code.includes(search)) return false;
      return true;
    });
  }, [accounts, search, typeFilter]);

  const assetAccounts = accounts.filter((a) => a.account_type === 'asset').length;
  const liabilityAccounts = accounts.filter((a) => a.account_type === 'liability').length;
  const revenueAccounts = accounts.filter((a) => a.account_type === 'revenue').length;
  const expenseAccounts = accounts.filter((a) => a.account_type === 'expense').length;
  const activeCount = accounts.filter((a) => a.status === 'active').length;

  const handleDelete = () => {
    if (!deleteTarget) return;
    chartOfAccountsStore.remove(deleteTarget.id);
    refresh();
    toast.success(`تم حذف الحساب ${deleteTarget.account_name_ar} بنجاح`);
    setDeleteTarget(null);
  };

  const handleCreate = () => {
    if (!createForm.account_code || !createForm.account_name_ar) {
      toast.error('يرجى إدخال كود الحساب واسم الحساب');
      return;
    }
    chartOfAccountsStore.create({
      company_id: '', account_code: createForm.account_code, account_name_ar: createForm.account_name_ar,
      account_name_en: createForm.account_name_en, account_type: createForm.account_type,
      parent_account_id: createForm.parent_account_id, level: createForm.level,
      is_postable: true, status: 'active',
    });
    refresh();
    toast.success('تم إضافة الحساب بنجاح');
    setShowCreateModal(false);
    setCreateForm({ account_code: '', account_name_ar: '', account_name_en: '', account_type: 'asset', parent_account_id: '', level: 1 });
  };

  const resetFilters = () => { setSearch(''); setTypeFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">دليل الحسابات</span>
              <span className="text-[13px] font-bold text-gray-900">{accounts.length} حساب</span>
            </div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في الحسابات..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>نشط:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{activeCount}</span>
          </div>
          <div className="me-auto" />
          <Button onClick={() => setShowCreateModal(true)}
            className="h-8 px-3 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" /><span>إضافة حساب</span>
          </Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الحسابات" value={accounts.length} sub={`${filtered.length} معروض`} icon={BookOpen} accent="slate" />
          <KpiCard label="الأصول" value={assetAccounts} sub="حسابات الأصول" icon={TrendingUp} accent="emerald" />
          <KpiCard label="الخصوم" value={liabilityAccounts} sub="حسابات الخصوم" icon={Activity} accent="amber" />
          <KpiCard label="إيرادات / مصروفات" value={`${revenueAccounts} / ${expenseAccounts}`} sub="دخل / مصروف" icon={DollarSign} accent="blue" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">{t.finance.title}</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="النوع" />
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
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyAccounts onReset={resetFilters} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/40">
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">كود الحساب</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">اسم الحساب</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">النوع</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المستوى</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                    <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[150px]">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(a => <AccountRow key={a.id} a={a} onDelete={setDeleteTarget} onViewEntries={(ac) => navigate(`/finance/journal-entries?accountId=${ac.id}`)} />)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {accounts.length} حساب</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div>
              <div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div>
            </div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف الحساب <strong className="text-gray-900">{deleteTarget.account_name_ar}</strong> ({deleteTarget.account_code})؟</p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إضافة حساب جديد</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>كود الحساب *</Label><Input value={createForm.account_code} onChange={(e) => setCreateForm({ ...createForm, account_code: e.target.value })} placeholder="مثال: 1300" /></div>
            <div><Label>اسم الحساب (عربي) *</Label><Input value={createForm.account_name_ar} onChange={(e) => setCreateForm({ ...createForm, account_name_ar: e.target.value })} placeholder="اسم الحساب بالعربية" /></div>
            <div><Label>اسم الحساب (إنجليزي)</Label><Input value={createForm.account_name_en} onChange={(e) => setCreateForm({ ...createForm, account_name_en: e.target.value })} placeholder="Account name in English" /></div>
            <div><Label>النوع</Label><Select value={createForm.account_type} onValueChange={(v) => setCreateForm({ ...createForm, account_type: v as Account['account_type'] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="asset">أصول</SelectItem><SelectItem value="liability">خصوم</SelectItem><SelectItem value="equity">حقوق ملكية</SelectItem><SelectItem value="revenue">إيرادات</SelectItem><SelectItem value="expense">مصروفات</SelectItem></SelectContent></Select></div>
            <div><Label>المستوى</Label><Input type="number" value={createForm.level} onChange={(e) => setCreateForm({ ...createForm, level: Number(e.target.value) })} min={1} max={5} /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>إلغاء</Button>
            <Button onClick={handleCreate} className="bg-emerald-500 hover:bg-emerald-600 text-white">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}