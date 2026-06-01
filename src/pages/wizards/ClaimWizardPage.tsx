import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, Check } from 'lucide-react';
import { StepperForm, type WizardStep } from '@/components/shared/StepperForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { formatQARInt } from '@/lib/format';
import { updateProjectCostOnClaim, logAudit } from '@/utils/exportUtils';

export default function ClaimWizardPage() {
  const navigate = useNavigate();
  const [contractor, setContractor] = useState('');
  const [project, setProject] = useState('');
  const [claimNumber, setClaimNumber] = useState('');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [claimedAmount, setClaimedAmount] = useState(0);
  const [workPercent, setWorkPercent] = useState(0);
  const [retention, setRetention] = useState(0);
  const [advanceDeduction, setAdvanceDeduction] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [engineerNotes, setEngineerNotes] = useState('');
  const [pmApproved, setPmApproved] = useState(true);
  const [financeApproved, setFinanceApproved] = useState(true);

  const netPayable = useMemo(() => Math.max(0, claimedAmount - retention - advanceDeduction - penalty), [claimedAmount, retention, advanceDeduction, penalty]);

  const steps: WizardStep[] = [
    {
      key: 'contract', title: 'العقد والمقاول',
      render: () => (
        <div className="space-y-4">
          <div>
            <Label>رقم المطالبة</Label>
            <Input value={claimNumber} onChange={e => setClaimNumber(e.target.value)} placeholder="CLM-2026-007" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>المقاول</Label>
              <Input value={contractor} onChange={e => setContractor(e.target.value)} placeholder="شركة البناء المتقدمة" />
            </div>
            <div>
              <Label>المشروع</Label>
              <Input value={project} onChange={e => setProject(e.target.value)} placeholder="مجمع النخيل السكني" />
            </div>
          </div>
          <div>
            <Label>تاريخ المطالبة</Label>
            <Input type="date" value={claimDate} onChange={e => setClaimDate(e.target.value)} />
          </div>
        </div>
      ),
    },
    {
      key: 'amount', title: 'مبلغ المطالبة',
      render: () => (
        <div className="space-y-4">
          <div>
            <Label>المبلغ المطالب (ر.ق) *</Label>
            <Input type="number" value={claimedAmount} onChange={e => setClaimedAmount(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground mt-1">{formatQARInt(claimedAmount)} ر.ق</p>
          </div>
          <div>
            <Label>نسبة الإنجاز (%)</Label>
            <Input type="number" min={0} max={100} value={workPercent} onChange={e => setWorkPercent(Number(e.target.value))} />
            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden mt-1">
              <div className="h-full bg-blue-500" style={{ width: `${workPercent}%` }} />
            </div>
          </div>
        </div>
      ),
      validate: () => claimedAmount > 0 ? true : 'حدد المبلغ',
    },
    {
      key: 'review-progress', title: 'مراجعة الإنجاز',
      render: () => (
        <div className="space-y-3">
          <p className="text-sm">هل المبلغ المطالب يتناسب مع نسبة الإنجاز ({workPercent}%)؟</p>
          <Textarea value={engineerNotes} onChange={e => setEngineerNotes(e.target.value)} placeholder="ملاحظات المهندس على التحقق..." />
        </div>
      ),
    },
    {
      key: 'deductions', title: 'الاستقطاعات',
      render: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>محتجز ضمان (5%)</Label>
              <Input type="number" value={retention} onChange={e => setRetention(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground mt-1">{formatQARInt(retention)} ر.ق</p>
            </div>
            <div>
              <Label>خصم مسبق</Label>
              <Input type="number" value={advanceDeduction} onChange={e => setAdvanceDeduction(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground mt-1">{formatQARInt(advanceDeduction)} ر.ق</p>
            </div>
            <div>
              <Label>غرامات</Label>
              <Input type="number" value={penalty} onChange={e => setPenalty(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground mt-1">{formatQARInt(penalty)} ر.ق</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-xs text-muted-foreground">صافي المستحق</p>
            <p className="text-2xl font-bold text-emerald-700">{formatQARInt(netPayable)} ر.ق</p>
          </div>
        </div>
      ),
    },
    {
      key: 'pm-approval', title: 'موافقة مدير المشروع',
      render: () => (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pm" checked={pmApproved} onChange={e => setPmApproved(e.target.checked)} className="rounded" />
            <Label htmlFor="pm" className="cursor-pointer">أوافق على المطالبة بصفتي مدير المشروع</Label>
          </div>
          <p className="text-xs text-muted-foreground">الموافقة ستنقل الطلب إلى المرحلة التالية (موافقة المالية).</p>
        </div>
      ),
    },
    {
      key: 'finance-approval', title: 'موافقة المالية',
      render: () => (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="fin" checked={financeApproved} onChange={e => setFinanceApproved(e.target.checked)} className="rounded" />
            <Label htmlFor="fin" className="cursor-pointer">أوافق على صرف المبلغ من المالية</Label>
          </div>
          <p className="text-xs text-muted-foreground">الموافقة ستنشئ ذمة مقاول وتحدّث تكلفة المشروع.</p>
        </div>
      ),
    },
    {
      key: 'review', title: 'تأكيد',
      render: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">رقم:</span> <span className="font-mono">{claimNumber || 'تلقائي'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المقاول:</span> <span>{contractor}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المشروع:</span> <span>{project}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المبلغ المطالب:</span> <span>{formatQARInt(claimedAmount)} ر.ق</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">الاستقطاعات:</span> <span>{formatQARInt(retention + advanceDeduction + penalty)} ر.ق</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground font-bold">صافي المستحق:</span> <span className="font-bold text-emerald-700">{formatQARInt(netPayable)} ر.ق</span></div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
            <Check className="h-4 w-4 text-emerald-600 mt-0.5" />
            <div className="text-xs text-emerald-800">
              <p>سيتم اعتماد المطالبة وتحديث تكلفة المشروع.</p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleComplete = () => {
    if (!pmApproved || !financeApproved) {
      toast.error('يجب الحصول على موافقة مدير المشروع والمالية');
      return;
    }
    try {
      const newClaim = {
        id: `clm-${Date.now()}`,
        claim_number: claimNumber || `CLM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`,
        claim_date: claimDate, claimed_amount: claimedAmount, work_completed_percentage: workPercent,
        retention_amount: retention, advance_deduction: advanceDeduction, penalty_amount: penalty,
        net_payable: netPayable, engineer_verification_status: 'verified', engineer_notes: engineerNotes,
        project_manager_approval_status: 'approved', finance_approval_status: 'approved',
        payment_status: 'unpaid', status: 'approved', contractor_name: contractor, project_name: project,
      };
      // save to localStorage
      const existing = JSON.parse(localStorage.getItem('erp_contractor_claims') || '[]');
      existing.push(newClaim);
      localStorage.setItem('erp_contractor_claims', JSON.stringify(existing));
      logAudit('create', 'contractor_claims', newClaim.id, '', `${netPayable} ر.ق`);

      toast.success('تم اعتماد المطالبة بنجاح');
      navigate('/construction/claims');
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ');
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <Banknote className="h-6 w-6 text-amber-600" />
        <div>
          <h1 className="text-xl font-bold">معالج اعتماد مطالبة مقاول</h1>
          <p className="text-xs text-muted-foreground">7 خطوات لتقديم واعتماد مطالبة جديدة</p>
        </div>
      </div>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={() => navigate('/construction/claims')}
        completeLabel="اعتماد المطالبة"
      />
    </div>
  );
}
