import { useState } from 'react';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { formatQAR, formatQARInt } from '@/lib/format';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Building2, CheckCircle2, Calculator } from 'lucide-react';
import { createStore } from '@/services/dataService';
import { generateJournalEntry } from '@/utils/exportUtils';

interface ConversionRecord {
  id: string;
  project_id: string;
  property_code: string;
  property_name: string;
  property_type: string;
  address: string;
  land_cost: number;
  construction_cost: number;
  other_costs: number;
  total: number;
  converted_at: string;
}

const conversionStore = createStore<ConversionRecord>({ key: 'erp_project_conversions', seed: [] });

interface ProjectOption {
  id: string;
  name: string;
  land_cost: number;
  construction_cost: number;
  other_costs: number;
  status: string;
  land_name: string;
  completion_pct: number;
}

function getCompletedProjects(): ProjectOption[] {
  const projects: ProjectOption[] = [];
  try {
    const rawProjects = localStorage.getItem('erp_projects');
    const rawLands = localStorage.getItem('erp_lands');
    if (rawProjects) {
      const allProjects: Record<string, unknown>[] = JSON.parse(rawProjects);
      const lands: Record<string, string>[] = rawLands ? JSON.parse(rawLands) : [];
      for (const p of allProjects) {
        if (p.status === 'completed' || p.status === 'testing') {
          const land = lands.find((l) => l.id === p.land_id);
          const constructionCost = (p.actual_cost as number) || 0;
          const landCost = (land?.total_acquisition_cost ? Number(land.total_acquisition_cost) : 0);
          const otherCosts = Math.round(constructionCost * 0.08);
          projects.push({
            id: p.id as string, name: (p.project_name as string) || '',
            land_cost: landCost, construction_cost: constructionCost, other_costs: otherCosts,
            status: p.status as string, land_name: (land?.land_name as string) || '',
            completion_pct: (p.completion_percentage as number) || 0,
          });
        }
      }
    }
  } catch {}
  return projects;
}

const propertyTypeLabels: Record<string, string> = {
  residential_building: 'عمارة سكنية', commercial_building: 'مبنى تجاري', villa_compound: 'مجمع فلل',
  villa: 'فيلا', mixed_use: 'متعدد الاستخدامات', warehouse: 'مستودع', office_building: 'مبنى مكاتب', retail_complex: 'مجمع تجاري',
};

function mapProjectTypeToPropertyType(projectType: string): string {
  const map: Record<string, string> = {
    residential_building: 'residential_building', commercial_building: 'commercial_building',
    villa_compound: 'villa_compound', single_villa: 'villa', mixed_use: 'mixed_use',
    warehouse: 'warehouse', office_building: 'office_building', retail_complex: 'retail_complex',
  };
  return map[projectType] || 'residential_building';
}

export default function ProjectConversionPage() {
  const { t } = useLocale();
  const projects = getCompletedProjects();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [converted, setConverted] = useState(false);
  const [conversionResult, setConversionResult] = useState<ConversionRecord | null>(null);
  const [propertyCode, setPropertyCode] = useState('');
  const [propertyName, setPropertyName] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [address, setAddress] = useState('');
  const [otherCosts, setOtherCosts] = useState(0);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const totalCost = selectedProject ? selectedProject.land_cost + selectedProject.construction_cost + otherCosts : 0;
  const fmt = (v: number) => formatQAR(v);

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId); setShowSummary(false); setConverted(false);
    const proj = projects.find((p) => p.id === projectId);
    if (proj) {
      setPropertyName(proj.name);
      setPropertyCode(`PROP-${String(projects.length + 1).padStart(3, '0')}`);
      setAddress(proj.land_name);
      setOtherCosts(proj.other_costs);
      try {
        const raw = localStorage.getItem('erp_projects');
        if (raw) {
          const allProjects: Record<string, unknown>[] = JSON.parse(raw);
          const p = allProjects.find((x: Record<string, unknown>) => x.id === projectId);
          if (p && p.project_type) { setPropertyType(mapProjectTypeToPropertyType(p.project_type as string)); }
        }
      } catch {}
    }
  };

  const handleConvert = () => {
    if (!selectedProject || !propertyCode || !propertyName || !propertyType || !address) return;
    const record: Omit<ConversionRecord, 'id'> = {
      project_id: selectedProject.id, property_code: propertyCode, property_name: propertyName,
      property_type: propertyType, address: address, land_cost: selectedProject.land_cost,
      construction_cost: selectedProject.construction_cost, other_costs: otherCosts,
      total: totalCost, converted_at: new Date().toISOString(),
    };
    const saved = conversionStore.create(record);
    setConversionResult(saved); setConverted(true);
    toast.success('تم تحويل المشروع إلى عقار بنجاح');
    // Generate JE: Debit Buildings (acc-6), Credit Projects Under Construction (acc-5)
    generateJournalEntry(
      `تحويل مشروع إلى عقار — ${propertyCode} ${propertyName}`,
      'مشاريع',
      selectedProject.id,
      [
        { account_id: 'acc-6', debit: totalCost, credit: 0, description: 'أصل — مباني' },
        { account_id: 'acc-5', debit: 0, credit: totalCost, description: 'تحويل من مشاريع تحت التنفيذ' },
      ],
    );
    try {
      const raw = localStorage.getItem('erp_properties');
      if (raw) {
        const properties: Record<string, unknown>[] = JSON.parse(raw);
        properties.push({
          id: saved.id, company_id: '', property_code: propertyCode, property_name: propertyName,
          project_id: selectedProject.id, land_id: '', property_type: propertyType, address: address,
          completion_date: new Date().toISOString().split('T')[0], handover_date: '',
          land_cost: selectedProject.land_cost, construction_cost: selectedProject.construction_cost,
          other_capitalized_cost: otherCosts, total_asset_value: totalCost, useful_life_years: 30,
          depreciation_method: 'straight_line', annual_depreciation: Math.round(totalCost / 30),
          property_manager_id: '', status: 'ready_for_leasing',
        });
        localStorage.setItem('erp_properties', JSON.stringify(properties));
      }
    } catch {}
  };

  if (converted && conversionResult) {
    return (
      <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">تحويل المشروع إلى عقار</h1>
          <p className="text-xs text-gray-500 mt-0.5">تحويل مشروع مكتمل إلى عقار في النظام</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center max-w-2xl mx-auto">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">تم التحويل بنجاح!</h2>
          <p className="text-gray-500 mb-6">تم تحويل المشروع إلى عقار وإضافته إلى سجل العقارات</p>
          <div className="bg-gray-50 rounded-xl p-6 text-right space-y-3 max-w-md mx-auto">
            <div className="flex justify-between"><span className="text-gray-400">كود العقار</span><span className="font-mono font-semibold">{conversionResult.property_code}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">اسم العقار</span><span>{conversionResult.property_name}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">نوع العقار</span><span>{propertyTypeLabels[conversionResult.property_type] || conversionResult.property_type}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">العنوان</span><span>{conversionResult.address}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold"><span>القيمة الإجمالية</span><span className="font-mono">{fmt(conversionResult.total)}</span></div>
          </div>
          <div className="mt-6 flex gap-3 justify-center">
            <Button onClick={() => { setSelectedProjectId(''); setShowSummary(false); setConverted(false); setConversionResult(null); }} className="bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4">تحويل مشروع آخر</Button>
            <Button variant="outline" onClick={() => window.location.href = '/properties'} className="h-9 text-sm rounded-lg">الذهاب إلى العقارات</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">تحويل المشروع إلى عقار</h1>
        <p className="text-xs text-gray-500 mt-0.5">اختر مشروعاً مكتملاً لتحويله إلى عقار</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center"><Building2 className="h-5 w-5 text-blue-600" /></div>
            <div><h2 className="text-base font-semibold text-gray-800">اختيار المشروع</h2><p className="text-xs text-gray-400 mt-0.5">اختر المشروع المكتمل الذي ترغب في تحويله إلى عقار</p></div>
          </div>
          <div>
            <Label className="text-xs font-medium text-gray-500">المشروع *</Label>
            <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200 mt-1"><SelectValue placeholder="اختر مشروعاً..." /></SelectTrigger>
              <SelectContent>
                {projects.length === 0 && (<SelectItem value="none" disabled>لا توجد مشاريع مكتملة</SelectItem>)}
                {projects.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} - {p.completion_pct}%</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          {selectedProject && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm"><span>نسبة الإنجاز</span><span className="font-semibold text-emerald-600">{selectedProject.completion_pct}%</span></div>
              <div className="flex justify-between text-sm"><span>الأرض</span><span>{selectedProject.land_name}</span></div>
              <div className="flex justify-between text-sm"><span>الحالة</span><span className="text-blue-600">{selectedProject.status === 'testing' ? 'مرحلة الاختبار' : 'مكتمل'}</span></div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Building2 className="h-5 w-5 text-emerald-600" /></div>
            <div><h2 className="text-base font-semibold text-gray-800">بيانات العقار</h2><p className="text-xs text-gray-400 mt-0.5">أدخل بيانات العقار الذي سيتم إنشاؤه</p></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">كود العقار *</Label><Input value={propertyCode} onChange={(e) => setPropertyCode(e.target.value)} disabled={!selectedProject} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">اسم العقار *</Label><Input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} disabled={!selectedProject} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">نوع العقار *</Label>
            <Select value={propertyType} onValueChange={setPropertyType} disabled={!selectedProject}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>{Object.entries(propertyTypeLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">العنوان *</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} disabled={!selectedProject} className="h-9 text-sm rounded-lg border-gray-200" /></div>
        </div>
      </div>

      {selectedProject && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center"><Calculator className="h-5 w-5 text-amber-600" /></div>
            <div><h2 className="text-base font-semibold text-gray-800">ملخص التكاليف قبل التحويل</h2></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-xl p-4"><span className="text-xs text-gray-500">تكلفة الأرض</span><div className="text-xl font-bold text-gray-800 mt-1">{fmt(selectedProject.land_cost)}</div></div>
            <div className="bg-gray-50 rounded-xl p-4"><span className="text-xs text-gray-500">تكلفة الإنشاء</span><div className="text-xl font-bold text-gray-800 mt-1">{fmt(selectedProject.construction_cost)}</div></div>
            <div className="bg-gray-50 rounded-xl p-4"><span className="text-xs text-gray-500">تكاليف أخرى</span>
              <Input type="number" value={otherCosts} onChange={(e) => setOtherCosts(Number(e.target.value))} className="mt-1 h-9 text-sm rounded-lg border-gray-200" />
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100"><span className="text-xs text-gray-500">إجمالي قيمة الأصل</span><div className="text-xl font-bold text-blue-600 mt-1">{fmt(totalCost)}</div></div>
          </div>
          <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
            <div className="text-sm text-gray-500"><Building2 className="h-4 w-4 inline ml-1" />العقار: <span className="font-semibold">{propertyName}</span> | الكود: <span className="font-mono">{propertyCode}</span></div>
            {!showSummary ? (
              <Button onClick={() => setShowSummary(true)} disabled={!propertyName || !propertyCode || !propertyType || !address} className="bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4">مراجعة التحويل</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSummary(false)} className="h-9 text-sm rounded-lg">رجوع</Button>
                <Button onClick={handleConvert} className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4"><CheckCircle2 className="h-4 w-4" />تأكيد التحويل</Button>
              </div>
            )}
          </div>
          {showSummary && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h4 className="font-semibold text-emerald-800 mb-2">ملخص عملية التحويل</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">المشروع:</span> {selectedProject.name}</div>
                <div><span className="text-gray-500">العقار الجديد:</span> {propertyName}</div>
                <div><span className="text-gray-500">الكود:</span> <span className="font-mono">{propertyCode}</span></div>
                <div><span className="text-gray-500">النوع:</span> {propertyTypeLabels[propertyType] || propertyType}</div>
                <div><span className="text-gray-500">العنوان:</span> {address}</div>
                <div><span className="text-gray-500">التكلفة الإجمالية:</span> <span className="font-mono font-semibold">{fmt(totalCost)}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {!selectedProject && projects.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center mt-6">
          <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium text-gray-500">لا توجد مشاريع جاهزة للتحويل</p>
          <p className="text-sm text-gray-400 mt-1">تأكد من وجود مشاريع مكتملة في النظام أولاً</p>
        </div>
      )}
    </div>
  );
}
