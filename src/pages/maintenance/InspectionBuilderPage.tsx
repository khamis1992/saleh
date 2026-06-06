import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, ClipboardCheck, Trash2, Eye, FileText } from 'lucide-react';

interface InspectionForm {
  id: string;
  title: string;
  description: string;
  sections: InspectionSection[];
  createdAt: string;
}

interface InspectionSection {
  id: string;
  title: string;
  items: InspectionItem[];
}

interface InspectionItem {
  id: string;
  label: string;
  type: 'pass_fail' | 'numeric' | 'text' | 'photo' | 'rating';
  required: boolean;
}

const STORAGE_KEY = 'erp_inspection_forms';

function loadForms(): InspectionForm[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveForms(forms: InspectionForm[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(forms));
}

const FORM_TYPES: Record<string, string> = {
  building: 'معاينة مبنى',
  safety: 'فحص سلامة',
  move_in: 'معاينة استلام',
  move_out: 'معاينة تسليم',
  equipment: 'فحص معدات',
  quality: 'فحص جودة',
};

export default function InspectionBuilderPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [forms, setForms] = useState<InspectionForm[]>(loadForms);
  const [showDialog, setShowDialog] = useState(false);
  const [showPreview, setShowPreview] = useState<InspectionForm | null>(null);
  const [form, setForm] = useState({ title: '', description: '', type: 'building' });

  const refresh = () => {
    setForms(loadForms());
  };

  const handleCreate = () => {
    if (!form.title) {
      toast.error('يرجى إدخال عنوان النموذج');
      return;
    }
    const sections: InspectionSection[] = [
      {
        id: crypto.randomUUID(),
        title: form.type === 'safety' ? 'معدات السلامة' : form.type === 'move_in' ? 'حالة الوحدة' : 'الفحص العام',
        items: [
          { id: crypto.randomUUID(), label: 'الحالة العامة', type: 'pass_fail', required: true },
          { id: crypto.randomUUID(), label: 'ملاحظات', type: 'text', required: false },
        ],
      },
    ];
    const newForm: InspectionForm = {
      id: crypto.randomUUID(),
      title: form.title,
      description: form.description || `${FORM_TYPES[form.type] || 'فحص'} - ${new Date().toLocaleDateString('ar-SA')}`,
      sections,
      createdAt: new Date().toISOString().split('T')[0],
    };
    const updated = [...forms, newForm];
    saveForms(updated);
    refresh();
    toast.success('تم إنشاء نموذج المعاينة');
    setShowDialog(false);
    setForm({ title: '', description: '', type: 'building' });
  };

  const handleDelete = (id: string) => {
    const updated = forms.filter(f => f.id !== id);
    saveForms(updated);
    refresh();
    toast.success('تم حذف النموذج');
  };

  return (
    <div className="min-h-full bg-[#f6f9fc]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">نماذج المعاينات</h1>
          <p className="text-xs text-gray-500 mt-0.5">{forms.length} نموذج — تصميم وإدارة نماذج المعاينات الميدانية</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2 bg-[#533afd] hover:bg-[#4434d4] text-white text-sm h-9 rounded-full px-4">
          <Plus className="h-4 w-4" />نموذج جديد
        </Button>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center mx-auto mb-4">
            <ClipboardCheck className="h-8 w-8 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">لا توجد نماذج معاينات</p>
          <p className="text-xs text-gray-400 mb-4">قم بإنشاء نموذج معاينة مخصص لفرق الصيانة والجودة</p>
          <Button variant="outline" size="sm" onClick={() => setShowDialog(true)} className="rounded-lg">إنشاء أول نموذج</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {forms.map(f => (
            <Card key={f.id} className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{f.title}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">{f.sections.length} أقسام</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">{f.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 mb-3">
                  {f.sections.map(s => (
                    <div key={s.id} className="text-xs text-gray-600 flex items-center gap-1.5">
                      <FileText className="h-3 w-3 text-gray-400" />
                      {s.title} — <span className="text-gray-400">{s.items.length} عناصر</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400">{f.createdAt}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowPreview(f)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => handleDelete(f.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>نموذج معاينة جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>العنوان *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="مثال: معاينة السلامة الشهرية" className="h-9 rounded-lg" />
            </div>
            <div>
              <Label>الوصف</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="وصف الغرض من المعاينة" className="h-9 rounded-lg" />
            </div>
            <p className="text-xs text-gray-400">سيتم إنشاء النموذج بقسم افتراضي واحد. يمكنك تخصيص الأقسام والعناصر لاحقاً.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>إلغاء</Button>
            <Button onClick={handleCreate} className="bg-[#3B82F6]">إنشاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{showPreview?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {showPreview?.sections.map(s => (
              <div key={s.id} className="border rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">{s.title}</h4>
                {s.items.map(item => (
                  <div key={item.id} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm flex-1">{item.label}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {item.type === 'pass_fail' ? 'نجح/فشل' : item.type === 'numeric' ? 'رقمي' : item.type === 'rating' ? 'تقييم' : item.type === 'photo' ? 'صورة' : 'نص'}
                    </Badge>
                    {item.required && <span className="text-xs text-red-400">*مطلوب</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
