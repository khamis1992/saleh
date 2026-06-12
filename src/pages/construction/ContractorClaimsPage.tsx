import { formatQAR } from '@/lib/format';
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
  Search, Filter, Eye, Pencil, Trash2, Calculator, AlertTriangle, ReceiptText,
  X, ChevronLeft, ChevronRight, Calendar, Users, Briefcase,
  Plus, RefreshCw, Download, FileText, ClipboardList, Wallet, XCircle, Building2,
  CheckCircle2, Hourglass, Hammer, Banknote, MoreVertical, ChevronsLeft, ChevronsRight,
  LayoutGrid, HardHat,
} from 'lucide-react';
import { contractorStore, projectStore, getProjectName } from '@/services/stores';
import { createStore } from '@/services/dataService';
import { updateProjectCostOnClaim, logAudit, exportToCSV } from '@/utils/exportUtils';
import type { ContractorClaim } from '@/types';

// ============================================================
// SEED DATA
// ============================================================
export const seedContractorClaims: ContractorClaim[] = [
  {
    id: 'clm-1', company_id: '', contractor_contract_id: 'ctr-1', contractor_id: 'cont-1', project_id: 'prj-1',
    claim_number: 'CLM-2025-001', claim_date: '2025-01-15',
    claimed_amount: 1200000, work_completed_percentage: 25,
    previous_claims_amount: 0, retention_amount: 60000, advance_deduction: 50000,
    penalty_amount: 0, net_payable: 1090000,
    engineer_verification_status: 'verified', engineer_notes: 'مطابق للمواصفات',
    project_manager_approval_status: 'approved',
    finance_approval_status: 'approved',
    payment_status: 'paid',
    status: 'paid',
    document_owner: 'أحمد علي',
    notes: '', created_at: '2025-01-15', updated_at: '2025-02-01', created_by: '', updated_by: '',
  },
  {
    id: 'clm-2', company_id: '', contractor_contract_id: 'ctr-1', contractor_id: 'cont-1', project_id: 'prj-1',
    claim_number: 'CLM-2025-002', claim_date: '2025-04-15',
    claimed_amount: 1500000, work_completed_percentage: 55,
    previous_claims_amount: 1200000, retention_amount: 75000, advance_deduction: 50000,
    penalty_amount: 0, net_payable: 1375000,
    engineer_verification_status: 'verified', engineer_notes: 'جودة ممتازة',
    project_manager_approval_status: 'approved',
    finance_approval_status: 'pending',
    payment_status: 'unpaid',
    status: 'approved',
    document_owner: 'سارة حسن',
    notes: 'بانتظار موافقة المالية', created_at: '2025-04-15', updated_at: '2025-04-20', created_by: '', updated_by: '',
  },
  {
    id: 'clm-3', company_id: '', contractor_contract_id: 'ctr-2', contractor_id: 'cont-2', project_id: 'prj-1',
    claim_number: 'CLM-2025-003', claim_date: '2025-05-01',
    claimed_amount: 800000, work_completed_percentage: 30,
    previous_claims_amount: 0, retention_amount: 40000, advance_deduction: 30000,
    penalty_amount: 0, net_payable: 730000,
    engineer_verification_status: 'pending', engineer_notes: '',
    project_manager_approval_status: 'pending',
    finance_approval_status: 'pending',
    payment_status: 'unpaid',
    status: 'submitted',
    document_owner: 'محمد محمود',
    notes: 'بانتظار التحقق الهندسي', created_at: '2025-05-01', updated_at: '2025-05-01', created_by: '', updated_by: '',
  },
  {
    id: 'clm-4', company_id: '', contractor_contract_id: 'ctr-3', contractor_id: 'cont-3', project_id: 'prj-2',
    claim_number: 'CLM-2025-004', claim_date: '2025-03-10',
    claimed_amount: 1000000, work_completed_percentage: 28,
    previous_claims_amount: 0, retention_amount: 50000, advance_deduction: 40000,
    penalty_amount: 15000, net_payable: 895000,
    engineer_verification_status: 'verified', engineer_notes: 'تأخير أسبوعين عن الجدول',
    project_manager_approval_status: 'approved',
    finance_approval_status: 'approved',
    payment_status: 'partially_paid',
    status: 'partially_paid',
    document_owner: 'ياسين كمال',
    notes: 'تم دفع 500,000 ر.ق', created_at: '2025-03-10', updated_at: '2025-04-05', created_by: '', updated_by: '',
  },
  {
    id: 'clm-5', company_id: '', contractor_contract_id: 'ctr-4', contractor_id: 'cont-4', project_id: 'prj-3',
    claim_number: 'CLM-2025-005', claim_date: '2025-08-01',
    claimed_amount: 600000, work_completed_percentage: 35,
    previous_claims_amount: 0, retention_amount: 30000, advance_deduction: 20000,
    penalty_amount: 0, net_payable: 550000,
    engineer_verification_status: 'verified', engineer_notes: 'جيد',
    project_manager_approval_status: 'approved',
    finance_approval_status: 'approved',
    payment_status: 'unpaid',
    status: 'approved',
    document_owner: 'فهد عبدالله',
    notes: 'جاهز للصرف', created_at: '2025-08-01', updated_at: '2025-08-10', created_by: '', updated_by: '',
  },
  {
    id: 'clm-6', company_id: '', contractor_contract_id: 'ctr-1', contractor_id: 'cont-1', project_id: 'prj-1',
    claim_number: 'CLM-2025-006', claim_date: '2025-07-01',
    claimed_amount: 900000, work_completed_percentage: 75,
    previous_claims_amount: 2700000, retention_amount: 45000, advance_deduction: 0,
    penalty_amount: 0, net_payable: 855000,
    engineer_verification_status: 'rejected', engineer_notes: 'بعض الأعمال غير مطابقة - يحتاج تصحيح',
    project_manager_approval_status: 'rejected',
    finance_approval_status: 'pending',
    payment_status: 'unpaid',
    status: 'rejected',
    document_owner: 'أحمد علي',
    notes: 'مرفوض من المهندس - يرجى التصحيح وإعادة التقديم', created_at: '2025-07-01', updated_at: '2025-07-05', created_by: '', updated_by: '',
  },
];

// In-memory store
const claimStore = createStore<ContractorClaim>({ key: 'erp_contractor_claims', seed: seedContractorClaims });

// ============================================================
// HELPERS
// ============================================================

const paymentStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  paid:           { label: 'مدفوع',        bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  partially_paid: { label: 'مدفوع جزئياً', bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-500' },
  unpaid:         { label: 'غير مدفوع',    bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500' },
};

const approvalStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  approved: { label: 'معتمد',       bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending:  { label: 'قيد المراجعة', bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
  rejected: { label: 'مرفوض',      bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
};

const engineerStatusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  verified: { label: 'تم التحقق', bg: 'bg-blue-50',  text: 'text-blue-700',  dot: 'bg-blue-500' },
  pending:  { label: 'معلق',      bg: 'bg-gray-50',  text: 'text-gray-600',  dot: 'bg-gray-400' },
  rejected: { label: 'مرفوض',    bg: 'bg-red-50',   text: 'text-red-700',   dot: 'bg-red-500' },
};

function getApprovalStatus(clm: ContractorClaim): 'approved' | 'pending' | 'rejected' {
  if (clm.status === 'rejected' || clm.engineer_verification_status === 'rejected' || clm.project_manager_approval_status === 'rejected') return 'rejected';
  if (clm.status === 'approved' || clm.status === 'paid' || clm.status === 'partially_paid') return 'approved';
  return 'pending';
}

function StatusChip({ config }: { config: { label: string; bg: string; text: string; dot: string } }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 60 ? 'bg-emerald-500' : value >= 30 ? 'bg-amber-500' : 'bg-blue-500';
  const text = value >= 60 ? 'text-emerald-600' : value >= 30 ? 'text-amber-600' : 'text-blue-600';
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className={`text-[11px] font-bold tabular-nums ${text} min-w-[30px]`}>{value}%</span>
    </div>
  );
}

// ============================================================
// WORKFLOW STEPPER (3 circles: engineer → PM → finance with status labels)
// ============================================================
function WorkflowStepper({ clm }: { clm: ContractorClaim }) {
  const steps: { status: 'approved' | 'pending' | 'rejected'; label: string; title: string }[] = [
    {
      status: clm.engineer_verification_status === 'verified' ? 'approved' : clm.engineer_verification_status === 'rejected' ? 'rejected' : 'pending',
      label: clm.engineer_verification_status === 'verified' ? 'تم التحقق' : clm.engineer_verification_status === 'rejected' ? 'مرفوض' : 'معلق',
      title: 'التحقق الهندسي',
    },
    {
      status: clm.project_manager_approval_status === 'approved' ? 'approved' : clm.project_manager_approval_status === 'rejected' ? 'rejected' : 'pending',
      label: clm.project_manager_approval_status === 'approved' ? 'موافق' : clm.project_manager_approval_status === 'rejected' ? 'مرفوض' : 'معلق',
      title: 'مدير المشروع',
    },
    {
      status: clm.finance_approval_status === 'approved' ? 'approved' : clm.finance_approval_status === 'rejected' ? 'rejected' : 'pending',
      label: clm.finance_approval_status === 'approved' ? 'موافق' : clm.finance_approval_status === 'rejected' ? 'مرفوض' : 'معلق',
      title: 'موافقة المالية',
    },
  ];

  const stepStyles = (s: string) => {
    if (s === 'approved') return 'bg-emerald-500 text-white border-emerald-500';
    if (s === 'rejected') return 'bg-red-500 text-white border-red-500';
    return 'bg-gray-100 text-gray-400 border-gray-200';
  };

  const labelColor = (s: string) => {
    if (s === 'approved') return 'text-emerald-600';
    if (s === 'rejected') return 'text-red-600';
    return 'text-gray-400';
  };

  const stepIcon = (s: string) => {
    if (s === 'approved') return <CheckCircle2 className="h-3.5 w-3.5" />;
    if (s === 'rejected') return <XCircle className="h-3.5 w-3.5" />;
    return <span className="text-[10px] font-bold">…</span>;
  };

  return (
    <div className="flex items-start gap-1.5" dir="ltr">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col items-center gap-1 min-w-[42px]">
          <div className="flex items-center gap-1 w-full">
            {i > 0 && (
              <div className={`flex-1 h-0.5 rounded-full ${steps[i - 1].status === 'approved' ? 'bg-emerald-300' : 'bg-gray-200'}`} />
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`h-7 w-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${stepStyles(step.status)}`}>
                  {stepIcon(step.status)}
                </div>
              </TooltipTrigger>
              <TooltipContent>{step.title}</TooltipContent>
            </Tooltip>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full ${step.status === 'approved' ? 'bg-emerald-300' : 'bg-gray-200'}`} />
            )}
          </div>
          <span className={`text-[10px] font-semibold whitespace-nowrap leading-tight text-center ${labelColor(step.status)}`}>
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// KPI CARD COMPONENT
// ============================================================
function KpiCard({
  label, value, sublabel, icon, color, valueColor = 'text-[#1E293B]',
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: React.ReactNode;
  color: 'blue' | 'red' | 'orange' | 'emerald' | 'violet';
  valueColor?: string;
}) {
  const colorMap = {
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600' },
    red:     { bg: 'bg-red-50',     text: 'text-red-500' },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-500' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    violet:  { bg: 'bg-violet-50',  text: 'text-violet-600' },
  };
  const c = colorMap[color];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2.5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <div className={`h-9 w-9 rounded-lg ${c.bg} flex items-center justify-center`}>
          <div className={c.text}>{icon}</div>
        </div>
      </div>
      <p className={`text-xl font-extrabold tabular-nums leading-tight ${valueColor}`}>
        {value}
      </p>
      {sublabel && (
        <p className="text-[11px] text-gray-400 font-medium">{sublabel}</p>
      )}
    </div>
  );
}

// ============================================================
// FORM INTERFACE
// ============================================================
interface ClaimForm {
  claim_number: string;
  contractor_id: string;
  project_id: string;
  claimed_amount: number;
  work_completed_percentage: number;
  status: ContractorClaim['status'];
  engineer_verification_status: ContractorClaim['engineer_verification_status'];
  project_manager_approval_status: ContractorClaim['project_manager_approval_status'];
  finance_approval_status: ContractorClaim['finance_approval_status'];
  payment_status: ContractorClaim['payment_status'];
  document_owner: string;
  notes: string;
}

const emptyClaimForm: ClaimForm = {
  claim_number: '',
  contractor_id: '',
  project_id: '',
  claimed_amount: 0,
  work_completed_percentage: 0,
  status: 'draft',
  engineer_verification_status: 'pending',
  project_manager_approval_status: 'pending',
  finance_approval_status: 'pending',
  payment_status: 'unpaid',
  document_owner: '',
  notes: '',
};

// ============================================================
// PAGE COMPONENT
// ============================================================
export default function ContractorClaimsPage() {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';
  const projectName = searchParams.get('projectName') || '';
  const [refresh, setRefresh] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contractorFilter, setContractorFilter] = useState('all');
  const [dateRange, setDateRange] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewingClaim, setViewingClaim] = useState<ContractorClaim | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ClaimForm>(emptyClaimForm);
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ContractorClaim | null>(null);

  const claims = useMemo(() => {
    const data = claimStore.getAll();
    setTimeout(() => setLoading(false), 300);
    return data;
  }, [refresh]);

  const contractors = useMemo(() => contractorStore.getAll(), [refresh]);
  const projects = useMemo(() => projectStore.getAll(), [refresh]);

  const filtered = useMemo(() => claims.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (contractorFilter !== 'all' && c.contractor_id !== contractorFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchNum = c.claim_number.toLowerCase().includes(q);
      const matchContractor = getContractorName(c.contractor_id).toLowerCase().includes(q);
      if (!matchNum && !matchContractor) return false;
    }
    return true;
  }), [claims, search, statusFilter, contractorFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  // KPIs
  const kpiTotal = claims.length;
  const kpiApproved = claims.filter(c => c.status === 'approved' || c.status === 'paid' || c.status === 'partially_paid').length;
  const kpiUnderReview = claims.filter(c => c.status === 'submitted' || c.status === 'verified' || c.status === 'draft').length;
  const kpiUnpaid = claims.filter(c => c.payment_status === 'unpaid').length;
  const kpiNetDue = claims.reduce((s, c) => s + (c.net_payable || 0), 0);

  const fmt = (v: number) => formatQAR(v);

  function getContractorName(id: string) {
    return (contractors as any[]).find((c) => c.id === id)?.name || id;
  }

  const calcNetPayable = useMemo(() => {
    const retention = form.claimed_amount * 0.05;
    const advanceDeduction = Math.min(form.claimed_amount * 0.1, form.claimed_amount);
    return form.claimed_amount - retention - advanceDeduction;
  }, [form.claimed_amount]);

  function handleCreate() {
    setEditingId(null);
    setForm(emptyClaimForm);
    setBudgetWarning(null);
    setDialogOpen(true);
  }

  function handleView(clm: ContractorClaim) {
    setViewingClaim(clm);
    setViewOpen(true);
  }

  function handleEdit(clm: ContractorClaim) {
    setViewingClaim(null);
    setViewOpen(false);
    setEditingId(clm.id);
    setForm({
      claim_number: clm.claim_number,
      contractor_id: clm.contractor_id,
      project_id: clm.project_id,
      claimed_amount: clm.claimed_amount,
      work_completed_percentage: clm.work_completed_percentage,
      status: clm.status,
      engineer_verification_status: clm.engineer_verification_status,
      project_manager_approval_status: clm.project_manager_approval_status,
      finance_approval_status: clm.finance_approval_status,
      payment_status: clm.payment_status,
      document_owner: (clm as any).document_owner || '',
      notes: clm.notes || '',
    });
    setBudgetWarning(null);
    setDialogOpen(true);
  }

  function handleSave() {
    if (!form.claim_number || !form.contractor_id || !form.project_id) {
      toast.error('يرجى ملء الحقول المطلوبة');
      return;
    }

    const prjs = projectStore.getAll() as any[];
    const prj = prjs.find((p) => p.id === form.project_id);
    if (prj) {
      const remaining = (prj.approved_budget || 0) - (prj.actual_cost || 0);
      if (form.claimed_amount > remaining) {
        setBudgetWarning(`تحذير: مبلغ الطلب (${fmt(form.claimed_amount)}) يتجاوز الميزانية المتبقية للمشروع (${fmt(remaining)})`);
      } else {
        setBudgetWarning(null);
      }
    }

    const fullData = {
      ...form,
      retention_amount: form.claimed_amount * 0.05,
      advance_deduction: Math.min(form.claimed_amount * 0.1, form.claimed_amount),
      net_payable: calcNetPayable,
      previous_claims_amount: 0,
      penalty_amount: 0,
      engineer_notes: '',
      claim_date: new Date().toISOString().split('T')[0],
      company_id: '',
      contractor_contract_id: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: '',
      updated_by: '',
    };

    if (editingId) {
      const oldClaim = claimStore.getById(editingId);
      claimStore.update(editingId, fullData as any);
      toast.success(`تم تحديث الطلب ${form.claim_number}`);
      if (form.status === 'approved' && oldClaim && oldClaim.status !== 'approved') {
        updateProjectCostOnClaim(form.project_id, form.claimed_amount);
        logAudit('approve_claim', 'contractor_claims', editingId, oldClaim.status, 'approved');
      }
    } else {
      claimStore.create(fullData as any);
      toast.success(`تم إضافة الطلب ${form.claim_number}`);
      if (form.status === 'approved') updateProjectCostOnClaim(form.project_id, form.claimed_amount);
    }

    setDialogOpen(false);
    setRefresh(r => r + 1);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    claimStore.remove(deleteTarget.id);
    toast.success(`تم حذف الطلب ${deleteTarget.claim_number}`);
    setDeleteTarget(null);
    setRefresh(r => r + 1);
  }

  function handleReset() {
    setSearch('');
    setStatusFilter('all');
    setContractorFilter('all');
    setDateRange('');
    setCurrentPage(1);
  }

  function handleExport() {
    const data = filtered.map((c) => ({
      'رقم المطالبة': c.claim_number,
      'تاريخ المطالبة': c.claim_date,
      'المقاول': getContractorName(c.contractor_id),
      'المشروع': getProjectName(c.project_id),
      'المبلغ المطالب': c.claimed_amount,
      'نسبة الإنجاز': `${c.work_completed_percentage}%`,
      'مبلغ محتجز': c.retention_amount || 0,
      'خصم مسبق': c.advance_deduction || 0,
      'غرامات': c.penalty_amount || 0,
      'صافي المستحق': c.net_payable || 0,
      'الحالة': c.status,
      'حالة السداد': c.payment_status,
      'التحقق الهندسي': c.engineer_verification_status,
      'موافقة مدير المشروع': c.project_manager_approval_status,
      'موافقة المالية': c.finance_approval_status,
      'مسؤول المستند': (c as any).document_owner || '',
      'ملاحظات': c.notes || '',
    }));
    exportToCSV(data, [
      { key: 'رقم المطالبة', label: 'رقم المطالبة' },
      { key: 'تاريخ المطالبة', label: 'تاريخ المطالبة' },
      { key: 'المقاول', label: 'المقاول' },
      { key: 'المشروع', label: 'المشروع' },
      { key: 'المبلغ المطالب', label: 'المبلغ المطالب' },
      { key: 'نسبة الإنجاز', label: 'نسبة الإنجاز' },
      { key: 'مبلغ محتجز', label: 'مبلغ محتجز' },
      { key: 'خصم مسبق', label: 'خصم مسبق' },
      { key: 'غرامات', label: 'غرامات' },
      { key: 'صافي المستحق', label: 'صافي المستحق' },
      { key: 'الحالة', label: 'الحالة' },
      { key: 'حالة السداد', label: 'حالة السداد' },
      { key: 'التحقق الهندسي', label: 'التحقق الهندسي' },
      { key: 'موافقة مدير المشروع', label: 'موافقة مدير المشروع' },
      { key: 'موافقة المالية', label: 'موافقة المالية' },
      { key: 'مسؤول المستند', label: 'مسؤول المستند' },
      { key: 'ملاحظات', label: 'ملاحظات' },
    ], 'مطالبات_المقاولين.csv');
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">

      {projectId && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2">
          <HardHat className="h-4 w-4 text-indigo-600" />
          <span className="text-xs text-indigo-700 font-medium">المشروع: {decodeURIComponent(projectName)}</span>
          <span className="text-[10px] text-indigo-400">({projectId})</span>
        </div>
      )}

      {/* ── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">مطالبات المقاولين</h1>
          <p className="text-[13px] text-gray-500 mt-1">إدارة ومراجعة المطالبات المالية للمقاولين ومتابعة دورة الموافقات</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCreate}
            className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-10 rounded-lg px-4 shadow-sm shadow-blue-200"
          >
            <Plus className="h-4 w-4" />
            إضافة مطالبة
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="gap-2 border-gray-200 text-gray-600 hover:text-gray-800 text-sm h-10 rounded-lg px-4"
          >
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-gray-200 text-gray-500 hover:text-gray-800 rounded-lg"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        <KpiCard
          label="إجمالي صافي المستحق"
          value={fmt(kpiNetDue)}
          sublabel="ريال قطري"
          icon={<Calculator className="h-[18px] w-[18px]" />}
          color="blue"
        />
        <KpiCard
          label="غير مدفوع"
          value={`${kpiUnpaid} مطالبات`}
          icon={<AlertTriangle className="h-[18px] w-[18px]" />}
          color="red"
        />
        <KpiCard
          label="قيد التدقيق"
          value={`${kpiUnderReview} مطالبات`}
          icon={<Hourglass className="h-[18px] w-[18px]" />}
          color="orange"
        />
        <KpiCard
          label="المطالبات المعتمدة"
          value={`${kpiApproved} مطالبات`}
          icon={<CheckCircle2 className="h-[18px] w-[18px]" />}
          color="emerald"
        />
        <KpiCard
          label="إجمالي المطالبات"
          value={`${kpiTotal} مطالبات`}
          icon={<FileText className="h-[18px] w-[18px]" />}
          color="violet"
        />
      </div>

      {/* ── FILTERS BAR ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-4 flex flex-wrap items-center gap-2.5">
        {/* Date range */}
        <div className="relative flex-1 min-w-[180px] max-w-[220px]">
          <Input
            readOnly
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            placeholder="نطاق التاريخ"
            className="h-9 text-xs border-gray-200 rounded-lg bg-gray-50 cursor-pointer pl-9 pr-3"
          />
          <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Status */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[150px] text-xs border-gray-200 rounded-lg bg-gray-50 gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <SelectValue placeholder="جميع الحالات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع الحالات</SelectItem>
            <SelectItem value="draft">مسودة</SelectItem>
            <SelectItem value="submitted">قيد المراجعة</SelectItem>
            <SelectItem value="verified">تم التحقق</SelectItem>
            <SelectItem value="approved">معتمد</SelectItem>
            <SelectItem value="rejected">مرفوض</SelectItem>
            <SelectItem value="partially_paid">مدفوع جزئياً</SelectItem>
            <SelectItem value="paid">مدفوع</SelectItem>
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-[260px]">
          <Search className="absolute right-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
          <Input
            placeholder="البحث في المطالبات..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-9 h-9 text-xs border-gray-200 rounded-lg bg-gray-50 focus:bg-white"
          />
        </div>

        {/* Contractor (extra) */}
        <Select value={contractorFilter} onValueChange={setContractorFilter}>
          <SelectTrigger className="h-9 w-[160px] text-xs border-gray-200 rounded-lg bg-gray-50 gap-1.5">
            <Users className="h-3.5 w-3.5 text-gray-400" />
            <SelectValue placeholder="جميع المقاولين" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المقاولين</SelectItem>
            {(contractors as any[]).map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Reset */}
        <Button
          variant="outline" size="sm" onClick={handleReset}
          className="h-9 border-gray-200 text-gray-500 hover:text-gray-800 rounded-lg gap-1.5 text-xs mr-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          إعادة تعيين
        </Button>

        {/* Menu toggle */}
        <Button
          variant="outline" size="icon"
          className="h-9 w-9 border-gray-200 text-gray-500 hover:text-gray-800 rounded-lg"
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>

      {/* ── DATA TABLE ──────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow >
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">رقم المطالبة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">المقاول</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">المشروع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">مبلغ المطالب</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">نسبة الإنجاز</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">صافي المستحق</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">التحقق الهندسي</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">حالة الموافقة</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">حالة الدفع</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">سير العمل</TableHead>
                  <TableHead className="text-[11px] font-bold text-[#64748B] h-11 px-3 text-right whitespace-nowrap">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-16">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-14 w-14 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                          <ReceiptText className="h-6 w-6 text-gray-300" />
                        </div>
                        <p className="text-sm font-semibold text-gray-400">لا توجد مطالبات</p>
                        <p className="text-xs text-gray-300">لا توجد نتائج تطابق معايير البحث</p>
                        <Button variant="outline" size="sm" onClick={handleReset}
                          className="h-8 text-xs rounded-lg mt-1 border-gray-200">
                          مسح الفلاتر
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {paginated.map((clm) => {
                  const approvalSt = getApprovalStatus(clm);
                  return (
                    <TableRow
                      key={clm.id}
                      className=" h-[72px] group"
                    >
                      {/* Claim Number */}
                      <TableCell className="px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-3.5 w-3.5 text-indigo-500" />
                          </div>
                          <span className="text-xs font-bold text-[#1E293B] tabular-nums whitespace-nowrap">
                            {clm.claim_number}
                          </span>
                        </div>
                      </TableCell>

                      {/* Contractor */}
                      <TableCell className="px-3">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-3.5 w-3.5 text-blue-500" />
                          </div>
                          <span className="text-xs font-medium text-[#334155] leading-tight max-w-[130px] truncate">
                            {getContractorName(clm.contractor_id)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Project */}
                      <TableCell className="px-3">
                        <span className="text-xs text-[#334155] max-w-[130px] truncate inline-block align-middle font-medium">
                          {getProjectName(clm.project_id)}
                        </span>
                      </TableCell>

                      {/* Claimed Amount */}
                      <TableCell className="px-3">
                        <span className="text-[13px] font-bold text-[#1E293B] tabular-nums whitespace-nowrap">
                          {fmt(clm.claimed_amount)}
                        </span>
                      </TableCell>

                      {/* Progress */}
                      <TableCell className="px-3">
                        <ProgressBar value={clm.work_completed_percentage} />
                      </TableCell>

                      {/* Net Due (green) */}
                      <TableCell className="px-3">
                        <span className="text-[13px] font-bold text-emerald-600 tabular-nums whitespace-nowrap">
                          {fmt(clm.net_payable)}
                        </span>
                      </TableCell>

                      {/* Engineer Verification */}
                      <TableCell className="px-3">
                        <StatusChip config={engineerStatusConfig[clm.engineer_verification_status] || engineerStatusConfig.pending} />
                      </TableCell>

                      {/* Approval Status */}
                      <TableCell className="px-3">
                        <StatusChip config={approvalStatusConfig[approvalSt]} />
                      </TableCell>

                      {/* Payment Status */}
                      <TableCell className="px-3">
                        <StatusChip config={paymentStatusConfig[clm.payment_status] || paymentStatusConfig.unpaid} />
                      </TableCell>

                      {/* Workflow Stepper */}
                      <TableCell className="px-3">
                        <WorkflowStepper clm={clm} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="px-3">
                        <div className="flex items-center gap-0.5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600"
                                onClick={() => handleView(clm)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>عرض التفاصيل</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 rounded-md hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"
                                onClick={() => handleEdit(clm)}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>تعديل</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600"
                                onClick={() => setDeleteTarget(clm)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>حذف</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost" size="sm"
                                className="h-7 w-7 p-0 rounded-md hover:bg-gray-100 text-gray-400"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>المزيد</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ── PAGINATION ──────────────────────────────────────── */}
          <div className="py-3 border-t border-gray-100 bg-[#FAFBFC] flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Select value={String(rowsPerPage)} onValueChange={v => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] text-xs border-gray-200 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-500">لكل صفحة</span>
            </div>

            <span className="text-xs text-gray-500">
              عرض <span className="font-bold text-[#1E293B]">{filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</span> إلى{' '}
              <span className="font-bold text-[#1E293B]">{Math.min(currentPage * rowsPerPage, filtered.length)}</span> من{' '}
              <span className="font-bold text-[#1E293B]">{filtered.length}</span> مطالبات
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <div className="h-8 min-w-[32px] px-2 bg-[#2563EB] text-white rounded-lg text-xs font-bold flex items-center justify-center">
                {currentPage}
              </div>
              <Button
                variant="outline" size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline" size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 border-gray-200 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW DETAIL DIALOG ──────────────────────────────────── */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              تفاصيل المطالبة {viewingClaim?.claim_number}
            </DialogTitle>
          </DialogHeader>

          {viewingClaim && (
            <div className="space-y-4 py-2">
              {/* Workflow visual */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-[11px] font-semibold text-gray-500 mb-3">سير العمل</p>
                <div className="flex items-center justify-center" dir="ltr">
                  <WorkflowStepper clm={viewingClaim} />
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">المقاول</p>
                  <p className="text-[13px] font-semibold text-[#1E293B]">{getContractorName(viewingClaim.contractor_id)}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">المشروع</p>
                  <p className="text-[13px] font-semibold text-[#1E293B]">{getProjectName(viewingClaim.project_id)}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">تاريخ المطالبة</p>
                  <p className="text-[13px] font-semibold text-[#1E293B] tabular-nums">{viewingClaim.claim_date}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">مالك المستند</p>
                  <p className="text-[13px] font-semibold text-[#1E293B]">{(viewingClaim as any).document_owner || '—'}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">مبلغ المطالب</p>
                  <p className="text-sm font-bold text-[#1E293B] tabular-nums">{fmt(viewingClaim.claimed_amount)}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">صافي المستحق</p>
                  <p className="text-sm font-bold text-emerald-600 tabular-nums">{fmt(viewingClaim.net_payable)}</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">نسبة الإنجاز</p>
                  <ProgressBar value={viewingClaim.work_completed_percentage} />
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 mb-1">حالة المطالبة</p>
                  <StatusChip config={paymentStatusConfig[viewingClaim.payment_status] || paymentStatusConfig.unpaid} />
                </div>
              </div>

              {viewingClaim.engineer_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-amber-700 mb-1">ملاحظات المهندس</p>
                  <p className="text-xs text-amber-900">{viewingClaim.engineer_notes}</p>
                </div>
              )}

              {viewingClaim.notes && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-gray-700 mb-1">ملاحظات</p>
                  <p className="text-xs text-gray-700">{viewingClaim.notes}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setViewOpen(false)} className="rounded-lg">إغلاق</Button>
            <Button onClick={() => viewingClaim && handleEdit(viewingClaim)} className="bg-[#3B82F6] hover:bg-blue-600 rounded-lg gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              تعديل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── CREATE / EDIT DIALOG ────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Calculator className="h-4 w-4 text-blue-600" />
              </div>
              {editingId ? 'تعديل مطالبة' : 'إضافة مطالبة جديدة'}
            </DialogTitle>
          </DialogHeader>

          {budgetWarning && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 flex items-start gap-2 text-xs">
              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <span>{budgetWarning}</span>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">رقم المطالبة</Label>
                <Input value={form.claim_number}
                  onChange={e => setForm({ ...form, claim_number: e.target.value })}
                  placeholder="CLM-2025-..." className="h-9 text-sm rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">نسبة الإنجاز (%)</Label>
                <Input type="number" value={form.work_completed_percentage}
                  onChange={e => setForm({ ...form, work_completed_percentage: Number(e.target.value) })}
                  min={0} max={100} className="h-9 text-sm rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">المقاول</Label>
                <Select value={form.contractor_id} onValueChange={v => setForm({ ...form, contractor_id: v })}>
                  <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue placeholder="اختر المقاول" /></SelectTrigger>
                  <SelectContent>
                    {(contractors as any[]).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">المشروع</Label>
                <Select value={form.project_id} onValueChange={v => setForm({ ...form, project_id: v })}>
                  <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue placeholder="اختر المشروع" /></SelectTrigger>
                  <SelectContent>
                    {(projects as any[]).map(p => <SelectItem key={p.id} value={p.id}>{(p as any).project_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">مبلغ المطالب (ر.ق)</Label>
                <Input type="number" value={form.claimed_amount}
                  onChange={e => setForm({ ...form, claimed_amount: Number(e.target.value) })}
                  className="h-9 text-sm rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">مالك المستند</Label>
                <Input value={form.document_owner}
                  onChange={e => setForm({ ...form, document_owner: e.target.value })}
                  placeholder="اسم المسؤول..." className="h-9 text-sm rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">حالة الطلب</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="submitted">قيد المراجعة</SelectItem>
                    <SelectItem value="verified">تم التحقق</SelectItem>
                    <SelectItem value="approved">معتمد</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                    <SelectItem value="partially_paid">مدفوع جزئياً</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">التحقق الهندسي</Label>
                <Select value={form.engineer_verification_status} onValueChange={(v: any) => setForm({ ...form, engineer_verification_status: v })}>
                  <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="verified">تم التحقق</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">موافقة مدير المشروع</Label>
                <Select value={form.project_manager_approval_status} onValueChange={(v: any) => setForm({ ...form, project_manager_approval_status: v })}>
                  <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="approved">موافق</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">موافقة المالية</Label>
                <Select value={form.finance_approval_status} onValueChange={(v: any) => setForm({ ...form, finance_approval_status: v })}>
                  <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">معلق</SelectItem>
                    <SelectItem value="approved">موافق</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">حالة الدفع</Label>
                <Select value={form.payment_status} onValueChange={(v: any) => setForm({ ...form, payment_status: v })}>
                  <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">غير مدفوع</SelectItem>
                    <SelectItem value="partially_paid">مدفوع جزئياً</SelectItem>
                    <SelectItem value="paid">مدفوع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Net payable calculation preview */}
            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>صافي المستحق المتوقع:</span>
                <span className="text-[10px] text-gray-400">مبلغ المطالب - 5% ضمان - 10% دفعة مقدمة</span>
              </div>
              <p className="text-xl font-extrabold text-emerald-600 tabular-nums">{fmt(calcNetPayable)}</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ملاحظات</Label>
              <Textarea value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={3} placeholder="ملاحظات إضافية..." className="text-sm rounded-lg resize-none" />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-lg">إلغاء</Button>
            <Button onClick={handleSave} className="bg-[#3B82F6] hover:bg-blue-600 rounded-lg">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRM ──────────────────────────────────────── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف المطالبة <strong>{deleteTarget?.claim_number}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
