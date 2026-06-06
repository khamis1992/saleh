import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Save, HardHat } from 'lucide-react';
import { projectStore, landStore, employeeStore } from '@/services/stores';
import type { Project } from '@/types';

export default function ProjectCreatePage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState<any>({
    project_code: '', project_name: '', land_id: '', project_type: 'residential_building',
    description: '', planned_start_date: '', planned_end_date: '',
    estimated_budget: 0, approved_budget: 0, actual_cost: 0,
    completion_percentage: 0, status: 'construction',
    project_manager_id: '', engineer_id: '',
  });

  const lands = landStore.getAll();
  const employees = employeeStore.getAll();

  useEffect(() => {
    if (id && isEdit) {
      const existing = projectStore.getById(id);
      if (existing) {
        const { id: _, company_id: __, actual_start_date: _____, actual_end_date: ______,
          notes: _______, created_at: ________, updated_at: _________, ...rest } = existing;
        setForm(rest);
      }
    }
  }, [id, isEdit]);

  const update = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  const handleSave = () => {
    const data = {
      ...form,
      company_id: '',
      estimated_budget: Number(form.estimated_budget) || 0,
      approved_budget: Number(form.approved_budget) || 0,
      actual_cost: Number(form.actual_cost) || 0,
      completion_percentage: Number(form.completion_percentage) || 0,
      project_manager_id: form.project_manager_id || '',
      engineer_id: form.engineer_id || '',
      actual_start_date: form.planned_start_date, actual_end_date: '',
    };
    if (isEdit && id) {
      projectStore.update(id, data);
      toast.success(`تم تحديث ${form.project_name || 'المشروع'} بنجاح`);
    } else {
      data.created_at = new Date().toISOString();
      data.updated_at = new Date().toISOString();
      projectStore.create(data as any);
      toast.success(`تم إنشاء ${form.project_name || 'المشروع'} بنجاح`);
    }
    navigate('/projects');
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-xs text-gray-500">
            <ArrowRight className="h-4 w-4 ml-1" />{t.common.back}
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isEdit ? t.projects.edit : t.projects.create}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{isEdit ? 'تعديل بيانات المشروع' : 'إنشاء مشروع جديد'}</p>
          </div>
        </div>
        <Button onClick={handleSave} className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4">
          <Save className="h-4 w-4" />{t.common.save}
        </Button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <HardHat className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">معلومات المشروع الأساسية</h2>
              <p className="text-xs text-gray-400 mt-0.5">البيانات الرئيسية للمشروع</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.projects.code}</Label><Input value={form.project_code} onChange={e => update('project_code', e.target.value)} placeholder="PRJ-2026-001" className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.projects.name}</Label><Input value={form.project_name} onChange={e => update('project_name', e.target.value)} placeholder="اسم المشروع" className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.projects.relatedLand}</Label>
              <Select value={form.land_id} onValueChange={v => update('land_id', v)}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue placeholder="اختر الأرض" /></SelectTrigger>
                <SelectContent>
                  {lands.map(l => <SelectItem key={l.id} value={l.id}>{l.land_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.projects.type}</Label>
              <Select value={form.project_type} onValueChange={v => update('project_type', v)}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_villa">فيلا مفردة</SelectItem><SelectItem value="villa_compound">مجمع فلل</SelectItem>
                  <SelectItem value="residential_building">عمارة سكنية</SelectItem><SelectItem value="commercial_building">عمارة تجارية</SelectItem>
                  <SelectItem value="retail_complex">مجمع تجاري</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">مدير المشروع</Label>
              <Select value={form.project_manager_id || ''} onValueChange={v => update('project_manager_id', v)}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue placeholder="اختر مدير المشروع" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— غير محدد —</SelectItem>
                  {employees.filter(e => e.status === 'active').map(e => <SelectItem key={e.id} value={e.id}>{e.full_name} — {e.job_title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">المهندس المشرف</Label>
              <Select value={form.engineer_id || ''} onValueChange={v => update('engineer_id', v)}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue placeholder="اختر المهندس المشرف" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— غير محدد —</SelectItem>
                  {employees.filter(e => e.status === 'active').map(e => <SelectItem key={e.id} value={e.id}>{e.full_name} — {e.job_title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">تاريخ البداية</Label><Input type="date" value={form.planned_start_date} onChange={e => update('planned_start_date', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.projects.plannedEnd}</Label><Input type="date" value={form.planned_end_date} onChange={e => update('planned_end_date', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.projects.budget}</Label><Input type="number" value={form.approved_budget || ''} onChange={e => update('approved_budget', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.projects.actualCost}</Label><Input type="number" value={form.actual_cost || ''} onChange={e => update('actual_cost', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.projects.completion} %</Label><Input type="number" value={form.completion_percentage || ''} onChange={e => update('completion_percentage', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
            <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.common.status}</Label>
              <Select value={form.status} onValueChange={v => update('status', v)}>
                <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="idea">فكرة</SelectItem><SelectItem value="design">تصميم</SelectItem>
                  <SelectItem value="construction">تحت الإنشاء</SelectItem><SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="on_hold">معلق</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <HardHat className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-800">وصف المشروع</h2>
              <p className="text-xs text-gray-400 mt-0.5">وصف تفصيلي للمشروع وأهدافه</p>
            </div>
          </div>
          <Textarea value={form.description || ''} onChange={e => update('description', e.target.value)} placeholder="وصف تفصيلي للمشروع..." rows={4} className="text-sm rounded-lg border-gray-200" />
        </div>
        <div className="flex items-center gap-3 justify-end">
          <Button variant="outline" onClick={() => navigate('/projects')} className="h-9 text-sm rounded-lg">{t.common.cancel}</Button>
          <Button onClick={handleSave} className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4"><Save className="h-4 w-4" />{t.common.save}</Button>
        </div>
      </div>
    </div>
  );
}
