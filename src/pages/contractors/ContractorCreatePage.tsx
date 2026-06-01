import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLocale } from '@/providers/LocaleContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Save, User } from 'lucide-react';
import { contractorStore } from '@/services/stores';

export default function ContractorCreatePage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState<any>({
    contractor_code: '', name: '', specialty: 'civil', classification: '',
    contact_person: '', phone: '', email: '', address: '',
    bank_name: '', iban: '', account_number: '', rating: 3, status: 'active',
  });

  useEffect(() => {
    if (id && isEdit) {
      const existing = contractorStore.getById(id);
      if (existing) {
        const { id: _, company_id: __, cr_number: ___, tax_number: ____, ...rest } = existing;
        setForm(rest);
      }
    }
  }, [id, isEdit]);

  const update = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  const handleSave = () => {
    const data = { ...form, company_id: '', cr_number: '', tax_number: '', rating: Number(form.rating) };
    if (isEdit && id) contractorStore.update(id, data);
    else contractorStore.create(data);
    navigate('/contractors');
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/contractors')} className="text-xs text-gray-500">
            <ArrowRight className="h-4 w-4 ml-1" />{t.common.back}
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isEdit ? t.contractors.edit : t.contractors.create}</h1>
            <p className="text-xs text-gray-500 mt-0.5">{isEdit ? 'تعديل بيانات المقاول' : 'إضافة مقاول جديد'}</p>
          </div>
        </div>
        <Button onClick={handleSave} className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4">
          <Save className="h-4 w-4" />{t.common.save}
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
            <User className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">معلومات المقاول</h2>
            <p className="text-xs text-gray-400 mt-0.5">البيانات الأساسية وبيانات التواصل</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.contractors.code}</Label><Input value={form.contractor_code} onChange={e => update('contractor_code', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.contractors.name}</Label><Input value={form.name} onChange={e => update('name', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.contractors.specialty}</Label>
            <Select value={form.specialty} onValueChange={v => update('specialty', v)}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="civil">أعمال مدنية</SelectItem><SelectItem value="electrical">كهرباء</SelectItem>
                <SelectItem value="hvac">تكييف</SelectItem><SelectItem value="plumbing">سباكة</SelectItem>
                <SelectItem value="finishing">تشطيبات</SelectItem><SelectItem value="general">مقاول عام</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.contractors.contactPerson}</Label><Input value={form.contact_person} onChange={e => update('contact_person', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.contractors.phone}</Label><Input value={form.phone} onChange={e => update('phone', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">البريد الإلكتروني</Label><Input value={form.email} onChange={e => update('email', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">العنوان</Label><Input value={form.address} onChange={e => update('address', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">اسم البنك</Label><Input value={form.bank_name} onChange={e => update('bank_name', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">رقم الحساب الدولي (IBAN)</Label><Input value={form.iban} onChange={e => update('iban', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.contractors.rating}</Label><Input type="number" min="1" max="5" value={form.rating} onChange={e => update('rating', e.target.value)} className="h-9 text-sm rounded-lg border-gray-200" /></div>
          <div className="space-y-1.5"><Label className="text-xs font-medium text-gray-500">{t.common.status}</Label>
            <Select value={form.status} onValueChange={v => update('status', v)}>
              <SelectTrigger className="h-9 text-sm rounded-lg border-gray-200"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="inactive">غير نشط</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 justify-end mt-6">
        <Button variant="outline" onClick={() => navigate('/contractors')} className="h-9 text-sm rounded-lg">{t.common.cancel}</Button>
        <Button onClick={handleSave} className="gap-2 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm h-9 rounded-lg px-4"><Save className="h-4 w-4" />{t.common.save}</Button>
      </div>
    </div>
  );
}
