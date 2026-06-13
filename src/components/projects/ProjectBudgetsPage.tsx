import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Filter, Pencil, Trash2, TrendingUp, TrendingDown, RotateCcw, Sparkles, DollarSign, Activity, AlertTriangle, CheckCircle2, ArrowRight, X } from 'lucide-react';
import { projectBudgetStore, projectStore } from '@/services/stores';

const fmt = formatQAR;

const budgetCategoryLabels: Record<string, string> = {
  land: 'أرض', design: 'تصميم', permits: 'تراخيص', civil_works: 'أعمال مدنية',
  mep: 'ميكانيكا وكهرباء', finishing: 'تشطيبات', landscaping: 'تنسيق حدائق',
  consultant: 'استشاري', contingency: 'طوارئ', other: 'أخرى',
};

const categoryConfig: Record<string, { dot: string; chip: string }> = {
  land:         { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  design:       { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  permits:      { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  civil_works:  { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  mep:          { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100' },
  finishing:    { dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' },
  landscaping:  { dot: 'bg-lime-500', chip: 'bg-lime-50 text-lime-700 ring-1 ring-lime-100' },
  consultant:   { dot: 'bg-cyan-500', chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100' },
  contingency:  { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
  other:        { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-600 ring-1 ring-gray-100' },
};

const emptyForm = { project_id: '', budget_code: '', budget_name: '', budget_category: 'civil_works' as const, approved_amount: 0, committed_amount: 0, actual_amount: 0 };

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; accent: string;
}) {
  const a: Record<string, { iconBg: string; iconColor: string }> = {
    violet:{ iconBg: 'bg-violet-50', iconColor: 'text-violet-600' }, amber:{ iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' }, rose:{ iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    slate:{ iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
  }[accent] || { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' };
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm">
      <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center mb-2.5`}><Icon className={`h-4 w-4 ${a.iconColor}`} /></div>
      <div className="text-xl font-bold text-gray-900 ltr-only tabular-nums">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function BudgetRow({ b, projects, onEdit, onDelete }: {
  b: any; projects: any[]; onEdit: (b: any) => void; onDelete: (id: string) => void;
}) {
  const cc = categoryConfig[b.budget_category] || categoryConfig.other;
  const getProjectName = (id: string) => projects.find((p: any) => p.id === id)?.project_name || id;
  const remaining = b.approved_amount - b.actual_amount;
  const variancePct = b.approved_amount > 0 ? Math.round(((b.approved_amount - b.actual_amount) / b.approved_amount) * 100) : 0;
  const isOver = remaining < 0;

  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-4 py-3"><span className="text-sm font-bold text-gray-900 font-mono">{b.budget_code}</span></td>
      <td className="px-4 py-3"><div><div className="text-sm font-bold text-gray-900">{b.budget_name}</div><div className="text-[11px] text-gray-400">{getProjectName(b.project_id)}</div></div></td>
      <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${cc.chip}`}><span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} />{budgetCategoryLabels[b.budget_category]}</span></td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(b.approved_amount)}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-600 ltr-only tabular-nums">{fmt(b.committed_amount)}</td>
      <td className="px-4 py-3 text-xs font-mono text-gray-700 ltr-only tabular-nums">{fmt(b.actual_amount)}</td>
      <td className="px-4 py-3"><span className={`text-xs font-mono font-bold ltr-only tabular-nums ${isOver ? 'text-rose-600' : 'text-emerald-600'}`}>{fmt(remaining)}</span></td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${isOver ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' : variancePct < 25 ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOver ? 'bg-rose-500' : variancePct < 25 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {isOver ? 'تجاوز' : `${variancePct}%`}
        </span>
      </td>
      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <Tooltip><TooltipTrigger asChild><button onClick={() => onEdit(b)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>تعديل</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><button onClick={() => onDelete(b.id)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button></TooltipTrigger><TooltipContent>حذف</TooltipContent></Tooltip>
        </div>
      </td>
    </tr>
  );
}

function EmptyBudgets({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center"><DollarSign className="h-8 w-8 text-gray-300" /></div>
      <div className="text-center"><p className="text-sm font-bold text-gray-700">لا توجد ميزانيات</p><p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج</p></div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1"><RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر</Button>
    </div>
  );
}

export default function ProjectBudgetsPage() {
  const { dir } = useLocale();
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const budgets = useMemo(() => projectBudgetStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), []);
  const getProjectName = (id: string) => projects.find((p: any) => p.id === id)?.project_name || id;

  const filtered = budgets.filter((b: any) => {
    if (projectFilter !== 'all' && b.project_id !== projectFilter) return false;
    if (categoryFilter !== 'all' && b.budget_category !== categoryFilter) return false;
    if (search && !b.budget_name.includes(search) && !b.budget_code.includes(search)) return false;
    return true;
  });

  const totalApproved = filtered.reduce((s: number, b: any) => s + b.approved_amount, 0);
  const totalActual = filtered.reduce((s: number, b: any) => s + b.actual_amount, 0);
  const totalVariance = totalApproved - totalActual;
  const overCount = budgets.filter((b: any) => (b.approved_amount - b.actual_amount) < 0).length;

  const openCreate = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (b: any) => { setEditId(b.id); setForm({ project_id: b.project_id, budget_code: b.budget_code, budget_name: b.budget_name, budget_category: b.budget_category, approved_amount: b.approved_amount, committed_amount: b.committed_amount, actual_amount: b.actual_amount }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.project_id || !form.budget_code || !form.budget_name) return;
    const approved = Number(form.approved_amount), committed = Number(form.committed_amount), actual = Number(form.actual_amount);
    const remaining = approved - actual, variance = approved - actual;
    const variancePct = approved > 0 ? (variance / approved) * 100 : 0;
    const data: any = { company_id: '', project_id: form.project_id, budget_code: form.budget_code, budget_name: form.budget_name, budget_category: form.budget_category, approved_amount: approved, committed_amount: committed, actual_amount: actual, remaining_amount: remaining, variance_amount: variance, variance_percentage: Math.round(variancePct * 100) / 100, status: 'active', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    if (editId) projectBudgetStore.update(editId, data); else projectBudgetStore.create(data);
    setModalOpen(false); setRefresh(r => r + 1);
  };
  const handleDelete = () => { if (!deleteTarget) return; projectBudgetStore.remove(deleteTarget.id); toast.success('تم الحذف'); setDeleteTarget(null); setRefresh(r => r + 1); };
  const resetFilters = () => { setSearch(''); setProjectFilter('all'); setCategoryFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-sm"><DollarSign className="h-4 w-4 text-white" /></div>
            <div className="hidden md:flex flex-col leading-tight"><span className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-600">الميزانيات</span><span className="text-[13px] font-bold text-gray-900">{filtered.length} بند</span></div>
          </div>
          <div className="h-6 w-px bg-gray-200 hidden md:block" />
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث..." value={search} onChange={e => setSearch(e.target.value)} className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"><X className="h-3 w-3" /></button>}
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500"><span>تجاوز:</span><span className="font-bold text-rose-600 ltr-only tabular-nums">{overCount}</span></div>
          <div className="me-auto" />
          <Button onClick={openCreate} className="h-8 px-3 gap-1.5 bg-violet-500 hover:bg-violet-600 text-white text-[11px] font-bold rounded-lg shadow-sm"><span>+ إضافة بند</span></Button>
        </div>
      </div>

      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي البنود" value={filtered.length} sub={`من ${budgets.length}`} icon={DollarSign} accent="slate" />
          <KpiCard label="المعتمد" value={fmt(totalApproved)} sub="إجمالي الميزانية" icon={CheckCircle2} accent="emerald" />
          <KpiCard label="الفعلي" value={fmt(totalActual)} sub="التكلفة الفعلية" icon={Activity} accent="amber" />
          <KpiCard label="الانحراف" value={fmt(totalVariance)} sub={totalVariance >= 0 ? 'تحت الميزانية' : 'تجاوز الميزانية'} icon={totalVariance >= 0 ? TrendingUp : AlertTriangle} accent={totalVariance >= 0 ? 'emerald' : 'rose'} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">ميزانيات المشاريع</h2><span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={resetFilters} className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50"><RotateCcw className="h-3.5 w-3.5" /> إعادة</Button></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="المشروع" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع المشاريع</SelectItem>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] h-8 text-xs rounded-lg border-gray-200 bg-white"><Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الفئة" /></SelectTrigger>
              <SelectContent><SelectItem value="all">جميع الفئات</SelectItem>{Object.entries(budgetCategoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? <EmptyBudgets onReset={resetFilters} /> : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-100 bg-gray-50/40">
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الكود</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">البند / المشروع</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الفئة</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المعتمد</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الملتزم</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الفعلي</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">المتبقي</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right">الانحراف</th>
                  <th className="text-[11px] font-bold text-gray-500 h-9 px-4 text-right w-[80px]">الإجراءات</th>
                </tr></thead>
                <tbody>{filtered.map((b: any) => <BudgetRow key={b.id} b={b} projects={projects} onEdit={openEdit} onDelete={(id) => { const item = budgets.find(x => x.id === id); if (item) setDeleteTarget(item); }} />)}</tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {budgets.length} بند</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />مفلتر محلياً</span>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center"><AlertTriangle className="h-4 w-4 text-rose-600" /></div><div><h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3><p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p></div></div>
            <p className="text-sm text-gray-600 mb-5">هل أنت متأكد من حذف بند الميزانية <strong className="text-gray-900">{deleteTarget.budget_name}</strong>؟</p>
            <div className="flex items-center justify-end gap-2"><Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button><Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button></div>
          </div>
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle>{editId ? 'تعديل بند ميزانية' : 'إضافة بند ميزانية'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div><Label>المشروع *</Label><Select value={form.project_id} onValueChange={v => setForm(f => ({ ...f, project_id: v }))}><SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger><SelectContent>{projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>كود البند *</Label><Input value={form.budget_code} onChange={e => setForm(f => ({ ...f, budget_code: e.target.value }))} placeholder="BUD-..." /></div>
              <div><Label>اسم البند *</Label><Input value={form.budget_name} onChange={e => setForm(f => ({ ...f, budget_name: e.target.value }))} /></div>
            </div>
            <div><Label>الفئة</Label><Select value={form.budget_category} onValueChange={v => setForm(f => ({ ...f, budget_category: v as any }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(budgetCategoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>المعتمد</Label><Input type="number" value={form.approved_amount} onChange={e => setForm(f => ({ ...f, approved_amount: Number(e.target.value) }))} /></div>
              <div><Label>الملتزم</Label><Input type="number" value={form.committed_amount} onChange={e => setForm(f => ({ ...f, committed_amount: Number(e.target.value) }))} /></div>
              <div><Label>الفعلي</Label><Input type="number" value={form.actual_amount} onChange={e => setForm(f => ({ ...f, actual_amount: Number(e.target.value) }))} /></div>
            </div>
            {form.approved_amount > 0 && (
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">المتبقي:</span><span className={`font-mono font-bold ${form.approved_amount - form.actual_amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(form.approved_amount - form.actual_amount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">نسبة الانحراف:</span><span className="font-mono font-bold">{((form.approved_amount - form.actual_amount) / form.approved_amount * 100).toFixed(2)}%</span></div>
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button><Button onClick={handleSave} className="bg-violet-500 hover:bg-violet-600 text-white">{editId ? 'تحديث' : 'حفظ'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}