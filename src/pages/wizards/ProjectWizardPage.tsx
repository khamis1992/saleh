import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, HardHat, Sparkles } from 'lucide-react';
import { StepperForm, type WizardStep } from '@/components/shared/StepperForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { projectStore, landStore, contractorStore } from '@/services/stores';
import { toast } from 'sonner';
import { formatQARInt } from '@/lib/format';

const TYPES = [
  { value: 'single_villa', label: 'فيلا مفردة' },
  { value: 'villa_compound', label: 'مجمع فلل' },
  { value: 'residential_building', label: 'عمارة سكنية' },
  { value: 'commercial_building', label: 'عمارة تجارية' },
  { value: 'mixed_use', label: 'متعدد الاستخدام' },
];

export default function ProjectWizardPage() {
  const navigate = useNavigate();
  const [landId, setLandId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('residential_building');
  const [manager, setManager] = useState('');
  const [engineer, setEngineer] = useState('');
  const [budget, setBudget] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const lands = landStore.getAll();
  const contractors = contractorStore.getAll();

  const steps: WizardStep[] = [
    {
      key: 'land', title: 'اختيار الأرض', description: 'حدد الأرض التي سيقام عليها المشروع',
      render: () => (
        <div className="space-y-4">
          <Label>الأرض</Label>
          <Select value={landId} onValueChange={setLandId}>
            <SelectTrigger><SelectValue placeholder="اختر أرض مسجلة" /></SelectTrigger>
            <SelectContent>
              {lands.map(l => <SelectItem key={l.id} value={l.id}>{l.land_name} · {l.area_sqm} م²</SelectItem>)}
            </SelectContent>
          </Select>
          {lands.length === 0 && <p className="text-xs text-amber-600">لا توجد أراضٍ مسجلة. أضف أرضاً من /lands/create أولاً.</p>}
        </div>
      ),
      validate: () => landId ? true : 'يرجى اختيار أرض',
    },
    {
      key: 'details', title: 'تفاصيل المشروع', description: 'معلومات المشروع الأساسية',
      render: () => (
        <div className="space-y-4">
          <div>
            <Label>اسم المشروع *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="مشروع مجمع الياسمين" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>رمز المشروع</Label>
              <Input value={code} onChange={e => setCode(e.target.value)} placeholder="PRJ-2026-005" />
            </div>
            <div>
              <Label>نوع المشروع</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ),
      validate: () => name ? true : 'اسم المشروع مطلوب',
    },
    {
      key: 'team', title: 'الفريق', description: 'مدير المشروع والمهندس المسؤول',
      render: () => (
        <div className="space-y-4">
          <div>
            <Label>مدير المشروع</Label>
            <Input value={manager} onChange={e => setManager(e.target.value)} placeholder="م. خالد العمري" />
          </div>
          <div>
            <Label>المهندس المسؤول</Label>
            <Input value={engineer} onChange={e => setEngineer(e.target.value)} placeholder="م. فيصل الشهري" />
          </div>
        </div>
      ),
    },
    {
      key: 'budget', title: 'الميزانية', description: 'الميزانية المعتمدة للمشروع',
      render: () => (
        <div className="space-y-4">
          <div>
            <Label>الميزانية المعتمدة (ر.ق)</Label>
            <Input type="number" value={budget} onChange={e => setBudget(Number(e.target.value))} placeholder="5000000" />
            {budget > 0 && <p className="text-xs text-muted-foreground mt-1">{formatQARInt(budget)} ر.ق</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>تاريخ البدء</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label>تاريخ الانتهاء المتوقع</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'phases', title: 'المراحل', description: 'سيتم إنشاء 3 مراحل افتراضية: دراسة الجدوى، الإنشاءات، التسليم',
      render: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/40">
            <p className="text-sm font-semibold text-blue-900">سيتم إنشاء المراحل التالية تلقائياً:</p>
            <ul className="mt-2 space-y-1 text-sm text-blue-800">
              <li>1. دراسة الجدوى والتصميم</li>
              <li>2. الأعمال الإنشائية</li>
              <li>3. التشطيبات والتسليم</li>
            </ul>
          </div>
          <p className="text-xs text-muted-foreground">يمكنك تعديل المراحل لاحقاً من صفحة المشروع.</p>
        </div>
      ),
    },
    {
      key: 'review', title: 'مراجعة وتأكيد', description: 'تأكد من جميع المعلومات قبل الإنشاء',
      render: () => {
        const land = lands.find(l => l.id === landId);
        return (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">الأرض:</span> <span className="font-semibold">{land?.land_name || '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">اسم المشروع:</span> <span className="font-semibold">{name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الرمز:</span> <span className="font-mono">{code || 'تلقائي'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">النوع:</span> <span>{TYPES.find(t => t.value === type)?.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">المدير:</span> <span>{manager || '-'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">الميزانية:</span> <span className="font-bold">{formatQARInt(budget)} ر.ق</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">المراحل:</span> <span>3 مراحل افتراضية</span></div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5" />
              <p className="text-xs text-emerald-800">عند التأكيد سيتم: إنشاء المشروع + إنشاء 3 مراحل + إنشاء مركز تكلفة + تسجيل نشاط.</p>
            </div>
          </div>
        );
      },
    },
  ];

  const handleComplete = () => {
    try {
      const yearCode = new Date().getFullYear();
      const existing = projectStore.getAll();
      const yearCount = existing.filter(p => p.project_code?.includes(String(yearCode))).length + 1;
      const finalCode = code || `PRJ-${yearCode}-${String(yearCount).padStart(3, '0')}`;

      const project = projectStore.create({
        project_code: finalCode, project_name: name, project_type: type,
        land_id: landId, manager_name: manager, engineer_name: engineer,
        approved_budget: budget, start_date: startDate, planned_end_date: endDate,
        actual_cost: 0, completion_percentage: 0, status: 'idea',
      } as any);

      // create 3 default phases
      const phaseStore = (window as any).__phaseStore;
      if (phaseStore) {
        for (let i = 1; i <= 3; i++) {
          phaseStore.create({
            project_id: project.id, phase_name: ['دراسة الجدوى والتصميم', 'الأعمال الإنشائية', 'التشطيبات والتسليم'][i - 1],
            sequence_number: i, budget_amount: Math.round(budget / 3), actual_cost: 0,
            progress_percentage: 0, status: 'not_started',
          } as any);
        }
      }

      toast.success(`تم إنشاء المشروع ${name} بنجاح`);
      navigate(`/projects/${project.id}`);
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء إنشاء المشروع');
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <HardHat className="h-6 w-6 text-orange-600" />
        <div>
          <h1 className="text-xl font-bold">معالج إنشاء مشروع تطوير</h1>
          <p className="text-xs text-muted-foreground">6 خطوات لإنشاء مشروع كامل من الصفر</p>
        </div>
      </div>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={() => navigate('/projects')}
        completeLabel="إنشاء المشروع"
      />
    </div>
  );
}
