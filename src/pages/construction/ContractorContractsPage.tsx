import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Filter, Eye, Pencil, Trash2, FileText, Plus, X } from 'lucide-react';
import { contractorStore, projectStore, getProjectName } from '@/services/stores';
import { createStore } from '@/services/dataService';
import type { ContractorContract } from '@/types';

// ============================================================
// SEED DATA
// ============================================================
export const seedContractorContracts: ContractorContract[] = [
  {
    id: 'ctr-1', company_id: '', contract_number: 'CONT-2024-001', contract_title: 'أعمال الحفر والردم والخرسانة',
    contractor_id: 'cont-1', project_id: 'prj-1', scope_of_work: 'تنفيذ جميع أعمال الحفر والردم والخرسانة المسلحة للمجمع السكني',
    contract_amount: 4500000, retention_percentage: 5, advance_payment: 450000,
    start_date: '2024-04-01', end_date: '2025-06-30',
    payment_terms: 'شهري حسب نسبة الإنجاز', penalty_terms: 'غرامة 0.1% يومياً عن التأخير', warranty_period_months: 12,
    status: 'active', notes: '', created_at: '2024-03-15', updated_at: '2024-03-15', created_by: '', updated_by: '',
  },
  {
    id: 'ctr-2', company_id: '', contract_number: 'CONT-2024-002', contract_title: 'أعمال الكهرباء والتمديدات',
    contractor_id: 'cont-2', project_id: 'prj-1', scope_of_work: 'تنفيذ كامل أعمال الكهرباء والتمديدات للمجمع السكني',
    contract_amount: 2800000, retention_percentage: 5, advance_payment: 280000,
    start_date: '2024-06-01', end_date: '2025-12-31',
    payment_terms: 'شهري حسب نسبة الإنجاز', penalty_terms: 'غرامة 0.1% يومياً عن التأخير', warranty_period_months: 12,
    status: 'active', notes: '', created_at: '2024-05-20', updated_at: '2024-05-20', created_by: '', updated_by: '',
  },
  {
    id: 'ctr-3', company_id: '', contract_number: 'CONT-2024-003', contract_title: 'أعمال التكييف والتهوية',
    contractor_id: 'cont-3', project_id: 'prj-2', scope_of_work: 'توريد وتركيب أنظمة التكييف المركزي لأبراج السلام',
    contract_amount: 3500000, retention_percentage: 5, advance_payment: 350000,
    start_date: '2024-09-01', end_date: '2026-03-31',
    payment_terms: 'ربع سنوي حسب التقدم', penalty_terms: 'غرامة 0.15% يومياً عن التأخير', warranty_period_months: 24,
    status: 'active', notes: '', created_at: '2024-08-15', updated_at: '2024-08-15', created_by: '', updated_by: '',
  },
  {
    id: 'ctr-4', company_id: '', contract_number: 'CONT-2025-001', contract_title: 'أعمال التشطيبات الداخلية',
    contractor_id: 'cont-4', project_id: 'prj-3', scope_of_work: 'تنفيذ كامل التشطيبات الداخلية لفلل الياسمين',
    contract_amount: 1800000, retention_percentage: 5, advance_payment: 180000,
    start_date: '2025-06-01', end_date: '2026-09-30',
    payment_terms: 'شهري حسب نسبة الإنجاز', penalty_terms: 'غرامة 0.1% يومياً عن التأخير', warranty_period_months: 12,
    status: 'draft', notes: 'بانتظار التوقيع النهائي', created_at: '2025-05-01', updated_at: '2025-05-01', created_by: '', updated_by: '',
  },
];

// In-memory store
const contractStore = createStore<ContractorContract>({ key: 'erp_contractor_contracts', seed: seedContractorContracts });

// Status map for Arabic labels
const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  pending_approval: 'بانتظار الموافقة',
  active: 'نشط',
  suspended: 'معلق',
  completed: 'مكتمل',
  terminated: 'منتهي',
  closed: 'مغلق',
};

// Form fields
interface ContractForm {
  contract_number: string;
  contractor_id: string;
  project_id: string;
  contract_title: string;
  scope_of_work: string;
  contract_amount: number;
  retention_percentage: number;
  advance_payment: number;
  payment_terms: string;
  penalty_terms: string;
  warranty_period_months: number;
  start_date: string;
  end_date: string;
  status: ContractorContract['status'];
}

const emptyForm: ContractForm = {
  contract_number: '',
  contractor_id: '',
  project_id: '',
  contract_title: '',
  scope_of_work: '',
  contract_amount: 0,
  retention_percentage: 5,
  advance_payment: 0,
  payment_terms: '',
  penalty_terms: '',
  warranty_period_months: 12,
  start_date: '',
  end_date: '',
  status: 'draft',
};

export default function ContractorContractsPage() {
  const { t } = useLocale();
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewContract, setViewContract] = useState<ContractorContract | null>(null);
  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ContractorContract | null>(null);

  const contracts = useMemo(() => {
    const data = contractStore.getAll();
    const timer = setTimeout(() => setLoading(false), 300);
    return data;
  }, [refresh]);
  const contractors = useMemo(() => contractorStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);

  const filtered = useMemo(() => contracts.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.contract_number.includes(search) && !c.contract_title.includes(search)) return false;
    return true;
  }), [contracts, search, statusFilter]);

  const fmt = (v: number) => formatQAR(v);

  function getContractorName(id: string) {
    return contractors.find((c: any) => c.id === id)?.name || id;
  }

  function handleCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function handleEdit(ctr: ContractorContract) {
    setEditingId(ctr.id);
    setForm({
      contract_number: ctr.contract_number,
      contractor_id: ctr.contractor_id,
      project_id: ctr.project_id,
      contract_title: ctr.contract_title,
      scope_of_work: ctr.scope_of_work,
      contract_amount: ctr.contract_amount,
      retention_percentage: ctr.retention_percentage,
      advance_payment: ctr.advance_payment,
      payment_terms: ctr.payment_terms || '',
      penalty_terms: ctr.penalty_terms || '',
      warranty_period_months: ctr.warranty_period_months ?? 12,
      start_date: ctr.start_date,
      end_date: ctr.end_date,
      status: ctr.status,
    });
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.contract_number || !form.contractor_id || !form.project_id) return;
    if (editingId) {
      contractStore.update(editingId, { ...form });
      toast.success(`تم تحديث العقد ${form.contract_number} بنجاح`);
    } else {
      contractStore.create({ ...form, company_id: '', notes: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: '', updated_by: '' } as any);
      toast.success(`تم إضافة العقد ${form.contract_number} بنجاح`);
    }
    setDialogOpen(false);
    setRefresh(r => r + 1);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    contractStore.remove(deleteTarget.id);
    toast.success(`تم حذف العقد ${deleteTarget.contract_number} بنجاح`);
    setDeleteTarget(null);
    setRefresh(r => r + 1);
  }

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">عقود المقاولين</h1>
          <p className="text-xs text-gray-500 mt-0.5">إدارة عقود المقاولين المرتبطة بالمشاريع</p>
        </div>
        <Button
          onClick={handleCreate}
          className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          إضافة عقد
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
            <Input
              placeholder="بحث برقم العقد أو العنوان..."
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
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="suspended">معلق</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="terminated">منتهي</SelectItem>
              <SelectItem value="closed">مغلق</SelectItem>
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
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">رقم العقد</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">عنوان العقد</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المقاول</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المشروع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">قيمة العقد</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">تاريخ البداية</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">تاريخ النهاية</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الحالة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[80px]">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-16">
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
                {filtered.map((ctr) => (
                  <TableRow key={ctr.id} className="">
                    <TableCell className="font-medium text-sm">{ctr.contract_number}</TableCell>
                    <TableCell className="text-sm">{ctr.contract_title}</TableCell>
                    <TableCell className="text-sm">{getContractorName(ctr.contractor_id)}</TableCell>
                    <TableCell className="text-sm">{getProjectName(ctr.project_id)}</TableCell>
                    <TableCell className="text-sm">{fmt(ctr.contract_amount)}</TableCell>
                    <TableCell className="text-sm">{ctr.start_date}</TableCell>
                    <TableCell className="text-sm">{ctr.end_date}</TableCell>
                    <TableCell><StatusBadge status={ctr.status} label={statusLabels[ctr.status] || ctr.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => setViewContract(ctr)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض التفاصيل</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleEdit(ctr)}>
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
                              onClick={() => setDeleteTarget(ctr)}
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
              <span className="text-xs text-gray-500">عرض {filtered.length} من {contracts.length} عقد</span>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل عقد مقاول' : 'إضافة عقد مقاول جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم العقد</Label>
                <Input value={form.contract_number} onChange={(e) => setForm({ ...form, contract_number: e.target.value })} placeholder="CONT-2025-..." />
              </div>
              <div className="space-y-2">
                <Label>عنوان العقد</Label>
                <Input value={form.contract_title} onChange={(e) => setForm({ ...form, contract_title: e.target.value })} placeholder="أعمال..." />
              </div>
              <div className="space-y-2">
                <Label>المقاول</Label>
                <Select value={form.contractor_id} onValueChange={(v) => setForm({ ...form, contractor_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر المقاول" /></SelectTrigger>
                  <SelectContent>
                    {contractors.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المشروع</Label>
                <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>قيمة العقد (ر.ق)</Label>
                <Input type="number" value={form.contract_amount} onChange={(e) => setForm({ ...form, contract_amount: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>نسبة التأمين (%)</Label>
                <Input type="number" value={form.retention_percentage} onChange={(e) => setForm({ ...form, retention_percentage: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>الدفعة المقدمة (ر.ق)</Label>
                <Input type="number" value={form.advance_payment} onChange={(e) => setForm({ ...form, advance_payment: Number(e.target.value) })} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>شروط الدفع</Label>
                <Textarea value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} rows={2} placeholder="شروط الدفع..." />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>شروط الجزاءات</Label>
                <Textarea value={form.penalty_terms} onChange={(e) => setForm({ ...form, penalty_terms: e.target.value })} rows={2} placeholder="شروط الجزاءات..." />
              </div>
              <div className="space-y-2">
                <Label>مدة الضمان (شهر)</Label>
                <Input type="number" min={0} max={120} value={form.warranty_period_months} onChange={(e) => setForm({ ...form, warranty_period_months: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>الحالة</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="pending_approval">بانتظار الموافقة</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="suspended">معلق</SelectItem>
                    <SelectItem value="completed">مكتمل</SelectItem>
                    <SelectItem value="terminated">منتهي</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>نطاق العمل</Label>
              <Textarea value={form.scope_of_work} onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })} rows={3} placeholder="وصف نطاق العمل..." />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t.common.cancel}</Button>
            <Button onClick={handleSave}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={!!viewContract} onOpenChange={(open) => { if (!open) setViewContract(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل العقد {viewContract?.contract_number}</DialogTitle>
          </DialogHeader>
          {viewContract && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">رقم العقد</Label>
                  <p className="text-sm font-medium">{viewContract.contract_number}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">عنوان العقد</Label>
                  <p className="text-sm font-medium">{viewContract.contract_title}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">المقاول</Label>
                  <p className="text-sm font-medium">{getContractorName(viewContract.contractor_id)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">المشروع</Label>
                  <p className="text-sm font-medium">{getProjectName(viewContract.project_id)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">قيمة العقد</Label>
                  <p className="text-sm font-medium">{fmt(viewContract.contract_amount)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">نسبة التأمين</Label>
                  <p className="text-sm font-medium">{viewContract.retention_percentage}%</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">الدفعة المقدمة</Label>
                  <p className="text-sm font-medium">{fmt(viewContract.advance_payment)}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">الحالة</Label>
                  <StatusBadge status={viewContract.status} label={statusLabels[viewContract.status] || viewContract.status} />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">تاريخ البداية</Label>
                  <p className="text-sm font-medium">{viewContract.start_date}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">تاريخ النهاية</Label>
                  <p className="text-sm font-medium">{viewContract.end_date}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">مدة الضمان</Label>
                  <p className="text-sm font-medium">{viewContract.warranty_period_months} شهر</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">نطاق العمل</Label>
                  <p className="text-sm">{viewContract.scope_of_work}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">شروط الدفع</Label>
                  <p className="text-sm">{viewContract.payment_terms || '-'}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500">شروط الغرامات</Label>
                  <p className="text-sm">{viewContract.penalty_terms || '-'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewContract(null)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف العقد <strong>{deleteTarget?.contract_number}</strong> ({deleteTarget?.contract_title})؟ لا يمكن التراجع عن هذا الإجراء.
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