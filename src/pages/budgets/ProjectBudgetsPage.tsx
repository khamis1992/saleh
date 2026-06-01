import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { PageHeader } from '@/components/shared/PageHeader';
import { BudgetVarianceBadge } from '@/components/shared/Phase2Components';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Filter, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { projectBudgetStore, projectStore } from '@/services/stores';

const budgetCategoryLabels: Record<string, string> = {
  land: 'أرض',
  design: 'تصميم',
  permits: 'تراخيص',
  civil_works: 'أعمال مدنية',
  mep: 'ميكانيكا وكهرباء',
  finishing: 'تشطيبات',
  landscaping: 'تنسيق حدائق',
  consultant: 'استشاري',
  contingency: 'طوارئ',
  other: 'أخرى',
};

const emptyForm = {
  project_id: '',
  budget_code: '',
  budget_name: '',
  budget_category: 'civil_works' as const,
  approved_amount: 0,
  committed_amount: 0,
  actual_amount: 0,
};

export default function ProjectBudgetsPage() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [refresh, setRefresh] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const budgets = useMemo(() => projectBudgetStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), []);

  const formattedAmount = (v: number) =>
    formatQAR(v);

  const getProjectName = (id: string) => projects.find((p: any) => p.id === id)?.project_name || id;

  const filtered = budgets.filter((b: any) => {
    if (projectFilter !== 'all' && b.project_id !== projectFilter) return false;
    if (categoryFilter !== 'all' && b.budget_category !== categoryFilter) return false;
    if (search && !b.budget_name.includes(search) && !b.budget_code.includes(search)) return false;
    return true;
  });

  const totalApproved = filtered.reduce((s: number, b: any) => s + b.approved_amount, 0);
  const totalActual = filtered.reduce((s: number, b: any) => s + b.actual_amount, 0);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (b: any) => {
    setEditId(b.id);
    setForm({
      project_id: b.project_id,
      budget_code: b.budget_code,
      budget_name: b.budget_name,
      budget_category: b.budget_category,
      approved_amount: b.approved_amount,
      committed_amount: b.committed_amount,
      actual_amount: b.actual_amount,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.project_id || !form.budget_code || !form.budget_name) return;
    const approved = Number(form.approved_amount);
    const committed = Number(form.committed_amount);
    const actual = Number(form.actual_amount);
    const remaining = approved - actual;
    const variance = approved - actual;
    const variancePct = approved > 0 ? (variance / approved) * 100 : 0;

    const data: any = {
      company_id: '',
      project_id: form.project_id,
      budget_code: form.budget_code,
      budget_name: form.budget_name,
      budget_category: form.budget_category,
      approved_amount: approved,
      committed_amount: committed,
      actual_amount: actual,
      remaining_amount: remaining,
      variance_amount: variance,
      variance_percentage: Math.round(variancePct * 100) / 100,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (editId) {
      projectBudgetStore.update(editId, data);
    } else {
      projectBudgetStore.create(data);
    }
    setModalOpen(false);
    setRefresh(r => r + 1);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">ميزانيات المشاريع</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة الميزانيات المعتمدة والفعلية للمشاريع</p>
        </div>
        <button onClick={openCreate} className="h-9 flex items-center gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-lg px-4">
          + إضافة بند ميزانية
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">إجمالي الميزانية المعتمدة</p>
          <p className="text-xl font-bold">{formattedAmount(totalApproved)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">إجمالي التكلفة الفعلية</p>
          <p className="text-xl font-bold">{formattedAmount(totalActual)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">الانحراف الإجمالي</p>
          <p className={`text-xl font-bold ${totalApproved - totalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formattedAmount(totalApproved - totalActual)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 h-9 text-sm rounded-lg border-gray-200" />
          </div>
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[180px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" /><SelectValue placeholder="المشروع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المشاريع</SelectItem>
              {projects.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg border-gray-200">
              <SelectValue placeholder="الفئة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الفئات</SelectItem>
              {Object.entries(budgetCategoryLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الكود</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">اسم البند</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">المشروع</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الفئة</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">المعتمد</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الملتزم</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الفعلي</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">المتبقي</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B]">الانحراف</TableHead>
                <TableHead className="text-[11px] font-bold text-[#64748B] w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      لا توجد ميزانيات
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((b: any) => (
                  <TableRow key={b.id}>
                    <TableCell className="font-medium">{b.budget_code}</TableCell>
                    <TableCell>{b.budget_name}</TableCell>
                    <TableCell>{getProjectName(b.project_id)}</TableCell>
                    <TableCell>{budgetCategoryLabels[b.budget_category] || b.budget_category}</TableCell>
                    <TableCell className="font-mono">{formattedAmount(b.approved_amount)}</TableCell>
                    <TableCell className="font-mono">{formattedAmount(b.committed_amount)}</TableCell>
                    <TableCell className="font-mono">{formattedAmount(b.actual_amount)}</TableCell>
                    <TableCell className={`font-mono ${b.remaining_amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formattedAmount(b.remaining_amount)}
                    </TableCell>
                    <TableCell>
                      <BudgetVarianceBadge variance={b.variance_amount} percentage={b.variance_percentage} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => openEdit(b)}>
                            <Pencil className="h-4 w-4 ml-2" />
                            تعديل
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              projectBudgetStore.remove(b.id);
                              setRefresh(r => r + 1);
                            }}
                          >
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل بند ميزانية' : 'إضافة بند ميزانية'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium mb-1 block">المشروع *</label>
              <Select
                value={form.project_id}
                onValueChange={v => setForm(f => ({ ...f, project_id: v }))}
              >
                <SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">كود البند *</label>
                <Input
                  value={form.budget_code}
                  onChange={e => setForm(f => ({ ...f, budget_code: e.target.value }))}
                  placeholder="BUD-..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">اسم البند *</label>
                <Input
                  value={form.budget_name}
                  onChange={e => setForm(f => ({ ...f, budget_name: e.target.value }))}
                  placeholder="اسم بند الميزانية"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">فئة الميزانية</label>
              <Select
                value={form.budget_category}
                onValueChange={v => setForm(f => ({ ...f, budget_category: v as any }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(budgetCategoryLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">المعتمد</label>
                <Input
                  type="number"
                  value={form.approved_amount}
                  onChange={e => setForm(f => ({ ...f, approved_amount: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الملتزم</label>
                <Input
                  type="number"
                  value={form.committed_amount}
                  onChange={e => setForm(f => ({ ...f, committed_amount: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الفعلي</label>
                <Input
                  type="number"
                  value={form.actual_amount}
                  onChange={e => setForm(f => ({ ...f, actual_amount: Number(e.target.value) }))}
                />
              </div>
            </div>
            {form.approved_amount > 0 && (
              <div className="bg-muted p-3 rounded text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المتبقي:</span>
                  <span className={`font-mono font-bold ${form.approved_amount - form.actual_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formattedAmount(form.approved_amount - form.actual_amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">نسبة الانحراف:</span>
                  <span className="font-mono font-bold">
                    {((form.approved_amount - form.actual_amount) / form.approved_amount * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
            <Button onClick={handleSave}>{editId ? 'تحديث' : 'حفظ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}