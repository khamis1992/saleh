import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, Filter, Eye, Pencil, Trash2, Plus, FileText, AlertTriangle, X, ShoppingCart, TrendingUp,
  TrendingDown, Clock, CheckCircle2, ArrowRight, HardHat, Sparkles, Users, RotateCcw, Download,
  Send, Ban, Activity, DollarSign, Award,
} from 'lucide-react';
import {
  projectStore, purchaseRequestStore, purchaseOrderStore, getProjectName, rfqStore,
} from '@/services/stores';
import type { PurchaseRequest, PRLineItem } from '@/services/stores';

const fmt = formatQAR;
const fmtInt = formatQARInt;

const priorityLabels: Record<string, string> = {
  low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة',
};

const statusLabels: Record<string, string> = {
  draft: 'مسودة', pending: 'قيد الانتظار', approved: 'معتمد', rejected: 'مرفوض',
};

const priorityConfig: Record<string, { dot: string; chip: string }> = {
  low:    { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-700 ring-1 ring-gray-100' },
  medium: { dot: 'bg-blue-500', chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-100' },
  high:   { dot: 'bg-orange-500', chip: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100' },
  urgent: { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
};

const statusConfig: Record<string, { dot: string; chip: string }> = {
  draft:    { dot: 'bg-gray-400', chip: 'bg-gray-50 text-gray-700 ring-1 ring-gray-100' },
  pending:  { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100' },
  approved: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' },
  rejected: { dot: 'bg-red-500', chip: 'bg-red-50 text-red-700 ring-1 ring-red-100' },
};

/* ── KPI Card ── */
function KpiCard({ label, value, sub, icon: Icon, accent, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; accent: string; trend?: { val: number; dir: 'up' | 'down' };
}) {
  const accentMap: Record<string, { iconBg: string; iconColor: string }> = {
    blue:   { iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    amber:  { iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    emerald:{ iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
    rose:   { iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
    violet: { iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
    slate:  { iconBg: 'bg-slate-50', iconColor: 'text-slate-600' },
    indigo: { iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600' },
  };
  const a = accentMap[accent] || accentMap.slate;
  return (
    <div className="relative bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-sm hover:-translate-y-0.5">
      <div className="flex items-start justify-between mb-2.5">
        <div className={`h-9 w-9 rounded-lg ${a.iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${a.iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            trend.dir === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
          }`}>
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

/* ── PR Card ── */
function PRCard({ pr, onDelete, onView, onEdit, onSubmit, onApprove, onReject, onConvertToPO, onCreateRFQ }: {
  pr: PurchaseRequest; onDelete: (p: PurchaseRequest) => void;
  onView: (p: PurchaseRequest) => void; onEdit: (p: PurchaseRequest) => void;
  onSubmit: (p: PurchaseRequest) => void; onApprove: (p: PurchaseRequest) => void;
  onReject: (p: PurchaseRequest) => void; onConvertToPO: (p: PurchaseRequest) => void;
  onCreateRFQ: (p: PurchaseRequest) => void;
}) {
  const prio = priorityConfig[pr.priority] || priorityConfig.medium;
  const stat = statusConfig[pr.status] || statusConfig.draft;
  const navigate = useNavigate();

  return (
    <div className="group relative bg-white rounded-xl border border-gray-100 p-5 transition-all duration-200 hover:border-gray-200 hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)]">
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] rounded-t-xl opacity-60 ${pr.priority === 'urgent' ? 'bg-red-500' : pr.priority === 'high' ? 'bg-orange-500' : pr.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-300'}`} />

      {/* Header */}
      <div className="flex items-start justify-between mb-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 truncate">{pr.pr_number}</div>
            <div className="text-[11px] text-gray-400 mt-0.5 truncate">{getProjectName(pr.project) || pr.project}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${prio.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${prio.dot}`} />
            {priorityLabels[pr.priority] || pr.priority}
          </span>
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${stat.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
            {statusLabels[pr.status] || pr.status}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-gray-500 mb-3.5">
        <span className="flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-gray-400" />
          {pr.required_date || '—'}
        </span>
        {pr.department && (
          <span className="flex items-center gap-1.5">
            <Users className="h-3 w-3 text-gray-400" />
            {pr.department}
          </span>
        )}
      </div>

      {/* Amount */}
      <div className="bg-gray-50 rounded-lg p-3 mb-3.5">
        <div className="text-[10px] text-gray-400 mb-0.5">المبلغ التقديري</div>
        <div className="text-lg font-bold text-gray-900 ltr-only tabular-nums">{fmt(pr.estimated_total)}</div>
      </div>

      {/* Items summary */}
      {pr.items && pr.items.length > 0 && (
        <div className="text-[11px] text-gray-500 mb-3.5 flex items-center gap-1.5">
          <FileText className="h-3 w-3 text-gray-400" />
          {pr.items.length} بند
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 pt-2 border-t border-gray-50" onClick={e => e.stopPropagation()}>
        <button onClick={() => onView(pr)} className="h-7 w-7 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center">
          <Eye className="h-3.5 w-3.5" />
        </button>
        {pr.status === 'draft' && (
          <>
            <button onClick={() => onEdit(pr)} className="h-7 w-7 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onSubmit(pr)} className="h-7 w-7 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center">
              <Send className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {pr.status === 'pending' && (
          <>
            <button onClick={() => onApprove(pr)} className="h-7 w-7 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => onReject(pr)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
              <Ban className="h-3.5 w-3.5" />
            </button>
          </>
        )}
        {pr.status === 'approved' && !pr.linked_po_id && (
          <>
            <button onClick={() => onConvertToPO(pr)} className="h-7 px-2 rounded-md text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />PO
            </button>
            <button onClick={() => onCreateRFQ(pr)} className="h-7 px-2 rounded-md text-[10px] font-bold text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors flex items-center gap-1">
              <FileText className="h-3 w-3" />RFQ
            </button>
          </>
        )}
        {pr.linked_po_number && (
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
            {pr.linked_po_number}
          </span>
        )}
        <button onClick={() => onDelete(pr)} className="h-7 w-7 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ── PR List Row ── */
function PRListRow({ pr, onDelete, onView, onEdit, onSubmit, onApprove, onReject, onConvertToPO, onCreateRFQ }: {
  pr: PurchaseRequest; onDelete: (p: PurchaseRequest) => void;
  onView: (p: PurchaseRequest) => void; onEdit: (p: PurchaseRequest) => void;
  onSubmit: (p: PurchaseRequest) => void; onApprove: (p: PurchaseRequest) => void;
  onReject: (p: PurchaseRequest) => void; onConvertToPO: (p: PurchaseRequest) => void;
  onCreateRFQ: (p: PurchaseRequest) => void;
}) {
  const prio = priorityConfig[pr.priority] || priorityConfig.medium;
  const stat = statusConfig[pr.status] || statusConfig.draft;
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm">
      <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100 flex items-center justify-center shrink-0">
        <ShoppingCart className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
        <div className="min-w-0">
          <div className="text-sm font-bold text-gray-900 truncate">{pr.pr_number}</div>
          <div className="text-[11px] text-gray-400 truncate">{getProjectName(pr.project) || pr.project}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 h-7 px-2.5 rounded-md text-[11px] font-bold ${prio.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${prio.dot}`} />
            {priorityLabels[pr.priority] || pr.priority}
          </span>
        </div>
        <div className="text-xs text-gray-600">{pr.required_date || '—'}</div>
        <div className="text-xs font-bold text-gray-800 ltr-only tabular-nums">{fmtInt(pr.estimated_total)}</div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[11px] font-bold ${stat.chip}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${stat.dot}`} />
            {statusLabels[pr.status] || pr.status}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={() => onView(pr)} className="h-8 w-8 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"><Eye className="h-4 w-4" /></button>
        {pr.status === 'draft' && (
          <>
            <button onClick={() => onEdit(pr)} className="h-8 w-8 rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors flex items-center justify-center"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => onSubmit(pr)} className="h-8 w-8 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center"><Send className="h-4 w-4" /></button>
          </>
        )}
        {pr.status === 'pending' && (
          <>
            <button onClick={() => onApprove(pr)} className="h-8 w-8 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-center"><CheckCircle2 className="h-4 w-4" /></button>
            <button onClick={() => onReject(pr)} className="h-8 w-8 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Ban className="h-4 w-4" /></button>
          </>
        )}
        {pr.status === 'approved' && !pr.linked_po_id && (
          <>
            <button onClick={() => onConvertToPO(pr)} className="h-8 px-2 rounded-md text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1"><ArrowRight className="h-3 w-3" />PO</button>
            <button onClick={() => onCreateRFQ(pr)} className="h-8 px-2 rounded-md text-[10px] font-bold text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-1"><FileText className="h-3 w-3" />RFQ</button>
          </>
        )}
        {pr.linked_po_number && <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{pr.linked_po_number}</span>}
        <button onClick={() => onDelete(pr)} className="h-8 w-8 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

/* ── Empty State ── */
function EmptyPRs({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 bg-white rounded-xl border border-gray-100">
      <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
        <ShoppingCart className="h-8 w-8 text-gray-300" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-gray-700">لا توجد طلبات شراء</p>
        <p className="text-xs text-gray-400 mt-1">لم يتم العثور على نتائج تطابق فلاتر البحث</p>
      </div>
      <Button variant="outline" size="sm" onClick={onReset} className="h-8 text-xs rounded-lg gap-1">
        <RotateCcw className="h-3.5 w-3.5" /> مسح الفلاتر
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export default function ProcurementRequestsPage() {
  const { t, dir } = useLocale();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const projectName = searchParams.get('projectName') || '';
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<PurchaseRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<PurchaseRequest | null>(null);
  const [viewTarget, setViewTarget] = useState<PurchaseRequest | null>(null);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const [form, setForm] = useState<Partial<PurchaseRequest & { items: PRLineItem[] }>>({
    pr_number: '', project: '', department: '', required_date: '',
    priority: 'medium', justification: '', estimated_total: 0, items: [],
  });

  const allPRs = useMemo(() => purchaseRequestStore.getAll(), []);
  const projects = useMemo(() => projectStore.getAll(), []);

  const filtered = useMemo(() => {
    return allPRs.filter((pr) => {
      if (priorityFilter !== 'all' && pr.priority !== priorityFilter) return false;
      const projectName = getProjectName(pr.project) || pr.project;
      if (search && !pr.pr_number.includes(search) && !projectName.includes(search)) return false;
      return true;
    });
  }, [allPRs, search, priorityFilter]);

  // KPIs
  const pendingCount = allPRs.filter((p: any) => p.status === 'pending').length;
  const approvedCount = allPRs.filter((p: any) => p.status === 'approved').length;
  const totalEstimated = allPRs.reduce((s: number, p: any) => s + (p.estimated_total || 0), 0);
  const urgentCount = allPRs.filter((p: any) => p.priority === 'urgent' && p.status !== 'approved' && p.status !== 'rejected').length;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success('تم نسخ رقم الطلب'));
  };

  const openCreate = () => {
    setEditTarget(null);
    const count = allPRs.length;
    setForm({
      pr_number: `PR-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`,
      project: projectId || '', department: '', required_date: '',
      priority: 'medium', justification: '', estimated_total: 0, items: [],
    });
    setBudgetWarning(null);
    setShowModal(true);
  };

  const openEdit = (pr: PurchaseRequest) => {
    setEditTarget(pr);
    setForm({ ...pr, items: pr.items ? [...pr.items] : [] });
    setBudgetWarning(null);
    setShowModal(true);
  };

  const openView = (pr: PurchaseRequest) => setViewTarget(pr);

  const savePR = () => {
    if (!form.pr_number || !form.project) return;
    const total = (form.items || []).reduce((s, i) => s + (i.total_price || 0), 0);
    const prj = projects.find((p: any) => p.id === form.project);
    if (prj) {
      const remaining = (prj.approved_budget || 0) - (prj.actual_cost || 0);
      if (total > remaining) {
        setBudgetWarning(`تحذير: المبلغ التقديري (${fmt(total)}) يتجاوز الميزانية المتبقية للمشروع (${fmt(remaining)})`);
      } else {
        setBudgetWarning(null);
      }
    }
    const items: PRLineItem[] = (form.items || []).map(item => ({
      item_name: item.item_name || '', description: item.description || '',
      quantity: item.quantity || 1, unit: item.unit || 'حبة',
      unit_price: item.unit_price || 0, total_price: item.total_price || ((item.quantity || 0) * (item.unit_price || 0)),
    }));
    if (editTarget) {
      purchaseRequestStore.update(editTarget.id, {
        pr_number: form.pr_number || '', project: form.project || '', department: form.department || '',
        required_date: form.required_date || '', priority: form.priority || 'medium',
        justification: form.justification || '', estimated_total: total, items,
      });
      toast.success('تم تحديث طلب الشراء بنجاح');
    } else {
      purchaseRequestStore.create({
        pr_number: form.pr_number || '', project: form.project || '', department: form.department || '',
        required_date: form.required_date || '', priority: form.priority || 'medium',
        justification: form.justification || '', estimated_total: total, items, status: 'draft',
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
    const project = projectStore.getById(pr.project);
    if (project) {
      const projectBudget = (project as any).approved_budget || (project as any).estimated_budget || 0;
      const projectCost = (project as any).actual_cost || 0;
      const existingApproved = allPRs
        .filter((p: any) => p.project === pr.project && p.id !== pr.id && (p.status === 'approved' || p.status === 'pending'))
        .reduce((s: number, p: any) => s + (p.estimated_total || 0), 0);
      const remaining = projectBudget - projectCost - existingApproved;
      if (pr.estimated_total > remaining && remaining >= 0) {
        toast.error(`الميزانية غير كافية. المتبقي: ${fmtInt(remaining)} من ${fmtInt(projectBudget)}`);
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

  const handleConvertToPO = (pr: PurchaseRequest) => {
    const yearCode = new Date().getFullYear();
    const existing = purchaseOrderStore.getAll();
    const count = existing.filter((p: any) => p.po_number?.includes(String(yearCode))).length + 1;
    const poNumber = `PO-${yearCode}-${String(count).padStart(3, '0')}`;
    const projectName = getProjectName(pr.project) || pr.project;
    const po = purchaseOrderStore.create({
      po_number: poNumber, pr_id: pr.id, pr_number: pr.pr_number, vendor: '', project: projectName,
      order_date: new Date().toISOString().split('T')[0], expected_delivery: pr.required_date,
      total_amount: pr.estimated_total, status: 'draft', receipt_status: 'none', payment_status: 'unpaid',
      delivery_location: '', notes: `تم إنشاؤه تلقائياً من طلب الشراء ${pr.pr_number}`,
      items: (pr.items || []).map((item: any) => ({
        itemName: item.item_name, description: item.description || '', quantity: item.quantity,
        unit: item.unit, unitPrice: item.unit_price, total: item.total_price,
      })),
    } as any);
    purchaseRequestStore.update(pr.id, { linked_po_id: po.id, linked_po_number: poNumber } as any);
    toast.success(`تم إنشاء أمر الشراء ${poNumber} من طلب الشراء ${pr.pr_number}`);
    navigate('/procurement/orders');
  };

  const handleCreateRFQ = (pr: PurchaseRequest) => {
    const yearCode = new Date().getFullYear();
    const existing = rfqStore.getAll();
    const count = existing.filter((r: any) => r.rfq_number?.includes(String(yearCode))).length + 1;
    const rfqNumber = `RFQ-${yearCode}-${String(count).padStart(3, '0')}`;
    const rfq = rfqStore.create({
      rfq_number: rfqNumber, pr_id: pr.id, pr_number: pr.pr_number, project_id: pr.project,
      title: `طلب عروض أسعار - ${pr.pr_number}`, description: pr.justification || '', status: 'draft',
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: (pr.items || []).map((item: any) => ({
        item_name: item.item_name, description: item.description || '', quantity: item.quantity, unit: item.unit,
      })),
      total_estimated: pr.estimated_total,
    } as any);
    toast.success(`تم إنشاء طلب عروض الأسعار ${rfqNumber}`);
    navigate(`/procurement/quotation-comparison?rfqId=${rfq.id}&rfqNumber=${rfqNumber}&prId=${pr.id}`);
  };

  const navigate = useNavigate();

  const resetFilters = () => { setSearch(''); setPriorityFilter('all'); };

  return (
    <div className="min-h-full bg-[#fafbfc]" dir={dir}>
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <ShoppingCart className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:flex flex-col leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-blue-600">المشتريات</span>
              <span className="text-[13px] font-bold text-gray-900">{allPRs.length} طلب</span>
            </div>
          </div>

          <div className="h-6 w-px bg-gray-200 hidden md:block" />

          <div className="relative flex-1 max-w-xs">
            <Search className="absolute end-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            <Input placeholder="ابحث في طلبات الشراء..." value={search} onChange={e => setSearch(e.target.value)}
              className="pe-9 ps-3 h-8 text-xs rounded-lg border-gray-200 bg-gray-50/60 focus:bg-white transition-colors" />
            {search && (
              <button onClick={() => setSearch('')} className="absolute start-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-[11px] text-gray-500">
            <span>إجمالي تقديري:</span>
            <span className="font-bold text-gray-900 ltr-only tabular-nums">{fmtInt(totalEstimated)}</span>
          </div>

          <div className="me-auto" />

          {/* View switcher */}
          <div className="flex items-center bg-gray-100/80 rounded-lg p-0.5" role="tablist">
            {([
              { key: 'list', label: 'قائمة', icon: FileText },
              { key: 'grid', label: 'بطاقات', icon: Sparkles },
            ] as const).map(v => (
              <button key={v.key} onClick={() => setViewMode(v.key)} role="tab" aria-selected={viewMode === v.key}
                className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded-md text-[11px] font-bold transition-all ${
                  viewMode === v.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}>
                <v.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>

          <Button onClick={openCreate}
            className="h-8 px-3 gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-[11px] font-bold rounded-lg shadow-sm">
            <Plus className="h-3.5 w-3.5" />
            <span>طلب شراء جديد</span>
          </Button>
        </div>
      </div>

      {/* ── Page Content ── */}
      <div className="max-w-[1640px] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="إجمالي الطلبات" value={allPRs.length} sub={`${filtered.length} معروض`} icon={ShoppingCart} accent="slate" />
          <KpiCard label="قيد الانتظار" value={pendingCount} sub="بانتظار الاعتماد" icon={Clock} trend={{ val: pendingCount > 0 ? 8 : 0, dir: pendingCount > 0 ? 'down' : 'up' }} accent="amber" />
          <KpiCard label="معتمدة" value={approvedCount} sub="جاهزة للتحويل" icon={Award} accent="emerald" />
          <KpiCard label="عاجلة" value={urgentCount} sub="تحتاج متابعة" icon={AlertTriangle} trend={{ val: urgentCount, dir: 'down' }} accent="rose" />
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-900">طلبات الشراء</h2>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}
                className="h-8 text-xs rounded-lg gap-1 border-gray-200 text-gray-600 hover:bg-gray-50">
                <RotateCcw className="h-3.5 w-3.5" /> إعادة
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs rounded-lg border-gray-200 bg-white">
                <Filter className="h-3 w-3 ml-1" /><SelectValue placeholder="الأولوية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأولويات</SelectItem>
                <SelectItem value="urgent">عاجلة</SelectItem>
                <SelectItem value="high">عالية</SelectItem>
                <SelectItem value="medium">متوسطة</SelectItem>
                <SelectItem value="low">منخفضة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Content ── */}
        {filtered.length === 0 ? (
          <EmptyPRs onReset={resetFilters} />
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filtered.map(pr => (
              <PRCard key={pr.id} pr={pr} onDelete={setDeleteTarget} onView={openView} onEdit={openEdit}
                onSubmit={handleSubmit} onApprove={handleApprove} onReject={handleReject}
                onConvertToPO={handleConvertToPO} onCreateRFQ={handleCreateRFQ} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(pr => (
              <PRListRow key={pr.id} pr={pr} onDelete={setDeleteTarget} onView={openView} onEdit={openEdit}
                onSubmit={handleSubmit} onApprove={handleApprove} onReject={handleReject}
                onConvertToPO={handleConvertToPO} onCreateRFQ={handleCreateRFQ} />
            ))}
          </div>
        )}

        {/* ── Result meta ── */}
        <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
          <span>عرض {filtered.length} من {allPRs.length} طلب</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            مفلتر محلياً
          </span>
        </div>
      </div>

      {/* ── Delete Dialog ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-6 w-full max-w-sm" dir={dir} onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-lg bg-rose-50 ring-1 ring-rose-100 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">تأكيد الحذف</h3>
                <p className="text-xs text-gray-500 mt-0.5">لا يمكن التراجع عن هذا الإجراء</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              هل أنت متأكد من حذف طلب الشراء <strong className="text-gray-900">{deleteTarget.pr_number}</strong>؟
            </p>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} className="h-9 text-xs rounded-lg border-gray-200">إلغاء</Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="h-9 text-xs rounded-lg bg-rose-600 hover:bg-rose-700 text-white">حذف</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
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
                <div>
                  <span className="text-gray-500">الأولوية:</span>
                  <span className={`inline-flex items-center gap-1 me-2 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${(priorityConfig[viewTarget.priority] || priorityConfig.medium).chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${(priorityConfig[viewTarget.priority] || priorityConfig.medium).dot}`} />
                    {priorityLabels[viewTarget.priority] || viewTarget.priority}
                  </span>
                </div>
                <div><span className="text-gray-500">المبلغ التقديري:</span> <span className="font-medium font-mono">{fmt(viewTarget.estimated_total)}</span></div>
                <div>
                  <span className="text-gray-500">الحالة:</span>
                  <span className={`inline-flex items-center gap-1 me-2 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${(statusConfig[viewTarget.status] || statusConfig.draft).chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${(statusConfig[viewTarget.status] || statusConfig.draft).dot}`} />
                    {statusLabels[viewTarget.status] || viewTarget.status}
                  </span>
                </div>
              </div>
              <div><span className="text-gray-500 text-sm">المبرر:</span> <p className="text-sm mt-1">{viewTarget.justification}</p></div>
              {viewTarget.items && viewTarget.items.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">بنود الطلب</h4>
                  <div className="border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-right p-2">الصنف</th><th className="text-right p-2">الوصف</th>
                          <th className="text-center p-2 w-20">الكمية</th><th className="text-center p-2 w-20">الوحدة</th>
                          <th className="text-right p-2 w-28">سعر الوحدة</th><th className="text-right p-2 w-28">الإجمالي</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewTarget.items.map((item, i) => (
                          <tr key={i} className="border-t">
                            <td className="p-2">{item.item_name}</td><td className="p-2 text-gray-500">{item.description}</td>
                            <td className="p-2 text-center">{item.quantity}</td><td className="p-2 text-center">{item.unit}</td>
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

      {/* ── Create / Edit Modal ── */}
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
            <div><Label>رقم الطلب</Label><Input value={form.pr_number} onChange={(e) => setForm({ ...form, pr_number: e.target.value })} /></div>
            <div><Label>المشروع *</Label><Select value={form.project || ''} onValueChange={(v) => setForm({ ...form, project: v })}><SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger><SelectContent>{projects.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.project_name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label>القسم</Label><Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} /></div>
            <div><Label>تاريخ الاحتياج</Label><Input type="date" value={form.required_date} onChange={(e) => setForm({ ...form, required_date: e.target.value })} /></div>
            <div><Label>الأولوية</Label><Select value={form.priority || 'medium'} onValueChange={(v) => setForm({ ...form, priority: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">منخفضة</SelectItem><SelectItem value="medium">متوسطة</SelectItem><SelectItem value="high">عالية</SelectItem><SelectItem value="urgent">عاجلة</SelectItem></SelectContent></Select></div>
            <div className="col-span-3"><Label>المبرر</Label><Textarea value={form.justification} onChange={(e) => setForm({ ...form, justification: e.target.value })} placeholder="أسباب طلب الشراء..." /></div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">بنود الطلب</h4>
              <Button variant="outline" size="sm" onClick={addItem}>+ إضافة بند</Button>
            </div>
            {(!form.items || form.items.length === 0) ? (
              <div className="border rounded-lg p-6 text-center text-muted-foreground text-sm">لا توجد بنود. اضغط "إضافة بند" للإضافة.</div>
            ) : (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-right p-2">الصنف</th><th className="text-right p-2">الوصف</th>
                      <th className="text-center p-2 w-24">الكمية</th><th className="text-center p-2 w-20">الوحدة</th>
                      <th className="text-right p-2 w-32">سعر الوحدة</th><th className="text-right p-2 w-32">الإجمالي</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(form.items || []).map((item: any, i: number) => (
                      <tr key={i} className="border-t">
                        <td className="p-1"><Input className="h-8 text-sm" value={item.item_name} onChange={(e) => updateItem(i, 'item_name', e.target.value)} /></td>
                        <td className="p-1"><Input className="h-8 text-sm" value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} /></td>
                        <td className="p-1"><Input className="h-8 text-sm text-center" type="number" value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} /></td>
                        <td className="p-1"><Input className="h-8 text-sm" value={item.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} /></td>
                        <td className="p-1"><Input className="h-8 text-sm text-right font-mono" type="number" value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', Number(e.target.value))} /></td>
                        <td className="p-1 text-right font-mono font-bold px-2">{fmt(item.total_price || 0)}</td>
                        <td className="p-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => removeItem(i)}>✕</Button></td>
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