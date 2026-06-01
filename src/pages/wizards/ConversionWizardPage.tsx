import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Sparkles } from 'lucide-react';
import { StepperForm, type WizardStep } from '@/components/shared/StepperForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { projectStore, propertyStore } from '@/services/stores';
import { toast } from 'sonner';
import { formatQARInt } from '@/lib/format';
import { generateJournalEntry } from '@/utils/exportUtils';

export default function ConversionWizardPage() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [propertyCode, setPropertyCode] = useState('');
  const [propertyType, setPropertyType] = useState('residential');
  const [buildingCount, setBuildingCount] = useState(1);
  const [unitsPerBuilding, setUnitsPerBuilding] = useState(4);
  const [landCost, setLandCost] = useState(0);
  const [actualCost, setActualCost] = useState(0);
  const [occupancy, setOccupancy] = useState(95);

  const projects = useMemo(() => projectStore.getAll().filter(p => ['completed', 'construction'].includes(p.status)), []);
  const selected = projects.find(p => p.id === projectId);

  const totalAssetValue = (landCost || 0) + (actualCost || 0);

  const steps: WizardStep[] = [
    {
      key: 'project', title: 'اختيار المشروع', description: 'حدد المشروع المكتمل المراد تحويله إلى عقار',
      render: () => (
        <div className="space-y-4">
          <Label>المشروع</Label>
          <Select value={projectId} onValueChange={(v) => {
            setProjectId(v);
            const p = projects.find(x => x.id === v);
            if (p) {
              setPropertyName(`عقار ${p.project_name}`);
              setPropertyCode(p.project_code?.replace('PRJ', 'PROP') || '');
              setActualCost(p.actual_cost || 0);
              setLandCost(p.approved_budget ? Math.round(p.approved_budget * 0.2) : 0);
            }
          }}>
            <SelectTrigger><SelectValue placeholder="اختر مشروع" /></SelectTrigger>
            <SelectContent>
              {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.project_name} · {p.status}</SelectItem>)}
            </SelectContent>
          </Select>
          {projects.length === 0 && <p className="text-xs text-amber-600">لا توجد مشاريع مكتملة للتحويل.</p>}
        </div>
      ),
      validate: () => projectId ? true : 'يرجى اختيار مشروع',
    },
    {
      key: 'final-cost', title: 'مراجعة التكاليف', description: 'التكلفة النهائية للمشروع وقيمة الأرض',
      render: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>تكلفة الأرض (ر.ق)</Label>
              <Input type="number" value={landCost} onChange={e => setLandCost(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground mt-1">{formatQARInt(landCost)} ر.ق</p>
            </div>
            <div>
              <Label>التكلفة الفعلية للمشروع (ر.ق)</Label>
              <Input type="number" value={actualCost} onChange={e => setActualCost(Number(e.target.value))} />
              <p className="text-xs text-muted-foreground mt-1">{formatQARInt(actualCost)} ر.ق</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <p className="text-xs text-muted-foreground">إجمالي قيمة الأصل</p>
            <p className="text-2xl font-bold text-blue-900">{formatQARInt(totalAssetValue)} ر.ق</p>
          </div>
        </div>
      ),
    },
    {
      key: 'property', title: 'تفاصيل العقار', description: 'اسم العقار ونوعه',
      render: () => (
        <div className="space-y-4">
          <div>
            <Label>اسم العقار *</Label>
            <Input value={propertyName} onChange={e => setPropertyName(e.target.value)} placeholder="عقار مجمع الياسمين" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>رمز العقار</Label>
              <Input value={propertyCode} onChange={e => setPropertyCode(e.target.value)} placeholder="PROP-2026-001" />
            </div>
            <div>
              <Label>نوع العقار</Label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">سكني</SelectItem>
                  <SelectItem value="commercial">تجاري</SelectItem>
                  <SelectItem value="mixed">مختلط</SelectItem>
                  <SelectItem value="villa">فيلا</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ),
      validate: () => propertyName ? true : 'اسم العقار مطلوب',
    },
    {
      key: 'buildings', title: 'المباني', description: 'كم مبنى تريد إنشاءه',
      render: () => (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>عدد المباني</Label>
              <Input type="number" min={1} value={buildingCount} onChange={e => setBuildingCount(Math.max(1, Number(e.target.value)))} />
            </div>
            <div>
              <Label>وحدات لكل مبنى</Label>
              <Input type="number" min={1} value={unitsPerBuilding} onChange={e => setUnitsPerBuilding(Math.max(1, Number(e.target.value)))} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <p className="text-sm text-emerald-900">
              <strong>{buildingCount * unitsPerBuilding}</strong> وحدة سيتم إنشاؤها إجمالاً
              في <strong>{buildingCount}</strong> مبنى
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'units', title: 'الوحدات', description: 'سيتم إنشاء الوحدات تلقائياً بحالة متاحة للتأجير',
      render: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-blue-100 bg-blue-50/40">
            <p className="text-sm font-semibold text-blue-900">سيتم إنشاء:</p>
            <ul className="mt-2 space-y-1 text-sm text-blue-800">
              <li>• {buildingCount} مبنى بأرقام B-1 إلى B-{buildingCount}</li>
              <li>• {buildingCount * unitsPerBuilding} وحدة بأرقام U-1 إلى U-{buildingCount * unitsPerBuilding}</li>
              <li>• كل الوحدات بحالة "متاحة" (جاهزة للتأجير)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      key: 'journal', title: 'القيد المحاسبي', description: 'سيتم تسجيل قيد تحويل الأصل من مشاريع تحت التنفيذ إلى عقار',
      render: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-gray-200 text-sm space-y-2">
            <div className="flex justify-between"><span>مدين: عقار ({propertyName || 'العقار'})</span><span className="font-bold">{formatQARInt(totalAssetValue)} ر.ق</span></div>
            <div className="flex justify-between text-muted-foreground">دائن: مشاريع تحت التنفيذ</div>
            <div className="flex justify-between"><span className="font-mono">JP-{propertyCode}</span><span className="text-xs text-muted-foreground">تلقائي</span></div>
          </div>
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-emerald-600 mt-0.5" />
            <p className="text-xs text-emerald-800">سيتم إنشاء قيد محاسبي تلقائياً بقيمة {formatQARInt(totalAssetValue)} ر.ق</p>
          </div>
        </div>
      ),
    },
    {
      key: 'review', title: 'تأكيد التحويل', description: 'مراجعة نهائية',
      render: () => (
        <div className="space-y-3">
          <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">المشروع:</span> <span className="font-semibold">{selected?.project_name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">العقار:</span> <span className="font-semibold">{propertyName}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">إجمالي قيمة الأصل:</span> <span className="font-bold">{formatQARInt(totalAssetValue)} ر.ق</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المباني:</span> <span>{buildingCount}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">الوحدات:</span> <span>{buildingCount * unitsPerBuilding}</span></div>
          </div>
        </div>
      ),
    },
  ];

  const handleComplete = () => {
    try {
      // Create property
      const yearCode = new Date().getFullYear();
      const existingProps = propertyStore.getAll();
      const count = existingProps.length + 1;
      const finalCode = propertyCode || `PROP-${yearCode}-${String(count).padStart(3, '0')}`;

      const property = propertyStore.create({
        property_code: finalCode, property_name: propertyName, property_type: propertyType,
        total_units: buildingCount * unitsPerBuilding, total_asset_value: totalAssetValue,
        land_cost: landCost, construction_cost: actualCost, occupancy_rate: 0,
        status: 'active', completion_percentage: 100,
      } as any);

      // Lock the project
      if (selected) {
        projectStore.update(selected.id, { status: 'converted' } as any);
      }

      // Create journal entry
      generateJournalEntry(
        `تحويل مشروع ${selected?.project_name || ''} إلى عقار ${propertyName}`,
        'مشاريع',
        property.id,
        [
          { account_id: 'acc-6', debit: totalAssetValue, credit: 0, description: 'أصول عقارية' },
          { account_id: 'acc-5', debit: 0, credit: totalAssetValue, description: 'مشاريع تحت التنفيذ' },
        ],
      );

      toast.success(`تم تحويل المشروع إلى عقار ${propertyName} بنجاح`);
      navigate(`/properties/${property.id}`);
    } catch (e) {
      console.error(e);
      toast.error('حدث خطأ أثناء التحويل');
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-2 mb-2">
        <ArrowLeftRight className="h-6 w-6 text-blue-600" />
        <div>
          <h1 className="text-xl font-bold">معالج تحويل مشروع إلى عقار</h1>
          <p className="text-xs text-muted-foreground">7 خطوات لتحويل مشروع مكتمل إلى عقار جاهز للتأجير</p>
        </div>
      </div>
      <StepperForm
        steps={steps}
        onComplete={handleComplete}
        onCancel={() => navigate('/projects')}
        completeLabel="تنفيذ التحويل"
      />
    </div>
  );
}
