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
import { Search, Filter, Pencil, Trash2, RotateCcw, CheckCircle2, AlertTriangle, TrendingUp, X, CreditCard, Clock, Ban, Banknote } from 'lucide-react';
import { chequeStore, getTenantName } from '@/services/stores';

const statusLabels: Record<string, string> = { received: 'مستلم', deposited: 'مودع', cleared: 'مصرف', bounced: 'مرتجع', cancelled: 'ملغي', returned: 'معاد' };
const statusConfig: Record<string, { dot: string; chip: string }> = {
  received:   { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  deposited:  { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  cleared:    { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  bounced:    { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  cancelled:  { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-500 ring-1 ring-gray-100' },
  returned:   { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
};
const bankNames = ['الراجحي', 'الأهلي', 'الرياض', 'ساب', 'الإنماء', 'البلاد', 'الجزيرة', 'العربي'];
const emptyForm = { cheque_number: '', bank_name: '', cheque_date: '', amount: 0, tenant_id: '', contract_id: '', status: 'received', notes: '' };

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

function formatDate(d: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('ar-SA'); }

function ChqRow({ c, onEdit, onDelete }: { c: any; onEdit: (x: any) => void; onDelete: (x: any) => void }) {
  const sc = statusConfig[c.status] || statusConfig.received;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900">{c.cheque_number}</span></td>
      <td className="px-4 py-3 text-sm text-gray-600">{c.bank_name}</td>
      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(c.cheque_date)}</td>
      <td className="px-4 py-3 font-mono text-sm font-bold text-gray-900 ltr-only">{formatQAR(c.amount)}</td>
      <td className="px-4 py-3 text-sm text-gray-600">{getTenantName(c.tenant_id)}</td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${sc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />{statusLabels[c.status]}</span></td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(c)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(c)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><CreditCard className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد شيكات</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function ChequesPage() {
  const { dir } = useLocale();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const cheques = useMemo(() => chequeStore.getAll(), [refresh]);
  const filtered = cheques.filter((c: any) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.cheque_number.includes(search) && !c.bank_name.includes(search)) return false;
    return true;
  });

  const clearedCheques = cheques.filter((c: any) => c.status === 'cleared').length;
  const bouncedCheques = cheques.filter((c: any) => c.status === 'bounced').length;
  const pendingCheques = cheques.filter((c: any) => c.status === 'received' || c.status === 'deposited').length;
  const totalChequeValue = cheques.reduce((s: number, c: any) => s + (c.amount || 0), 0);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: any) => {
    setEditId(c.id);
    setForm({ cheque_number: c.cheque_number, bank_name: c.bank_name, cheque_date: c.cheque_date || '', amount: c.amount, tenant_id: c.tenant_id || '', contract_id: c.contract_id || '', status: c.status, notes: c.notes || '' });
    setModalOpen(true);
  };
  const handleSave = () => {
    if (!form.cheque_number || !form.bank_name) return;
    const data: any = { company_id: '', cheque_number: form.cheque_number, bank_name: form.bank_name, cheque_date: form.cheque_date, amount: Number(form.amount), tenant_id: form.tenant_id, contract_id: form.contract_id, status: form.status, notes: form.notes };
    if (editId) chequeStore.update(editId, data); else chequeStore.create(data);
    setModalOpen(false); setRefresh(r => r + 1);
  };
  const handleDelete = () => { if (!deleteTarget) return; chequeStore.remove(deleteTarget.id); toast.success('تم الحذف'); setDeleteTarget(null); setRefresh(r => r + 1); };
  const resetFilters = () => { setSearch(''); setStatusFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm"><CreditCard className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">الشيكات</span><span className="text-[13px] font-bold text-gray-900">{cheques.length} شيك</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" dir="auto" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="me-auto" />
          <Button onClick={openCreate} className="h-8 px-3 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><span>+ إضافة شيك</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الشيكات" value={cheques.length} icon={CreditCard} accent="slate" />
          <KpiCard label="مصرفة" value={clearedCheques} icon={CheckCircle2} accent="emerald" />
          <KpiCard label="معلقة" value={pendingCheques} icon={Clock} accent="amber" />
          <KpiCard label="القيمة الإجمالية" value={formatQAR(totalChequeValue)} icon={Banknote} accent="blue" />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">الشيكات</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
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
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">رقم الشيك</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">البنك</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">تاريخ الشيك</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المبلغ</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المستأجر</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الحالة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map((c: any) => <ChqRow key={c.id} c={c} onEdit={openEdit} onDelete={setDeleteTarget} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {cheques.length} شيك</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف الشيك <strong className="text-gray-900">{deleteTarget.cheque_number}</strong>؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل شيك' : 'إضافة شيك'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>رقم الشيك *</Label><Input value={form.cheque_number} onChange={e => setForm(f => ({ ...f, cheque_number: e.target.value }))} placeholder="مثال: CHQ-2026001" /></div>
              <div><Label>البنك *</Label><Select value={form.bank_name} onValueChange={v => setForm(f => ({ ...f, bank_name: v }))}><SelectTrigger><SelectValue placeholder="اختر البنك" /></SelectTrigger><SelectContent>{bankNames.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>تاريخ الشيك</Label><Input type="date" value={form.cheque_date} onChange={e => setForm(f => ({ ...f, cheque_date: e.target.value }))} /></div>
              <div><Label>المبلغ</Label><Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} /></div>
            </div>
            <div><Label>المستأجر</Label><Input value={form.tenant_id} onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value }))} placeholder="معرف المستأجر" /></div>
            <div><Label>العقد</Label><Input value={form.contract_id} onChange={e => setForm(f => ({ ...f, contract_id: e.target.value }))} placeholder="معرف العقد" /></div>
            <div><Label>الحالة</Label><Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>ملاحظات</Label><Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="ملاحظات" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button><Button onClick={handleSave} className="bg-emerald-500 hover:bg-emerald-600 text-white">{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}