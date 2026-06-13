import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Filter, Pencil, Trash2, RotateCcw, CheckCircle2, AlertTriangle, TrendingUp, TrendingDown, X, Building2, Wallet, CreditCard, DollarSign } from 'lucide-react';
import { bankAccountStore } from '@/services/stores';

const statusLabels: Record<string, string> = { active: 'نشط', inactive: 'غير نشط', closed: 'مغلق' };
const currencyLabels: Record<string, string> = { SAR: 'ريال سعودي', USD: 'دولار أمريكي', EUR: 'يورو' };
const statusConfig: Record<string, { dot: string; chip: string }> = {
  active: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  inactive: { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100' },
  closed: { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
};
const emptyForm = { bank_name: '', account_name: '', account_number: '', iban: '', currency: 'QAR' as string, opening_balance: 0, current_balance: 0, status: 'active' as string };

function KpiCard({ label, value, icon: Icon, accent }: { label: string; value: string | number; icon: React.ElementType; accent: string }) {
  const a: Record<string, { iconBg: string; iconColor: string }> = { emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, blue:{ iconBg: 'bg-blue-50', iconColor: 'text-blue-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' }, slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' } }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
    </div>
  );
}

function AccRow({ acc, onEdit, onDelete }: { acc: any; onEdit: (a: any) => void; onDelete: (a: any) => void }) {
  const sc = statusConfig[acc.status] || statusConfig.inactive;
  const diff = acc.current_balance - acc.opening_balance;
  const isPositive = diff >= 0;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><div><div className="text-sm font-bold text-gray-900">{acc.bank_name}</div><div className="text-[11px] text-gray-400">{acc.account_name}</div></div></td>
      <td className="px-4 py-3 font-mono text-xs text-gray-500" dir="ltr">{acc.account_number}</td>
      <td className="px-4 py-3 font-mono text-[11px] text-gray-400" dir="ltr">{acc.iban || '—'}</td>
      <td className="px-4 py-3"><span className="text-xs font-medium text-gray-600">{currencyLabels[acc.currency] || acc.currency}</span></td>
      <td className="px-4 py-3 font-mono text-sm font-bold text-gray-900 ltr-only">{formatQAR(acc.opening_balance)}</td>
      <td className="px-4 py-3 font-mono text-sm font-bold text-gray-900 ltr-only">{formatQAR(acc.current_balance)}</td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1 font-mono text-xs font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>{isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{isPositive ? '+' : ''}{formatQAR(Math.abs(diff))}</span></td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${sc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />{statusLabels[acc.status]}</span></td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(acc)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(acc)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><Building2 className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد حسابات بنكية</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function BankAccountsPage() {
  const { dir } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const accounts = useMemo(() => bankAccountStore.getAll(), [refresh]);
  const filtered = accounts.filter((acc: any) => {
    if (statusFilter !== 'all' && acc.status !== statusFilter) return false;
    if (search && !acc.bank_name.includes(search) && !acc.account_name.includes(search) && !acc.account_number.includes(search)) return false;
    return true;
  });

  const activeAccounts = accounts.filter((acc: any) => acc.status === 'active').length;
  const totalBalance = accounts.reduce((s: number, acc: any) => s + (acc.current_balance || 0), 0);
  const avgBalance = accounts.length > 0 ? Math.round(totalBalance / accounts.length) : 0;

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (acc: any) => {
    setEditId(acc.id);
    setForm({
      bank_name: acc.bank_name, account_name: acc.account_name, account_number: acc.account_number,
      iban: acc.iban, currency: acc.currency, opening_balance: acc.opening_balance,
      current_balance: acc.current_balance, status: acc.status,
    });
    setModalOpen(true);
  };
  const handleSave = () => {
    if (!form.bank_name || !form.account_name || !form.account_number) return;
    const data: any = { company_id: '', bank_name: form.bank_name, account_name: form.account_name, account_number: form.account_number, iban: form.iban, currency: form.currency, opening_balance: Number(form.opening_balance), current_balance: Number(form.current_balance), status: form.status };
    if (editId) bankAccountStore.update(editId, data); else bankAccountStore.create(data);
    setModalOpen(false);
    setRefresh(r => r + 1);
  };
  const handleDelete = () => { if (!deleteTarget) return; bankAccountStore.remove(deleteTarget.id); toast.success('تم الحذف'); setDeleteTarget(null); setRefresh(r => r + 1); };
  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm"><Building2 className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">الحسابات البنكية</span><span className="text-[13px] font-bold text-gray-900">{accounts.length} حساب</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" dir="auto" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="me-auto" />
          <Button onClick={openCreate} className="h-8 px-3 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><span>+ إضافة حساب</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الحسابات" value={accounts.length} icon={Building2} accent="slate" />
          <KpiCard label="نشطة" value={activeAccounts} icon={CheckCircle2} accent="emerald" />
          <KpiCard label="الرصيد الإجمالي" value={formatQAR(totalBalance)} icon={Wallet} accent="blue" />
          <KpiCard label="متوسط الرصيد" value={formatQAR(avgBalance)} icon={DollarSign} accent="amber" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">الحسابات البنكية</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الحالة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الحالات</SelectItem>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyState onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">البنك / الحساب</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">رقم الحساب</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">IBAN</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">العملة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الرصيد الافتتاحي</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الرصيد الحالي</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الفرق</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map((acc: any) => <AccRow key={acc.id} acc={acc} onEdit={openEdit} onDelete={setDeleteTarget} />)}</tbody>
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
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف الحساب <strong className="text-gray-900">{deleteTarget.bank_name} — {deleteTarget.account_name}</strong>؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل حساب بنكي' : 'إضافة حساب بنكي'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>اسم البنك *</Label><Input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="مثال: مصرف الراجحي" /></div>
              <div><Label>اسم الحساب *</Label><Input value={form.account_name} onChange={e => setForm(f => ({ ...f, account_name: e.target.value }))} placeholder="مثال: الحساب الجاري" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>رقم الحساب *</Label><Input value={form.account_number} onChange={e => setForm(f => ({ ...f, account_number: e.target.value }))} placeholder="رقم الحساب" /></div>
              <div><Label>رقم IBAN</Label><Input value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} placeholder="SA..." dir="ltr" /></div>
            </div>
            <div><Label>العملة</Label><Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(currencyLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v} ({k})</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الرصيد الافتتاحي</Label><Input type="number" value={form.opening_balance} onChange={e => setForm(f => ({ ...f, opening_balance: Number(e.target.value) }))} /></div>
              <div><Label>الرصيد الحالي</Label><Input type="number" value={form.current_balance} onChange={e => setForm(f => ({ ...f, current_balance: Number(e.target.value) }))} /></div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 ring-1 ring-gray-100">
              <div className="flex justify-between text-sm"><span className="text-gray-600">الفرق</span><span className={`font-mono font-bold ${Number(form.current_balance) - Number(form.opening_balance) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatQAR(Number(form.current_balance) - Number(form.opening_balance))}</span></div>
            </div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="inactive">غير نشط</SelectItem><SelectItem value="closed">مغلق</SelectItem></SelectContent></Select></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button><Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white">{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}