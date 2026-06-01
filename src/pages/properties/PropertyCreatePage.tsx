import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Save } from 'lucide-react';

export default function PropertyCreatePage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div dir="rtl" className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/properties')}><ArrowRight className="h-4 w-4 ml-2" />{t.common.back}</Button>
        <h1 className="text-2xl font-bold">{id ? t.properties.edit : t.properties.create}</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>معلومات العقار</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2"><Label>{t.properties.code}</Label><Input placeholder="PROP-001" /></div>
          <div className="space-y-2"><Label>{t.properties.name}</Label><Input placeholder="اسم العقار" /></div>
          <div className="space-y-2"><Label>{t.properties.type}</Label>
            <Select><SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger><SelectContent>
              <SelectItem value="residential_building">عمارة سكنية</SelectItem>
              <SelectItem value="commercial_building">عمارة تجارية</SelectItem>
              <SelectItem value="villa_compound">مجمع فلل</SelectItem>
              <SelectItem value="villa">فيلا</SelectItem>
              <SelectItem value="retail_complex">مجمع تجاري</SelectItem>
            </SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>المشروع المرتبط</Label>
            <Select><SelectTrigger><SelectValue placeholder="اختر المشروع" /></SelectTrigger><SelectContent>
              <SelectItem value="1">مجمع النخيل السكني</SelectItem>
              <SelectItem value="2">أبراج السلام</SelectItem>
            </SelectContent></Select>
          </div>
          <div className="space-y-2"><Label>{t.properties.address}</Label><Input placeholder="العنوان" /></div>
          <div className="space-y-2"><Label>تاريخ الإكمال</Label><Input type="date" /></div>
          <div className="space-y-2"><Label>تاريخ التسليم</Label><Input type="date" /></div>
          <div className="space-y-2"><Label>تكلفة الأرض</Label><Input type="number" placeholder="0" /></div>
          <div className="space-y-2"><Label>تكلفة الإنشاء</Label><Input type="number" placeholder="0" /></div>
          <div className="space-y-2"><Label>تكاليف مرسملة أخرى</Label><Input type="number" placeholder="0" /></div>
          <div className="space-y-2"><Label>{t.properties.assetValue}</Label><Input type="number" placeholder="0" /></div>
          <div className="space-y-2"><Label>العمر الإنتاجي (سنوات)</Label><Input type="number" placeholder="30" /></div>
          <div className="space-y-2"><Label>{t.properties.propertyManager}</Label><Input placeholder="مدير العقار" /></div>
          <div className="space-y-2"><Label>{t.properties.status}</Label>
            <Select><SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger><SelectContent>
              <SelectItem value="ready_for_leasing">جاهز للتأجير</SelectItem>
              <SelectItem value="partially_leased">مؤجر جزئياً</SelectItem>
              <SelectItem value="fully_leased">مؤجر بالكامل</SelectItem>
              <SelectItem value="under_construction">تحت الإنشاء</SelectItem>
            </SelectContent></Select>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-3 justify-end mt-6">
        <Button variant="outline" onClick={() => navigate('/properties')}>{t.common.cancel}</Button>
        <Button><Save className="h-4 w-4 ml-2" />{t.common.save}</Button>
      </div>
    </div>
  );
}
