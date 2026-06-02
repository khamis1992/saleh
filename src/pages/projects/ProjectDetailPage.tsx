import { useMemo, useState, useEffect } from 'react';
import { formatQAR, formatQARInt } from '@/lib/format';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ProjectCostSummaryCard } from '@/components/shared/Phase2Components';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Pencil, ClipboardList, TrendingUp, ShoppingCart, DollarSign, History, HardHat, FileText, Plus, Trash2, Save, X, GanttChart, AlertTriangle } from 'lucide-react';
import {
  projectStore, getLandName, projectBudgetStore, contractorClaimStore,
  purchaseOrderStore, purchaseRequestStore, rfqStore,
  stockTransactionStore, inventoryStore, projectPhaseStore,
  getAllowedStatusTransitions, dailyReportStore,
} from '@/services/stores';
import { createStore } from '@/services/dataService';
import { ProjectGantt, phasesToGanttTasks } from '@/components/gantt/ProjectGantt';
import { WorkflowTimeline } from '@/components/shared/WorkflowTimeline';
import { NextBestAction } from '@/components/shared/NextBestAction';
import { EVMPanel } from '@/components/shared/EVMPanel';
import type { ProjectProgressUpdate, ProjectPhase } from '@/types';
// dailyReportStore imported from '@/services/stores' above
const seedProgressUpdates: ProjectProgressUpdate[] = [
  { id: 'pu-1', company_id: '', project_id: 'prj-1', phase_id: '', update_date: '2025-06-01', previous_progress: 75, new_progress: 80, progress_change: 5, description: 'اكتمال أعمال الطابق الثاني بالكامل', issues: '', photos_count: 12, submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-06-01', created_at: '2025-06-01', updated_at: '2025-06-01', is_active: true },
  { id: 'pu-2', company_id: '', project_id: 'prj-1', phase_id: '', update_date: '2025-06-15', previous_progress: 80, new_progress: 85, progress_change: 5, description: 'اكتمال صب أعمدة الطابق الثالث', issues: '', photos_count: 8, submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-06-15', created_at: '2025-06-15', updated_at: '2025-06-15', is_active: true },
  { id: 'pu-3', company_id: '', project_id: 'prj-2', phase_id: '', update_date: '2025-06-01', previous_progress: 50, new_progress: 60, progress_change: 10, description: 'اكتمال الهيكل الإنشائي للبرج A', issues: '', photos_count: 15, submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-06-01', created_at: '2025-06-01', updated_at: '2025-06-01', is_active: true },
  { id: 'pu-4', company_id: '', project_id: 'prj-4', phase_id: '', update_date: '2025-08-01', previous_progress: 85, new_progress: 95, progress_change: 10, description: 'اكتمال التشطيبات الداخلية - جاري الاختبارات النهائية', issues: 'تأخير في استلام المصاعد', photos_count: 20, submitted_by: '', approval_status: 'approved', approved_by: '', approved_at: '2025-08-01', created_at: '2025-08-01', updated_at: '2025-08-01', is_active: true },
];
const progressUpdateStore = createStore<ProjectProgressUpdate>({ key: 'erp_progress_updates', seed: seedProgressUpdates });

export default function ProjectDetailPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const project = useMemo(() => projectStore.getById(id || ''), [id]);
  const fmt = (v: number) => formatQAR(v);

  // ── Phases state from store ──
  const [phases, setPhases] = useState<ProjectPhase[]>([]);
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<ProjectPhase | null>(null);
  const [phaseForm, setPhaseForm] = useState<Partial<ProjectPhase>>({});
  const [phaseToast, setPhaseToast] = useState('');

  const loadPhases = () => {
    if (!id) return;
    setPhases(projectPhaseStore.getAll().filter(p => p.project_id === id));
  };

  useEffect(() => { loadPhases(); }, [id]);

  // Auto-calculate project completion_percentage as weighted avg of phase progress
  const updateProjectCompletion = () => {
    if (!id || !project) return;
    const projectPhases = projectPhaseStore.getAll().filter(p => p.project_id === id);
    if (projectPhases.length === 0) return;
    const totalBudget = projectPhases.reduce((s, p) => s + p.budget_amount, 0);
    if (totalBudget === 0) return;
    const weightedProgress = projectPhases.reduce((s, p) => s + (p.progress_percentage * p.budget_amount), 0);
    const newCompletion = Math.round((weightedProgress / totalBudget) * 10) / 10;
    projectStore.update(id, { completion_percentage: newCompletion });
  };

  // ── Phase CRUD ──
  const openPhaseCreate = () => {
    setEditingPhase(null);
    setPhaseForm({
      company_id: 'comp-1',
      project_id: id || '',
      phase_name: '',
      sequence_number: (phases.length + 1),
      planned_start: '',
      planned_end: '',
      actual_start: '',
      actual_end: '',
      responsible_user_id: '',
      contractor_id: '',
      budget_amount: 0,
      actual_cost: 0,
      progress_percentage: 0,
      status: 'not_started' as ProjectPhase['status'],
      notes: '',
    });
    setPhaseDialogOpen(true);
  };

  const openPhaseEdit = (phase: ProjectPhase) => {
    setEditingPhase(phase);
    setPhaseForm({ ...phase });
    setPhaseDialogOpen(true);
  };

  const handlePhaseSave = () => {
    if (!phaseForm.phase_name) return;
    if (editingPhase) {
      projectPhaseStore.update(editingPhase.id, phaseForm);
    } else {
      projectPhaseStore.create(phaseForm as Omit<ProjectPhase, 'id'>);
    }
    loadPhases();
    updateProjectCompletion();
    setPhaseDialogOpen(false);
    setPhaseToast(editingPhase ? 'تم تحديث المرحلة بنجاح' : 'تم إضافة المرحلة بنجاح');
    setTimeout(() => setPhaseToast(''), 2000);
  };

  const handlePhaseDelete = (phaseId: string) => {
    projectPhaseStore.remove(phaseId);
    loadPhases();
    updateProjectCompletion();
    setPhaseToast('تم حذف المرحلة بنجاح');
    setTimeout(() => setPhaseToast(''), 2000);
  };

  const handlePhaseStatusChange = (phaseId: string, newStatus: string) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    const allowed = getAllowedStatusTransitions('phase', phase.status);
    if (!allowed.includes(newStatus)) {
      setPhaseToast(`لا يمكن الانتقال من "${phase.status}" إلى "${newStatus}"`);
      setTimeout(() => setPhaseToast(''), 2000);
      return;
    }
    projectPhaseStore.update(phaseId, { status: newStatus as ProjectPhase['status'] });
    loadPhases();
    setPhaseToast('تم تغيير الحالة بنجاح');
    setTimeout(() => setPhaseToast(''), 2000);
  };

  const dailyReports = useMemo(() => {
    if (!id) return [];
    return dailyReportStore.getAll().filter(d => d.project_id === id);
  }, [id]);

  const progressUpdates = useMemo(() => {
    if (!id) return [];
    return progressUpdateStore.getAll().filter(p => p.project_id === id);
  }, [id]);

  const budgets = useMemo(() => {
    if (!id) return [];
    return projectBudgetStore.getAll().filter(b => b.project_id === id);
  }, [id]);

  const claims = useMemo(() => {
    if (!id) return [];
    return contractorClaimStore.getAll().filter(c => c.project_id === id);
  }, [id]);

  const purchaseOrders = useMemo(() => {
    if (!id || !project) return [];
    return purchaseOrderStore.getAll().filter(po => po.project === project.project_name);
  }, [id, project]);

  const purchaseRequests = useMemo(() => {
    if (!id || !project) return [];
    return purchaseRequestStore.getAll().filter(pr => pr.project === project.project_name);
  }, [id, project]);

  const rfqs = useMemo(() => {
    if (!id) return [];
    return rfqStore.getAll().filter(r => r.project_id === id);
  }, [id]);

  const materialsCost = useMemo(() => {
    if (!id) return 0;
    return stockTransactionStore.getAll()
      .filter(t => t.project_id === id && (t.transaction_type === 'issue_to_project' || t.transaction_type === 'return_from_project'))
      .reduce((s, t) => {
        if (t.transaction_type === 'return_from_project') return s - t.total_cost;
        return s + t.total_cost;
      }, 0);
  }, [id]);

  const costSummary = useMemo(() => {
    const contractorClaimsTotal = claims.reduce((s, c) => s + c.claimed_amount, 0);
    const otherCosts = project ? (project.actual_cost - contractorClaimsTotal - materialsCost) : 0;
    const totalActualCost = project ? project.actual_cost : 0;
    const approvedBudget = project ? project.approved_budget : 0;
    const variance = approvedBudget - totalActualCost;
    return {
      contractorClaims: contractorClaimsTotal,
      materialsIssued: materialsCost,
      otherCosts: Math.max(0, otherCosts),
      totalActualCost,
      remainingBudget: variance,
      variance,
    };
  }, [claims, materialsCost, project]);

  if (!project) return <div className="text-center py-12 text-gray-500">المشروع غير موجود</div>;

  const phaseStatusLabel = (s: string) => {
    const map: Record<string, string> = {
      not_started: 'لم يبدأ', in_progress: 'قيد التنفيذ', completed: 'مكتمل',
      delayed: 'متأخر', cancelled: 'ملغي',
    };
    return map[s] || s;
  };

  return (
    <div className="bg-gray-50 min-h-full" dir="rtl">

      {/* Phase toast */}
      {phaseToast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg text-sm font-medium animate-bounce ${
          phaseToast.includes('لا يمكن') ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          {phaseToast}
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-xs text-gray-500">
            <ArrowRight className="h-4 w-4 ml-1" />{t.common.back}
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{project.project_code} - {project.project_name}</h1>
            <p className="text-xs text-gray-500 mt-0.5">تفاصيل المشروع وإدارته</p>
          </div>
        </div>
        <Button onClick={() => navigate(`/projects/${project.id}/edit`)} className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4">
          <Pencil className="h-4 w-4" />{t.common.edit}
        </Button>
      </div>

      {/* ── Command Center: Workflow timeline + Next best action ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">حالة سير العمل</p>
        <WorkflowTimeline
          steps={(() => {
            const order: any[] = ['idea', 'feasibility', 'design', 'approvals', 'tendering', 'construction', 'testing', 'handover', 'completed', 'converted'];
            const currentIdx = order.indexOf(project.status);
            return order.map((s, i) => {
              const labels: Record<string, string> = {
                idea: 'فكرة', feasibility: 'دراسة جدوى', design: 'تصميم', approvals: 'اعتمادات',
                tendering: 'طرح', construction: 'إنشاء', testing: 'اختبار', handover: 'تسليم', completed: 'مكتمل', converted: 'محول'
              };
              let status: 'completed' | 'current' | 'pending' = 'pending';
              if (i < currentIdx) status = 'completed';
              else if (i === currentIdx) status = 'current';
              return { key: s, label: labels[s] || s, status };
            });
          })()}
        />
      </div>

      {/* ── Next best action banner ── */}
      {project.status !== 'converted' && project.status !== 'cancelled' && (() => {
        const projectPhases = projectPhaseStore.getAll().filter(p => p.project_id === project.id);
        const delayedPhase = projectPhases.find(p => p.status !== 'completed' && p.planned_end && new Date(p.planned_end) < new Date());
        if (project.status === 'completed' || project.completion_percentage === 100) {
          return (
            <NextBestAction
              title="المشروع جاهز للتحويل إلى عقار"
              description="اكتملت جميع الأعمال. الخطوة التالية هي تحويله إلى عقار وتأجير وحداته."
              actionLabel="تحويل إلى عقار"
              actionTo="/wizards/conversion"
              variant="success"
              className="mb-4"
            />
          );
        }
        if (delayedPhase) {
          return (
            <NextBestAction
              title={`مرحلة "${delayedPhase.phase_name}" متأخرة`}
              description="هذه المرحلة تجاوزت تاريخ الانتهاء المخطط. تحقق من الأسباب وقم بتحديث التقدم."
              actionLabel="تحديث التقدم"
              actionTo={`/construction/progress`}
              variant="warning"
              className="mb-4"
            />
          );
        }
        if (project.actual_cost > project.approved_budget) {
          return (
            <NextBestAction
              title="تجاوز في الميزانية"
              description={`التكلفة الفعلية تجاوزت المعتمدة بمقدار ${fmt(project.actual_cost - project.approved_budget)}`}
              actionLabel="مراجعة الميزانية"
              actionTo={`/budgets`}
              variant="warning"
              className="mb-4"
            />
          );
        }
        return null;
      })()}

      {/* ── Quick Actions sticky bar ── */}
      <div className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-2">إجراءات سريعة:</span>
        <Button variant="outline" size="sm" onClick={() => navigate('/construction/daily-reports')} className="h-8 text-xs gap-1">
          <ClipboardList className="h-3.5 w-3.5" /> تقرير يومي
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/construction/progress')} className="h-8 text-xs gap-1">
          <TrendingUp className="h-3.5 w-3.5" /> تحديث تقدم
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/procurement/purchase-requests')} className="h-8 text-xs gap-1">
          <ShoppingCart className="h-3.5 w-3.5" /> طلب شراء
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/construction/claims')} className="h-8 text-xs gap-1">
          <DollarSign className="h-3.5 w-3.5" /> مطالبة
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/construction/risk-register')} className="h-8 text-xs gap-1">
          <AlertTriangle className="h-3.5 w-3.5" /> المخاطر
        </Button>
        {project.status === 'completed' && (
          <Button variant="outline" size="sm" onClick={() => navigate('/wizards/conversion')} className="h-8 text-xs gap-1 text-blue-700 border-blue-200 hover:bg-blue-50">
            <HardHat className="h-3.5 w-3.5" /> تحويل إلى عقار
          </Button>
        )}
      </div>

      {/* ── Earned Value Management panel (P0 ANSI/EIA 748) ── */}
      {(() => {
        const phases = projectPhaseStore.getAll().filter(p => p.project_id === project.id);
        const pv = project.approved_budget * (project.completion_percentage / 100);
        return (
          <EVMPanel
            bac={project.approved_budget}
            ac={project.actual_cost}
            ev={project.approved_budget * (project.completion_percentage / 100)}
            pv={pv}
            completionPct={project.completion_percentage}
            className="mb-4"
          />
        );
      })()}

      <Tabs dir="rtl" defaultValue="overview">
        <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100 mb-6 w-fit">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">نظرة عامة</TabsTrigger>
            <TabsTrigger value="phases" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">المراحل</TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">الميزانية</TabsTrigger>
            <TabsTrigger value="daily" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">التقارير اليومية</TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">تحديثات التقدم</TabsTrigger>
            <TabsTrigger value="procurement" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">المشتريات</TabsTrigger>
            <TabsTrigger value="costs" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">ملخص التكاليف</TabsTrigger>
            <TabsTrigger value="gantt" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5"><GanttChart className="h-3 w-3 inline ml-1" />المخطط الزمني</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">نسبة الإنجاز</div><div className="text-xl font-bold text-gray-800 mt-1">{project.completion_percentage}%</div><Progress value={project.completion_percentage} className="mt-2 h-1.5" /></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">الميزانية</div><div className="text-xl font-bold text-gray-800 mt-1">{fmt(project.approved_budget)}</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">التكلفة الفعلية</div><div className={`text-xl font-bold mt-1 ${project.actual_cost > project.approved_budget ? 'text-red-600' : 'text-gray-800'}`}>{fmt(project.actual_cost)}</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">الانحراف</div><div className={`text-xl font-bold mt-1 ${project.actual_cost > project.approved_budget ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(project.approved_budget - project.actual_cost)}</div></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center"><HardHat className="h-5 w-5 text-blue-600" /></div>
              <div><h2 className="text-base font-semibold text-gray-800">تفاصيل المشروع</h2></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><span className="text-gray-400">النوع: </span>{(t.projects.types as any)[project.project_type]}</div>
              <div><span className="text-gray-400">الأرض: </span>{getLandName(project.land_id)}</div>
              <div><span className="text-gray-400">تاريخ البداية: </span>{project.planned_start_date}</div>
              <div><span className="text-gray-400">النهاية المخطط: </span>{project.planned_end_date}</div>
              <div><span className="text-gray-400">البداية الفعلية: </span>{project.actual_start_date || '-'}</div>
              <div><span className="text-gray-400">النهاية الفعلية: </span>{project.actual_end_date || '-'}</div>
              <div><span className="text-gray-400">الحالة: </span><StatusBadge status={project.status} label={(t.projects.statuses as any)[project.status]} /></div>
              {project.description && <div className="md:col-span-2"><span className="text-gray-400">الوصف: </span>{project.description}</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">التقارير اليومية</div><div className="text-lg font-bold text-gray-800 mt-1">{dailyReports.length}</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">تحديثات التقدم</div><div className="text-lg font-bold text-gray-800 mt-1">{progressUpdates.length}</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">طلبات الشراء</div><div className="text-lg font-bold text-gray-800 mt-1">{purchaseRequests.length}</div></div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">أوامر الشراء</div><div className="text-lg font-bold text-gray-800 mt-1">{purchaseOrders.length}</div></div>
          </div>
        </TabsContent>

        <TabsContent value="phases">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">مراحل المشروع</h2>
            <Button onClick={openPhaseCreate} className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4">
              <Plus className="h-4 w-4" />إضافة مرحلة
            </Button>
          </div>
          {phases.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <HardHat className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-400">لا توجد مراحل لهذا المشروع</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-semibold text-gray-500 h-9">#</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 h-9">المرحلة</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">نسبة الإنجاز</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">الحالة</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 h-9">تاريخ البداية</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">تاريخ النهاية</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 h-9">الميزانية</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">التكلفة الفعلية</TableHead>
                  <TableHead className="text-xs font-semibold text-gray-500 h-9 w-[120px]">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phases.sort((a, b) => a.sequence_number - b.sequence_number).map((p) => (
                  <TableRow key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <TableCell className="text-sm text-gray-400">{p.sequence_number}</TableCell>
                    <TableCell className="font-medium text-sm">{p.phase_name}</TableCell>
                    <TableCell><div className="flex items-center gap-2"><div className="w-16 bg-gray-200 rounded-full h-1.5"><div className="bg-[#3B82F6] h-1.5 rounded-full" style={{width: `${p.progress_percentage}%`}} /></div><span className="text-xs text-gray-500">{p.progress_percentage}%</span></div></TableCell>
                    <TableCell>
                      <Select value={p.status} onValueChange={(v) => handlePhaseStatusChange(p.id, v)}>
                        <SelectTrigger className="h-7 text-xs w-[110px] rounded-lg border-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {getAllowedStatusTransitions('phase', p.status).map(s => (
                            <SelectItem key={s} value={s} className="text-xs">{phaseStatusLabel(s)}</SelectItem>
                          ))}
                          <SelectItem value={p.status} className="text-xs" disabled>{phaseStatusLabel(p.status)} (الحالي)</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-sm">{p.planned_start}</TableCell><TableCell className="text-sm">{p.planned_end}</TableCell>
                    <TableCell className="text-sm">{fmt(p.budget_amount)}</TableCell><TableCell className={`text-sm ${p.actual_cost > p.budget_amount ? 'text-red-600' : ''}`}>{fmt(p.actual_cost)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openPhaseEdit(p)}>
                          <Pencil className="h-3.5 w-3.5 text-gray-400 hover:text-[#3B82F6]" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handlePhaseDelete(p.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}

          {/* Phase Create/Edit Dialog */}
          <Dialog open={phaseDialogOpen} onOpenChange={setPhaseDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  {editingPhase ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-2">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">اسم المرحلة</Label>
                  <Input value={phaseForm.phase_name || ''} onChange={e => setPhaseForm(p => ({ ...p, phase_name: e.target.value }))} className="h-9 text-sm rounded-lg border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">الرقم التسلسلي</Label>
                  <Input type="number" value={phaseForm.sequence_number || 1} onChange={e => setPhaseForm(p => ({ ...p, sequence_number: parseInt(e.target.value) || 1 }))} className="h-9 text-sm rounded-lg border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">نسبة الإنجاز (%)</Label>
                  <Input type="number" value={phaseForm.progress_percentage || 0} onChange={e => setPhaseForm(p => ({ ...p, progress_percentage: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))} className="h-9 text-sm rounded-lg border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">البداية المخطط</Label>
                  <Input type="date" value={phaseForm.planned_start || ''} onChange={e => setPhaseForm(p => ({ ...p, planned_start: e.target.value }))} className="h-9 text-sm rounded-lg border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">النهاية المخطط</Label>
                  <Input type="date" value={phaseForm.planned_end || ''} onChange={e => setPhaseForm(p => ({ ...p, planned_end: e.target.value }))} className="h-9 text-sm rounded-lg border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">البداية الفعلية</Label>
                  <Input type="date" value={phaseForm.actual_start || ''} onChange={e => setPhaseForm(p => ({ ...p, actual_start: e.target.value }))} className="h-9 text-sm rounded-lg border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">النهاية الفعلية</Label>
                  <Input type="date" value={phaseForm.actual_end || ''} onChange={e => setPhaseForm(p => ({ ...p, actual_end: e.target.value }))} className="h-9 text-sm rounded-lg border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">الميزانية</Label>
                  <Input type="number" value={phaseForm.budget_amount || 0} onChange={e => setPhaseForm(p => ({ ...p, budget_amount: parseInt(e.target.value) || 0 }))} className="h-9 text-sm rounded-lg border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">التكلفة الفعلية</Label>
                  <Input type="number" value={phaseForm.actual_cost || 0} onChange={e => setPhaseForm(p => ({ ...p, actual_cost: parseInt(e.target.value) || 0 }))} className="h-9 text-sm rounded-lg border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">الحالة</Label>
                  <Select value={phaseForm.status || 'not_started'} onValueChange={v => setPhaseForm(p => ({ ...p, status: v as ProjectPhase['status'] }))}>
                    <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">لم يبدأ</SelectItem>
                      <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="delayed">متأخر</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs font-medium text-gray-500">ملاحظات</Label>
                  <Input value={phaseForm.notes || ''} onChange={e => setPhaseForm(p => ({ ...p, notes: e.target.value }))} className="h-9 text-sm rounded-lg border-gray-200" />
                </div>
              </div>
              <DialogFooter className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Button variant="outline" onClick={() => setPhaseDialogOpen(false)} className="gap-1 text-sm h-9 rounded-lg border-gray-200">
                  <X className="h-4 w-4" />إلغاء
                </Button>
                <Button onClick={handlePhaseSave} className="gap-1 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg">
                  <Save className="h-4 w-4" />{editingPhase ? 'تحديث المرحلة' : 'إضافة المرحلة'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="budget">
          {budgets.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-14 w-14 mx-auto text-gray-200 mb-4" />
              <p className="text-sm font-medium text-gray-500">لا توجد بنود ميزانية</p>
              <p className="text-xs text-gray-400 mt-1">لم يتم إضافة بنود ميزانية لهذا المشروع</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">المعتمد</div><div className="text-lg font-bold text-gray-800 mt-1">{fmt(budgets.reduce((s, b) => s + b.approved_amount, 0))}</div></div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">الملتزم</div><div className="text-lg font-bold text-gray-800 mt-1">{fmt(budgets.reduce((s, b) => s + b.committed_amount, 0))}</div></div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">الفعلي</div><div className="text-lg font-bold text-gray-800 mt-1">{fmt(budgets.reduce((s, b) => s + b.actual_amount, 0))}</div></div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"><div className="text-xs text-gray-500">المتبقي</div><div className="text-lg font-bold text-emerald-600 mt-1">{fmt(budgets.reduce((s, b) => s + b.remaining_amount, 0))}</div></div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-gray-500 h-9">البند</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">الفئة</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">المعتمد</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 h-9">الملتزم</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">الفعلي</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">المتبقي</TableHead>
                      <TableHead className="text-xs font-semibold text-gray-500 h-9">الانحراف %</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map(b => (
                      <TableRow key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <TableCell className="font-medium text-sm">{b.budget_name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{b.budget_category}</Badge></TableCell>
                        <TableCell className="text-sm">{fmt(b.approved_amount)}</TableCell>
                        <TableCell className="text-sm">{fmt(b.committed_amount)}</TableCell>
                        <TableCell className="text-sm">{fmt(b.actual_amount)}</TableCell>
                        <TableCell className={`text-sm ${b.remaining_amount < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(b.remaining_amount)}</TableCell>
                        <TableCell className={`text-sm ${b.variance_percentage < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{b.variance_percentage > 0 ? '+' : ''}{b.variance_percentage}%</TableCell>
                        <TableCell><StatusBadge status={b.status} label={b.status === 'active' ? 'نشط' : b.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="daily">
          {dailyReports.length === 0 ? (
            <div className="text-center py-12"><ClipboardList className="h-12 w-12 mx-auto text-gray-300 mb-4" /><p className="text-gray-400">لا توجد تقارير يومية</p></div>
          ) : (
            <div className="space-y-4">
              {dailyReports.map(dr => (
                <div key={dr.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-800">{dr.report_number} - {dr.report_date}</h3>
                    <Badge variant={dr.approval_status === 'approved' ? 'default' : 'outline'} className="text-[10px]">{dr.approval_status === 'approved' ? 'معتمد' : dr.approval_status}</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400">الطقس: </span>{dr.weather_condition}</div>
                    <div><span className="text-gray-400">عدد العمال: </span>{dr.manpower_count}</div>
                    <div><span className="text-gray-400">المعدات في الموقع: </span>{dr.equipment_on_site}</div>
                    <div><span className="text-gray-400">المواد المستلمة: </span>{dr.materials_received || 'لا يوجد'}</div>
                    <div className="md:col-span-2"><span className="text-gray-400">الأعمال المنجزة: </span>{dr.work_completed_today}</div>
                    <div className="md:col-span-2"><span className="text-gray-400">الأعمال المخطط لها غداً: </span>{dr.planned_work_tomorrow}</div>
                    {dr.issues_encountered && <div className="md:col-span-2 text-red-600"><span className="text-gray-400">مشاكل: </span>{dr.issues_encountered}</div>}
                    {dr.safety_incidents && <div className="md:col-span-2 text-amber-600"><span className="text-gray-400">حوادث السلامة: </span>{dr.safety_incidents}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress">
          {progressUpdates.length === 0 ? (
            <div className="text-center py-12"><TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-4" /><p className="text-gray-400">لا توجد تحديثات تقدم</p></div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">التاريخ</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">التقدم السابق</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">التقدم الجديد</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">التغيير</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">الوصف</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">صور</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {progressUpdates.map(pu => (
                    <TableRow key={pu.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <TableCell className="text-sm">{pu.update_date}</TableCell>
                      <TableCell className="text-sm">{pu.previous_progress}%</TableCell>
                      <TableCell className="font-bold text-sm">{pu.new_progress}%</TableCell>
                      <TableCell className={`text-sm ${pu.progress_change > 0 ? 'text-emerald-600 font-bold' : 'text-red-600'}`}>+{pu.progress_change}%</TableCell>
                      <TableCell className="text-sm">{pu.description}</TableCell>
                      <TableCell className="text-sm">{pu.photos_count}</TableCell>
                      <TableCell><Badge variant={pu.approval_status === 'approved' ? 'default' : 'outline'} className="text-[10px]">{pu.approval_status === 'approved' ? 'معتمد' : pu.approval_status}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="procurement">
          <Tabs dir="rtl" defaultValue="prs" className="space-y-4">
            <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100 inline-flex">
              <TabsList className="bg-transparent h-auto p-0 gap-0">
                <TabsTrigger value="prs" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">طلبات الشراء</TabsTrigger>
                <TabsTrigger value="pos" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">أوامر الشراء</TabsTrigger>
                <TabsTrigger value="rfqs" className="data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white rounded-lg text-xs px-3 py-1.5">طلبات عروض الأسعار</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="prs">
              {purchaseRequests.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="h-14 w-14 mx-auto text-gray-200 mb-4" />
                  <p className="text-sm font-medium text-gray-500">لا توجد طلبات شراء</p>
                  <p className="text-xs text-gray-400 mt-1">لم يتم رفع طلبات شراء لهذا المشروع بعد</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">رقم الطلب</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">القسم</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">تاريخ الاستحقاق</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">الأولوية</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">المبلغ التقديري</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">الحالة</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {purchaseRequests.map(pr => (
                      <TableRow key={pr.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <TableCell className="font-medium text-sm">{pr.pr_number}</TableCell>
                        <TableCell className="text-sm">{pr.department}</TableCell>
                        <TableCell className="text-sm">{pr.required_date}</TableCell>
                        <TableCell><Badge variant={pr.priority === 'urgent' ? 'destructive' : pr.priority === 'high' ? 'default' : 'outline'} className="text-[10px]">{pr.priority === 'urgent' ? 'عاجل' : pr.priority === 'high' ? 'عالي' : pr.priority === 'medium' ? 'متوسط' : 'منخفض'}</Badge></TableCell>
                        <TableCell className="text-sm">{fmt(pr.estimated_total)}</TableCell>
                        <TableCell><StatusBadge status={pr.status} label={pr.status === 'approved' ? 'معتمد' : pr.status === 'pending' ? 'قيد الانتظار' : pr.status === 'draft' ? 'مسودة' : pr.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </TabsContent>
            <TabsContent value="pos">
              {purchaseOrders.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-14 w-14 mx-auto text-gray-200 mb-4" />
                  <p className="text-sm font-medium text-gray-500">لا توجد أوامر شراء</p>
                  <p className="text-xs text-gray-400 mt-1">لم يتم إنشاء أوامر شراء لهذا المشروع بعد</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">رقم الأمر</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">المورد</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">تاريخ الأمر</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">تاريخ التسليم المتوقع</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">المبلغ</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">حالة الاستلام</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">حالة الدفع</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">الحالة</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {purchaseOrders.map(po => (
                      <TableRow key={po.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <TableCell className="font-medium text-sm">{po.po_number}</TableCell>
                        <TableCell className="text-sm">{po.vendor}</TableCell>
                        <TableCell className="text-sm">{po.order_date}</TableCell>
                        <TableCell className="text-sm">{po.expected_delivery}</TableCell>
                        <TableCell className="text-sm">{fmt(po.total_amount)}</TableCell>
                        <TableCell><Badge variant={po.receipt_status === 'full' ? 'default' : po.receipt_status === 'partial' ? 'secondary' : 'outline'} className="text-[10px]">{po.receipt_status === 'full' ? 'مكتمل' : po.receipt_status === 'partial' ? 'جزئي' : 'لا يوجد'}</Badge></TableCell>
                        <TableCell><Badge variant={po.payment_status === 'paid' ? 'default' : po.payment_status === 'partially_paid' ? 'secondary' : 'outline'} className="text-[10px]">{po.payment_status === 'paid' ? 'مدفوع' : po.payment_status === 'partially_paid' ? 'مدفوع جزئياً' : 'غير مدفوع'}</Badge></TableCell>
                        <TableCell><StatusBadge status={po.status} label={po.status === 'completed' ? 'مكتمل' : po.status === 'in_progress' ? 'قيد التنفيذ' : po.status === 'approved' ? 'معتمد' : po.status === 'draft' ? 'مسودة' : po.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </TabsContent>
            <TabsContent value="rfqs">
              {rfqs.length === 0 ? (
                <div className="text-center py-12">
                  <ClipboardList className="h-14 w-14 mx-auto text-gray-200 mb-4" />
                  <p className="text-sm font-medium text-gray-500">لا توجد طلبات عروض أسعار</p>
                  <p className="text-xs text-gray-400 mt-1">لم يتم إنشاء طلبات عروض أسعار لهذا المشروع بعد</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"><Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-xs font-semibold text-gray-500 h-9">رقم الطلب</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">العنوان</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">آخر موعد للتقديم</TableHead><TableHead className="text-xs font-semibold text-gray-500 h-9">الحالة</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {rfqs.map(rfq => (
                      <TableRow key={rfq.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <TableCell className="font-medium text-sm">{rfq.rfq_number}</TableCell>
                        <TableCell className="text-sm">{rfq.title}</TableCell>
                        <TableCell className="text-sm">{rfq.submission_deadline}</TableCell>
                        <TableCell><StatusBadge status={rfq.status} label={rfq.status === 'under_evaluation' ? 'قيد التقييم' : rfq.status === 'quotations_received' ? 'تم استلام العروض' : rfq.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="costs">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ProjectCostSummaryCard
                approvedBudget={project.approved_budget}
                contractorClaims={costSummary.contractorClaims}
                materialsIssued={costSummary.materialsIssued}
                otherCosts={costSummary.otherCosts}
                totalActualCost={costSummary.totalActualCost}
                remainingBudget={costSummary.remainingBudget}
                variance={costSummary.variance}
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center"><DollarSign className="h-5 w-5 text-amber-600" /></div>
                <h2 className="text-base font-semibold text-gray-800">المطالبات</h2>
              </div>
              <div className="space-y-2">
                {claims.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 mx-auto text-gray-200 mb-3" />
                    <p className="text-sm font-medium text-gray-500">لا توجد مطالبات</p>
                    <p className="text-xs text-gray-400 mt-1">لم يتم تقديم مطالبات مقاولين لهذا المشروع</p>
                  </div>
                ) : (
                  claims.map(c => (
                    <div key={c.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded-lg">
                      <span>{c.claim_number}</span>
                      <span className="font-bold">{fmt(c.claimed_amount)}</span>
                      <Badge variant={c.payment_status === 'paid' ? 'default' : 'outline'} className="text-[10px]">
                        {c.payment_status === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gantt">
          <ProjectGantt
            tasks={phasesToGanttTasks(phases.map(p => ({
              id: p.id,
              phase_name: p.phase_name,
              start_date: p.planned_start,
              end_date: p.planned_end,
              completion_percentage: p.progress_percentage || 0,
            })))}
            viewMode="Month"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
