import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Filter, Eye, Pencil, Trash2, Plus, FileText, AlertTriangle, X, ShoppingCart, TrendingUp, Clock, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { projectStore, purchaseRequestStore, purchaseOrderStore, getProjectName, rfqStore, vendorQuotationStore } from '@/services/stores';
import { KpiCard } from '@/components/shared/DesignSystem';
import type { PurchaseRequest, PRLineItem } from '@/services/stores';

const priorityLabels: Record<string, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  pending: 'قيد الانتظار',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function PurchaseRequestsPage() {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const projectName = searchParams.get('projectName') || '';
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<PurchaseRequest | null>(null);
  const [viewTarget, setViewTarget] = useState<PurchaseRequest | null>(null);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<PurchaseRequest & { items: PRLineItem[] }>>({
    pr_number: '', project: '', department: '', required_date: '',
    priority: 'medium', justification: '', estimated_total: 0, items: [],
  });

  const fmt = (v: number) => formatQAR(v);

  const allPRs = useMemo(() => {
    const data = purchaseRequestStore.getAll();
    const timer = setTimeout(() => setLoading(false), 300);
    return data;
  }, []);

  const projects = useMemo(() => projectStore.getAll(), []);

  const filtered = useMemo(() => {
    return allPRs.filter((pr) => {
      if (priorityFilter !== 'all' && pr.priority !== priorityFilter) return false;
      const projectName = getProjectName(pr.project) || pr.project;
      if (search && !pr.pr_number.includes(search) && !projectName.includes(search)) return false;
      return true;
    });
  }, [allPRs, search, priorityFilter]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      toast.success('تم نسخ رقم الطلب');
    });
  };

  const openCreate = () => {
    setEditTarget(null);
    const count = allPRs.length;
    setForm({
      pr_number: `PR-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`,
      project: '', department: '', required_date: '',
      priority: 'medium', justification: '', estimated_total: 0, items: [],
    });
    setBudgetWarning(null);
    setShowModal(true);
  };

  const openEdit = (pr: PurchaseRequest) => {
    setEditTarget(pr);
    setForm({
      ...pr,
      items: pr.items ? [...pr.items] : [],
    });
    setBudgetWarning(null);
    setShowModal(true);
  };

  const openView = (pr: PurchaseRequest) => {
    setViewTarget(pr);
  };

  const savePR = () => {
    if (!form.pr_number || !form.project) return;
    const total = (form.items || []).reduce((s, i) => s + (i.total_price || 0), 0);

    const prj = projects.find((p: any) => p.id === form.project);
    if (prj) {
      const remaining = (prj.approved_budget || 0) - (prj.actual_cost || 0);
      if (total > remaining) {
        const warnMsg = `تحذير: المبلغ التقديري (${fmt(total)}) يتجاوز الميزانية المتبقية للمشروع (${fmt(remaining)})`;
        setBudgetWarning(warnMsg);
      } else {
        setBudgetWarning(null);
      }
    }

    const items: PRLineItem[] = (form.items || []).map(item => ({
      item_name: item.item_name || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      unit: item.unit || 'حبة',
      unit_price: item.unit_price || 0,
      total_price: item.total_price || ((item.quantity || 0) * (item.unit_price || 0)),
    }));

    if (editTarget) {
      purchaseRequestStore.update(editTarget.id, {
        pr_number: form.pr_number || '',
        project: form.project || '',
        department: form.department || '',
        required_date: form.required_date || '',
        priority: form.priority || 'medium',
        justification: form.justification || '',
        estimated_total: total,
        items,
      });
      toast.success('تم تحديث طلب الشراء بنجاح');
    } else {
      purchaseRequestStore.create({
        pr_number: form.pr_number || '',
        project: form.project || '',
        department: form.department || '',
        required_date: form.required_date || '',
        priority: form.priority || 'medium',
        justification: form.justification || '',
        estimated_total: total,
        items,
        status: 'draft',
      });
      toast.success('تم إنشاء طلب الشراء بنجاح');
    }
    setShowModal(false);
    setEditTarget(null);
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...(prev.items || []), { item_name: '', description: '', quantity: 1, unit: 'حبة', unit_price: 0, total_price: 0 }],
    }));
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setForm((prev) => {
      const items = [...(prev.items || [])];
      const item = { ...items[index], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        item.total_price = (item.quantity || 0) * (item.unit_price || 0);
      }
      items[index] = item;
      const total = items.reduce((s, i) => s + (i.total_price || 0), 0);
      return { ...prev, items, estimated_total: total };
    });
  };

  const removeItem = (index: number) => {
    setForm((prev) => {
      const items = (prev.items || []).filter((_, i) => i !== index);
      const total = items.reduce((s, i) => s + (i.total_price || 0), 0);
      return { ...prev, items, estimated_total: total };
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    purchaseRequestStore.remove(deleteTarget.id);
    toast.success(`تم حذف طلب الشراء ${deleteTarget.pr_number} بنجاح`);
    setDeleteTarget(null);
  };

  const handleSubmit = (pr: PurchaseRequest) => {
    purchaseRequestStore.update(pr.id, { status: 'pending' });
    toast.success(`تم تقديم طلب الشراء ${pr.pr_number} للمراجعة`);
  };

  const handleApprove = (pr: PurchaseRequest) => {
    // Budget validation
    const project = projectStore.getById(pr.project);
    if (project) {
      const projectBudget = (project as any).approved_budget || (project as any).estimated_budget || 0;
      const projectCost = (project as any).actual_cost || 0;
      const existingApproved = allPRs
        .filter((p: any) => p.project === pr.project && p.id !== pr.id && (p.status === 'approved' || p.status === 'pending'))
        .reduce((s: number, p: any) => s + (p.estimated_total || 0), 0);
      const remaining = projectBudget - projectCost - existingApproved;
      if (pr.estimated_total > remaining && remaining >= 0) {
        toast.error(`الميزانية غير كافية. المتبقي: ${formatQARInt(remaining)} من ${formatQARInt(projectBudget)}`);
        return;
      }
    }
    purchaseRequestStore.update(pr.id, { status: 'approved' });
    toast.success(`تم اعتماد طلب الشراء ${pr.pr_number}`);
  };

  const handleReject = (pr: PurchaseRequest) => {
    purchaseRequestStore.update(pr.id, { status: 'rejected' });
    toast.success(`تم رفض طلب الشراء ${pr.pr_number}`);
  };

  // Convert approved PR to Purchase Order
  const handleConvertToPO = (pr: PurchaseRequest) => {
    const yearCode = new Date().getFullYear();
    const existing = purchaseOrderStore.getAll();
    const count = existing.filter((p: any) => p.po_number?.includes(String(yearCode))).length + 1;
    const poNumber = `PO-${yearCode}-${String(count).padStart(3, '0')}`;
    const projectName = getProjectName(pr.project) || pr.project;

    const po = purchaseOrderStore.create({
      po_number: poNumber,
      pr_id: pr.id,
      pr_number: pr.pr_number,
      vendor: '',
      project: projectName,
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery: pr.required_date,
      total_amount: pr.estimated_total,
      status: 'draft',
      receipt_status: 'none',
      payment_status: 'unpaid',
      delivery_location: '',
      notes: `تم إنشاؤه تلقائياً من طلب الشراء ${pr.pr_number}`,
      items: (pr.items || []).map((item: any) => ({
        itemName: item.item_name,
        description: item.description || '',
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unit_price,
        total: item.total_price,
      })),
    } as any);

    purchaseRequestStore.update(pr.id, { linked_po_id: po.id, linked_po_number: poNumber } as any);
    toast.success(`تم إنشاء أمر الشراء ${poNumber} من طلب الشراء ${pr.pr_number}`);
    navigate(`/procurement/orders`);
  };

  // Create RFQ from approved PR
  const handleCreateRFQ = (pr: PurchaseRequest) => {
    const yearCode = new Date().getFullYear();
    const existing = rfqStore.getAll();
    const count = existing.filter((r: any) => r.rfq_number?.includes(String(yearCode))).length + 1;
    const rfqNumber = `RFQ-${yearCode}-${String(count).padStart(3, '0')}`;

    const rfq = rfqStore.create({
      rfq_number: rfqNumber,
      pr_id: pr.id,
      pr_number: pr.pr_number,
      project_id: pr.project,
      title: `طلب عروض أسعار - ${pr.pr_number}`,
      description: pr.justification || '',
      status: 'draft',
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: (pr.items || []).map((item: any) => ({
        item_name: item.item_name,
        description: item.description || '',
        quantity: item.quantity,
        unit: item.unit,
      })),
      total_estimated: pr.estimated_total,
    } as any);

    toast.success(`تم إنشاء طلب عروض الأسعار ${rfqNumber}`);
    navigate(`/procurement/quotation-comparison?rfqId=${rfq.id}&rfqNumber=${rfqNumber}&prId=${pr.id}`);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">طلبات الشراء</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {filtered.length} طلب — إدارة طلبات الشراء والموافقات
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4 shadow-sm shadow-blue-500/20 transition-all hover:shadow-md hover:shadow-blue-500/30"
        >
          <Plus className="h-4 w-4" />
          طلب شراء جديد
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
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-lg border-gray-200">
              <Filter className="h-4 w-4 ml-2" />
              <SelectValue placeholder="الأولوية" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأولويات</SelectItem>
              <SelectItem value="urgent">عاجلة</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="low">منخفضة</SelectItem>
            </SelectContent>
          </Select>
          {(search || priorityFilter !== 'all') && (
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
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">رقم الطلب</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المشروع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الأولوية</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">تاريخ الاحتياج</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">المبلغ التقديري</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9">الحالة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-9 w-[180px]">{t.common.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <FileText className="h-7 w-7 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">لا توجد طلبات شراء</p>
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
                {filtered.map((pr) => (
                  <TableRow
                    key={pr.id}
                    className=""
                  >
                    <TableCell className="font-medium text-sm">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCopyCode(pr.pr_number); }}
                            className="text-[#3B82F6] hover:text-blue-700 font-mono text-xs transition-colors cursor-pointer"
                          >
                            {pr.pr_number}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>اضغط للنسخ</TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm text-gray-800">{getProjectName(pr.project) || pr.project}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[pr.priority] || 'bg-gray-100 text-gray-700'}`}>
                        {priorityLabels[pr.priority] || pr.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">{pr.required_date}</TableCell>
                    <TableCell className="text-sm font-mono text-gray-700">{fmt(pr.estimated_total)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={pr.status}
                        label={statusLabels[pr.status] || pr.status}
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                              onClick={() => openView(pr)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>عرض</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost" size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                              onClick={() => openEdit(pr)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>تعديل</TooltipContent>
                        </Tooltip>
                        {pr.status === 'draft' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
                                onClick={() => handleSubmit(pr)}
                              >
                                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7"/></svg>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>تقديم</TooltipContent>
                          </Tooltip>
                        )}
                        {pr.status === 'pending' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
                                  onClick={() => handleApprove(pr)}
                                >
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12l5 5L20 7"/></svg>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>اعتماد</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost" size="sm"
                                  className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleReject(pr)}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>رفض</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                        {/* Workflow: Convert to PO for approved PRs */}
                        {pr.status === 'approved' && !pr.linked_po_id && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 px-2 text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-semibold gap-1"
                                onClick={() => handleConvertToPO(pr)}
                              >
                                <ArrowRight className="h-3 w-3" />PO
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>تحويل إلى أمر شراء</TooltipContent>
                          </Tooltip>
                        )}
                        {/* Workflow: RFQ link for approved PRs */}
                        {pr.status === 'approved' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 px-2 text-[10px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-semibold gap-1"
                                onClick={() => handleCreateRFQ(pr)}
                              >
                                <FileText className="h-3 w-3" />RFQ
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>طلب عروض أسعار</TooltipContent>
                          </Tooltip>
                        )}
                        {/* Show linked PO indicator */}
                        {pr.linked_po_number && (
                          <span className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded font-semibold">
                            {pr.linked_po_number}
                          </span>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteTarget(pr)}
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
              <span className="text-xs text-gray-500">عرض {filtered.length} من {allPRs.length} طلب</span>
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
              هل أنت متأكد من حذف طلب الشراء <strong>{deleteTarget?.pr_number}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Modal */}
      <Dialog open={!!viewTarget} onOpenChange={(open) => { if (!open) setViewTarget(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب الشراء — {viewTarget?.pr_number}</DialogTitle>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><span className="text-gray-500">المشروع:</span> <span className="font-medium">{getProjectName(viewTarget.project) || viewTarget.project}</span></div>
                <div><span className="text-gray-500">القسم:</span> <span className="font-medium">{viewTarget.department}</span></div>
                <div><span className="text-gray-500">تاريخ الاحتياج:</span> <span className="font-medium">{viewTarget.required_date}</span></div>
                <div><span className="text-gray-500">الأولوية:</span> <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[viewTarget.priority] || ''}`}>{priorityLabels[viewTarget.priority]}</span></div>
                <div><span className="text-gray-500">المبلغ التقديري:</span> <span className="font-medium font-mono">{fmt(viewTarget.estimated_total)}</span></div>
                <div><span className="text-gray-500">الحالة:</span> <StatusBadge status={viewTarget.status} label={statusLabels[viewTarget.status] || viewTarget.status} /></div>
              </div>
              <div><span className="text-gray-500 text-sm">المبرر:</span> <p className="text-sm mt-1">{viewTarget.justification}</p></div>
              {viewTarget.items && viewTarget.items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">بنود الطلب</h4>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-right p-2">الصنف</th>
                          <th className="text-right p-2">الوصف</th>
                          <th className="text-center p-2 w-20">الكمية</th>
                          <th className="text-center p-2 w-20">الوحدة</th>
                          <th className="text-right p-2 w-28">سعر الوحدة</th>
                          <th className="text-right p-2 w-28">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewTarget.items.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{item.item_name}</td>
                            <td className="p-2 text-gray-500">{item.description}</td>
                            <td className="p-2 text-center">{item.quantity}</td>
                            <td className="p-2 text-center">{item.unit}</td>
                            <td className="p-2 text-right font-mono">{fmt(item.unit_price)}</td>
                            <td className="p-2 text-right font-mono font-bold">{fmt(item.total_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/50">
                        <tr>
                          <td colSpan={5} className="p-2 text-right font-semibold">الإجمالي التقديري</td>
                          <td className="p-2 text-right font-bold font-mono">{fmt(viewTarget.estimated_total)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create / Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'تعديل طلب شراء' : 'طلب شراء جديد'}</DialogTitle>
          </DialogHeader>
          {budgetWarning && (
            <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 rounded-lg p-3 flex items-start gap-2 text-sm">
              <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span>{budgetWarning}</span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>رقم الطلب</Label>
              <Input value={form.pr_number} onChange={(e) => setForm({ ...form, pr_number: e.target.value })} />
            </div>
            <div>
              <Label>المشروع *</Label>
              <Select value={form.project || ''} onValueChange={(v) => setForm({ ...form, project: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المشروع" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>القسم</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div>
              <Label>تاريخ الاحتياج</Label>
              <Input type="date" value={form.required_date} onChange={(e) => setForm({ ...form, required_date: e.target.value })} />
            </div>
            <div>
              <Label>الأولوية</Label>
              <Select value={form.priority || 'medium'} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">منخفضة</SelectItem>
                  <SelectItem value="medium">متوسطة</SelectItem>
                  <SelectItem value="high">عالية</SelectItem>
                  <SelectItem value="urgent">عاجلة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3">
              <Label>المبرر</Label>
              <Textarea
                value={form.justification}
                onChange={(e) => setForm({ ...form, justification: e.target.value })}
                placeholder="أسباب طلب الشراء..."
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">بنود الطلب</h4>
              <Button variant="outline" size="sm" onClick={addItem}>+ إضافة بند</Button>
            </div>
            {(!form.items || form.items.length === 0) ? (
              <div className="border rounded-lg p-6 text-center text-muted-foreground text-sm">
                لا توجد بنود. اضغط "إضافة بند" للإضافة.
              </div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-right p-2">الصنف</th>
                      <th className="text-right p-2">الوصف</th>
                      <th className="text-center p-2 w-24">الكمية</th>
                      <th className="text-center p-2 w-20">الوحدة</th>
                      <th className="text-right p-2 w-32">سعر الوحدة</th>
                      <th className="text-right p-2 w-32">الإجمالي</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.items || []).map((item: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="p-1">
                          <Input className="h-8 text-sm" value={item.item_name} onChange={(e) => updateItem(i, 'item_name', e.target.value)} />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-sm" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-sm text-center" type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-sm" value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} />
                        </td>
                        <td className="p-1">
                          <Input className="h-8 text-sm text-right font-mono" type="number" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', Number(e.target.value))} />
                        </td>
                        <td className="p-1 text-right font-mono font-bold px-2">{fmt(item.total_price || 0)}</td>
                        <td className="p-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => removeItem(i)}>✕</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/50">
                    <tr>
                      <td colSpan={5} className="p-2 text-right font-semibold">الإجمالي التقديري</td>
                      <td className="p-2 text-right font-bold font-mono">{fmt(form.estimated_total || 0)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>{t.common.cancel}</Button>
            <Button onClick={savePR}>{t.common.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
